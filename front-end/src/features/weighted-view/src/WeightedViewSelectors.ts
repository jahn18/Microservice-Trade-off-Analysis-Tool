import { ISelector } from "../../../store/Plugin";
import { STORE_ALIAS as WeightedViewAlias, IWeightedViewStoreState, defaultState } from "./WeightedViewTypes";

const getPluginState = (state: any) => ((state[WeightedViewAlias] || defaultState) as IWeightedViewStoreState);

export const getLoading = (state: any) => getPluginState(state).loading;
export const getError = (state: any) => getPluginState(state).error;
export const getWeights = (state: any) => getPluginState(state).weights;

const WeightedViewSelectors: ISelector[] = [
    getLoading,
    getError,
    getWeights
];

export default WeightedViewSelectors;