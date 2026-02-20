package graph

type Graph struct {
	Nodes []Node
	Edges []Edge
}

type Node struct {
	ID              string
	Label           string
	DependencyCount int
}

type Edge struct {
	Source string
	Target string
}
