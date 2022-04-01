import { call, put } from "redux-saga/effects";
import { Action } from "../../../store/ActionTools";
import { IActionList } from "../../../store/Plugin";
import { IChangeHistoryStoreState } from "../../change-history-table/src/ChangeHistoryTypes";
import { ILoadingState } from "../../weighted-view/src/WeightedViewTypes";
import { ICustomViewStoreState, STORE_ALIAS as CustomViewAlias } from "./CustomViewTypes";
import { CustomViewService } from "./service/CustomViewService";

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

export const fetchClusterDecompositionAction = new Action<ICustomViewStoreState,
    {graph: any, selectedTab: string}
>(`${CustomViewAlias}.CLUSTER_GRAPH`)
    .addReducer((state, action) => ({
        ...state,
        loading: ILoadingState.FETCH_DECOMPOSITION_LOADING
    }))
    .addSaga(function * (action) {
        try {
            let clusteredGraph: any = yield call(CustomViewService.clusterGraph, action.payload.graph);
            yield put(fetchClusterDecompositionSuccessAction.getReduxAction()({graph: clusteredGraph, selectedTab: action.payload.selectedTab}));
        } catch (e) {
            yield put(fetchClusterDecompositionFailedAction.getReduxAction()({error: (e as Error).message}))
        }
    })

export const fetchClusterDecompositionSuccessAction = new Action<IChangeHistoryStoreState,
    {graph: any, selectedTab: string}
>(`${CustomViewAlias}.CLUSTER_GRAPH_SUCCESS`)
    .addReducer((state, action) => ({
        ...state,
        loading: ILoadingState.NOT_LOADING
    }))
    .addSaga(function * (action) {
        yield put(saveCytoscapeGraphAction.getReduxAction()({selectedTab: action.payload.selectedTab, modifiedCytoscapeGraph: action.payload.graph}))
    })

export const fetchClusterDecompositionFailedAction = new Action<IChangeHistoryStoreState,
    {error: string}
>(`${CustomViewAlias}.CLUSTER_GRAPH_FAILED`)
    .addReducer((state, action) => ({
        ...state,
        error: action.payload.error,
        loading: ILoadingState.NOT_LOADING
    }))

const CustomViewActions: IActionList = {
    saveCytoscapeGraphAction,
    resetCytoscapeGraphAction,
    updateRelationshipTypeAction,
    fetchClusterDecompositionAction,
    fetchClusterDecompositionSuccessAction,
    fetchClusterDecompositionFailedAction
}

export default CustomViewActions;