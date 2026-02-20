import React, { useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from '@editorjs/header';
import Embed from '@editorjs/embed'
import Table from '@editorjs/table'
import List from '@editorjs/list'
import Warning from '@editorjs/warning'
import Code from '@editorjs/code'
import LinkTool from '@editorjs/link'
import Image from '@editorjs/image'
import Raw from '@editorjs/raw'
import Marker from '@editorjs/marker'
import CheckList from '@editorjs/checklist'
import ColorPlugin from 'editorjs-text-color-plugin'
import html2pdf from "html2pdf.js";
import { Box, Button, Card, Heading, Text } from 'grommet';
import { useSelector, useDispatch} from "react-redux";
import { closeEditor } from '../store/slice/settingSlice'
import { Close } from "grommet-icons";

const DEFAULT_INITIAL_DATA = {
  "time": new Date().getTime(),
  "blocks": [
    {
      "type": "header",
      "data": {
        "text": "This is my awesome editor!",
        "level": 1
      }
    },
  ]
}

const TOOLS = {
  embed: Embed,
  table: Table,
  marker: Marker,
  list: List,
  warning: Warning,
  code: Code,
  linkTool: LinkTool,
  image: Image,
  raw: Raw,
  header: {
    class: Header,
    config: {
      levels: [2, 3, 4],
      defaultLevel: 3
    }
  },
  checklist: CheckList,
  Color: {
    class: ColorPlugin,
    config: {
      colorCollections: ['#EC7878', '#9C27B0', '#673AB7', '#3F51B5', '#0070FF', '#03A9F4', '#00BCD4', '#4CAF50', '#8BC34A', '#CDDC39', '#FFF'],
      defaultColor: '#FF1300',
      type: 'text',
      customPicker: true,
    }
  },
  Marker: {
    class: ColorPlugin,
    config: {
      colorCollections: ['#EC7878', '#9C27B0', '#673AB7', '#3F51B5', '#0070FF', '#03A9F4', '#00BCD4', '#4CAF50', '#8BC34A', '#CDDC39', '#FFF'],
      defaultColor: '#FFBF00',
      type: 'marker',
      icon: `<svg fill="#000000" height="200px" width="200px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M17.6,6L6.9,16.7c-0.2,0.2-0.3,0.4-0.3,0.6L6,23.9c0,0.3,0.1,0.6,0.3,0.8C6.5,24.9,6.7,25,7,25c0,0,0.1,0,0.1,0l6.6-0.6 c0.2,0,0.5-0.1,0.6-0.3L25,13.4L17.6,6z"></path> <path d="M26.4,12l1.4-1.4c1.2-1.2,1.1-3.1-0.1-4.3l-3-3c-0.6-0.6-1.3-0.9-2.2-0.9c-0.8,0-1.6,0.3-2.2,0.9L19,4.6L26.4,12z"></path> </g> <g> <path d="M28,29H4c-0.6,0-1-0.4-1-1s0.4-1,1-1h24c0.6,0,1,0.4,1,1S28.6,29,28,29z"></path> </g> </g></svg>`
    }
  },
  //  inlineCode: InlineCode,
}

export const NoteEditor = () => {
  const dispatch = useDispatch();
  const [isHover, setHover] = useState(false);


  const githubDetail = useSelector((state) => state.githubDetail);
  const uniqueId = githubDetail.owner + '-' + githubDetail.repo


  // console.log('.... NoteEditor.js is callled')
  const ejInstance = useRef(null);
  

  const initEditor = () => {
    const editor = new EditorJS({
      holder: `editorjs-${uniqueId}`,
      onReady: () => {
        ejInstance.current = editor;
      },
      autofocus: true,
      data: JSON.parse(localStorage.getItem(`editorContent-${uniqueId}`)) || DEFAULT_INITIAL_DATA,
      onChange: async () => {
        let content = await editor.saver.save();
        localStorage.setItem(`editorContent-${uniqueId}`, JSON.stringify(content));
      },
      tools: TOOLS,
    });
  };

  // This will run only once
  useEffect(() => {
    if (ejInstance.current === null || ejInstance.current === undefined) {
      initEditor();
    }

    return () => {
      ejInstance?.current?.destroy();
      ejInstance.current = null;
    };
  }, []);

  const downloadAsPDF = () => {
    // console.log('downlaod a pdf')
    const editorContent = document.getElementById(`editorjs-${uniqueId}`);
    const opt = {
      margin: 1,
      filename: "note.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().from(editorContent).set(opt).save();
  };

  const onClickSplit=()=>{
    dispatch(closeEditor());       
}

  return(
  <>
  <Box align="center" gap='small' direction='row' justify='between'>
    <Heading level="4" margin="small">Notes</Heading>
    <Box direction="row" gap="small" margin='small'>
      <Card onClick={downloadAsPDF} elevation={false} pad="xsmall" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Text weight='bold'  color={isHover ? '#444' : '#666e78'}  >Download</Text>
      </Card>
    <Button onClick={onClickSplit}><Close/></Button>
    </Box>
    
  </Box>

    <Box  pad={{'left':'large', 'right':'small'}}>
      <div id={`editorjs-${uniqueId}`} />
    </Box>
    {/* <div className="pl-4 pr-2 h-full max-h-full overflow-y-auto" id="editorjs" /> */}
  </>
  )
}

// const EditorPage = () => {
//     return (<>
//         <EditorNoSSR  />
//     </>);
// }
// export default EditorPage;

// This is the implementation of Novel.sh yarn add novel@0.1.17
// import { Editor } from "novel";

// export default function EditorPage() {
//   return (
//       <Editor className="h-screen p-3 scroll" defaultValue={{}} />
//   );
// }