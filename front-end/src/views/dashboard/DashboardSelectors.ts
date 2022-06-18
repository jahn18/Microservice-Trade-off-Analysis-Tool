import * as FileInputSelectors from "../../features/file-input/src/FileInputSelectors";
import * as DiffSelectorSelectors from "../../features/diff-selector/src/DiffSelectorSelectors";
import * as NavigationSelectors from "../../features/navigation/src/NavigationSelectors";

export const getSelectors = (state: any) => {
    return {
        jsonGraph: FileInputSelectors.getJSONGraph(state),
        selectedTab: NavigationSelectors.getSelectedTab(state),
        diffSelect: DiffSelectorSelectors.getDiffSelect(state)
    }
}