import { CytoscapeGraphs } from "../../custom-view/src/CustomViewTypes";

export const STORE_ALIAS = "DiffView";

export interface IDiffViewUIState {
    cytoscapeGraphs: CytoscapeGraphs,
    relationshipTypes: any,
    selectedTab: string,
    selectedElements: any,
    jsonGraph: any,
    selectedDecompositions: any
}

export interface IDiffViewStoreState { 
    selectedDecompositions: any
}

export const defaultState: IDiffViewStoreState = {
    selectedDecompositions: []
}