package main

import (
	"embed"
	"io/fs"
	"log"

	"github.com/ritiksrivastava/archhelix/cmd"
)

//go:embed ui/build/*
var frontendAssets embed.FS

func main() {
	// Prepare the frontend filesystem
	distFS, err := fs.Sub(frontendAssets, "ui/build")
	if err != nil {
		log.Fatal(err)
	}

	// Execute the root command (starts server by default)
	cmd.Execute(distFS)
}
