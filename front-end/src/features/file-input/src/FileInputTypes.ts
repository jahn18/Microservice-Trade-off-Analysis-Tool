export const STORE_ALIAS = "FileInput";

export interface IFileInputViewUIState {
    jsonGraph: any
    error?: string
}

export interface IFileInputViewStoreState {
    jsonGraph: any
    error?: string
}

export const defaultState: IFileInputViewStoreState = {
    jsonGraph: {}
}