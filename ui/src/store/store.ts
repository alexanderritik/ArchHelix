import {combineReducers, configureStore} from '@reduxjs/toolkit';
import settingReducer from './slice/settingSlice';
import openFolderReducer from './slice/openFolderSlice';
import githubDetailReducer  from './slice/githubDetailSlice';
import githubFileReducer from './slice/githubFileSlice';
import nodesAndEdgesReducer from './slice/nodesAndEdgesSlice';
import nodeHoverReducer from './slice/nodeHoverSlice';

const rootReducer = combineReducers({
    settings: settingReducer,
    openFolder: openFolderReducer,
    githubDetail: githubDetailReducer,
    githubFile: githubFileReducer,
    nodesAndEdges: nodesAndEdgesReducer,
    nodeHover: nodeHoverReducer
  });

  
export const store = configureStore({
    reducer: rootReducer,
})