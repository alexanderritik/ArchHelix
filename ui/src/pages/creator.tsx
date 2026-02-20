import React, { useState } from 'react';
import { Card, Box, Image, Text} from 'grommet';
import { Github, Instagram, Linkedin} from 'grommet-icons';
import { useNavigate } from "react-router-dom";
import Typewriter from '../utils/typewritter';

const Creator = () => {
    const navigate = useNavigate();

    const [hoveredButton, setHoveredButton] = useState('null');
    return (
        <>
            <Image style={{ position: 'absolute', zIndex: '-1' }} fill src='white.jpg'></Image>
            <Box className="h-screen w-screen flex items-center justify-center" pad="small" >
                <Box height="xlarge" width="xlarge" align='center' pad="small" margin="small" style={{ overflowY: 'scroll' }}>
                    <Box direction='row'>
                        <Text size='3xl' weight="bolder" color="#666e78">Creator&nbsp;</Text>
                        <Text size='3xl' weight="bolder" onClick={()=> navigate('/')} color={hoveredButton === 'Creator' ? '#666e78' : '#D0D3D4'}  onMouseEnter={() => setHoveredButton('Creator')} onMouseLeave={() => setHoveredButton('null')} > Github2s</Text>
                    </Box>
                    <Text size='small' weight="bold"><Typewriter text="Its always feels great to here from you in DMs" delay={100} /></Text>
                    <Box direction="row">
                        {/* One side of screen */}
                        <Box
                            basis="1/2"
                            align="center"
                            pad="medium"
                            justify='between'
                            
                        >
                            <Card align='center' background="#FBFCFC">
                                <Image src="https://avatars.githubusercontent.com/u/44138254?v=4" />

                                <Box direction="row" gap="small" align="center" pad="small" justify='evenly'>
                                    <a href="https://www.linkedin.com/in/ritik-srivastava-9b6964182/" target="_blank" rel="noopener noreferrer">
                                        <Linkedin />
                                    </a>
                                    <a href="https://github.com/alexanderritik" target="_blank" rel="noopener noreferrer">
                                    <Github />
                                    </a>
                                </Box>

                            </Card>


                        </Box>

                        {/* Other side of screen */}
                        <Box
                            basis="1/2"
                            align="center"
                            pad="medium"
                            justify="between"
                        >
                            <Card align='center' background="#FBFCFC">
                                <Image src="https://avatars.githubusercontent.com/u/54510172?v=4" />
                                <Box direction="row" gap="small" align="center" pad="small">
                                <a href="https://www.linkedin.com/in/mayankmaurya-000007/" target="_blank" rel="noopener noreferrer">
                                        <Linkedin />
                                    </a>
                                    <a href="https://github.com/Mayank-maurya" target="_blank" rel="noopener noreferrer">
                                    <Github />
                                    </a>
                                    <Instagram />
                                </Box>
                 
                            </Card>




                        </Box>
                    </Box>


                </Box></Box>
        </>
    );
};

export default Creator;
