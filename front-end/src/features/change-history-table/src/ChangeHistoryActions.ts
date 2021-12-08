import { call, delay, put, select } from 'redux-saga/effects';
import { Action } from "../../../store/ActionTools";
import { IActionList } from "../../../store/Plugin";
import { ChangeHistoryService } from "../service/ChangeHistoryService";
import { STORE_ALIAS as ChangeHistoryAlias, IChangeHistoryStoreState, defaultState } from "./ChangeHistoryTypes";

export const addNewMoveAction = new Action<IChangeHistoryStoreState, 
    {selectedTab: string, sourceNode: any, currPartitionNode: any, newPartitionNode: any, diffNode?: any}
>(`${ChangeHistoryAlias}.ADD_NEW_MOVE`)
    .addSaga(function* (action) {
        let moveOperation: any = new ChangeHistoryService().formatMoveOperation(action.payload.sourceNode, action.payload.currPartitionNode, action.payload.newPartitionNode, action.payload.diffNode)
        yield put(undoMoveAction.getReduxAction()({selectedTab: action.payload.selectedTab, moveOperation: moveOperation}));
        // If the node has moved back to its original position, then don't add it to the change history list
        yield put(addMoveAction.getReduxAction()({selectedTab: action.payload.selectedTab, moveOperation: moveOperation}));
    });

const addMoveAction = new Action<IChangeHistoryStoreState, 
    {selectedTab: string, moveOperation: any}
>(`${ChangeHistoryAlias}.ADD_MOVE_SUCCESS`)
    .addReducer((state, action) => ({
        ...state,
        changeHistory: {
            ...state.changeHistory,
            [action.payload.selectedTab]: [
                ...state.changeHistory[action.payload.selectedTab] || [],
                action.payload.moveOperation
            ]
        }
    }))

export const undoMoveAction = new Action<IChangeHistoryStoreState,
    {selectedTab: string, moveOperation: any}
>(`${ChangeHistoryAlias}.UNDO_MOVE`)
    .addReducer((state, action) => ({
        ...state,
        changeHistory: {
            ...state.changeHistory,
            [action.payload.selectedTab]: state.changeHistory[action.payload.selectedTab]?.filter((eleInfo: any) => {
                return eleInfo.movedNode.data().id !== action.payload.moveOperation.movedNode.data().id
            }) || []
        }
    }))

export const selectElementsAction = new Action<IChangeHistoryStoreState,
    {selectedTab: string, selectedElements: any[]}
>(`${ChangeHistoryAlias}.SELECT_ELEMENTS`)
    .addReducer((state, action) => ({
        ...state,
        selectedElements: {
            ...state.selectedElements,
            [action.payload.selectedTab]: action.payload.selectedElements
        }
    }))

export const resetChangeHistoryAction = new Action<IChangeHistoryStoreState,
    {selectedTab: string}
>(`${ChangeHistoryAlias}.RESET_CHANGE_HISTORY`)
.addReducer((state, action) => ({
    ...state,
    changeHistory: {
        ...state.changeHistory,
        [action.payload.selectedTab]: []
    }
}))

const ChangeHistoryActions = {
    addNewMoveAction,
    undoMoveAction,
    addMoveAction,
    selectElementsAction,
    resetChangeHistoryAction
}

export default ChangeHistoryActions;