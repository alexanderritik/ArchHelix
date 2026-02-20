package provider

import (
	"bufio"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/ritiksrivastava/archhelix/internal/core"
)

// GoProvider implements the Provider interface for Go files.
type GoProvider struct {
	mu          sync.RWMutex
	moduleCache map[string]string // directory -> module name
}

// Ensure GoProvider implements Provider.
var _ Provider = (*GoProvider)(nil)

// ParseFile parses a Go file and extracts its DNA.
func (p *GoProvider) ParseFile(path string) (*core.FileDNA, error) {
	// Skip test files to keep the architecture graph clean and focused on the core system.
	if strings.HasSuffix(path, "_test.go") {
		return nil, nil
	}

	fset := token.NewFileSet()
	// Parse the file with comments to get flexible parsing, though we don't strictly need comments yet.
	node, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
	if err != nil {
		return nil, err
	}

	dna := &core.FileDNA{
		Path:     path,
		Package:  node.Name.Name,
		Language: "go",
		Imports:  []string{},
		Exports:  []string{},
		Metadata: make(map[string]interface{}),
	}

	// Resolve PackagePath
	moduleName, moduleRoot := p.getModuleInfo(path)
	if moduleName != "" && moduleRoot != "" {
		rel, err := filepath.Rel(moduleRoot, filepath.Dir(path))
		if err == nil {
			if rel == "." {
				dna.PackagePath = moduleName
			} else {
				dna.PackagePath = filepath.ToSlash(filepath.Join(moduleName, rel))
			}
		}
	}

	// Extract Imports and build a mapping of local package names to full package paths
	importMap := make(map[string]string)
	for _, imp := range node.Imports {
		if imp.Path != nil {
			// Remove double quotes from import path
			cleanPath := strings.Trim(imp.Path.Value, "\"")
			dna.Imports = append(dna.Imports, cleanPath)

			// Determine local name (either alias or last component of path)
			localName := ""
			if imp.Name != nil {
				localName = imp.Name.Name
			} else {
				// Default to last component of path
				parts := strings.Split(cleanPath, "/")
				localName = parts[len(parts)-1]
				// Handle vN version suffixes which are common in Go
				if strings.HasPrefix(localName, "v") && len(localName) > 1 {
					// Check if it's strictly a version (v1, v2, etc)
					isVersion := true
					for _, r := range localName[1:] {
						if r < '0' || r > '9' {
							isVersion = false
							break
						}
					}
					if isVersion && len(parts) > 1 {
						localName = parts[len(parts)-2]
					}
				}
			}
			if localName != "" && localName != "." && localName != "_" {
				importMap[localName] = cleanPath
			}
		}
	}

	// Extract Exports and Usages
	ast.Inspect(node, func(n ast.Node) bool {
		switch x := n.(type) {
		case *ast.FuncDecl:
			// Capture ALL functions, not just exported ones, to map intra-package usages
			dna.Exports = append(dna.Exports, x.Name.Name)
		case *ast.GenDecl:
			if x.Tok == token.TYPE || x.Tok == token.CONST || x.Tok == token.VAR {
				for _, spec := range x.Specs {
					switch s := spec.(type) {
					case *ast.TypeSpec:
						// Capture ALL types
						dna.Exports = append(dna.Exports, s.Name.Name)
					case *ast.ValueSpec:
						for _, name := range s.Names {
							// Capture ALL variables/constants
							dna.Exports = append(dna.Exports, name.Name)
						}
					}
				}
			}
		case *ast.SelectorExpr:
			// Look for usages like "server.NewServer" (inter-package)
			if ident, ok := x.X.(*ast.Ident); ok {
				if pkgPath, found := importMap[ident.Name]; found {
					// Found an external symbol usage
					symbol := x.Sel.Name
					dna.Uses = append(dna.Uses, pkgPath+"."+symbol)
				}
			}
		case *ast.Ident:
			// Look for usages of intra-package identifiers (e.g. calling `processRouteInfo` locally)
			// Unresolved identifiers (Obj == nil) that aren't basic types are potential intra-package calls
			if x.Obj == nil {
				// We prepend the package path to ensure it maps correctly in the engine
				if dna.PackagePath != "" {
					dna.Uses = append(dna.Uses, dna.PackagePath+"."+x.Name)
				} else {
					dna.Uses = append(dna.Uses, dna.Package+"."+x.Name)
				}
			}
		}
		return true
	})

	return dna, nil
}

func (p *GoProvider) getModuleInfo(path string) (string, string) {
	dir := filepath.Dir(path)

	p.mu.RLock()
	if _, ok := p.moduleCache[dir]; ok {
		p.mu.RUnlock()
	} else {
		p.mu.RUnlock()
	}

	current := dir
	for {
		goModPath := filepath.Join(current, "go.mod")
		if _, err := os.Stat(goModPath); err == nil {
			moduleName := p.parseModuleName(goModPath)
			if moduleName != "" {
				p.mu.Lock()
				if p.moduleCache == nil {
					p.moduleCache = make(map[string]string)
				}
				p.moduleCache[dir] = moduleName
				p.mu.Unlock()
				return moduleName, current
			}
		}

		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}

	return "", ""
}

func (p *GoProvider) parseModuleName(goModPath string) string {
	file, err := os.Open(goModPath)
	if err != nil {
		return ""
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "module ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "module "))
		}
	}
	return ""
}

func init() {
	Register(".go", &GoProvider{})
}
