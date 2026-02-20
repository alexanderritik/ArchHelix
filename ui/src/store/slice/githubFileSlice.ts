import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    'file' : '',
}

export const githubFileSlice = createSlice({
    name: 'githubDetail',
    initialState,
    reducers: {
        githubFile: (state , action) =>{
            state.file = action.payload.file;
        },
    }
})


export const {githubFile} = githubFileSlice.actions

export default githubFileSlice.reducer