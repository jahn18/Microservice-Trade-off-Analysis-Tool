import { call, delay, put, select } from 'redux-saga/effects';
import { Action } from "../../../store/ActionTools";
import { IActionList, ISelector } from "../../../store/Plugin";
import CustomViewActions from '../../custom-view/src/CustomViewActions';
import { fetchWeightedDecompositionFailedAction } from '../../weighted-view/src/WeightedViewActions';
import { STORE_ALIAS as DiffViewAlias, IDiffViewStoreState, defaultState, ILoadingState } from "./DiffViewTypes";
import { DiffViewService } from './service/DiffViewService';

export const setSelectedDecompositionsAction = new Action<IDiffViewStoreState, 
    {selectedDecompositions: any}
>(`${DiffViewAlias}.SET_SELECTED_DECOMPOSITIONS`)
    .addReducer((state, action) => ({
        ...state,
        selectedDecompositions: action.payload.selectedDecompositions
    }))

export const fetchWeightedDiffDecompositionAction = new Action<IDiffViewStoreState,
    {jsonGraph: any}
>(`${DiffViewAlias}.FETCH_DIFF_WEIGHTED_DECOMPOSITION`)
    // .addReducer((state, action) => ({
    //     ,,,state,
    //     loading: ILoadingState.FETCH_DECOMPOSITION_LOADING
    // }))
    .addSaga(function* (action) {
        try {
            let weightedDiffGraph: any = yield call(DiffViewService.fetchDiffWeightedDecomposition, action.payload.jsonGraph);
            yield put(fetchWeightedDiffDecompositionSuccessAction.getReduxAction()({weightedDiffGraph: weightedDiffGraph}))   
        } catch (e) {
            yield put(fetchWeightedDecompositionFailedAction.getReduxAction()({error: (e as Error).message}));
        }
    });


export const fetchWeightedDiffDecompositionSuccessAction = new Action<IDiffViewStoreState,
    {weightedDiffGraph: any}
>(`${DiffViewAlias}.FETCH_DIFF_WEIGHTED_DECOMPOSITION_SUCCESS`)
    .addReducer((state, action) => ({
        ...state,
        loading: ILoadingState.NOT_LOADING
    }))
    .addSaga(function* (action) {
        yield put(CustomViewActions.saveCytoscapeGraphAction.getReduxAction()({selectedTab: "weighted-diff-view", modifiedCytoscapeGraph: action.payload.weightedDiffGraph}));
    })


export const fetchWeightedDiffDecompositionFailedAction = new Action<IDiffViewStoreState,
    {error: string}
>(`${DiffViewAlias}.FETCH_DIFF_WEIGHTED_DECOMPOSITION_FAILED`)
    .addReducer((state, action) => ({
        ...state,
        error: action.payload.error,
        loading: ILoadingState.NOT_LOADING
    }))

export const setDiffWeightsAction = new Action<IDiffViewStoreState,
    {weights: any}
>(`${DiffViewAlias}.SET_WEIGHTS`)
    .addReducer((state, action) => ({
        ...state,
        weights: action.payload.weights
    }))

const DiffViewActions: IActionList = {
    setSelectedDecompositionsAction,
    fetchWeightedDecompositionFailedAction,
    fetchWeightedDiffDecompositionSuccessAction,
    fetchWeightedDiffDecompositionAction,
    setDiffWeightsAction
}

export default DiffViewActions;