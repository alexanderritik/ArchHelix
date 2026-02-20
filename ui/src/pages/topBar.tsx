import { Box, Button, Text, Image } from "grommet"
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { changeNote } from '../store/slice/settingSlice'
import mainLogo from '../assets/mainIcon.png';

const SideBar = () => {
    const dispatch = useDispatch();

    const [hoveredButton, setHoveredButton] = useState('null');
    const state = useSelector((state: any) => state.settings);
    const splitState = state.code || state.note

    const openNotes = () => {
        dispatch(changeNote(false))
    }
    const aboutPage = () => {
        window.open('/', '_blank');
    }

    return (
        <div style={{ position: 'relative', zIndex: 1 }}>
            <Image onClick={aboutPage} style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 2, backgroundColor: 'white', pointerEvents: 'auto', cursor: 'pointer' }} src={mainLogo} width="30px" height="30px" />

            <Box style={{ position: 'absolute', top: '25px', right: '25px', zIndex: 2, }} direction="row" gap="medium">
                <Button style={{ visibility: splitState ? 'hidden' : 'visible' }} onClick={openNotes} onMouseEnter={() => setHoveredButton('Notes')} onMouseLeave={() => setHoveredButton('null')}>
                    <Text weight='bold' color={hoveredButton === 'Notes' ? '#444' : '#666e78'} >Notes</Text>
                </Button>
            </Box>
        </div>

    )
}

export default SideBar;