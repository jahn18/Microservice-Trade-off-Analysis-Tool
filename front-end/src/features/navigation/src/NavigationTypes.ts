export const STORE_ALIAS = "Navigation";

export interface INavigationUIState {
    selectedTab: string
}

export interface INavigationStoreState {
    selectedTab: string
}

export const defaultState: INavigationStoreState = {
    selectedTab: ""
}