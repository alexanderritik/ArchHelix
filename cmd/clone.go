package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
)

// cloneCmd represents the clone command
var cloneCmd = &cobra.Command{
	Use:   "clone [url]",
	Short: "Clone a git repository",
	Long: `Clone a repository from GitHub or any other git provider.
Example: archhelix clone https://github.com/alexanderritik/dbgraph.git`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		repoURL := args[0]

		dirName := getRepoName(repoURL)

		if info, err := os.Stat(dirName); err == nil && info.IsDir() {
			fmt.Printf("Directory '%s' already exists. Overwrite? (y/N): ", dirName)
			var response string
			fmt.Scanln(&response)

			if strings.ToLower(response) != "y" {
				fmt.Println("Aborted.")
				return
			}

			fmt.Printf("Removing existing directory '%s'...\n", dirName)
			if err := os.RemoveAll(dirName); err != nil {
				fmt.Printf("Error removing directory: %v\n", err)
				os.Exit(1)
			}
		}

		fmt.Printf("Cloning %s...\n", repoURL)

		gitCmd := exec.Command("git", "clone", repoURL)
		gitCmd.Stdout = os.Stdout
		gitCmd.Stderr = os.Stderr

		if err := gitCmd.Run(); err != nil {
			fmt.Printf("Error cloning repository: %v\n", err)
			os.Exit(1)
		}

		fmt.Println("Successfully cloned repository.")

		// Start the analysis server on the cloned directory
		startServer(dirName)
	},
}

func getRepoName(url string) string {
	// url: https://github.com/user/repo.git -> repo
	// Remove .git suffix
	url = strings.TrimSuffix(url, ".git")
	// Get base name
	return filepath.Base(url)
}

func init() {
	rootCmd.AddCommand(cloneCmd)
}
