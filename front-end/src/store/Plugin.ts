import { Action } from './ActionTools';
import { Reducer } from 'redux';
import { Saga } from 'redux-saga';

export type ISelector = ((state: any) => any);

export interface IActionList {
    [actionName: string]: Action<any, any>
}

export interface IPlugin {
    alias: string;
    defaultState: any;
    actions: IActionList;
    selectors: ISelector[];
    childPlugins: IPlugin[];
    parentPlugin?: IPlugin;
}

export interface IPluginStoreState {
    plugins: { [pluginAlias: string]: IPlugin },
    replaceReducer: (nextReducer: Reducer<any, IActionPayload<any>>) => void
}

export interface IAction<S, P> {
    actionType: IActionType;
    getReduxAction: (payload: P) => void;
    reducer?: (state: S, action: IActionPayload<P>) => S
    saga?: Saga
}

export interface IActionPayload<P = any> {
    type: string
    payload: P
    error: boolean
}

export interface IActionType {
    type: string,
    error: boolean
}

const initialState: IPluginStoreState = {
    plugins: {},
    replaceReducer: () => { },
}

export const PLUGIN_ADD = "~~PLUGIN.ADD";

export function addPlugin(plugin: IPlugin) {
    return { type: PLUGIN_ADD, payload: { plugin }, error: false };
}

export const pluginReducer = (state: IPluginStoreState = initialState, action: IActionPayload): IPluginStoreState => {
    switch (action.type) {
        case PLUGIN_ADD: {
            const addAction = action as ReturnType<typeof addPlugin>;
            return {
                ...state,
                plugins: {...state.plugins, [addAction.payload.plugin.alias]: action.payload.plugin }
            };
        }

        default:
            return state;
    }
};


