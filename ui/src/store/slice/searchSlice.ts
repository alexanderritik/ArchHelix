import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SearchState {
    searchedNodeId: string | null;
}

const initialState: SearchState = {
    searchedNodeId: null,
};

export const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        setSearchedNodeId: (state, action: PayloadAction<string | null>) => {
            state.searchedNodeId = action.payload;
        },
    }
});

export const { setSearchedNodeId } = searchSlice.actions;

export default searchSlice.reducer;
