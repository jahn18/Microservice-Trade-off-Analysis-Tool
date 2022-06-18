import * as LocalStorage from "../../../store/localStorage";

export const STORE_ALIAS = "DiffSelector";

export interface IDiffSelectorViewUIState {
    diffSelect: boolean
}

export interface IDiffSelectorViewStoreState {
    diffSelect: boolean
}

export const defaultState: IDiffSelectorViewStoreState = {
    diffSelect: LocalStorage.loadToolState() || false
}