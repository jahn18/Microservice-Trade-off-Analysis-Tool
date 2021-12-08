import NavigationActions from "./NavigationActions";
import NavigationSelectors from "./NavigationSelectors";
import { defaultState, STORE_ALIAS as NavigationAlias } from './NavigationTypes';

export const Navigation = {
    alias: NavigationAlias,
    defaultState,
    actions: NavigationActions,
    selectors: NavigationSelectors,
    childPlugins: []
}