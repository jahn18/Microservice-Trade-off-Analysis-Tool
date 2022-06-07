import * as LocalStorage from "../../../store/localStorage";

export const STORE_ALIAS = "FileInput";

export interface IFileInputViewUIState {
    jsonGraph: any
    enableWeightedView: boolean
    error?: string
}

export interface IFileInputViewStoreState {
    jsonGraph: any
    enableWeightedView: boolean
    error?: string
}

export const defaultState: IFileInputViewStoreState = {
    jsonGraph: LocalStorage.loadInputFile() || {},
    enableWeightedView: LocalStorage.loadToolState() || false
}