import { ISelector } from "../../../store/Plugin";
import { STORE_ALIAS as DiffSelectorAlias, IDiffSelectorViewStoreState, defaultState } from "./DiffSelectorTypes";

const getPluginState = (state: any) => ((state[DiffSelectorAlias] || defaultState) as IDiffSelectorViewStoreState);

export const getDiffSelect = (state: any) => getPluginState(state).diffSelect;

const DiffSelectorViewSelectors: ISelector[] = [];

export default DiffSelectorViewSelectors;