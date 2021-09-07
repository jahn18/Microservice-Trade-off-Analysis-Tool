export const updateDiffGraph = (graph) => {
    return {
        type: 'UPDATE_DIFF_GRAPH',
        payload: graph
    };
};

export const updateTradeOffGraph = (graph) => {
    return {
        type: 'UPDATE_TRADE_OFF_GRAPH',
        payload: graph
    };
};

export const updateWeightedRelationshipGraph = (graph) => {
    return {
        type: 'UPDATE_WEIGHTED_RELATIONSHIP_GRAPH',
        payload: graph
    };
}