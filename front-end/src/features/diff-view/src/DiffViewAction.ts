import { Action } from "../../../store/ActionTools";
import { IActionList, ISelector } from "../../../store/Plugin";
import { STORE_ALIAS as DiffViewAlias, IDiffViewStoreState, defaultState } from "./DiffViewTypes";

export const setSelectedDecompositionsAction = new Action<IDiffViewStoreState, 
    {selectedDecompositions: any}
>(`${DiffViewAlias}.SET_SELECTED_DECOMPOSITIONS`)
    .addReducer((state, action) => ({
        ...state,
        selectedDecompositions: action.payload.selectedDecompositions
    }))

const DiffViewActions: IActionList = {
    setSelectedDecompositionsAction
}

export default DiffViewActions;