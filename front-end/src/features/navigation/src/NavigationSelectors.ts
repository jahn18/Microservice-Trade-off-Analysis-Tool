import { ISelector } from "../../../store/Plugin";
import { defaultState, INavigationStoreState, STORE_ALIAS as NavigationAlias } from "./NavigationTypes";

const getPluginState = (state: any) => ((state[NavigationAlias] || defaultState) as INavigationStoreState);

export const getSelectedTab = (state: any) => getPluginState(state).selectedTab;

const NavigationSelectors: ISelector[] = [
    getSelectedTab
];

export default NavigationSelectors;