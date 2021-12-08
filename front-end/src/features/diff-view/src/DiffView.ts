import { IPlugin } from '../../../store/Plugin';
import DiffViewActions from './DiffViewAction';
import DiffViewSelectors from './DiffViewSelectors';
import { defaultState, STORE_ALIAS as DiffViewAlias } from './DiffViewTypes';

export const DiffView: IPlugin = {
    alias: DiffViewAlias,
    defaultState,
    actions: DiffViewActions,
    selectors: DiffViewSelectors,
    childPlugins: []
}