import { getChangeHistory, getSelectedElements } from "../ChangeHistorySelectors";

export const getSelectors = (state: any) => {
    return {
        changeHistory: getChangeHistory(state),
        selectedElements: getSelectedElements(state)
    }
}