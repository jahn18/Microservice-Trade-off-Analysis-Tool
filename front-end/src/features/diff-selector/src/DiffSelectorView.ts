import { IPlugin } from "../../../store/Plugin";
import DiffSelectorViewActions from "./DiffSelectorAction";
import DiffSelectorViewSelectors from "./DiffSelectorSelectors";
import { STORE_ALIAS as DiffSelectorAlias, IDiffSelectorViewStoreState, defaultState } from "./DiffSelectorTypes";

export const DiffSelectorView: IPlugin = {
    alias: DiffSelectorAlias,
    defaultState,
    actions: DiffSelectorViewActions,
    selectors: DiffSelectorViewSelectors,
    childPlugins: []
}