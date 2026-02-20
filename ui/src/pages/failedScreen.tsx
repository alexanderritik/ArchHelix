import { Box, Text, Image } from "grommet";
import failed from '../assets/failedBlack.png';

interface FailedScreenProps {
    message: string;
}
const FailedScreen: React.FC<FailedScreenProps> = ({message}) => {

    let error = message;
    switch (message) {
        case "FAILED_TO_DOWNLOAD_REPO":
            error = "failed to download repository";
            break;
        case "UNABLE_TO_FIND_REPO":
            error = "unable to find repository";
            break;
        case "UNABLE_TO_DETECT_LANGUAGE":
            error = "unable to detect language";
            break;
        case "LANGUAGE_NOT_SUPPORTED":
            error = "currently this language not supported";
            break;
        default:
            error = 'Please try again later.';
            break;
    }

    return (
        <div style={{ position: 'relative', zIndex: 2, backgroundColor:'white' }} className="h-screen flex items-center justify-center">
        <Box justify="center" align="center" height="100%" width="100%" >
            <Image src={failed} width="300px" height="300px" />
            <Text size="3xl" weight="normal"> 
                Aaaah! Something went wrong
            </Text>
            <Text size="medium" weight="normal"  margin={{top:"xxsmall"}}> 
                Sorry, {error}.
            </Text>
            <Text size="medium" weight="normal"> 
            In the meantime, please feel free to explore other GitHub repositories.
            </Text>
        </Box>
        </div>
    );
}
export default FailedScreen;