package provider

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	"github.com/ritiksrivastava/archhelix/internal/core"
	sitter "github.com/smacker/go-tree-sitter"
	"github.com/smacker/go-tree-sitter/python"
)

// PythonProvider implements the Provider interface for Python files.
type PythonProvider struct{}

// Ensure PythonProvider implements Provider.
var _ Provider = (*PythonProvider)(nil)

func (p *PythonProvider) ParseFile(path string) (*core.FileDNA, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	dna := &core.FileDNA{
		Path:     path,
		Language: "python",
		Imports:  []string{},
		Exports:  []string{},
		Metadata: make(map[string]interface{}),
	}

	parser := sitter.NewParser()
	parser.SetLanguage(python.GetLanguage())
	tree, _ := parser.ParseCtx(context.Background(), nil, content)

	// Walk is done after computing PackagePath

	// Python files don't have explicit package declarations like Go.
	// We use the filename without extension as the "package" name.
	filename := filepath.Base(path)
	ext := filepath.Ext(filename)
	if len(ext) > 0 {
		dna.Package = filename[0 : len(filename)-len(ext)]
	} else {
		dna.Package = filename
	}

	// Calculate a logical PackagePath (Python module name) based on the file path
	// e.g. "src/utils/db.py" -> "src.utils.db"
	// "__init__.py" in "src/utils" -> "src.utils"
	normalizedPath := filepath.ToSlash(path)
	normalizedPath = strings.TrimSuffix(normalizedPath, ".py")
	if strings.HasSuffix(normalizedPath, "/__init__") {
		normalizedPath = strings.TrimSuffix(normalizedPath, "/__init__")
	} else if normalizedPath == "__init__" {
		normalizedPath = ""
	}
	dna.PackagePath = strings.ReplaceAll(normalizedPath, "/", ".")

	basePackage := dna.PackagePath
	if filepath.Base(path) != "__init__.py" {
		lastDot := strings.LastIndex(basePackage, ".")
		if lastDot != -1 {
			basePackage = basePackage[:lastDot]
		} else {
			basePackage = ""
		}
	}

	walkPythonTree(tree.RootNode(), content, dna, basePackage)

	return dna, nil
}

func resolveRelativeImport(basePackage string, relImport string) string {
	dots := 0
	for dots < len(relImport) && relImport[dots] == '.' {
		dots++
	}

	parts := strings.Split(basePackage, ".")
	if basePackage == "" {
		parts = []string{}
	}

	popCount := dots - 1
	if popCount > len(parts) {
		popCount = len(parts)
	}

	var resolvedBase string
	if len(parts)-popCount > 0 {
		resolvedBase = strings.Join(parts[:len(parts)-popCount], ".")
	}

	suffix := relImport[dots:]
	if suffix == "" {
		return resolvedBase
	}
	if resolvedBase == "" {
		return suffix
	}
	return resolvedBase + "." + suffix
}

func walkPythonTree(node *sitter.Node, sourceCode []byte, dna *core.FileDNA, basePackage string) {
	if node == nil {
		return
	}

	switch node.Type() {
	case "import_statement":
		for i := 0; i < int(node.ChildCount()); i++ {
			child := node.Child(i)
			if child.Type() == "dotted_name" {
				dna.Imports = append(dna.Imports, child.Content(sourceCode))
			} else if child.Type() == "aliased_import" {
				// aliased_import has a dotted_name child
				for j := 0; j < int(child.ChildCount()); j++ {
					grandchild := child.Child(j)
					if grandchild.Type() == "dotted_name" {
						dna.Imports = append(dna.Imports, grandchild.Content(sourceCode))
						break
					}
				}
			}
		}
	case "import_from_statement":
		var moduleName string
		seenImportKeyword := false
		for i := 0; i < int(node.ChildCount()); i++ {
			child := node.Child(i)
			if child.Type() == "import" {
				seenImportKeyword = true
				if moduleName != "" {
					dna.Imports = append(dna.Imports, moduleName)
				}
			} else if !seenImportKeyword {
				if child.Type() == "dotted_name" || child.Type() == "identifier" {
					moduleName = child.Content(sourceCode)
				} else if child.Type() == "relative_import" {
					moduleName = resolveRelativeImport(basePackage, child.Content(sourceCode))
				}
			} else if seenImportKeyword {
				if child.Type() == "dotted_name" || child.Type() == "identifier" {
					name := child.Content(sourceCode)
					if moduleName != "" {
						dna.Imports = append(dna.Imports, moduleName+"."+name)
					} else {
						dna.Imports = append(dna.Imports, name)
					}
				} else if child.Type() == "aliased_import" {
					for j := 0; j < int(child.ChildCount()); j++ {
						grandchild := child.Child(j)
						if grandchild.Type() == "dotted_name" || grandchild.Type() == "identifier" {
							name := grandchild.Content(sourceCode)
							if moduleName != "" {
								dna.Imports = append(dna.Imports, moduleName+"."+name)
							} else {
								dna.Imports = append(dna.Imports, name)
							}
							break
						}
					}
				}
			}
		}
	case "class_definition", "function_definition":
		for i := 0; i < int(node.ChildCount()); i++ {
			child := node.Child(i)
			if child.Type() == "identifier" {
				dna.Exports = append(dna.Exports, child.Content(sourceCode))
				break
			}
		}
	}

	for i := 0; i < int(node.ChildCount()); i++ {
		walkPythonTree(node.Child(i), sourceCode, dna, basePackage)
	}
}

func init() {
	Register(".py", &PythonProvider{})
}
