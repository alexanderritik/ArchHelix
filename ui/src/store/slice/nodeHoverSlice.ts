import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    'id' : '',
    'state': false,
}

export const nodeHoverSlice = createSlice({
    name: 'nodeHover',
    initialState,
    reducers: {
        nodeHover: (state , action) =>{
            state.id = action.payload.id;
            state.state = action.payload.state;
        },
    }
})


export const {nodeHover} = nodeHoverSlice.actions

export default nodeHoverSlice.reducer