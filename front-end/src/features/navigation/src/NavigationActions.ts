import {Action} from "../../../store/ActionTools";
import { IActionList } from "../../../store/Plugin";
import { INavigationStoreState, STORE_ALIAS as NavigationAlias } from "./NavigationTypes";


export const changeSelectedTabAction = new Action<INavigationStoreState,
    {selectedTab: string}
>(`${NavigationAlias}.CHANGE_SELECTED_TAB`)
    .addReducer((state, action) => ({
        ...state,
        selectedTab: action.payload.selectedTab
    }));

const NavigationActions: IActionList = {
    changeSelectedTabAction
}

export default NavigationActions; 