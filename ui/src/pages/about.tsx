import React, { useEffect, useState } from 'react';
import { Card, Box, Image, Text, Button, CheckBoxGroup, Spinner, Select } from 'grommet';
import { Checkmark, Close, Code, Currency, Document, View } from 'grommet-icons';
import { useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import Typewriter from '../utils/typewritter';
import mainLogo from '../assets/mainIcon.png';
import { nodesAndEdges } from '../store/slice/nodesAndEdgesSlice';

const customInputStyle = {
    outline: 'none',
    backgroundColor: 'white',
    border: 'none',
};

const About = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [hoveredButton, setHoveredButton] = useState('null');

    const [owner, setOwner] = useState('');
    const [ownerExists, setOwnerExists] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [repositories, setRepositories] = useState<{ id: number; name: string }[]>([]);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: number; name: string }[]>([]);
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [folders, setFolders] = useState<string[]>([]);
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

    const [loaderRepo, setLoaderRepo] = useState(false);
    const [loaderBranch, setLoaderBranch] = useState(false);
    const [loaderFolder, setLoaderFolder] = useState(false);

    const [visualiseDisabled, setVisualiseDisabled] = useState(false);
    // console.log('owner:', owner, 'selected', selectedRepo, 'selectedFolders', selectedFolders, 'visualiseDisabled', visualiseDisabled);
    const visualseButton = () => {
        const root = ''

        localStorage.setItem(`github2s-${owner}-${selectedRepo}-branch`, selectedBranch)
        if(selectedFolders.length>0){
            localStorage.setItem(`github2s-${owner}-${selectedRepo}-ignore_folder`, JSON.stringify(selectedFolders))
        }

        dispatch(nodesAndEdges({ initialNodes: [], initialEdges: [], error: '', projectStructure: [], graphAdjListFiles: {}, graphAdjListFolder: {}, nodesDictionary: {} }));
        setTimeout(() => {
            navigate(`/${owner}/${selectedRepo}`);
        }, 1000);

    };

    useEffect(() => {
        if (!ownerExists) { return; }
        for (const repo of repositories) {
            if (repo.name === selectedRepo && ownerExists && owner) {
                setVisualiseDisabled(true);
                return;
            }
        }
        setVisualiseDisabled(false);
    }, [ownerExists, owner, selectedRepo, selectedFolders]);

    // CHECK IF OWNER EXISTS
    useEffect(() => {
        const timer = setTimeout(() => {
            if (owner) {
                checkOwnerExists(owner);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [owner]);
    // Service to check if owner exists
    const checkOwnerExists = async (owner: string) => {
        setIsChecking(true);
        try {
            const response = await fetch(`https://api.github.com/users/${owner}`);
            if (response.ok) {
                setOwnerExists(true);
            } else {
                setOwnerExists(false);
            }
        } catch (error) {
            console.error('Error checking owner:', error);
            setOwnerExists(false);
        }
        setIsChecking(false);
    };

    // FETCH REPOSITORIES IF OWNER EXISTS
    useEffect(() => {
        if (ownerExists) {
            fetchRepositories(owner);
        }
    }, [ownerExists, owner]);

    // Service to fetch repositories
    const fetchRepositories = async (owner: string) => {
        try {
            setLoaderRepo(true);
            let repoNames = [];
            let page = 1;
            while (true) {
                const response = await fetch(`https://api.github.com/users/${owner}/repos?page=${page++}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.length === 0) { break; }
                    for (const repo of data) {
                        repoNames.push({ name: repo.name, id: repo.node_id });
                    }
                } else {
                    console.error('Error fetching repositories');
                    break;
                }
            }
            // console.log(repoNames);
            setRepositories(repoNames);
            setLoaderRepo(false);
        } catch (error) {
            console.error('Error fetching repositories:', error);
        }
    };

    // SEARCH REPOSITORIES
    useEffect(() => {
        const filteredRepositories = repositories.filter(repo =>
            repo.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filteredRepositories);
    }, [searchTerm, repositories]);

    // FETCH BRANCHES IF REPO SELECTED
    useEffect(() => {
        if (selectedRepo) {
            fetchBranches(owner, selectedRepo);
        }
    }, [selectedRepo]);


    // Service to fetch branches
    const fetchBranches = async (owner: string, repo: string) => {
        setLoaderBranch(true);
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`);
            if (response.ok) {
                const data = await response.json();
                const branchNames = data.map((branch: any) => branch.name);
                setBranches(branchNames);
            } else {
                console.error('Error fetching branches');
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
        setLoaderBranch(false);
    };

    // FETCH FOLDERS IF REPO SELECTED
    useEffect(() => {
        // console.log('selectedBranch:', selectedBranch, selectedRepo);
        for (const repo of repositories) {
            if (repo.name === selectedRepo && selectedBranch) {
                fetchFolders(owner, selectedRepo, selectedBranch);
            }
        }
    }, [selectedBranch]);

    // FETCH FOLDERS
    const fetchFolders = async (owner: string, repo: string, branch: string) => {
        // console.log('fetching folders loader set to true');
        setLoaderFolder(true);
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`);
            if (response.ok) {
                const data = await response.json();
                const folderNames = data.filter((item: any) => item.type === 'dir').map((folder: any) => folder.name);
                setFolders(folderNames);
            } else {
                console.error('Error fetching folders');
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
        }
        setLoaderFolder(false)
    };

    const [borderHighlighted, setBorderHighlighted] = useState(false);
    const copyFeedBack = () => {
        navigator.clipboard.writeText('gitshadee@gmail.com')
    }

    const creatorClicked = () => {
        navigate('/creator');
    }

    return (
        <Box className="h-screen w-screen flex items-center justify-center" >
            <Card height="xlarge" width="xlarge" direction="row" pad="small" margin="large" style={{ overflowY: 'scroll' }}>

                {/* One side of screen */}
                <Box
                    basis="1/2"
                    align="center"
                    pad="medium"
                    justify='between'
                    background={{ image: "url('dot.jpg')", opacity: 'medium' }}
                >
                    {/* <Github size="xlarge" /> */}
                    <Image src={mainLogo} width="100px" height="100px" />

                    <Box pad="xsmall" className='flex items-center'>
                        <Card pad="medium" background={{ color: 'white' }}>
                            <Text margin="small" textAlign='justify' size='small'>Introducing GitHub2s, our innovative open-source tool designed to revolutionize your code exploration experience. GitHub2s allows you to effortlessly visualize file dependencies within any repository, making it easier to understand complex project structures. Additionally, it enables you to read through the code and create detailed notes, enhancing collaboration and documentation. Looking ahead, we're excited to announce that future updates will bring advanced code explanation features and many more exciting capabilities. With GitHub2s, navigating and comprehending code has never been simpler or more efficient.</Text>
                            <Text margin="small" textAlign='justify' size='small' weight='bold'>lang - PYTHON | TYPESCRIPT | JAVASCRIPT ....</Text>
                            <Text margin="small" textAlign='justify' size='small' weight='bold'>please request if you need any programming language support thank you </Text>
                        </Card>
                    </Box>

                    <Box direction='row' gap='small'>
                        <Card pad="small" justify='between' background={{ color: "#E8EAED" }}>
                            <Button alignSelf='center' tip='Repo'>
                                <Text weight='bold'>100K <Document /></Text>
                            </Button>
                        </Card>

                        <Card pad="small" justify='between' background={{ color: "#E8EAED" }}>
                            <Button alignSelf='center' tip="Programming Language">
                                <Text weight='bold'>3 <Code /></Text>
                            </Button>
                        </Card>

                        <Card pad="small" justify='between' background={{ color: "#E8EAED" }}>
                            <Button alignSelf='center' tip="sponsor">
                                <Text weight='bold'>0 <Currency /></Text>
                            </Button>
                        </Card>

                        <Card pad="small" justify='between' background={{ color: "#E8EAED" }}>
                            <Button alignSelf='center' tip="View">
                                <Text weight='bold'>100+ <View /></Text>
                            </Button>
                        </Card>
                    </Box>

                    <Box width="100%" direction='row' justify='around' >
                        <Button style={{ background: 'white' }} onClick={creatorClicked} onMouseEnter={() => setHoveredButton('Creator')} onMouseLeave={() => setHoveredButton('null')}>
                            <Text weight='bold' color={hoveredButton === 'Creator' ? '#666e78' : '#D0D3D4'} >Creator</Text>
                        </Button>
                        <Button
                            onClick={() => {
                                setHoveredButton('Feedback');
                                setBorderHighlighted(true);
                                copyFeedBack()
                                setTimeout(() => {
                                    setBorderHighlighted(false);
                                }, 2000);
                            }}
                            onMouseEnter={() => setHoveredButton('Feedback')}
                            onMouseLeave={() => setHoveredButton('null')}
                            tip={ borderHighlighted ? "Email Copied! Thanks for sharing feedback from future":"" }
                        >
                            <Text weight='bold' color={hoveredButton === 'Feedback' ? '#666e78' : '#D0D3D4'} >Feedback</Text>

                        </Button>
                    </Box>

                </Box>

                {/* Other side of screen */}
                <Box
                    basis="1/2"
                    align="center"
                    justify="center"
                    gap='medium'
                    border={{ side: 'left', size: 'medium' }}
                >

                    <Box margin={{ bottom: "medium" }} align='center' justify='center'>
                        <Box direction='row'>
                            <Text size='3xl' weight="bolder" color="gray"> Github</Text><Text size='3xl' weight="bolder" color="black">2s</Text>
                        </Box>
                        <Text size='small' weight="bolder" color="grey"><Typewriter text='Helps you imagine better' delay={100}></Typewriter></Text>
                    </Box>

                    <Card direction='row' pad="small" width="medium" justify='between'>

                        <input
                            style={customInputStyle}
                            type="text"
                            placeholder="github handle"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                        />
                        {
                            owner !== '' &&
                            <>
                                {isChecking ? (
                                    <Text color="lightgreen">Checking...</Text>
                                ) : (ownerExists !== null &&
                                    (ownerExists ?
                                        <Checkmark size="medium" color="lightgreen" /> :
                                        <Close size="medium" color="red" />)
                                )
                                }
                            </>

                        }

                    </Card>

                    <Card pad="small" width="medium" justify='center' >
                        {loaderRepo ?
                            <Spinner size="small" color="lightgreen" alignSelf='center' /> :
                            <>
                                <datalist id="repositories">
                                    {searchResults.map((repo) => (
                                        <option key={repo.id} value={repo.name} />
                                    ))}
                                </datalist>
                                <input
                                style={{ cursor: searchResults.length === 0 ? 'not-allowed' : 'pointer', ...customInputStyle }}
                                    list="repositories"
                                    value={selectedRepo}
                                    onChange={(e) => setSelectedRepo(e.target.value)}
                                    placeholder="Select a repository"
                                    disabled={!ownerExists}
                                />
                            </>
                        }
                    </Card>

                    <Card pad="small" width="medium" justify='center'  >
                        {loaderBranch ?
                            <Spinner size="small" color="lightgreen" alignSelf='center' /> :
                            <>
                                <datalist id="branches">
                                    {branches.map((branch) => (
                                        <option key={branch} value={branch}>{branch}</option>
                                    ))}
                                </datalist>
                                <input
                                    style={{ cursor: branches.length === 0 ? 'not-allowed' : 'pointer', ...customInputStyle }}
                                    list="branches"
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    placeholder="Select a branch"
                                    disabled={!selectedRepo}
                                />
                            </>
                        }
                    </Card>


                    <Card pad="small" width="medium" justify='center'>
                    {loaderFolder ?
                            <Spinner size="small" color="lightgreen" alignSelf='center' /> :
                            <>
                                <div style={{ maxHeight: '200px', overflowY: 'scroll' }}>
                                    <CheckBoxGroup
                                        style={{ color: 'gray' }}
                                        options={folders}
                                        value={selectedFolders}
                                        onChange={(event: any) => setSelectedFolders(event.value)}
                                    />
                                </div> 
                                {
                                    folders.length === 0 && 
                                
                                <input
                                    style={{ cursor: folders.length === 0 ? 'not-allowed' : 'pointer', ...customInputStyle }}
                                    placeholder="Folders to ignore eg- node_modules"
                                    disabled={true}
                                />
                            }
                                </>
                        }
                    </Card>


                    <Card pad="small" width="small" justify='between'
                        style={{
                            opacity: visualiseDisabled ? 1 : 0.8, // Adjust opacity for disabled effect
                            // pointerEvents: visualiseDisabled ? 'none' : 'auto',
                        }}
                    >
                        <Button disabled={!visualiseDisabled} alignSelf='center' onClick={visualseButton} onMouseEnter={() => setHoveredButton('Visualise')} onMouseLeave={() => setHoveredButton('null')}>
                            <Text weight='bold' color={hoveredButton === 'Visualise' ? '#666e78' : '#666e78'} >Visualise</Text>
                        </Button>
                    </Card>
                </Box>

            </Card></Box>

    );
};

export default About;
