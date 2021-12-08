import { ISelector } from "../../../store/Plugin";
import { STORE_ALIAS as ChangeHistoryAlias, IChangeHistoryStoreState, defaultState } from "./ChangeHistoryTypes";

const getPluginState = (state: any) => ((state[ChangeHistoryAlias] || defaultState) as IChangeHistoryStoreState);

export const getChangeHistory = (state:any) => getPluginState(state).changeHistory;

export const getSelectedElements = (state: any) => getPluginState(state).selectedElements;

const ChangeHistorySelectors: ISelector[] = [
    getChangeHistory,
    getSelectedElements
];

export default ChangeHistorySelectors;
