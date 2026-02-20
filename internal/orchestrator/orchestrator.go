package orchestrator

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"sync"

	"github.com/ritiksrivastava/archhelix/internal/core"
	"github.com/ritiksrivastava/archhelix/internal/engine"
	"github.com/ritiksrivastava/archhelix/internal/provider"
)

// Orchestrator coordinates the scanning and analysis process.
type Orchestrator struct {
	Engine *engine.Engine
}

// New creates a new Orchestrator.
func New(eng *engine.Engine) *Orchestrator {
	return &Orchestrator{Engine: eng}
}

// Start scans the directory at root and populates the engine's graph.
func (o *Orchestrator) Start(root string) error {
	// 1. Setup Channels
	// Jobs channel for file paths
	jobs := make(chan string, 100)
	// Results channel for parsed DNA
	results := make(chan *core.FileDNA, 100)

	// 2. Start Worker Pool
	var wg sync.WaitGroup
	// Use number of CPUs for worker count
	numWorkers := runtime.NumCPU()
	if numWorkers < 1 {
		numWorkers = 1
	}

	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for path := range jobs {
				ext := filepath.Ext(path)
				fmt.Println("Processing", path, "with extension", ext)
				// Check if we have a provider for this extension
				if p, ok := provider.Get(ext); ok {
					dna, err := p.ParseFile(path)
					if err == nil && dna != nil {
						// Normalize path to relative path
						relPath, relErr := filepath.Rel(root, dna.Path)
						if relErr == nil {
							dna.Path = filepath.ToSlash(relPath)
						}
						results <- dna
					} else if err != nil {
						// Log error but continue
						fmt.Fprintf(os.Stderr, "Error parsing %s: %v\n", path, err)
					}
					// If err == nil && dna == nil, it means the provider intentionally skipped the file (e.g., a test file).
				}
			}
		}()
	}

	// 3. Start Collector
	done := make(chan bool)
	go func() {
		for dna := range results {
			o.Engine.IngestFileDNA(dna)
		}
		done <- true
	}()

	// 4. Walk the directory and dispatch jobs
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			// Skip directories we can't read
			return nil
		}

		// Skip hidden directories (like .git)
		if d.IsDir() && len(d.Name()) > 1 && d.Name()[0] == '.' {
			return fs.SkipDir
		}

		if !d.IsDir() {
			jobs <- path
		}
		return nil
	})

	close(jobs)    // No more jobs
	wg.Wait()      // Wait for workers to finish
	close(results) // No more results
	<-done         // Wait for collector to finish

	if err != nil {
		return err
	}

	// 5. Link Dependencies (Graph Building)
	o.Engine.LinkDependencies()

	return nil
}
