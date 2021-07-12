export const updateDiffGraph = (graph) => {
    return {
        type: 'UPDATE_DIFF_GRAPH',
        payload: graph
    };
};

export const updateCustomGraph = (graph) => {
    return {
        type: 'UPDATE_CUSTOM_GRAPH',
        payload: graph
    };
};