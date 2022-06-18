import { Action } from './ActionTools';
import { Reducer } from 'react';
import { applyMiddleware, combineReducers, createStore } from 'redux'
import createSagaMiddleware, { Saga } from 'redux-saga';
import { put, select, takeEvery } from 'redux-saga/effects';
import { IActionPayload, IPlugin, IPluginStoreState, pluginReducer, PLUGIN_ADD } from './Plugin';
import { saveInputFile, saveToolState} from './localStorage';

export default class Store {
    public static sagaMiddleware = createSagaMiddleware();
    public static reduxStore = Store.configureStore();

    static configureStore() {
        const store = createStore(combineReducers({ plugin: pluginReducer }), applyMiddleware(Store.sagaMiddleware));
        Store.addSaga(watchAdd);

        store.getState().plugin.replaceReducer = store.replaceReducer.bind(store);

        store.subscribe(() => {
            saveToolState(store.getState());
            saveInputFile(store.getState());
        });

        // Return the modified store
        return store
    }

    static addSaga(saga: Saga) {
        Store.sagaMiddleware.run(saga);
    }
}

function* pluginAddEffect(action: IActionPayload) {
    const pluginState: IPluginStoreState = yield select((state) => state.plugin);
    const reducer: { [pluginAlias: string]: Reducer<any, IActionPayload> } = {plugin: pluginReducer};
    for (const [pluginAlias, plugin] of Object.entries({...pluginState.plugins, [action.payload.plugin.alias as string]: action.payload.plugin as IPlugin})) {
        const subReducers: {[actionKey: string]: Reducer<any, IActionPayload>} = {};
        Object.values(plugin.actions).forEach(action => {
            if (action.reducer) {
                subReducers[action.actionType.type] = action.reducer;
            }
        });
        const defaultReducer = (state: any, action: IActionPayload) => state;
        reducer[pluginAlias] = (state = plugin.defaultState, action) => (subReducers[action.type] || defaultReducer)(state, action);
    }
    
    // adding sagas
    Object.values((action.payload.plugin as IPlugin).actions).forEach(action => {
        if (action.saga && !action.sagaAddedToRedux) {
            Store.addSaga(action.saga);
            action.sagaAddedToRedux = true;
        } 
    });

    pluginState.replaceReducer(combineReducers(reducer));

    // dispatching the init action
    const initAction: Action<any> = action.payload.plugin.actions['init'];
    yield initAction && put(initAction.getReduxAction()());
}

export function* watchAdd() {
    yield takeEvery(PLUGIN_ADD, pluginAddEffect);
}
