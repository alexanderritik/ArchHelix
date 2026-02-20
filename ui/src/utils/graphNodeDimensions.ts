import { Node } from "reactflow";

export const graphNodeDimension = (node: {id: string, state: boolean}, nodes: Node[], nodesAndEdges: { graphAdjListFiles: any; graphAdjListFolder: any; nodesDictionary: any; }) => {
    
    const { graphAdjListFiles, graphAdjListFolder, nodesDictionary } = { ...nodesAndEdges };
    // console.log('node', node)
    // console.log('graphAdjListFiles', graphAdjListFiles)
    // console.log('graphAdjListFolder', graphAdjListFolder)
    // console.log('nodesDictionary', nodesDictionary)
    // console.log('nodes', nodes)

    // when nodes state is set to open means expand
    if(node.state){
 
        const nodeGotChanged = [];

        let clickedNode : Node | undefined = nodes.find((nodeP) => nodeP.id === node.id);
        
        // get all the parents
        const parents = findParents(graphAdjListFolder, node.id);
    
        // get all the siblings (means which are isHidden is true)
        const siblings = isVisible(nodes, node.id);
    
        // get all its child
        const children = structuredClone(getAllChildren(graphAdjListFolder,graphAdjListFiles, nodesDictionary,node.id));
        
        let totalChilds: number = 0 
        if(graphAdjListFolder[node.id]!== undefined && graphAdjListFolder[node.id].length ){
            totalChilds+=graphAdjListFolder[node.id].length 
        }
        if(graphAdjListFiles[node.id]!== undefined && graphAdjListFiles[node.id].length){
            totalChilds+=graphAdjListFiles[node.id].length 
        }
        // console.log('parents',parents)
        // console.log('siblings',siblings)
        // console.log('children',children)
        // console.log('totalChilds',totalChilds)

        const sideLength = Math.ceil(Math.sqrt(totalChilds));
        const numRows = sideLength;
        const numCols = Math.ceil(totalChilds / sideLength);
    
        // calculate largest node width present in a grid so that we can set w and h accordingly
        const node_Width = getLargestNameNodeLen(children)*5;
        children.sort((a:Node,b:Node)=> 
        { 
            if(a.type === "group") {
                return a.id.length-b.id.length;
            } else {
                return 0;
            }
        });
        const cellWidth = numCols * 50;
        const cellHeight = numRows * 20;
        let childIndex = 0, numChildren = children.length;
        for (let row = 0; row < numRows ; row++) {
            let prev_child_position_x = 1, prev_child_position_y = 1;
            for (let col = 0; col < numCols; col++) {
                if (childIndex < numChildren) {
                    const child = children[childIndex];
                    if (col === 0) {
                        if (numChildren === 1) {
                            child.position.x = child.id.length * 2 + (col * cellWidth);
                            child.position.y = child.id.length * 2 + (row * cellHeight);
                        } else {
                            child.position.x = 100 + (col * cellWidth);
                            child.position.y = 100 + (row * cellHeight);
                        }
                    } else {
                        if (child.type === "group") {
                            child.position.x = prev_child_position_x + node_Width + cellWidth;
                            child.position.y = 100 + (row * cellHeight);
                        } else {
                            child.position.x = prev_child_position_x + node_Width + cellWidth;
                            child.position.y = 100 + (row * cellHeight);
                        }
                    }
                    if (child.style) {
                        if (child.type === "group") {
                            child.style.width = 170;
                            child.style.height = 35;
                        }
                    }
                    child.hidden = false;
                    nodeGotChanged.push(child);
                    childIndex++;
                    prev_child_position_x = child.position.x;
                    prev_child_position_y = child.position.y;
                    child.data.icon = false;
                }
            }
        }

        // node which we have clicked we are changing it's width and height
        let ht = 1, wt = 1;
        // 5 for top padding 5 for bottom padding 120 for height of a node
        ht = ht * numRows * (5 + 5 + 120);
        // 100 for padding 50 + 50 left and right
        wt = (wt * numCols * (node_Width + cellWidth)) + 100;
        if (clickedNode !== undefined) {
            let newNode = JSON.parse(JSON.stringify(clickedNode))
            newNode.style = {};
            newNode.style.width = wt;
            newNode.style.height = ht;
            newNode.data.icon = true;
            nodeGotChanged.push(newNode);

            // shift the siblings to right and down
            if (siblings.length) {
                // console.log('sibling', siblings)
                // let lastPos = clickedNode.position.x + Number.parseInt(clickedNode.style?.width.toString());
                siblings.forEach(node => {
                    // position end point check
                    // if (node.position.x) {
                        // console.log(lastPos);
                    // }
                    // node.position.x = node.position.x + wt;
                    // node.position.y = node.position.y + ht;
                });
            }
        }


        // if parent is present then adjust it size according to the size added by expanding node
        if (parents.size) {
            parents.forEach(prtString => {
                const prt = nodesDictionary[prtString];
                nodes.forEach(currNode => {
                    if(currNode.id === prt.id){
                        if (currNode.style) {
                            const w = currNode.style.width as number;
                            const h = currNode.style.height as number;
                            currNode.style.height = h + (ht);
                            currNode.style.width = w + (wt);
                            nodeGotChanged.push(currNode);
                        }
                        return;
                    }
                });
            });
        }
    
        // console.log(siblings, children, parents, nodes, nodeGotChanged, clickedNode)
    
        const changesMap = new Map(nodeGotChanged.map(node => [node.id, node]));
    
        // Replace nodes in the original array with the nodes from nodeGotChanges array if they have the same ID
        const updatedOriginal = nodes.map(node => changesMap.has(node.id) ? changesMap.get(node.id) : node);

        return updatedOriginal as Node[];
        
    }
    else {

        const nodeGotChanged = [];

        function recursivelyHideChildren(nodeId:string) {
            const childrenDeep = getAllChildren(graphAdjListFolder, graphAdjListFiles, nodesDictionary, nodeId);
            const childrens = structuredClone(childrenDeep);
        
            for (const children of childrens) {
                children.hidden = true;
                if (children.type === "group") {
                    recursivelyHideChildren(children.id); // Recursively hide children of this group
                }
                nodeGotChanged.push(children);
            }
        }
        recursivelyHideChildren(node.id);
        // // get all its child
        // const childrenDeep = getAllChildren(graphAdjListFolder,graphAdjListFiles, nodesDictionary,node.id);
        // const childrens = structuredClone(childrenDeep)
        // for(const children of childrens){
        //     children.hidden = true;
        //     if(children.type==="group"){
        //         const internalChildren= structuredClone(getAllChildren(graphAdjListFolder,graphAdjListFiles, nodesDictionary,node.id));
        //     }
        //     nodeGotChanged.push(children);
        // }


        //changing its self
        let clickedNode : Node | undefined = nodes.find((nodeP) => nodeP.id === node.id);
        

        // get all the parents
        const parents = findParents(graphAdjListFolder, node.id);
        // if parent is present then adjust it size according to the size added by expanding node
        if (parents.size) {
            parents.forEach(prtString => {
                const prt = nodesDictionary[prtString];
                nodes.forEach(currNode => {
                    if(currNode.id === prt.id){
                        // console.log('chid-parent', currNode.id )
                        if (clickedNode && clickedNode.style && currNode.style) {
                            const w = clickedNode.style.width as number;
                            const h = clickedNode.style.height as number;
                            const hold = currNode.style.height as number;
                            const wold = currNode.style.width as number;
                            currNode.style.height = hold - (h);
                            currNode.style.width = wold - (w);
                            nodeGotChanged.push(currNode);
                        }
                        return;
                    }
                });
            });
        }

        if (clickedNode !== undefined) {
            let newNode = JSON.parse(JSON.stringify(clickedNode))
            newNode.style = {};
            newNode.style.width = 170;
            newNode.style.height = 35;
            nodeGotChanged.push(newNode);
        }
            

        const changesMap = new Map(nodeGotChanged.map(node => [node.id, node]));
    
        // Replace nodes in the original array with the nodes from nodeGotChanges array if they have the same ID
        const updatedOriginal = nodes.map(node => changesMap.has(node.id) ? changesMap.get(node.id) : node);

        return updatedOriginal as Node[];

    }

   
}

function findParents(graph: { [K: string]: string[] }, node: string, visited: Set<string> = new Set()): Set<string> {
    const parents = new Set<string>();

    if (node === '') return parents;
    // Add the node to visited set to avoid revisiting it
    visited.add(node);

    // Iterate through each key-value pair in the graph
    for (const [key, value] of Object.entries(graph)) {
        // Check if the node is present in the current value list
        if (value.includes(node) && key !== '') {
            // Add the key (parent) to the parents set
            parents.add(key);
            // If the parent node hasn't been visited, perform DFS recursively
            if (!visited.has(key)) {
                const recursiveParents = findParents(graph, key, visited);
                recursiveParents.forEach(parent => parents.add(parent));
            }
        }
    }

    return parents;
}

function isVisible(nodes: Node[], root: string) {
    const visibleNodes: Node[] = [];
    nodes.forEach(node => {
        if (!node.hidden && node.id !== root) {
            visibleNodes.push(node);
        }
    })
    return visibleNodes;
}

function getAllChildren(graphAdjListFolder: { [K: string]: any[] | string[]; },graphAdjListFiles: { [K: string]: any[] | string[]; },nodesDictionary: { [x: string]: Node; }, node: string) {
    const children: Node[] = [];
    // console.log(graphAdjListFolder[node], graphAdjListFiles[node])
    for( const index in graphAdjListFolder[node]){
        // graphAdjListFolder[node].forEach(cnode => {
        //     children.push(nodesDictionary[cnode]);
        // })
        children.push(nodesDictionary[graphAdjListFolder[node][index]]);
    }


    for( const index in graphAdjListFiles[node]){
        // graphAdjListFiles[node].forEach(cnode => {
        //     children.push(nodesDictionary[cnode]);
        // });
        children.push(nodesDictionary[graphAdjListFiles[node][index]]);
    }



    return children;
}

function getLargestNameNodeLen(children: Node[]): number {
    let maxLen = 0;
    children.forEach(child=>{
        if (child.data.label.length > maxLen)
            maxLen = child.data.label.length;
    });
    return maxLen;
}
