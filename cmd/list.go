package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List cloned repositories and start analysis",
	Long:  `List all repositories cloned in the codehub directory and select one to start ArchHelix analysis.`,
	Run: func(cmd *cobra.Command, args []string) {
		codehubDir := "codehub"

		entries, err := os.ReadDir(codehubDir)
		if err != nil {
			fmt.Printf("Error reading %s directory (have you cloned a repository yet?): %v\n", codehubDir, err)
			os.Exit(1)
		}

		var repos []string
		for _, entry := range entries {
			if entry.IsDir() {
				repos = append(repos, entry.Name())
			}
		}

		if len(repos) == 0 {
			fmt.Println("No repositories found in codehub directory.")
			return
		}

		fmt.Println("Available repositories:")
		for i, repo := range repos {
			fmt.Printf("%d. %s\n", i+1, repo)
		}

		fmt.Print("Enter the number of the repository to analyze: ")
		var response string
		fmt.Scanln(&response)

		response = strings.TrimSpace(response)
		if response == "" {
			fmt.Println("Aborted.")
			return
		}

		idx, err := strconv.Atoi(response)
		if err != nil || idx < 1 || idx > len(repos) {
			fmt.Println("Invalid selection. Aborted.")
			return
		}

		selectedRepo := repos[idx-1]
		targetDir := filepath.Join(codehubDir, selectedRepo)

		fmt.Printf("Starting analysis on %s...\n", selectedRepo)
		startServer(targetDir)
	},
}

func init() {
	rootCmd.AddCommand(listCmd)
}
