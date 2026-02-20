import { createSlice } from "@reduxjs/toolkit";

export interface IsettingState{
    note: boolean,
    code: boolean,
}


const initialState: IsettingState = {
    note: false,
    code: false,
}

export const settingSlice = createSlice({
    name: 'setting',
    initialState,
    reducers: {
        changeNote: (state , action) =>{
            state.note = !state.note
            state.code = false
        },
        changeCode: (state, action) =>{
            state.code = !state.code
            state.note = false
        },
        closeEditor: (state, action) =>{
            state.code = false
            state.note = false
        }

    }
})


export const {changeNote, changeCode, closeEditor} = settingSlice.actions

export default settingSlice.reducer