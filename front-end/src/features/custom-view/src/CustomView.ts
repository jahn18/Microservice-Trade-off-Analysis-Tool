import { IPlugin } from '../../../store/Plugin';
import CustomViewActions from './CustomViewActions';
import CustomViewSelectors from './CustomViewSelectors';
import { defaultState, STORE_ALIAS as CustomViewAlias } from './CustomViewTypes';

export const CustomView: IPlugin = {
    alias: CustomViewAlias,
    defaultState,
    actions: CustomViewActions,
    selectors: CustomViewSelectors,
    childPlugins: []
}