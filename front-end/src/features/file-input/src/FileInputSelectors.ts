import { ISelector } from "../../../store/Plugin";
import { STORE_ALIAS as FileInputAlias, IFileInputViewStoreState, defaultState } from "./FileInputTypes";

const getPluginState = (state: any) => ((state[FileInputAlias] || defaultState) as IFileInputViewStoreState);

export const getJSONGraph = (state: any) => getPluginState(state).jsonGraph;

export const getError = (state: any) => getPluginState(state).error;

export const getWeightedViewState = (state: any) => getPluginState(state).enableWeightedView;

const FileInputViewSelectors: ISelector[] = [];

export default FileInputViewSelectors;