import { Action } from "../../../store/ActionTools";
import { IActionList } from "../../../store/Plugin";
import { ICustomViewStoreState, STORE_ALIAS as CustomViewAlias } from "./CustomViewTypes";

export const updateRelationshipTypeAction = new Action<ICustomViewStoreState,
    {selectedTab: string, updatedRelationshipType: any}
>(`${CustomViewAlias}.UPDATE_RELATIONSHIP_TYPES`)
    .addReducer((state, action) => ({
       ...state,
       relationshipTypes: {
           ...state.relationshipTypes,
           [action.payload.selectedTab]: action.payload.updatedRelationshipType
       } 
    }))

export const saveCytoscapeGraphAction = new Action<ICustomViewStoreState, 
    {selectedTab: string, modifiedCytoscapeGraph: JSON}
>(`${CustomViewAlias}.SAVE_GRAPH`)
    .addReducer((state, action) => ({
        ...state,
        cytoscapeGraphs: {
            ...state.cytoscapeGraphs,
            [action.payload.selectedTab]: action.payload.modifiedCytoscapeGraph
        }
    }))

export const resetCytoscapeGraphAction = new Action<ICustomViewStoreState, 
    {selectedTab: string, jsonGraphData: any}
>(`${CustomViewAlias}.RESET_GRAPH`)
    .addReducer((state, action) => ({
        ...state,
        cytoscapeGraphs: {
            ...state.cytoscapeGraphs,
            [action.payload.selectedTab]: {}
        }
    }))

const CustomViewActions: IActionList = {
    saveCytoscapeGraphAction,
    resetCytoscapeGraphAction,
    updateRelationshipTypeAction
}

export default CustomViewActions;