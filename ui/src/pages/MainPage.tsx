import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    Background,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    Node,
    Edge,
    getOutgoers,
    getIncomers,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSelector } from 'react-redux';
import { Card, RangeInput } from 'grommet';

import CustomNode from '../utils/nodes/customNode';
import { NoteEditor } from '../editor/notesEditor';
import { CodeEditor } from '../editor/codeEditor';
import ProjectStructure from '../utils/projectStructure';
import Draggable from '../utils/useDrag';
import CustomBox from '../utils/nodes/customBox';
import { graphNodeDimension } from '../utils/graphNodeDimensions';
import { IsettingState } from '../store/slice/settingSlice';
import { getUpdatedNodesAndEdges } from '../utils/graphUtils';

const nodeTypes = { custom: CustomNode, group: CustomBox };

const DependencyLegend = () => (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 text-sm font-sans w-52">
        <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">Dependency Heatmap</h3>
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: '#ffffff' }}></div>
                <span className="text-gray-600 text-xs">0 dependencies</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: '#fef08a' }}></div>
                <span className="text-gray-600 text-xs">1 - 3 (Low)</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: '#fdba74' }}></div>
                <span className="text-gray-600 text-xs">4 - 7 (Medium)</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: '#fca5a5' }}></div>
                <span className="text-gray-600 text-xs">8 - 14 (High)</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-gray-600 text-xs">15+ (Critical)</span>
            </div>
        </div>
    </div>
);

const MainPage = () => {
    const editorState: IsettingState = useSelector((state: any) => state.settings as IsettingState);
    const showSidebar = editorState.code || editorState.note;
    const nodesAndEdges = useSelector((state: any) => state.nodesAndEdges);
    const openFolderState = useSelector((state: any) => state.openFolder);
    const nodeHoverState = useSelector((state: any) => state.nodeHover);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(window.innerWidth / 2);
    const [mainContentbarWidth, setMainContentBarWidth] = useState(window.innerWidth / 2);
    const [isolatedNodeId, setIsolatedNodeId] = useState<string | null>(null);

    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const collapsedFoldersMap = openFolderState.folders || {};

        // Use the centralized dynamic layout generator on every toggle
        const { nodes: updatedNodes, edges: updatedEdges } = getUpdatedNodesAndEdges(collapsedFoldersMap);

        if (updatedNodes.length > 0) {
            setNodes(updatedNodes);
            setEdges(updatedEdges);
            setIsolatedNodeId(null);
        }
    }, [openFolderState.folders, setNodes, setEdges]);

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback(
        (mouseMoveEvent: { clientX: number }) => {
            if (isResizing && sidebarRef.current) {
                setSidebarWidth(
                    Math.min(mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left, window.innerWidth / 2)
                );
            }
        },
        [isResizing]
    );

    useEffect(() => {
        const totalWidth = window.innerWidth;
        const minMainContentWidth = window.innerWidth / 4;
        const newMainContentWidth = Math.min(totalWidth - sidebarWidth, window.innerWidth - minMainContentWidth);
        setMainContentBarWidth(Math.max(newMainContentWidth, minMainContentWidth));
    }, [sidebarWidth]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    const highlightPath = (node: Node, nodes: Node[], edges: Edge[], selection: boolean) => {
        if (isolatedNodeId) return;
        if (node.type === "custom") {
            const allIncomers = getIncomers(node, nodes, edges);
            const allOutgoers = getOutgoers(node, nodes, edges);

            const incomersSet = new Set(allIncomers.map(n => n.id));
            const outgoersSet = new Set(allOutgoers.map(n => n.id));

            const incomerAncestors = new Set<string>();
            const outgoerAncestors = new Set<string>();
            const hoveredAncestors = new Set<string>();

            const addAncestors = (nId: string, targetSet: Set<string>) => {
                const n = nodes.find(x => x.id === nId);
                if (n && n.parentNode) {
                    targetSet.add(n.parentNode);
                    addAncestors(n.parentNode, targetSet);
                }
            };

            addAncestors(node.id, hoveredAncestors);
            allIncomers.forEach(n => addAncestors(n.id, incomerAncestors));
            allOutgoers.forEach(n => addAncestors(n.id, outgoerAncestors));

            const updatedNodes = nodes.map((elem) => {
                const isHovered = elem.id === node.id;
                const isHoveredAncestor = hoveredAncestors.has(elem.id);

                const isIncomer = incomersSet.has(elem.id) || incomerAncestors.has(elem.id);
                const isOutgoer = outgoersSet.has(elem.id) || outgoerAncestors.has(elem.id);

                const highlight = isHovered || isHoveredAncestor || isIncomer || isOutgoer;
                const opacity = highlight ? 1 : 0.25;

                let borderColor;
                if (isIncomer) borderColor = 'red';
                if (isOutgoer) borderColor = 'green';

                return {
                    ...elem,
                    data: {
                        ...elem.data,
                        border: highlight && !isHovered && !isHoveredAncestor ? borderColor : undefined,
                    },
                    style: {
                        ...elem.style,
                        opacity,
                    },
                };
            });

            const updatedEdges = edges.map((edge) => {
                // If the edge connects nodes in the path
                const isActive = (edge.source === node.id && outgoersSet.has(edge.target)) ||
                    (edge.target === node.id && incomersSet.has(edge.source));

                return {
                    ...edge,
                    animated: isActive,
                    style: {
                        ...edge.style,
                        opacity: isActive ? 1 : 0.15,
                    }
                }
            });

            setNodes(updatedNodes);
            setEdges(updatedEdges);
        }
    };

    const resetNodeStyles = (nodes: Node[], edges: Edge[]) => {
        if (isolatedNodeId) return;
        const updatedNodes = nodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                border: undefined,
            },
            style: {
                ...node.style,
                opacity: 1,
            },
        }));
        setNodes(updatedNodes);

        const updatedEdges = edges.map((edge) => ({
            ...edge,
            animated: false,
            style: {
                ...edge.style,
                opacity: 1,
            }
        }));
        setEdges(updatedEdges);
    };

    const onPaneClick = useCallback(() => {
        setIsolatedNodeId(null);
        setNodes(nds => nds.map(n => ({
            ...n,
            hidden: false,
            data: { ...n.data, border: undefined },
            style: { ...n.style, opacity: 1 }
        })));
        setEdges(eds => eds.map(e => ({
            ...e,
            hidden: e.data?.originalHidden,
            animated: false,
            style: { ...e.style, opacity: 1 }
        })));
    }, [setNodes, setEdges]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (isolatedNodeId || node.type === "group") {
            return;
        }

        setIsolatedNodeId(node.id);

        const allIncomers = getIncomers(node, nodes, edges);
        const allOutgoers = getOutgoers(node, nodes, edges);

        const incomersSet = new Set(allIncomers.map(n => n.id));
        const outgoersSet = new Set(allOutgoers.map(n => n.id));

        const incomerAncestors = new Set<string>();
        const outgoerAncestors = new Set<string>();
        const hoveredAncestors = new Set<string>();

        const addAncestors = (nId: string, targetSet: Set<string>) => {
            const n = nodes.find(x => x.id === nId);
            if (n && n.parentNode) {
                targetSet.add(n.parentNode);
                addAncestors(n.parentNode, targetSet);
            }
        };

        addAncestors(node.id, hoveredAncestors);
        allIncomers.forEach(n => addAncestors(n.id, incomerAncestors));
        allOutgoers.forEach(n => addAncestors(n.id, outgoerAncestors));

        const updatedNodes = nodes.map((elem) => {
            const isHovered = elem.id === node.id;
            const isHoveredAncestor = hoveredAncestors.has(elem.id);
            const isIncomer = incomersSet.has(elem.id) || incomerAncestors.has(elem.id);
            const isOutgoer = outgoersSet.has(elem.id) || outgoerAncestors.has(elem.id);

            const highlight = isHovered || isHoveredAncestor || isIncomer || isOutgoer;

            let borderColor;
            if (isIncomer) borderColor = 'red';
            if (isOutgoer) borderColor = 'green';

            return {
                ...elem,
                hidden: !highlight,
                data: {
                    ...elem.data,
                    border: highlight && !isHovered && !isHoveredAncestor ? borderColor : undefined,
                },
                style: {
                    ...elem.style,
                    opacity: 1,
                },
            };
        });

        const updatedEdges = edges.map((edge) => {
            const isActive = (edge.source === node.id && outgoersSet.has(edge.target)) ||
                (edge.target === node.id && incomersSet.has(edge.source));

            return {
                ...edge,
                hidden: !isActive || edge.data?.originalHidden,
                animated: isActive,
                style: {
                    ...edge.style,
                    opacity: 1,
                }
            };
        });

        setNodes(updatedNodes);
        setEdges(updatedEdges);
    }, [nodes, edges, isolatedNodeId, setNodes, setEdges]);

    return (
        <ReactFlowProvider>
            <div className="fixed min-h-screen flex flex-row h-screen bg-white">
                <div
                    ref={sidebarRef}
                    className="flex flex-row bg-white border-r border-gray-200 z-20"
                    style={showSidebar ? { minWidth: window.innerWidth / 4, width: sidebarWidth } : { width: window.innerWidth }}

                >
                    <div className="flex-1 relative">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            nodeTypes={nodeTypes}
                            fitView
                            fitViewOptions={{ maxZoom: 1, minZoom: 0 }}
                            proOptions={{ hideAttribution: true }}
                            onNodeMouseEnter={(event, node) => highlightPath(node, nodes, edges, true)}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            snapToGrid
                            panOnScroll
                            selectionOnDrag
                            onNodeMouseLeave={() => resetNodeStyles(nodes, edges)}
                        >
                            <Background variant={BackgroundVariant.Dots} />
                        </ReactFlow>
                    </div>
                    <div
                        className="flex-none w-1.5 cursor-col-resize hover:bg-gray-400"
                        onMouseDown={startResizing}
                    />
                    {nodesAndEdges.projectStructure.length !== 0 && (
                        <>
                            <Draggable initialX={100} initialY={100}>
                                <div className="absolute top-20 z-40">
                                    <ProjectStructure />
                                </div>
                            </Draggable>
                            <Draggable initialX={window.innerWidth / 4 - 250} initialY={window.innerHeight - 250}>
                                <div className="absolute z-40">
                                    <DependencyLegend />
                                </div>
                            </Draggable>
                        </>
                    )}
                </div>
                {showSidebar && (
                    <div
                        className="pt-2 flex-1 flex flex-col rounded-r-lg"
                        style={{ width: mainContentbarWidth }}
                    >
                        {editorState.note && <NoteEditor />}
                        {editorState.code && <CodeEditor />}
                    </div>
                )}
            </div>
        </ReactFlowProvider>
    );
};

export default MainPage;
