import { ISelector } from "../../../store/Plugin";
import { STORE_ALIAS as CustomViewAlias, ICustomViewStoreState, defaultState } from "./CustomViewTypes";

const getPluginState = (state: any) => ((state[CustomViewAlias] || defaultState) as ICustomViewStoreState);

export const getCytoscapeGraphs = (state: any) => getPluginState(state).cytoscapeGraphs;

export const getRelationshipTypes = (state: any) => getPluginState(state).relationshipTypes;

const CustomViewSelectors: ISelector[] = [
    getCytoscapeGraphs,
    getRelationshipTypes
];

export default CustomViewSelectors;