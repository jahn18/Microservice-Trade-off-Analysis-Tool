import * as NavigationSelectors from './../../../navigation/src/NavigationSelectors';
import { getCytoscapeGraphs, getRelationshipTypes } from '../CustomViewSelectors';
import * as ChangeHistorySelectors from '../../../change-history-table/src/ChangeHistorySelectors';
import * as FileInputViewSelectors from '../../../file-input/src/FileInputSelectors';

export const getSelectors = (state: any) => {
    return {
        selectedTab: NavigationSelectors.getSelectedTab(state),
        selectedElements: ChangeHistorySelectors.getSelectedElements(state),
        cytoscapeGraphs: getCytoscapeGraphs(state),
        relationshipTypes: getRelationshipTypes(state),
        jsonGraph: FileInputViewSelectors.getJSONGraph(state)
    }
}