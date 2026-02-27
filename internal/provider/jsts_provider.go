package provider

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	"github.com/ritiksrivastava/archhelix/internal/core"
	sitter "github.com/smacker/go-tree-sitter"
	"github.com/smacker/go-tree-sitter/javascript"
	"github.com/smacker/go-tree-sitter/typescript/tsx"
	"github.com/smacker/go-tree-sitter/typescript/typescript"
)

// JSTSProvider implements the Provider interface for JS and TS files.
type JSTSProvider struct{}

// Ensure JSTSProvider implements Provider.
var _ Provider = (*JSTSProvider)(nil)

func (p *JSTSProvider) ParseFile(path string) (*core.FileDNA, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	dna := &core.FileDNA{
		Path:     path,
		Language: "javascript",
		Imports:  []string{},
		Exports:  []string{},
		Metadata: make(map[string]interface{}),
	}

	parser := sitter.NewParser()
	ext := filepath.Ext(path)

	switch ext {
	case ".ts", ".mts", ".cts":
		parser.SetLanguage(typescript.GetLanguage())
		dna.Language = "typescript"
	case ".tsx":
		parser.SetLanguage(tsx.GetLanguage())
		dna.Language = "typescript"
	case ".js", ".mjs", ".cjs", ".jsx":
		parser.SetLanguage(javascript.GetLanguage())
		dna.Language = "javascript"
	default:
		// fallback to javascript
		parser.SetLanguage(javascript.GetLanguage())
	}

	tree, _ := parser.ParseCtx(context.Background(), nil, content)

	// Determine package from filename
	filename := filepath.Base(path)
	if len(ext) > 0 {
		dna.Package = filename[0 : len(filename)-len(ext)]
	} else {
		dna.Package = filename
	}

	// Determine logical PackagePath
	normalizedPath := filepath.ToSlash(path)
	normalizedPath = strings.TrimSuffix(normalizedPath, ext)
	if strings.HasSuffix(normalizedPath, "/index") {
		normalizedPath = strings.TrimSuffix(normalizedPath, "/index")
	} else if normalizedPath == "index" {
		normalizedPath = ""
	}
	dna.PackagePath = strings.ReplaceAll(normalizedPath, "/", ".")

	basePackage := dna.PackagePath
	isIndex := false
	if strings.HasPrefix(filename, "index.") {
		isIndex = true
	}

	if !isIndex {
		lastDot := strings.LastIndex(basePackage, ".")
		if lastDot != -1 {
			basePackage = basePackage[:lastDot]
		} else {
			basePackage = ""
		}
	}

	walkJSTSTree(tree.RootNode(), content, dna, basePackage)

	return dna, nil
}

func unquote(s string) string {
	if len(s) >= 2 && (s[0] == '\'' || s[0] == '"' || s[0] == '`') {
		return s[1 : len(s)-1]
	}
	return s
}

func resolveJSTSImport(basePackage string, relImport string) string {
	for _, ext := range []string{".js", ".ts", ".jsx", ".tsx", ".cjs", ".mjs", ".mts", ".cts"} {
		if strings.HasSuffix(relImport, ext) {
			relImport = strings.TrimSuffix(relImport, ext)
			break
		}
	}

	if !strings.HasPrefix(relImport, ".") {
		return relImport // external or absolute
	}

	dots := 0
	for strings.HasPrefix(relImport, "../") {
		dots++
		relImport = strings.TrimPrefix(relImport, "../")
	}
	if strings.HasPrefix(relImport, "./") {
		relImport = strings.TrimPrefix(relImport, "./")
	} else if relImport == "." || relImport == ".." {
		if relImport == ".." {
			dots++
		}
		relImport = ""
	}

	parts := strings.Split(basePackage, ".")
	if basePackage == "" {
		parts = []string{}
	}

	popCount := dots
	if popCount > len(parts) {
		popCount = len(parts)
	}

	var resolvedBase string
	if len(parts)-popCount > 0 {
		resolvedBase = strings.Join(parts[:len(parts)-popCount], ".")
	}

	relImport = strings.ReplaceAll(relImport, "/", ".")

	if relImport == "" {
		return resolvedBase
	}
	if resolvedBase == "" {
		return relImport
	}
	return resolvedBase + "." + relImport
}

func walkJSTSTree(node *sitter.Node, sourceCode []byte, dna *core.FileDNA, basePackage string) {
	if node == nil {
		return
	}

	switch node.Type() {
	case "import_statement":
		for i := 0; i < int(node.ChildCount()); i++ {
			child := node.Child(i)
			if child.Type() == "string" {
				val := unquote(child.Content(sourceCode))
				dna.Imports = append(dna.Imports, resolveJSTSImport(basePackage, val))
				break
			}
		}
	case "call_expression":
		if node.ChildCount() >= 2 {
			funcNode := node.Child(0)
			funcName := funcNode.Content(sourceCode)
			isImport := funcNode.Type() == "import" || (funcNode.Type() == "identifier" && (funcName == "require" || funcName == "import"))

			if isImport {
				argsNode := node.Child(1)
				if argsNode.Type() == "arguments" {
					for j := 0; j < int(argsNode.ChildCount()); j++ {
						arg := argsNode.Child(j)
						if arg.Type() == "string" {
							val := unquote(arg.Content(sourceCode))
							dna.Imports = append(dna.Imports, resolveJSTSImport(basePackage, val))
							break
						}
					}
				}
			}
		}
	case "export_statement":
		hasFrom := false
		var fromString string
		for i := 0; i < int(node.ChildCount()); i++ {
			child := node.Child(i)
			if child.Type() == "string" {
				fromString = unquote(child.Content(sourceCode))
				hasFrom = true
			} else if child.Type() == "lexical_declaration" || child.Type() == "variable_declaration" {
				for j := 0; j < int(child.ChildCount()); j++ {
					decl := child.Child(j)
					if decl.Type() == "variable_declarator" {
						idNode := decl.ChildByFieldName("name")
						if idNode == nil {
							for k := 0; k < int(decl.ChildCount()); k++ {
								if decl.Child(k).Type() == "identifier" {
									idNode = decl.Child(k)
									break
								}
							}
						}
						if idNode != nil {
							dna.Exports = append(dna.Exports, idNode.Content(sourceCode))
						}
					}
				}
			} else if child.Type() == "function_declaration" || child.Type() == "class_declaration" {
				for j := 0; j < int(child.ChildCount()); j++ {
					if child.Child(j).Type() == "identifier" {
						dna.Exports = append(dna.Exports, child.Child(j).Content(sourceCode))
						break
					}
				}
			} else if child.Type() == "export_clause" {
				for j := 0; j < int(child.ChildCount()); j++ {
					if child.Child(j).Type() == "export_specifier" {
						spec := child.Child(j)
						for k := 0; k < int(spec.ChildCount()); k++ {
							if spec.Child(k).Type() == "identifier" {
								dna.Exports = append(dna.Exports, spec.Child(k).Content(sourceCode))
								break
							}
						}
					}
				}
			}
		}
		if hasFrom && fromString != "" {
			dna.Imports = append(dna.Imports, resolveJSTSImport(basePackage, fromString))
		}
	case "assignment_expression":
		left := node.ChildByFieldName("left")
		if left == nil && node.ChildCount() > 0 {
			left = node.Child(0)
		}
		if left != nil && left.Type() == "member_expression" {
			obj := left.ChildByFieldName("object")
			prop := left.ChildByFieldName("property")
			if obj == nil && left.ChildCount() >= 3 {
				obj = left.Child(0)
				prop = left.Child(2)
			}
			if obj != nil && prop != nil {
				if obj.Content(sourceCode) == "exports" {
					dna.Exports = append(dna.Exports, prop.Content(sourceCode))
				} else if obj.Content(sourceCode) == "module" && prop.Content(sourceCode) == "exports" {
					right := node.ChildByFieldName("right")
					if right == nil && node.ChildCount() >= 3 {
						right = node.Child(2)
					}
					if right != nil && right.Type() == "object" {
						for i := 0; i < int(right.ChildCount()); i++ {
							pair := right.Child(i)
							if pair.Type() == "pair" {
								key := pair.ChildByFieldName("key")
								if key == nil && pair.ChildCount() > 0 {
									key = pair.Child(0)
								}
								if key != nil && (key.Type() == "property_identifier" || key.Type() == "identifier") {
									dna.Exports = append(dna.Exports, key.Content(sourceCode))
								}
							}
						}
					}
				}
			}
		}
	}

	for i := 0; i < int(node.ChildCount()); i++ {
		walkJSTSTree(node.Child(i), sourceCode, dna, basePackage)
	}
}

func init() {
	provider := &JSTSProvider{}
	Register(".js", provider)
	Register(".jsx", provider)
	Register(".cjs", provider)
	Register(".mjs", provider)
	Register(".ts", provider)
	Register(".tsx", provider)
	Register(".cts", provider)
	Register(".mts", provider)
}
