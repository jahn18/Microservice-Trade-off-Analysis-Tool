import * as FileInputSelectors from "../../features/file-input/src/FileInputSelectors"
import * as NavigationSelectors from "../../features/navigation/src/NavigationSelectors";

export const getSelectors = (state: any) => {
    return {
        jsonGraph: FileInputSelectors.getJSONGraph(state),
        selectedTab: NavigationSelectors.getSelectedTab(state),
        enableWeightedView: FileInputSelectors.getWeightedViewState(state)
    }
}