import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    'owner' : '',
    'repo': '',
    'root': '',
    'branch': '',
    'ignore_folder':[],
}

export const githubDetailSlice = createSlice({
    name: 'githubDetail',
    initialState,
    reducers: {
        githubDetail: (state , action) =>{
            state.owner = action.payload.owner;
            state.repo = action.payload.repo;
            state.root = action.payload.root;
            state.branch = action.payload.branch;
            state.ignore_folder = action.payload.ignore_folder;
        },
    }
})


export const {githubDetail} = githubDetailSlice.actions

export default githubDetailSlice.reducer