import { call, delay, put, select } from 'redux-saga/effects';
import { Action } from "../../../store/ActionTools";
import { IActionList } from "../../../store/Plugin";
import { STORE_ALIAS as FileInputAlias, IFileInputViewStoreState, defaultState } from "./FileInputTypes";
import { FileInputService } from './service/FileInputService';

export const setJSONGraphInputAction = new Action<IFileInputViewStoreState,
    {file: any}
>(`${FileInputAlias}.SET_JSON_GRAPH`)
    .addSaga(function* (action) {
        try {
            yield put(setJSONGraphInputSuccessAction.getReduxAction()({file: action.payload.file}));
        } catch (e) {
            yield put(setJSONGraphInputFailedAction.getReduxAction()({error: (e as Error).message}));
        }
    });

export const setJSONGraphInputSuccessAction = new Action<IFileInputViewStoreState,
    {file: any}
>(`${FileInputAlias}.SET_JSON_GRAPH_SUCCESS`)
    .addReducer((state, action) => ({
        ...state,
        jsonGraph: JSON.parse(action.payload.file)
    }));

export const setJSONGraphInputFailedAction = new Action<IFileInputViewStoreState,
    {error: string}
>(`${FileInputAlias}.SET_JSON_GRAPH_FAILED`)
    .addReducer((state, action) => ({
        ...state,
        error: action.payload.error
    }));

export const getDemoJSONGraphAction = new Action<IFileInputViewStoreState,
    {projectName: string}
>(`${FileInputAlias}.SET_DEMO_JSON_GRAPH`)  
    .addSaga(function* (action) {
        try {
            let graph = yield call(FileInputService.fetchDemoDecomposition, action.payload.projectName);
            yield put(getDemoJSONGraphSuccessAction.getReduxAction()({demoGraph: graph}));
        } catch (e) {
            yield put(getDemoJSONGraphFailedAction.getReduxAction()({error: (e as Error).message}));
        }
    })

export const getDemoJSONGraphSuccessAction = new Action<IFileInputViewStoreState,
    {demoGraph: any}
>(`${FileInputAlias}.SET_DEMO_JSON_GRAPH_SUCCESS`)
    .addReducer((state, action) => ({
        ...state,
        jsonGraph: action.payload.demoGraph
    }))

export const getDemoJSONGraphFailedAction = new Action<IFileInputViewStoreState,
    {error: string}
>(`${FileInputAlias}.SET_DEMO_JSON_GRAPH_FAILED`)
    .addReducer((state, action) => ({
        ...state,
        error: action.payload.error
    }))

export const clearErrorAction = new Action<IFileInputViewStoreState>(`${FileInputAlias}.CLEAR_ERROR`)
    .addReducer((state, action) => ({
        ...state,
        error: undefined,
    }));


const FileInputViewActions: IActionList = {
    setJSONGraphInputAction,
    setJSONGraphInputSuccessAction,
    setJSONGraphInputFailedAction,
    clearErrorAction,
    getDemoJSONGraphAction,
    getDemoJSONGraphSuccessAction,
    getDemoJSONGraphFailedAction,
}

export default FileInputViewActions;

