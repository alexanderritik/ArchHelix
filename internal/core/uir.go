package core

// FileDNA represents the "Architecture DNA" of a file affecting the graph.
// It serves as the Unified Internal Representation (UIR) for different languages.
type FileDNA struct {
	// Path is the relative path to the file.
	Path string

	// Package is the package name (e.g., "main", "utils").
	Package string

	// PackagePath is the full importable path (e.g., "github.com/user/repo/pkg").
	PackagePath string

	// Language identifies the source language (e.g., "go", "typescript").
	Language string

	// Imports contains a list of dependencies imported by this file.
	Imports []string

	// Exports contains a list of symbols (functions, classes, constants) exported by this file.
	Exports []string

	// Uses tracks external symbols called/used in this file (e.g., "fmt.Println", "server.NewServer").
	Uses []string

	// Metadata holds additional information like LOC, complexity, or other metrics.
	Metadata map[string]interface{}

	// DependencyCount is the number of incoming dependencies (useful for UI sizing/gravity).
	DependencyCount int
}
