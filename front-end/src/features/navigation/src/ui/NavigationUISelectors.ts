import { getSelectedTab } from "../NavigationSelectors";

export const getSelectors = (state: any) => {
    return {
        selectedTab: getSelectedTab(state)
    }
}