import { IPlugin } from "../../../store/Plugin";
import ChangeHistoryActions from "./ChangeHistoryActions";
import ChangeHistorySelectors from "./ChangeHistorySelectors";
import { STORE_ALIAS as ChangeHistoryAlias, IChangeHistoryStoreState, defaultState } from "./ChangeHistoryTypes";

export const ChangeHistory: IPlugin = {
    alias: ChangeHistoryAlias,
    defaultState,
    actions: ChangeHistoryActions,
    selectors: ChangeHistorySelectors,
    childPlugins: []
}