package cmd

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/ritiksrivastava/archhelix/internal/engine"
	"github.com/ritiksrivastava/archhelix/internal/orchestrator"
	"github.com/spf13/cobra"
)

var (
	// frontendAssets holds the embedded filesystem for the UI
	frontendAssets fs.FS

	// upgrader handles WebSocket upgrades
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	// eng holds the analysis engine
	eng *engine.Engine

	// repoRootPath holds the path to the repository being analyzed
	repoRootPath string
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "archhelix",
	Short: "ArchHelix CLI",
	Long:  `ArchHelix is a tool for analyzing and visualizing architecture. Use 'clone' to start.`,
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute(assets fs.FS) {
	frontendAssets = assets
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func startServer(rootPath string) {
	if frontendAssets == nil {
		log.Fatal("Frontend assets not initialized")
	}

	repoRootPath = rootPath

	// Initialize Engine and Orchestrator
	eng = engine.New()
	orch := orchestrator.New(eng)

	// Run analysis in background
	go func() {
		fmt.Printf("Starting analysis on %s...\n", rootPath)
		if err := orch.Start(rootPath); err != nil {
			log.Println("Analysis error:", err)
		} else {
			g := eng.GetGraph()
			fmt.Printf("Analysis complete. Graph has %d nodes and %d edges.\n", len(g.Nodes), len(g.Edges))
		}
	}()

	// 1. Serve Embedded Frontend
	http.Handle("/", http.FileServer(http.FS(frontendAssets)))

	// 2. WebSocket Endpoint for Streaming
	http.HandleFunc("/ws", handleWebSocket)

	// 3. API Endpoint for file reading
	http.HandleFunc("/api/file", handleFileRequest)

	// 4. API Endpoint for project structure
	http.HandleFunc("/api/structure", handleStructureRequest)

	// 5. API Endpoint for graph data
	http.HandleFunc("/api/graph", handleGraphRequest)

	// 6. API Endpoint for all files (for Monaco models)
	http.HandleFunc("/api/files/all", handleFilesAllRequest)

	fmt.Println("Analysis UI running at http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade:", err)
		return
	}
	defer conn.Close()

	log.Println("Client connected")

	// Send current graph
	if eng != nil {
		g := eng.GetGraph()
		if err := conn.WriteJSON(g); err != nil {
			log.Println("Write:", err)
			return
		}
	}

	for {
		// Read message
		_, _, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read:", err)
			break
		}
	}
}

func handleFileRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	pathParam := r.URL.Query().Get("path")
	if pathParam == "" {
		http.Error(w, "missing path parameter", http.StatusBadRequest)
		return
	}

	// Prevent directory traversal
	cleanPath := filepath.Clean(pathParam)
	if strings.HasPrefix(cleanPath, "..") {
		http.Error(w, "invalid path parameter", http.StatusBadRequest)
		return
	}

	fullPath := filepath.Join(repoRootPath, cleanPath)

	content, err := os.ReadFile(fullPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to read file: %v", err), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write(content)
}

func handleFilesAllRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if repoRootPath == "" {
		http.Error(w, "repository root not set", http.StatusInternalServerError)
		return
	}

	allFiles := make(map[string]string)

	err := filepath.WalkDir(repoRootPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}

		if d.IsDir() {
			name := d.Name()
			if name == ".git" || name == "node_modules" || name == "__pycache__" || name == "dist" || name == "build" || (strings.HasPrefix(name, ".") && name != ".") {
				return fs.SkipDir
			}
			return nil
		}

		if !strings.HasPrefix(d.Name(), ".") {
			// Read file content
			content, readErr := os.ReadFile(path)
			if readErr == nil {
				// Only include files < 1MB
				if len(content) < 1024*1024 {
					relPath, _ := filepath.Rel(repoRootPath, path)
					relPath = filepath.ToSlash(relPath)
					allFiles[relPath] = string(content)
				}
			}
		}
		return nil
	})

	if err != nil {
		http.Error(w, fmt.Sprintf("failed to read files: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(allFiles); err != nil {
		log.Printf("failed to encode files response: %v", err)
	}
}

type TreeNode struct {
	Name     string      `json:"name"`
	Path     string      `json:"path"`
	Type     string      `json:"type"`
	Children []*TreeNode `json:"children,omitempty"`
}

func buildFileTree(path string) ([]*TreeNode, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var nodes []*TreeNode
	for _, entry := range entries {
		// Ignore hidden directories like .git and node_modules
		if entry.IsDir() && (entry.Name() == ".git" || entry.Name() == "node_modules" || entry.Name() == "__pycache__") {
			continue
		}

		// Also ignore hidden files like .DS_Store
		if !entry.IsDir() && strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		fullPath := filepath.Join(path, entry.Name())
		// Rel path for the frontend (clean it up so it's relative to repo root)
		relPath, _ := filepath.Rel(repoRootPath, fullPath)
		// Ensure it uses forward slashes
		relPath = filepath.ToSlash(relPath)

		nodeType := "file"
		if entry.IsDir() {
			nodeType = "dir"
		}

		node := &TreeNode{
			Name: entry.Name(),
			Path: relPath, // Changed from fullPath to relPath to match what frontend expects
			Type: nodeType,
		}

		if entry.IsDir() {
			children, err := buildFileTree(fullPath)
			if err != nil {
				return nil, err
			}
			node.Children = children
		}

		nodes = append(nodes, node)
	}

	return nodes, nil
}

func handleStructureRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if repoRootPath == "" {
		http.Error(w, "repository root not set", http.StatusInternalServerError)
		return
	}

	tree, err := buildFileTree(repoRootPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to build file tree: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(tree); err != nil {
		log.Printf("failed to encode structure response: %v", err)
	}
}

func handleGraphRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if eng == nil {
		http.Error(w, "engine not initialized", http.StatusInternalServerError)
		return
	}

	g := eng.GetGraph()

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(g); err != nil {
		log.Printf("failed to encode graph response: %v", err)
	}
}
