import { Box, Spinner } from "grommet";

const LaunchScreen = () => {
    return (
        <div style={{ position: 'relative', zIndex: 2, backgroundColor:'white' }} className="h-screen flex items-center justify-center">
        <Box justify="center" align="center" height="100%" width="100%" >
            <Spinner border={[ { side: 'all', size: 'medium', style: 'dotted', color: 'black' } ]} ></Spinner>
        </Box>
        </div>
    );
}
export default LaunchScreen;