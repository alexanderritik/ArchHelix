import { createSlice } from "@reduxjs/toolkit";

const initialState: { folders: Record<string, boolean> } = {
    folders: {}
}

export const openFolderSlice = createSlice({
    name: 'openFolder',
    initialState,
    reducers: {
        openFolder: (state, action) => {
            state.folders[action.payload.id] = action.payload.state;
        },
        setOpenFolders: (state, action) => {
            state.folders = action.payload;
        },
    }
})


export const { openFolder, setOpenFolders } = openFolderSlice.actions

export default openFolderSlice.reducer