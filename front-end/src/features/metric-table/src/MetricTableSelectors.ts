import { ISelector } from "../../../store/Plugin";
import { STORE_ALIAS as MetricTableAlias, IMetricTableStoreState, defaultState } from './MetricTableTypes';

const getPluginState = (state: any) => ((state[MetricTableAlias] || defaultState) as IMetricTableStoreState);

export const getRelationshipTypes = (state: any) => getPluginState(state).relationshipTypes;

const MetricTableSelectors: ISelector[] = [
    getRelationshipTypes
];

export default MetricTableSelectors;