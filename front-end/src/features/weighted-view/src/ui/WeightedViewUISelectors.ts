import { getError, getLoading, getWeights } from "../WeightedViewSelectors";
import * as NavigationSelectors from './../../../navigation/src/NavigationSelectors';
import * as CustomViewSelectors from './../../../custom-view/src/CustomViewSelectors';
import * as ChangeHistorySelectors from '../../../change-history-table/src/ChangeHistorySelectors';
import * as FileInputViewSelectors from '../../../file-input/src/FileInputSelectors';

export const getSelectors = (state: any) => {
    return {
        selectedTab: NavigationSelectors.getSelectedTab(state),
        selectedElements: ChangeHistorySelectors.getSelectedElements(state),
        cytoscapeGraphs: CustomViewSelectors.getCytoscapeGraphs(state),
        relationshipTypes: CustomViewSelectors.getRelationshipTypes(state),
        jsonGraph: FileInputViewSelectors.getJSONGraph(state),
        weights: getWeights(state),
        loading: getLoading(state),
        error: getError(state)
    }
}