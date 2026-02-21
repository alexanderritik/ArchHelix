import { Text } from 'grommet';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useDispatch, useSelector } from "react-redux"
import { IsettingState, changeCode } from '../../store/slice/settingSlice'
import { githubFile } from '../../store/slice/githubFileSlice';

const getFileIcon = (filename: string) => {
  if (!filename) return '📄';
  const parts = filename.split('.');
  if (parts.length === 1) return '📄';
  const ext = parts.pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return '🟨';
    case 'ts':
    case 'tsx':
      return '📘';
    case 'go':
      return '🐹';
    case 'py':
      return '🐍';
    case 'rs':
      return '🦀';
    case 'java':
      return '☕';
    case 'html':
    case 'htm':
      return '🌐';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return '🎨';
    case 'json':
      return '📋';
    case 'md':
      return '📝';
    case 'sh':
    case 'bash':
      return '🐚';
    case 'sql':
      return '🗄️';
    case 'svg':
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return '🖼️';
    default:
      return '📄';
  }
};

const CustomNode = (data: any) => {
  const dispatch = useDispatch();
  const editorState: IsettingState = useSelector((state: any) => state.settings as IsettingState);


  let border = true;
  if (data.data.border === undefined) {
    border = false;
  }

  // This helps to being side bar on double click on node
  const doubleClickMouse = () => {
    let filePath = data.id;
    // We can only change it to split screen if select feature is true on node(select false)
    if (!editorState.code) {
      // console.log('double', editorState.code)
      dispatch(changeCode(true))
      dispatch(githubFile({ file: filePath }))

    } else {
      dispatch(changeCode(false))
    }
  }

  const singleClickMouse = () => {
    let filePath = data.id;

    // We can only change it to split screen if select feature is true on node(select false)
    if (editorState.code) {
      dispatch(githubFile({ file: filePath }))
    }
  }

  const label = data.data.label;
  const isHighlighted = !!border;
  const iconSource = getFileIcon(data.id);

  const dependencyCount = data.data.dependencyCount || 0;

  let backgroundColor = '#ffffff'; // 0 deps
  if (dependencyCount > 0 && dependencyCount <= 3) backgroundColor = '#fef08a'; // yellow-200
  else if (dependencyCount > 3 && dependencyCount <= 7) backgroundColor = '#fdba74'; // orange-300
  else if (dependencyCount > 7 && dependencyCount <= 14) backgroundColor = '#fca5a5'; // red-300
  else if (dependencyCount > 14) backgroundColor = '#ef4444'; // red-500

  return (
    <div
      className={`relative flex items-center justify-between px-3 py-1.5 rounded-md transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${isHighlighted ? 'border-2 border-dashed' : 'border border-gray-200'}`}
      style={{
        ...(isHighlighted ? { borderColor: data.data.border, zIndex: 10 } : { zIndex: 0 }),
        backgroundColor
      }}
      onDoubleClick={doubleClickMouse}
      onClick={singleClickMouse}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm select-none">{iconSource}</span>
        <Text size="small" weight="normal" color="dark-2" className="truncate font-sans select-none">
          {label}
        </Text>
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export default memo(CustomNode);
