import * as NavigationSelectors from './../../../navigation/src/NavigationSelectors';
import * as CustomViewSelectors from './../../../custom-view/src/CustomViewSelectors';
import * as ChangeHistorySelectors from '../../../change-history-table/src/ChangeHistorySelectors';
import * as FileInputViewSelectors from '../../../file-input/src/FileInputSelectors';
import { getSelectedDecompositions } from '../DiffViewSelectors';

export const getSelectors = (state: any) => {
    return {
        selectedTab: NavigationSelectors.getSelectedTab(state),
        selectedElements: ChangeHistorySelectors.getSelectedElements(state),
        cytoscapeGraphs: CustomViewSelectors.getCytoscapeGraphs(state),
        relationshipTypes: CustomViewSelectors.getRelationshipTypes(state),
        jsonGraph: FileInputViewSelectors.getJSONGraph(state),
        selectedDecompositions: getSelectedDecompositions(state)
    }
}