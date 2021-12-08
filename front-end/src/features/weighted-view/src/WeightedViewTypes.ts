import { CytoscapeGraphs } from "../../custom-view/src/CustomViewTypes";

export const STORE_ALIAS = "WeightedView";

export interface IWeightedViewUIState {
    cytoscapeGraphs: CytoscapeGraphs,
    relationshipTypes: any,
    selectedTab: string,
    selectedElements: any,
    jsonGraph: any,
    loading: ILoadingState,
    weights: any,
    error?: string
}

export enum ILoadingState {
    NOT_LOADING,
    FETCH_DECOMPOSITION_LOADING,
}

export interface IWeightedViewStoreState {
    loading: ILoadingState,
    weights: any,
    error?: string
}

export const defaultState: IWeightedViewStoreState = {
    weights: {},
    loading: ILoadingState.NOT_LOADING
}