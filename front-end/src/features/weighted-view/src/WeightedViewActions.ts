import { call, delay, put, select } from 'redux-saga/effects';
import { Action } from "../../../store/ActionTools";
import { IActionList } from "../../../store/Plugin";
import * as CustomViewActions from "../../custom-view/src/CustomViewActions";
import { WeightedViewService } from './service/WeightedViewService';
import { STORE_ALIAS as WeightedViewAlias, IWeightedViewStoreState, defaultState, ILoadingState } from "./WeightedViewTypes";


export const fetchWeightedDecompositionAction = new Action<IWeightedViewStoreState,
    {weights: any, jsonGraph: any}
>(`${WeightedViewAlias}.FETCH_DECOMPOSITION`)
    .addReducer((state, action) => ({
        ...state,
        loading: ILoadingState.FETCH_DECOMPOSITION_LOADING
    }))
    .addSaga(function* (action) {
        try {
            let weightedGraph: any = yield call(WeightedViewService.fetchWeightedDecomposition, action.payload.weights, action.payload.jsonGraph);
            yield put(fetchWeightedDecompositionSuccessAction.getReduxAction()({weightedGraph: weightedGraph}));
        } catch (e) {
            yield put(fetchWeightedDecompositionFailedAction.getReduxAction()({error: (e as Error).message}));
        }
    });

export const fetchWeightedDecompositionSuccessAction = new Action<IWeightedViewStoreState,
    {weightedGraph: any}
>(`${WeightedViewAlias}.FETCH_DECOMPOSITION_SUCCESS`)
    .addReducer((state, action) => ({
        ...state,
        loading: ILoadingState.NOT_LOADING
    }))
    .addSaga(function * (action) {
        yield put(CustomViewActions.saveCytoscapeGraphAction.getReduxAction()({selectedTab: "weighted-view", modifiedCytoscapeGraph: action.payload.weightedGraph}))
    })


export const fetchWeightedDecompositionFailedAction = new Action<IWeightedViewStoreState,
    {error: string}
>(`${WeightedViewAlias}.FETCH_DECOMPOSITION_FAILED`)
    .addReducer((state, action) => ({
        ...state,
        error: action.payload.error,
        loading: ILoadingState.NOT_LOADING
    }))

export const setWeightsAction = new Action<IWeightedViewStoreState,
    {weights: any}
>(`${WeightedViewAlias}.SET_WEIGHTS`)
    .addReducer((state, action) => ({
        ...state,
        weights: action.payload.weights
    }))

const WeightedViewActions: IActionList = {
    fetchWeightedDecompositionAction,
    fetchWeightedDecompositionFailedAction,
    fetchWeightedDecompositionSuccessAction,
    setWeightsAction
}

export default WeightedViewActions;