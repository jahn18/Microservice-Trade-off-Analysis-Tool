import { getRelationshipTypes } from "../MetricTableSelectors"

export const getSelectors = (state: any) => {
    return {
        relationshipTypes: getRelationshipTypes(state)
    }
}