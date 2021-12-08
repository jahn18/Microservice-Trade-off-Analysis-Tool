import { IPlugin } from '../../../store/Plugin';
import MetricTableActions from './MetricTableActions';
import MetricTableSelectors from './MetricTableSelectors';
import { defaultState, STORE_ALIAS as MetricTableAlias } from './MetricTableTypes';

export const MetricTable: IPlugin = {
    alias: MetricTableAlias,
    defaultState,
    actions: MetricTableActions,
    selectors: MetricTableSelectors,
    childPlugins: []
}