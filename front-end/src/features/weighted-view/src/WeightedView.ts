import { IPlugin } from '../../../store/Plugin';
import WeightedViewActions from './WeightedViewActions';
import WeightedViewSelectors from './WeightedViewSelectors';
import { STORE_ALIAS as WeightedViewAlias, IWeightedViewStoreState, defaultState, ILoadingState } from "./WeightedViewTypes";

export const WeightedView: IPlugin = {
    alias: WeightedViewAlias,
    defaultState,
    actions: WeightedViewActions,
    selectors: WeightedViewSelectors,
    childPlugins: []
}