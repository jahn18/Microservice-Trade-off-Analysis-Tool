import { Decomposition } from "../../../models/Decomposition";

export const STORE_ALIAS = "CustomView";

export interface CytoscapeGraphs {
    [view: string]: Object
}

export interface ICustomViewUIState {
    cytoscapeGraphs: CytoscapeGraphs
    relationshipTypes: any
    selectedTab: string,
    selectedElements: any,
    jsonGraph: any
}

export interface ICustomViewStoreState {
    cytoscapeGraphs: CytoscapeGraphs
    relationshipTypes: any
}

export const defaultState: ICustomViewStoreState = {
    cytoscapeGraphs: {},
    relationshipTypes: {}
}