import { Box, Text } from 'grommet';
import React, { FC } from 'react';

interface Imenu {
    id:String,
    top:number | boolean,
    left:number | boolean,
    right:number | boolean,
    bottom:number | boolean,
    onClick?: () => void;
}

export const ContextMenu : FC<Imenu> =({
  id,
  top,
  left,
  right,
  bottom,
  ...props
})=>{

  return (
    <Box
    border = {{color:"gray"}}
    style={{
        position: 'absolute',
        backgroundColor:"white",
        top: top !== false ? `${top}px` : undefined,
        left: left !== false ? `${left}px` : undefined,
        right: right !== false ? `${right}px` : undefined,
        bottom: bottom !== false ? `${bottom}px` : undefined,
        zIndex: 999,
        marginTop: "5px"
      }}
      width="small"
      {...props}
    >
      <Text size='small'  margin={{left:"small"}} >Note</Text>
      <Text size='small'  margin={{left:"small"}}>Code</Text>
    </Box>
  );
}


// const [menu, setMenu] = useState<Imenu | null>(null);
// const ref = useRef<HTMLDivElement>(null);
// const onNodeContextMenu = useCallback(
    
//     (event: { preventDefault: () => void; clientY: number; clientX: number; }, node: { id: any; }) => {
//       // Prevent native context menu from showing
//       event.preventDefault();
        
//       console.log('pop', ref.current)
//       // Calculate position of the context menu. We want to make sure it
//       // doesn't get positioned off-screen.
//       if(ref.current){
//         const pane = ref.current.getBoundingClientRect();
//         setMenu({
//             id: node.id,
//             top: event.clientY < pane.height - 200 && event.clientY,
//             left: event.clientX < pane.width - 200 && event.clientX,
//             right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
//             bottom: event.clientY >= pane.height - 200 && pane.height - event.clientY,
//           });


//       }

//     },
//     [setMenu],
//   );


// ref={ref}
// {menu!==null && <ContextMenu onClick={onPaneClick} {...menu} />}