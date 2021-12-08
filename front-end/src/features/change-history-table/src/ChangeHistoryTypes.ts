export const STORE_ALIAS = "ChangeHistory";

export interface ChangeHistory {
    [selectedTab: string]: any[]
}

export interface IChangeHistoryUIState {
    changeHistory: ChangeHistory,
    selectedElements: ChangeHistory
}

export interface IChangeHistoryStoreState {
    changeHistory: ChangeHistory
    selectedElements: ChangeHistory
}

export const defaultState: IChangeHistoryStoreState = {
    changeHistory: {},
    selectedElements: {}
}