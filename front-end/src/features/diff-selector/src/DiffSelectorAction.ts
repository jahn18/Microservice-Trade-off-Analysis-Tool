import { call, delay, put, select } from 'redux-saga/effects';
import { Action } from "../../../store/ActionTools";
import { IActionList } from "../../../store/Plugin";
import { STORE_ALIAS as DiffSelectorAlias, IDiffSelectorViewStoreState, defaultState } from "./DiffSelectorTypes";

export const toggleDiffViewAction = new Action<IDiffSelectorViewStoreState,
    {diffSelect: boolean}
>(`${DiffSelectorAlias}.TOGGLE_DIFF_VIEW`)
    .addReducer((state, action) => ({
        ...state,
        diffSelect: action.payload.diffSelect
    }));

const DiffSelectorViewActions: IActionList = {
    toggleDiffViewAction
}

export default DiffSelectorViewActions;

