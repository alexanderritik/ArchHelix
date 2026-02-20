package orchestrator

import (
	"fmt"
	"path/filepath"
	"testing"

	"github.com/ritiksrivastava/archhelix/internal/provider"

	"github.com/ritiksrivastava/archhelix/internal/engine"
)

func TestOrchestrator(t *testing.T) {
	eng := engine.New()
	orch := New(eng)

	// Run on the project root (assuming test is run from internal/orchestrator)
	// We use absolute path to be safe or relative to module root.
	// Since we are running `go test ./internal/orchestrator/...`, the CWD might be the package dir.
	// Let's rely on finding `go.mod` or just existing files.
	// Trying to scan the parent directories to find the root.

	root := "../../"
	abs, _ := filepath.Abs(root)
	t.Logf("Testing root: %s -> %s", root, abs)

	// check if a provider is registered
	if _, ok := provider.Get(".go"); !ok {
		t.Fatal("Provider for .go not registered")
	} else {
		t.Log("Provider for .go registered")
	}

	err := orch.Start(abs)
	if err != nil {
		t.Fatalf("Orchestrator failed: %v", err)
	}

	g := eng.GetGraph()
	fmt.Printf("Graph has %d nodes and %d edges\n", len(g.Nodes), len(g.Edges))

	if len(g.Nodes) == 0 {
		t.Errorf("Expected nodes, got 0")
	}

	// Check if some expected nodes are present
	foundOrchest := false
	foundProvider := false

	for _, n := range g.Nodes {
		if n.Label == "orchestrator.go" {
			foundOrchest = true
		}
		if n.Label == "provider.go" {
			foundProvider = true
		}
	}

	if !foundOrchest {
		t.Errorf("Did not find 'orchestrator' package in graph. Nodes: %v", g.Nodes)
	}
	if !foundProvider {
		t.Errorf("Did not find 'provider' package in graph.")
	}

	foundHello := false
	for _, n := range g.Nodes {
		if n.Label == "hello.py" {
			foundHello = true
		}
	}
	if !foundHello {
		t.Errorf("Did not find 'hello' python package in graph.")
	}
}
