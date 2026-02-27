import { Box, Button, Text, Image, TextInput } from "grommet"
import { Search } from "grommet-icons";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { changeNote } from '../store/slice/settingSlice'
import { setSearchedNodeId } from '../store/slice/searchSlice';
import mainLogo from '../assets/mainIcon.png'; const SideBar = () => {
    const dispatch = useDispatch();

    const [hoveredButton, setHoveredButton] = useState('null');
    const [searchValue, setSearchValue] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const state = useSelector((state: any) => state.settings);
    const splitState = state.code || state.note;
    const nodes = useSelector((state: any) => state.nodesAndEdges.initialNodes || []);

    const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchValue(value);
        if (!value) {
            setSuggestions([]);
            dispatch(setSearchedNodeId(null));
        } else {
            const regex = new RegExp(value, "i");
            const matched = nodes
                .filter((n: any) => {
                    const label = (n.data?.label || n.id || '') as string;
                    // match against the full path or the basename
                    const basename = label.split(/[/\\]/).pop() || '';
                    return regex.test(label) || regex.test(basename);
                })
                .map((n: any) => {
                    const label = (n.data?.label || n.id || '') as string;
                    const parts = label.split(/[/\\]/);
                    const basename = parts.pop() || label;
                    const dirname = parts.join('/') || '';

                    return {
                        // format as "filename - path" for nicer UI
                        label: dirname ? `${basename} - ${dirname}` : basename,
                        value: n.id,
                        originalLabel: label
                    };
                });
            setSuggestions(matched);
        }
    };

    const onSuggestionSelect = (event: any) => {
        const selectedId = event.suggestion.value;
        setSearchValue(event.suggestion.label);
        dispatch(setSearchedNodeId(selectedId));
    };


    const openNotes = () => {
        dispatch(changeNote(false))
    }
    const aboutPage = () => {
        window.open('/', '_blank');
    }

    return (
        <div style={{ position: 'relative', zIndex: 1 }}>
            <Image onClick={aboutPage} style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 2, backgroundColor: 'white', pointerEvents: 'auto', cursor: 'pointer' }} src={mainLogo} width="30px" height="30px" />

            <Box style={{ position: 'absolute', top: '20px', left: '70px', zIndex: 2, width: '30vw', minWidth: '250px', backgroundColor: 'white', borderRadius: '4px', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}>
                <TextInput
                    icon={<Search />}
                    placeholder="Search files/nodes..."
                    value={searchValue}
                    onChange={onSearchChange}
                    onSelect={onSuggestionSelect}
                    suggestions={suggestions}
                    dropAlign={{ top: 'bottom', left: 'left' }}
                    style={{ border: 'none' }}
                />
            </Box>

            <Box style={{ position: 'absolute', top: '25px', right: '25px', zIndex: 2, }} direction="row" gap="medium">
                <Button style={{ visibility: splitState ? 'hidden' : 'visible' }} onClick={openNotes} onMouseEnter={() => setHoveredButton('Notes')} onMouseLeave={() => setHoveredButton('null')}>
                    <Text weight='bold' color={hoveredButton === 'Notes' ? '#444' : '#666e78'} >Notes</Text>
                </Button>
            </Box>
        </div>

    )
}

export default SideBar;