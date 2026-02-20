import { Edge, MarkerType, Node } from "reactflow";
import { store } from '../store/store';
import { nodesAndEdges } from "../store/slice/nodesAndEdgesSlice";
import { setOpenFolders } from "../store/slice/openFolderSlice";

// Structure from Go Graph
interface GoNode {
    ID: string;
    Label: string;
    DependencyCount?: number;
}

interface GoEdge {
    Source: string;
    Target: string;
}

interface GoGraph {
    Nodes: GoNode[];
    Edges: GoEdge[];
}

interface NodeTree {
    id: string;
    isFolder: boolean;
    name: string;
    children: NodeTree[];
    goNode?: GoNode;
    width: number;
    height: number;
    x: number;
    y: number;
    color?: string;
}

const PADDING = 40;
const HEADER_HEIGHT = 60;
const GAP = 20;

let cachedTreeRoot: NodeTree | null = null;
let cachedEdgesData: GoEdge[] = [];
const colorPalette = [
    '#F28B82', '#FBBC05', '#FFF475', '#CCFF90', '#A7FFEB',
    '#CBF0F8', '#AECBFA', '#D7AEFB', '#FDCFE8', '#E6C9A8', '#E8EAED',
];

function assignColors(node: NodeTree) {
    if (!node.color) {
        node.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    }
    if (node.isFolder) {
        node.children.forEach(assignColors);
    }
}

function layoutTree(node: NodeTree, collapsedFoldersMap: Record<string, boolean>) {
    if (!node.isFolder) {
        node.width = 220;
        node.height = 70;
        return;
    }

    const isCollapsed = collapsedFoldersMap[node.id] === false;

    if (isCollapsed) {
        const labelLength = node.name ? node.name.length : 0;
        node.width = Math.max(150, Math.min(1000, labelLength * 11 + 60));
        node.height = HEADER_HEIGHT;
        return;
    }

    // Layout children first
    node.children.forEach(child => layoutTree(child, collapsedFoldersMap));

    // Sort children: folders first, then files
    node.children.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
        return a.isFolder ? -1 : 1;
    });

    const maxRowWidth = Math.max(800, Math.ceil(Math.sqrt(node.children.length)) * 260);

    let currentX = PADDING;
    let currentY = PADDING + HEADER_HEIGHT;
    let rowHeight = 0;
    let maxWidth = PADDING; // at least padding size

    node.children.forEach(child => {
        if (currentX + child.width > maxRowWidth && currentX > PADDING) {
            // move to next row
            currentX = PADDING;
            currentY += rowHeight + GAP;
            rowHeight = 0;
        }

        child.x = currentX;
        child.y = currentY;

        currentX += child.width + GAP;
        rowHeight = Math.max(rowHeight, child.height);
        maxWidth = Math.max(maxWidth, currentX);
    });

    currentY += rowHeight > 0 ? rowHeight + PADDING : PADDING;

    node.width = maxWidth || 200;
    node.height = currentY;
}

const processGraphData = async (goGraph: GoGraph, structureData: any[] = []) => {
    try {
        if (!goGraph || !goGraph.Nodes || !goGraph.Edges) {
            const payload = {
                initialNodes: [],
                initialEdges: [],
                graphAdjListFolder: {},
                graphAdjListFiles: {},
                nodesDictionary: {},
                projectStructure: structureData,
                error: "Invalid graph data received",
            }
            store.dispatch(nodesAndEdges(payload));
            return;
        }

        const nodeData = goGraph.Nodes;
        const edgeData = goGraph.Edges;
        cachedEdgesData = edgeData;

        // Build tree
        const treeRoot: NodeTree = { id: 'root', isFolder: true, name: 'Project Root', children: [], width: 0, height: 0, x: 0, y: 0 };
        const idToTree: { [id: string]: NodeTree } = { 'root': treeRoot };

        nodeData.forEach(goNode => {
            const parts = goNode.ID.split('/');
            let currentParent = treeRoot;
            let currentPath = '';

            for (let i = 0; i < parts.length - 1; i++) {
                currentPath += (i === 0 ? '' : '/') + parts[i];
                if (!idToTree[currentPath]) {
                    const newFolder: NodeTree = { id: currentPath, isFolder: true, name: parts[i], children: [], width: 0, height: 0, x: 0, y: 0 };
                    idToTree[currentPath] = newFolder;
                    currentParent.children.push(newFolder);
                }
                currentParent = idToTree[currentPath];
            }

            const fileNode: NodeTree = { id: goNode.ID, isFolder: false, name: parts[parts.length - 1], children: [], goNode: goNode, width: 0, height: 0, x: 0, y: 0 };
            currentParent.children.push(fileNode);
            idToTree[goNode.ID] = fileNode;
        });

        assignColors(treeRoot);
        cachedTreeRoot = treeRoot;

        let initialFoldersState: Record<string, boolean> = {};

        // Find depths map first to initialize states
        const initFolderStates = (treeNode: NodeTree, depth: number = 0) => {
            if (treeNode.isFolder) {
                initialFoldersState[treeNode.id] = depth < 1;
                treeNode.children.forEach(child => initFolderStates(child, depth + 1));
            }
        };
        initFolderStates(treeRoot);

        // Compute layout
        layoutTree(treeRoot, initialFoldersState);

        const { nodes, edges, nodesDictionary } = computeNodesAndEdgesState(treeRoot, cachedEdgesData, initialFoldersState);

        const payload = {
            initialNodes: nodes,
            initialEdges: edges,
            graphAdjListFolder: {},
            graphAdjListFiles: {},
            nodesDictionary,
            projectStructure: structureData,
        };

        store.dispatch(nodesAndEdges(payload));
        store.dispatch(setOpenFolders(initialFoldersState));

    } catch (error) {
        console.error('Error processing graph data:', error);
    }
};

export const getUpdatedNodesAndEdges = (collapsedFoldersMap: Record<string, boolean>) => {
    if (!cachedTreeRoot) return { nodes: [], edges: [], nodesDictionary: {} };

    // Recompute layout for entire tree according to state
    layoutTree(cachedTreeRoot, collapsedFoldersMap);

    return computeNodesAndEdgesState(cachedTreeRoot, cachedEdgesData, collapsedFoldersMap);
};

const computeNodesAndEdgesState = (treeRoot: NodeTree, edgeData: GoEdge[], collapsedFoldersMap: Record<string, boolean>) => {
    let nodes: Node[] = [];
    let nodesDictionary: { [K: string]: Node } = {};
    const childToParent = new Map<string, string>();

    const populateChildToParent = (node: NodeTree, parent?: string) => {
        if (parent) {
            childToParent.set(node.id, parent);
        }
        if (node.isFolder) {
            node.children.forEach(child => populateChildToParent(child, node.id));
        }
    };
    populateChildToParent(treeRoot);

    const generateReactFlowNodes = (treeNode: NodeTree, parentId?: string) => {
        if (treeNode.isFolder) {
            const folderNode: Node = {
                id: treeNode.id,
                type: 'group',
                position: { x: treeNode.x, y: treeNode.y },
                parentNode: parentId,
                style: { width: treeNode.width, height: treeNode.height, zIndex: -1 },
                data: { label: treeNode.name, color: treeNode.color, icon: true, originalWidth: treeNode.width, originalHeight: treeNode.height },
            };
            nodes.push(folderNode);
            nodesDictionary[folderNode.id] = folderNode;

            if (collapsedFoldersMap[treeNode.id] !== false) {
                treeNode.children.forEach(child => generateReactFlowNodes(child, treeNode.id));
            }
        } else {
            const fileNode: Node = {
                id: treeNode.id,
                type: 'custom',
                position: { x: treeNode.x, y: treeNode.y },
                parentNode: parentId,
                hidden: false,
                extent: 'parent',
                data: {
                    label: treeNode.goNode?.Label || treeNode.name,
                    color: treeNode.color,
                    icon: false,
                    dependencyCount: treeNode.goNode?.DependencyCount || 0,
                }
            };
            nodes.push(fileNode);
            nodesDictionary[fileNode.id] = fileNode;
        }
    }

    generateReactFlowNodes(treeRoot);

    const getVisibleAncestor = (nodeId: string): string => {
        let current = nodeId;
        let lastVisible = current;
        while (childToParent.has(current)) {
            let parent = childToParent.get(current)!;
            if (collapsedFoldersMap[parent] === false) {
                lastVisible = parent;
            }
            current = parent;
        }
        return lastVisible;
    };

    const hasExternalEdgesMap: Record<string, boolean> = {};

    const edges: Edge[] = edgeData.map((edge, index) => {
        const sourceVisible = getVisibleAncestor(edge.Source);
        const targetVisible = getVisibleAncestor(edge.Target);

        if (sourceVisible === targetVisible) {
            return {
                id: `e-${edge.Source}-${edge.Target}-${index}`,
                source: edge.Source,
                target: edge.Target,
                hidden: true,
                data: { originalHidden: true },
            };
        }

        hasExternalEdgesMap[sourceVisible] = true;
        hasExternalEdgesMap[targetVisible] = true;

        return {
            id: `e-${edge.Source}-${edge.Target}-${index}`,
            source: sourceVisible,
            target: targetVisible,
            hidden: false,
            data: { originalHidden: false },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
                color: '#A9A9A9',
            },
            style: {
                strokeWidth: 2,
                stroke: '#A9A9A9',
            }
        };
    });

    nodes = nodes.map(node => {
        if (hasExternalEdgesMap[node.id]) {
            const updatedNode = {
                ...node,
                data: {
                    ...node.data,
                    hasExternalEdges: true
                }
            };
            nodesDictionary[updatedNode.id] = updatedNode;
            return updatedNode;
        }
        return node;
    });

    return { nodes, edges, nodesDictionary };
};

export { processGraphData };
// const initialNodes: Node[] = [];
// const initialEdges: Edge[] = [];


// type MyMap = { [K: string]: string[] };
// let graphAdjListFolder: MyMap = {};
// let graphAdjListFiles: MyMap = {};
// let nodesDictionary: { [K: string]: Node }= {}

// let colors = [
//     "Red",
//     "Orange",
//     "Yellow",
//     "Green",
//     "Teal",
//     "Blue",
//     "Dark Blue",
//     "Purple",
//     "Pink",
//     "Brown",
//     "Gray",
// ]
// let nodes = [];
// for (let index = 0; index < nodeData.length; index++) {
//     nodes.push(nodeData[index] as Node)
//     let rand = Math.floor(Math.random() * 6) + 1;
//     nodes[index].data.color = colors[rand];
// }

// const edges = [];
// for (let index = 0; index < edgeData.length; index++) {
//     edges.push(edgeData[index] as Edge);
//     edges[index].markerEnd ={
//         type: MarkerType.ArrowClosed,
//         width: 15, 
//         height:15,
//         color: '#A9A9A9',
//     }
//     edges[index].style = {
//         strokeWidth: 2,
//         stroke: '#A9A9A9',
//       }
// }


// // making adj list for folders
// initialNodes.forEach(node => {
//     if(node.type === "group") {
//         let parentNode: string = node.parentNode === undefined ? "" : node.parentNode;
//         if(graphAdjListFolder[node.id] === undefined) {
//             graphAdjListFolder[node.id]=[];
//         }
//         if(graphAdjListFolder[parentNode == null ? "" : parentNode] === undefined) {
//             graphAdjListFolder[parentNode == null ? "" : parentNode]=[];
//         }
//         graphAdjListFolder[parentNode == null ? "" : parentNode].push(node.id);
//     }
// });

// // making adj list for files in folder
// initialNodes.forEach(node => {
//     if(node.type === "group") {
//         initialNodes.forEach(file => {
//             if(file.type === "custom" && file.parentNode === node.id) {
//                 if(!graphAdjListFiles[node.id]) {
//                     graphAdjListFiles[node.id] = [];
//                 }
//                 graphAdjListFiles[node.id].push(file.id);
//             }
//         });
//     }
// });

// // making a dictionary for all nodes
// initialNodes.forEach(node => {
//     nodesDictionary[node.id] = node;
// });

// export {initialNodes, initialEdges, graphAdjListFolder, graphAdjListFiles, nodesDictionary};





// console.log(initialNodes, initialEdges)

// export const initialNodes: Node[] = [
//     // { id: 'Bigbox', position: { x: 0, y: 0 }, type: "groupBox", data: { icon: "CaretDownFill", label: 'Box' ,},  hidden:false},
//     // { id: 'box', position: { x: 0, y: 0 }, type: "groupBox", data: { icon: "CaretDownFill", label: 'Box' ,}, parentNode: 'Bigbox', extent: 'parent', hidden:false},
//     { id: 'box', position: { x: 0, y: 0 }, type: "groupBox", data: { icon: "CaretDownFill", label: 'Box' ,}, hidden:false},
//     // { id: '1', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file1' }, },
//     // { id: '2', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file2' } }, 
//     // { id: '3', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file3' }, },
//     // { id: '4', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file4' } },
//     // { id: '5', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file5' } },
//     // { id: '6', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file6' } },
//     // { id: '7', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' } },
//     { id: '6', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file6' },parentNode: 'box', extent: 'parent', hidden:false},
//     { id: '7', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' },parentNode: 'box', extent: 'parent',  hidden:false },
//     { id: '8', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' },parentNode: 'box', extent: 'parent',  hidden:false },
//     { id: '9', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' },parentNode: 'box', extent: 'parent',  hidden:false },
//     { id: '10', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' },parentNode: 'box', extent: 'parent',  hidden:false},
//     // { id: '8', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file8' } },
//     // { id: '9', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file9' } },
//     // { id: '10', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file10' } },
// ];



// export const initialNodes:Node[] = [
//     { id: 'box', position: { x: 0, y: 0 }, type: "groupBox", data: { icon: "CaretDownFill", label: 'Box' ,}},
//     // { id: '1', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file1' }, },
//     // { id: '2', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file2' } }, 
//     // { id: '3', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file3' }, },
//     // { id: '4', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file4' } },
//     // { id: '5', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file5' } },
//     // { id: '6', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file6' } },
//     // { id: '7', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' } },
//     { id: '6', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file6' },parentNode: 'box', extent: 'parent',},
//     { id: '7', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' },parentNode: 'box', extent: 'parent',},
//     { id: '8', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' },parentNode: 'box', extent: 'parent',},
//     { id: '9', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' },parentNode: 'box', extent: 'parent',},
//     { id: '10', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file7' },parentNode: 'box', extent: 'parent',},
//     // { id: '8', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file8' } },
//     // { id: '9', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file9' } },
//     // { id: '10', position: { x: 0, y: 0 }, type: "custom", data: { icon: "CaretDownFill", label: 'file10' } },
// ];


// export const initialEdges = [
//     { id: 'e1', source: '1', target: '2', label: "component" },
//     { id: 'e2', source: '1', target: '3', label: "interface" },
//     { id: 'e7', source: '1', target: '8', label: "db" },
//     { id: 'e3', source: '2', target: '4', label: "box" },
//     { id: 'e4', source: '2', target: '5', label: "labels" },
//     { id: 'e5', source: '3', target: '6', label: "status" },
//     { id: 'e6', source: '3', target: '7', label: "files" },
//     { id: 'e8', source: '8', target: '9', label: "model" },
//     { id: 'e10', source: '8', target: '10', label: "migration" },
// ];


