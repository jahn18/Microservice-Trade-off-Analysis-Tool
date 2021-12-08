import { ISelector } from "../../../store/Plugin";
import { STORE_ALIAS as DiffViewAlias, IDiffViewStoreState, defaultState } from "./DiffViewTypes";

const getPluginState = (state: any) => ((state[DiffViewAlias] || defaultState) as IDiffViewStoreState);

export const getSelectedDecompositions = (state: any) => getPluginState(state).selectedDecompositions;

const DiffViewSelectors: ISelector[] = [
    getSelectedDecompositions
];

export default DiffViewSelectors;