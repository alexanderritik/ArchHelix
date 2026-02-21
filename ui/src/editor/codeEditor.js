import Editor, { useMonaco } from '@monaco-editor/react';
import { Heading, Box, Button, Card } from 'grommet';
import { Add, Close, Subtract } from 'grommet-icons';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeEditor } from '../store/slice/settingSlice'
import { fetchCodeFromBackend, fetchAllCodeFiles } from '../services/getCodeFromGithub';

const extensionToLanguageMap = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    rs: 'rust',
    go: 'go',
    mdx: 'markdown',
    sh: 'shell',
    // Add more mappings as needed
};

const getLanguageByExtension = (filename) => {
    const extension = filename.split('.').pop();
    return extensionToLanguageMap[extension] || 'plaintext';
};

export const CodeEditor = () => {
    const dispatch = useDispatch();

    // console.log('.... CodeEditor.js is callled')
    const githubSelectedFile = useSelector((state) => state.githubFile);
    const githubDetail = useSelector((state) => state.githubDetail)

    const [font, setFont] = useState(16);
    const [code, setCode] = useState(``);
    const [language, setLanguage] = useState('typescript'); // Default language
    const filename = githubSelectedFile.file;

    const monaco = useMonaco();
    const [modelsLoaded, setModelsLoaded] = useState(false);

    useEffect(() => {
        if (monaco && !modelsLoaded) {
            const loadAllFiles = async () => {
                const files = await fetchAllCodeFiles();

                if (monaco.languages?.typescript?.typescriptDefaults) {
                    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                        target: monaco.languages.typescript.ScriptTarget.Latest,
                        allowNonTsExtensions: true,
                        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                        module: monaco.languages.typescript.ModuleKind.CommonJS,
                        noEmit: true,
                        esModuleInterop: true,
                        jsx: monaco.languages.typescript.JsxEmit.React,
                        reactNamespace: "React",
                        allowJs: true,
                    });
                }

                Object.entries(files).forEach(([path, content]) => {
                    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
                    const uri = monaco.Uri.parse(`file:///${normalizedPath}`);
                    if (!monaco.editor.getModel(uri)) {
                        const lang = getLanguageByExtension(path);
                        monaco.editor.createModel(content, lang, uri);
                    }
                });
                setModelsLoaded(true);
            };
            loadAllFiles();
        }
    }, [monaco, modelsLoaded]);

    useEffect(() => {
        const fetchCodeAndDetectLanguage = async () => {
            try {
                const response = await fetchCodeFromBackend(githubDetail.owner, githubDetail.repo, githubSelectedFile.file);
                setCode(code => `${response}`)
                const detectedLanguage = getLanguageByExtension(githubSelectedFile.file);
                setLanguage(detectedLanguage);
                // console.log(githubSelectedFile.file, detectedLanguage)
                // setLanguage(detectedLanguage || 'plaintext'); // Set to plaintext if detection fails
                // console.log(detectedLanguage, language); // Handle the detected language here
            } catch (error) {
                console.error('Error fetching code:', error);
            }
        };

        // if (githubSelectedFile.file) {
        fetchCodeAndDetectLanguage();
        // }
    }, [githubSelectedFile.file, githubDetail.owner, githubDetail.repo]);

    const editorDidMount = (editor) => {
        editor.focus();
    };

    const onChange = (newValue, e) => {
        // Handle editor change if needed
    };

    const fontChange = (option) => {
        if (option === '-') {
            setFont((prevFont) => prevFont - 1);
        } else {
            setFont((prevFont) => prevFont + 1);
        }
    };

    const onClickSplit = () => {
        dispatch(closeEditor());
    };


    return (
        <div >
            <Box align="center" gap='small' direction='row' justify='between'>
                <Heading level="4" margin="small">{filename === '' ? 'Your\'s Space' : filename}</Heading>
                <Button margin='small' onClick={onClickSplit}><Close /></Button>
            </Box>

            <Card style={{ position: 'absolute', bottom: '5%', right: '2%', zIndex: 10, backgroundColor: 'white' }} direction='row' gap='medium' pad='small'>
                <Add onClick={() => fontChange('+')} size='small' margin="small" />
                <Subtract onClick={() => fontChange('-')} size='small' />
            </Card>

            <div className='pt-1'>
                <Editor
                    height="100vh"
                    language={language} // Default language, you'll update this based on the detected language
                    theme="vs-light"
                    onChange={onChange}
                    value={code}
                    path={filename ? `file:///${filename.startsWith('/') ? filename.substring(1) : filename}` : undefined}
                    options={{
                        fontSize: font
                    }}
                    onMount={editorDidMount}
                />
            </div>
        </div>
    );
};
