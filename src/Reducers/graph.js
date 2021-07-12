const initialState = {
    diff_graph: {}, 
    custom_graph: {}
};

function graphReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_DIFF_GRAPH':
            return {diff_graph: action.payload, custom_graph: state.custom_graph};
        case 'UPDATE_CUSTOM_GRAPH':
            return {diff_graph: state.diff_graph, custom_graph: action.payload};
        default: 
            return state;
    }
};

export default graphReducer; 