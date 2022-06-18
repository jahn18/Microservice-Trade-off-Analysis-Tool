import {getDiffSelect} from "../DiffSelectorSelectors"
export const getSelectors = (state: any) => {
    return {
        diffSelect: getDiffSelect(state)
    }
}