import { CytoscapeGraphs } from "../../custom-view/src/CustomViewTypes";

export const STORE_ALIAS = "DiffView";

export interface IDiffViewUIState {
    cytoscapeGraphs: CytoscapeGraphs,
    relationshipTypes: any,
    selectedTab: string,
    selectedElements: any,
    jsonGraph: any,
    selectedDecompositions: any,
    // loading: ILoadingState,
    // error?: string
}

export enum ILoadingState {
    NOT_LOADING,
    FETCH_DECOMPOSITION_LOADING,
}

export interface IDiffViewStoreState { 
    selectedDecompositions: any,
    loading: ILoadingState,
    weights: any,
    error?: string
}

export const defaultState: IDiffViewStoreState = {
    selectedDecompositions: [],
    weights: {},
    loading: ILoadingState.NOT_LOADING
}