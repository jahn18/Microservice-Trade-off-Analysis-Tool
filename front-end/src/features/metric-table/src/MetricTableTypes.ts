export const STORE_ALIAS = "MetricTable";

export interface IMetricTableUIState {
    relationshipTypes: any
}

export interface IMetricTableStoreState {
    relationshipTypes: any
}

export const defaultState: IMetricTableStoreState = {
    relationshipTypes: {}
}