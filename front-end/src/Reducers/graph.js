const initialState = {
    diff_graph: {
    }, 
    trade_off_graph: {
        graph: []
    },
    weighted_relationship_graph: {
        graph: []
    }
};

function graphReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_DIFF_GRAPH':
            return {diff_graph: action.payload, trade_off_graph: state.trade_off_graph, weighted_relationship_graph: state.weighted_relationship_graph};
        case 'UPDATE_TRADE_OFF_GRAPH':
            return {diff_graph: state.diff_graph, trade_off_graph: action.payload, weighted_relationship_graph: state.weighted_relationship_graph};
        case 'UPDATE_WEIGHTED_RELATIONSHIP_GRAPH':
            return {diff_graph: state.diff_graph, trade_off_graph: state.trade_off_graph, weighted_relationship_graph: action.payload};
        default: 
            return state;
    }
};

export default graphReducer; 