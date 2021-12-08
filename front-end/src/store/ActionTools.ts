import { Saga } from 'redux-saga';
import { takeLatest } from 'redux-saga/effects';
import { IAction, IActionPayload, IActionType } from "./Plugin"

export class Action<S, P = void> implements IAction<S, P> {
    actionType: IActionType;
    sagaAddedToRedux = false;
    listenedActions: IAction<any, any>[] = [];
    reducer?: (state: S, action: IActionPayload<P>) => S;
    worker?: (action: IActionPayload<P>) => void;
    saga?: Saga;

    constructor(type: string, error: boolean = false) {
        this.actionType = {
            type,
            error
        }
    }

    addReducer(reducer: (state: S, action: IActionPayload<P>) => S) {
        this.reducer = reducer;
        return this;
    }

    addSaga(worker: (action: IActionPayload<P>) => void) {
        this.worker = worker;
        this._refreshSaga();
        return this;
    }

    getReduxAction() {
        return (payload: P) => ({ type: this.actionType.type, payload, error: this.actionType.error } as IActionPayload<P>);
    }

    addListener(action: IAction<any, any>) {
        this.listenedActions.push(action);
        this._refreshSaga();
        return this;
    }

    private _refreshSaga() {
        const worker = this.worker;
        if (worker) {
            const actionType = this.actionType.type.repeat(1);
            const listenedActionTypes = [...this.listenedActions.map(action => action.actionType.type)];
            this.saga = function* () {
                yield takeLatest([actionType, ...listenedActionTypes], worker);
            }
            this.saga.bind(this);
        }
    }
}
