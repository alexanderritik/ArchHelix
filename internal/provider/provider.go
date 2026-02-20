package provider

import (
	"sync"

	"github.com/ritiksrivastava/archhelix/internal/core"
)

// Provider defines the interface for language-specific analysis.
type Provider interface {
	// ParseFile takes a file path and returns its Architecture DNA.
	ParseFile(path string) (*core.FileDNA, error)
}

var (
	registryMu sync.RWMutex
	registry   = make(map[string]Provider)
)

// Register registers a provider for a specific file extension (e.g., ".go").
func Register(ext string, p Provider) {
	registryMu.Lock()
	defer registryMu.Unlock()
	registry[ext] = p
}

// Get returns the provider for a given extension.
func Get(ext string) (Provider, bool) {
	registryMu.RLock()
	defer registryMu.RUnlock()
	p, ok := registry[ext]
	return p, ok
}
