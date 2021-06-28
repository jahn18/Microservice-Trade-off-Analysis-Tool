import React from "react";
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
import compoundDragAndDrop from 'cytoscape-compound-drag-and-drop';

Cytoscape.use(compoundDragAndDrop);

class DiffTool extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            graphData: this.props.location.state,
            selectedRelationshipType: 'static',
            graph: []
        }
    }

    render() {
        let circleStyle = {
            padding:10,
            margin:20,
            display:"inline-block",
            backgroundColor: this.props.bgColor,
            borderRadius: "50%",
            width:100,
            height:100,
            left:0,
            top:0
        };
        const {graph, graphData} = this.state;
        let elements = [];

        elements.push({
            data: {
                id: 'partition0', 
            } 
        });
        elements.push({
            data: {
                id: 'partition1', 
            } 
        });
        elements.push({
            data: {
                parent: 'partition2'
            } 
        });
        
        elements.push({
            data: {
                id: 'core0', 
                parent: 'partition0'
            } 
        });
        elements.push({
            data: {
                id: 'core1', 
                parent: 'partition1'
            } 
        });
        elements.push({
            data: {
                id: 'core2', 
                parent: 'partition2'
            } 
        });
        
        let ids = []

        for(let i = 0; i < graphData.data.static_graph.nodes.length; i++) {
            let classNode = graphData.data.static_graph.nodes[i];
            if(i < 1) {
                elements.push({
                    group: 'nodes', 
                    data: {
                        id: classNode.id, 
                        label: classNode.label,
                        parent: 'core2'
                    } 
                });
            }
            else if(i < 5) {
                elements.push({
                    group: 'nodes', 
                    data: {
                        id: classNode.id, 
                        label: classNode.label,
                        parent: 'core0'
                    } 
                });
            } else if (i > 15 && i < 20) {
                elements.push({
                    group: 'nodes', 
                    data: {
                        id: classNode.id, 
                        label: classNode.label,
                        parent: 'core1'
                    } 
                });
            } else {
                elements.push({
                    group: 'nodes', 
                    data: {
                        id: classNode.id, 
                        label: classNode.label,
                        parent: (i < 17) ? 'partition0' : 'partition1'
                    } 
                });
            }
            if(i > 10 && i < 20) {
                ids.push(classNode.id);
            }
        }
        for(let i = 0; i < graphData.data.static_graph.links.length; i++) {
            let edge = graphData.data.static_graph.links[i];
            elements.push({group: 'edges', data: {source: edge.source, target: edge.target} });      
        }

        return (
            <div>
                <CytoscapeComponent
                    elements={elements} 
                    style={{width: "100%", height: "750px"}} 
                    stylesheet={[
                        {
                            'selector': 'node',
                            'style': {
                                'background-color': '#777',
                                'label': 'data(id)'
                            }
                        },
                        {
                            // The compound node
                            'selector': '$node > node',
                            'style': {
                                'shape': 'roundrectangle',
                                // 'padding-top': '10px',
                                // 'padding-left': '10px',
                                // 'padding-bottom': '10px',
                                // 'padding-right': '10px',
                                // 'text-valign': 'top',
                                // 'text-halign': 'center',
                                'background-color': '#e3e3e3',
                                'label': ""
                            }
                        },
                        {
                            'selector': 'edge',
                            'style': {
                                'width': 1,
                                'line-color': '#c4c4c4',
                                'target-arrow-color': '#c4c4c4',
                                'target-arrow-shape': 'vee',
                                'curve-style': 'bezier'
                            }
                        }
                    ]}
                    cy={(cy) => { 
                        // Orbit View
                        this.cy = cy;
                        
                        let partition_names = ['partition0', 'partition1', 'partition2'];
                        let cores_names = ['core0', 'core1', 'core2'];

                        //Style
                        // cy.style().selector('node').style({
                        //     'background-color': function (ele) {
                        //         for(let i = 0; i < cores_names.length; i++) {
                        //             if(partition_names[i].includes(ele.data('id'))) {
                        //                 return '#ffffff';
                        //             } else if(cores_names[i].includes(ele.data('id'))) {
                        //                 return '#e3e3e3';
                        //             } else {
                        //                 return '#777';
                        //             }
                        //         }
                        //     }
                        // });

                        let cores = [cy.elements()[3], cy.elements()[4]];
                        let partitions = cy.collection();

                        partitions = cy.elements().slice(0, 3);

                        var w = window.innerWidth;
                        var h = window.innerHeight;

                        let col = [];
                        for(let i = 0; i < 2; i++) {
                            col.push(cy.collection());
                        }
                        col[0] = cy.elements().slice(7, 19);
                        col[1] = cy.elements().slice(19, 36);
                        for(let j = 0; j < col.length; j++) {
                            let npos = cores[j].position();
                            col[j].layout({
                                name: 'concentric',
                                spacingFactor: 3.5,
                                boundingBox: {
                                    x1: npos.x - w/2,
                                    x2: npos.x + w/2,
                                    y1: npos.y - w/2,
                                    y2: npos.y + w/2 
                                },
                                fit: true,
                                concentric: function(n) {
                                    for(let i = 0; i < cores[j].children().length; i++) {
                                        if(cores[j].children()[i].id() === n.id() ) {
                                            // Inner level
                                            return 2;
                                        } 
                                    }
                                    // First outer level. Return 0 for classes even outer.
                                    for(let i = 0; i < ids.length; i++) {
                                        if(n.id() == ids[i]) {
                                            return 0;
                                        }
                                    }
                                    return 1;
                                },
                                levelWidth: function() {
                                    return 1;
                                } 
                            }).run();
                        }

                        partitions.layout({
                            name: 'cose',
                            randomize: true
                        }).run();

                    }}
                />
            </div>
        );
    }
}

export default DiffTool;