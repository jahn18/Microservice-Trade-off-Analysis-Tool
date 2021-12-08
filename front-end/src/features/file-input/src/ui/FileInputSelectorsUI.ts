import { getJSONGraph, getError } from "../FileInputSelectors";

export const getSelectors = (state: any) => {
    return {
        jsonGraph: getJSONGraph(state),
        error: getError(state)
    }
}