package engine

import (
	"path/filepath"
	"sync"

	"github.com/ritiksrivastava/archhelix/internal/core"
	"github.com/ritiksrivastava/archhelix/internal/graph"
)

// Engine handles the language-agnostic analysis, graph building, and symbol resolution.
type Engine struct {
	mu          sync.RWMutex
	SymbolTable map[string]string        // Maps symbol/package names to the defining file path.
	FileMap     map[string]*core.FileDNA // Maps file path to its parsed DNA.
	Graph       *graph.Graph
}

// New creates a new instance of the Engine.
func New() *Engine {
	return &Engine{
		SymbolTable: make(map[string]string),
		FileMap:     make(map[string]*core.FileDNA),
		Graph:       &graph.Graph{Nodes: []graph.Node{}, Edges: []graph.Edge{}},
	}
}

// IngestFileDNA adds a file's DNA to the engine and updates the symbol table.
// It does NOT build edges immediately; that happens in the Link phase.
func (e *Engine) IngestFileDNA(dna *core.FileDNA) {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.FileMap[dna.Path] = dna

	// Add node to graph
	node := graph.Node{ID: dna.Path, Label: filepath.Base(dna.Path)}
	e.Graph.Nodes = append(e.Graph.Nodes, node)

	// Update Symbol Table with exports
	for _, export := range dna.Exports {
		if dna.PackagePath != "" {
			// Store as "package.Symbol" for granular matching
			e.SymbolTable[dna.PackagePath+"."+export] = dna.Path
		}
		// Also store bare export for backwards compatibility or ambiguous cases
		e.SymbolTable[export] = dna.Path
	}

	// Register the package path itself to map to the file (last file wins for package-level imports)
	if dna.PackagePath != "" {
		e.SymbolTable[dna.PackagePath] = dna.Path
	} else {
		e.SymbolTable[dna.Package] = dna.Path
	}
}

// LinkDependencies runs after scanning to connect nodes based on imports and the symbol table.
func (e *Engine) LinkDependencies() {
	e.mu.Lock()
	defer e.mu.Unlock()

	for _, dna := range e.FileMap {
		seen := make(map[string]bool)

		// 1. Link based on specific symbol usages (Granular)
		for _, use := range dna.Uses {
			if targetPath, ok := e.SymbolTable[use]; ok {
				if targetPath != dna.Path && !seen[targetPath] {
					edge := graph.Edge{Source: targetPath, Target: dna.Path}
					e.Graph.Edges = append(e.Graph.Edges, edge)
					seen[targetPath] = true
				}
			}
		}

		// 2. Link based on package-level imports (Broad)
		for _, imp := range dna.Imports {
			// Check if import matches a known package
			if targetPath, ok := e.SymbolTable[imp]; ok {
				// Avoid self-loops and duplicates
				if targetPath != dna.Path && !seen[targetPath] {
					edge := graph.Edge{Source: targetPath, Target: dna.Path}
					e.Graph.Edges = append(e.Graph.Edges, edge)
					seen[targetPath] = true
				}
			}
		}
	}

	// Calculate DependencyCount (Gravity) for each node based on outgoing edges (since arrows are now reversed)
	dependencyCounts := make(map[string]int)
	for _, edge := range e.Graph.Edges {
		dependencyCounts[edge.Source]++
	}

	// Update Graph.Nodes and FileMap with the calculated counts
	for i := range e.Graph.Nodes {
		nodeID := e.Graph.Nodes[i].ID
		count := dependencyCounts[nodeID]
		e.Graph.Nodes[i].DependencyCount = count

		if dna, ok := e.FileMap[nodeID]; ok {
			dna.DependencyCount = count
		}
	}
}

// GetGraph returns the current state of the graph.
func (e *Engine) GetGraph() *graph.Graph {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.Graph
}
