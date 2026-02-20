import { Text } from 'grommet';
import { FolderOpen, Folder } from 'grommet-icons';
import React, { memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NodeResizeControl, Handle, Position } from 'reactflow';
import { openFolder } from '../../store/slice/openFolderSlice';

const controlStyle = {
  background: 'transparent',
  border: 'none',
};

const CustomBox = (data: any) => {
  const dispatch = useDispatch();
  const folderState = useSelector((state: any) => state.openFolder.folders[data.id]);
  const isExpanded = folderState !== false;

  const toggleFolder = () => {
    dispatch(openFolder({ id: data.id, state: !isExpanded }))
  }

  const hasExternalEdges = data.data.hasExternalEdges && !isExpanded;
  const hoverBorderColor = data.data.border;

  const inlineStyles: React.CSSProperties = { zIndex: -1 };
  if (hoverBorderColor) {
    inlineStyles.border = `2px solid ${hoverBorderColor}`;
    inlineStyles.boxShadow = `0 0 10px ${hoverBorderColor}`;
  }

  const connectionIndicatorCls = hasExternalEdges && !hoverBorderColor
    ? 'ring-2 ring-indigo-400 ring-offset-2'
    : '';

  return (
    <div className={`relative h-full w-full rounded-lg ${isExpanded ? 'bg-indigo-50/40 shadow-inner' : `bg-white shadow-md ${hoverBorderColor ? 'border-transparent' : 'border border-gray-200'} ${connectionIndicatorCls}`} transition-all duration-300 overflow-hidden backdrop-blur-sm`} style={inlineStyles}>
      <div
        className={`flex items-center justify-between p-2 pl-3 ${isExpanded ? 'bg-indigo-100/50 border-b border-indigo-200/50' : 'bg-gray-50'} cursor-pointer hover:bg-indigo-50 transition-colors`}
        onClick={toggleFolder}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <FolderOpen size='medium' color="brand" /> : <Folder size='medium' color="brand" />}
          <Text size='medium' weight='bold' color="dark-2" className="truncate select-none font-sans">
            {data.data.label || data.id.split('/').pop()}
          </Text>
        </div>
      </div>

      {isExpanded && (
        <NodeResizeControl style={controlStyle} minWidth={150} minHeight={100}>
          <ResizeIcon />
        </NodeResizeControl>
      )}

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

function ResizeIcon() {
  return (
    <div className="absolute bottom-1 right-1 text-gray-400 cursor-se-resize">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <polyline points="16 20 20 20 20 16" />
        <line x1="14" y1="14" x2="20" y2="20" />
      </svg>
    </div>
  );
}

export default memo(CustomBox);


// const controlStyle = {
//   background: 'transparent',
//   border: 'none',
// };

// const CustomBox = (data: any) => {

//   const color = `bg-${data.data.color}`

//   const dispatch = useDispatch();

//   const [folderOpen, setFolderOpen] = useState(false)
//   const [width, setWidth] = useState("medium")
//   const [height, setHeight] = useState("medium")

//   const hideFolder = () => {
//     if (folderOpen) {
//       setWidth(width => width = "xsmall")
//       setHeight(height => height = "xxsmall")
//     } else {
//       setWidth(width => width = "medium")
//       setHeight(height => height = "medium")
//     }

//     dispatch(openFolder({ id: data.id, state: !folderOpen }))
//     setFolderOpen(folderOpen => !folderOpen)
//   }

//   return (
//     <>
//       <NodeResizeControl style={controlStyle} minWidth={100} minHeight={50}>
//         <ResizeIcon />
//         <div className={"" + color}>
//           <Box>
//             <Button className='text-bold' onClick={hideFolder} pad="small" margin={{ right: "5%" }} color="white">
//               {folderOpen ? <Next size='small' /> : <Down size='small' />}
//             </Button>
//           </Box>
//           {data.id}
//         </div>
//       </NodeResizeControl>

//       {/* <Handle type="target" position={Position.Left} /> */}

//       {/* <Handle type="source" position={Position.Right} /> */}
//     </>
//   );
// };

// function ResizeIcon() {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       width="20"
//       height="20"
//       viewBox="0 0 24 24"
//       strokeWidth="2"
//       stroke="#ff0071"
//       fill="none"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       style={{ position: 'absolute', right: 5, bottom: 5 }}
//     >
//       <path stroke="none" d="M0 0h24v24H0z" fill="none" />
//       <polyline points="16 20 20 20 20 16" />
//       <line x1="14" y1="14" x2="20" y2="20" />
//       <polyline points="8 4 4 4 4 8" />
//       <line x1="4" y1="4" x2="10" y2="10" />
//     </svg>
//   );
// }

// export default memo(CustomBox);