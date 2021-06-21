import React from "react";
import CytoscapeComponent from 'react-cytoscapejs';


class DiffTool extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let elements = [];
        const {state} = this.props.location;
        
        for(let i = 0; i < state.data.static_graph.nodes.length; i++) {
            let classNode = state.data.static_graph.nodes[i];
            elements.push({ data: {id: classNode.id, label: classNode.label} });      
        }
        for(let i = 0; i < state.data.static_graph.links.length; i++) {
            let edge = state.data.static_graph.links[i];
            elements.push({ data: {source: edge.source, target: edge.target} });      
        }

        const layout = { name: 'random' };
        return <CytoscapeComponent elements={elements} layout={layout} style={{width: "100%", height: "750px"}} />;
    }
}

export default DiffTool;