import { Box, Text, Button } from 'grommet';
import { CaretDownFill, Document, Folder, FolderOpen } from 'grommet-icons';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IsettingState, changeCode } from '../store/slice/settingSlice';
import { githubFile } from '../store/slice/githubFileSlice';
import { nodeHover } from '../store/slice/nodeHoverSlice';

interface TreeNodeProps {
    node: TreeNodeData;
}

interface TreeNodeData {
    name: string;
    path: string;
    type: string;
    children?: TreeNodeData[];
}

const TreeNode: React.FC<TreeNodeProps> = ({ node }) => {
    const dispatch = useDispatch();
    const editorState: IsettingState = useSelector((state: any) => state.settings as IsettingState);

    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const filename = node.path;
    const filenameHighlightNode = node.path;

    const doubleClickMouse = () => {
        // We can only change it to split screen if select feature is true on node(select false)
        if (!editorState.code) {
            dispatch(changeCode(true))
            dispatch(githubFile({ file: filename }))
        } else {
            dispatch(changeCode(false))
        }
    }
    const singleClickMouse = () => {
        // We can only change it to split screen if select feature is true on node(select false)
        if (editorState.code) {
            dispatch(githubFile({ file: filename }))
        }
    }

    const highlightNode = () => {
        dispatch(nodeHover({ id: filenameHighlightNode, state: true }))
    }
    const resetNode = () => {
        dispatch(nodeHover({ id: filenameHighlightNode, state: false }))
    }


    return (
        <Box>
            <Box direction="row" align="center" gap="small" onClick={handleToggle}>
                {node.type === "dir" && (isOpen ? <FolderOpen size='small' color="Black" /> : <Folder size='small' color="Black" />)}
                {node.type === "file" && <Box align='center' direction='row' onMouseEnter={highlightNode} onMouseLeave={resetNode} onClick={(e) => { e.stopPropagation(); singleClickMouse(); }} onDoubleClick={(e) => { e.stopPropagation(); doubleClickMouse(); }}><Document style={{ paddingRight: '3px' }} size='small' color="black" /><Button><Text wordBreak='keep-all' size='medium' weight='lighter' color='#515A5A'>{node.name}</Text></Button></Box>}
                {node.type === "dir" && <Text size='medium' weight='normal' color='#909497'>{node.name}</Text>}

                {/* {!node.children && <View size='small'/>} */}
            </Box>
            {isOpen && node.children && (
                <Box margin={{ left: '25px' }}>
                    {node.children.map((childNode, index) => (
                        <TreeNode key={index} node={childNode} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

interface TreeViewProps {
    data: TreeNodeData[];
}

const TreeView: React.FC<TreeViewProps> = ({ data }) => {

    const [isOpen, setIsOpen] = useState(false);

    const changeSetOpen = () => {
        setIsOpen(open => !open);
    }
    return (
        <div style={{ position: 'relative', width: "200px", maxWidth: "200px", maxHeight: '500px', overflowX: 'auto', overflowY: 'auto', borderRadius: '10px', backgroundColor: '#F4F6F7' }}>
            <div style={{ position: 'sticky', top: '0', zIndex: 1, backgroundColor: '#F4F6F7' }}>
                <Box
                    pad='small'
                    gap='xsmall'
                >
                    <Box direction='row' alignContent='between' gap='xsmall'>
                        <Text size='medium' weight='bolder' color='grey'>Project Structure </Text>
                        <CaretDownFill onClick={changeSetOpen} size='medium' />
                    </Box>
                </Box>
            </div>
            <div style={{ position: 'sticky', bottom: '0', zIndex: 1, height: '2px', backgroundColor: '#F4F6F7' }}>
            </div>
            {
                isOpen &&
                <div style={{ width: 'fit-content' }}>
                    <Box
                        pad={{ left: 'small', right: 'small', top: 'xxxsmall', bottom: 'small' }}
                        gap='xsmall'
                    >
                        {data.map((node, index) => (
                            <TreeNode key={index} node={node} />
                        ))}
                    </Box>
                </div>
            }

        </div>
    );
};


const ProjectStructure = () => {
    // console.log('ProjectStructure is called')
    const projectData = useSelector((state: any) => state.nodesAndEdges.projectStructure)
    return <TreeView data={projectData} />;
};

export default ProjectStructure;
