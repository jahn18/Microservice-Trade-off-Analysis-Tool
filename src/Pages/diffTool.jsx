import React from "react";
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import $ from 'jquery';
import Popper from 'popper.js';
// import compoundDragAndDrop from 'cytoscape-compound-drag-and-drop';

// Cytoscape.use(compoundDragAndDrop);

class DiffTool extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            graphData: this.props.location.state,
            selectedRelationshipType: 'static',
            data: {
                edges: [],
                nodes: []
            },
            isOpen: false
        }
    }

    toggleOpen = () => this.setState({ isOpen: !this.state.isOpen });

    showEdgeDependencies = (relationshipType) => {
        let elements = []
        const {graphData} = this.state;

        console.log(elements);

        switch(relationshipType) {
            case 'static':
                let static_graph = graphData.data.static_graph.links;
                for(let i = 0; i < static_graph.length; i++) {
                    let edge = static_graph[i];
                    elements.push({
                        group: 'edges', 
                        data: {
                            //id: `static_${i}`,
                            source: `graph_1_${edge.source}`,
                            target: `graph_1_${edge.target}`,
                            weight: edge.weight
                        } 
                    });
                }
                break; 
            case 'class name':
                let class_name_graph = graphData.data.class_name_graph.links;
                for(let i = 0; i < class_name_graph.length; i++) {
                    let edge = class_name_graph[i];
                    elements.push({
                        group: 'edges', 
                        data: {
                            //id: `class_name_${i}`,
                            source: edge.source,
                            target: edge.target,
                            weight: edge.weight
                        } 
                    });
                }
                break;
            default: 
                break;
        }
        return elements;
    }

    setUpPartitions = (graph_nodes, element_list, partition_num, graph_num, isCoreElement) => {              
        let color;
        if(graph_num == 1) {
            color = '#4169e1';
        } else if (graph_num == 2) {
            color = '#e9253e';
        } else {
            color = 'grey';
        }

        for(let i = 0; i < graph_nodes.length; i++) {
            let classNode = graph_nodes[i];
            element_list.push({
                group: 'nodes', 
                data: {
                    id: `graph_${graph_num}_${classNode}`, 
                    label: classNode,
                    element_type: (isCoreElement) ? 'common' : `graph_${graph_num}`,
                    parent: (isCoreElement) ? `core${partition_num}` : `partition${partition_num}`,
                    background_color: color
                } 
            });
        }
    }

    render() {
        const {graphData} = this.state;
        let diffGraph = graphData.data.diff_graph;
        var num_of_partitions = Object.keys(diffGraph).length;
        var elements = []

        const menuClass = `dropdown-menu${this.state.isOpen ? " show" : ""}`;

        for(let i = 0; i < num_of_partitions; i++) {
            elements.push({
                data: {
                    id: `partition${i}`,
                    background_color: 'white',
                    colored: false
                } 
            });
            elements.push({
                data: {
                    id: `core${i}`, 
                    parent: `partition${i}`,
                    background_color: 'white',
                    colored: true
                } 
            });
            this.setUpPartitions(diffGraph[i].common, elements, i, null, true);
            this.setUpPartitions(diffGraph[i].graph_one_diff, elements, i, 1, false);
            this.setUpPartitions(diffGraph[i].graph_two_diff, elements, i, 2, false);
        }

        elements = [].concat(elements, this.showEdgeDependencies('static'));

        console.log(elements)

        return (
            <div id='container' style={{position: 'relative'}}>
                <CytoscapeComponent
                    elements={elements} 
                    style={{width: "100%", height: "1250px", position: 'absolute'}} 
                    stylesheet={[
                        {
                            'selector': 'node',
                            'style': {
                                'background-color': 'data(background_color)',
                                'label': 'data(label)'
                            }
                        },
                        {
                            // The compound node
                            'selector': '$node > node',
                            'style': {
                                'shape': 'roundrectangle',
                                'padding-top': '10px',
                                'padding-left': '10px',
                                'padding-bottom': '10px',
                                'padding-right': '10px',
                                'text-valign': 'top',
                                'text-halign': 'center',
                                'background-color': function(node) {
                                    if (node.data("colored"))
                                    return "#e9e9e9";
                                    else
                                    return "white";
                                },
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

                        var w = window.innerWidth;
                        var h = window.innerHeight;

                        let partitions = [];

                        let orbits = [];

                        for(let i = 0; i < num_of_partitions; i++) {
                            partitions.push(this.cy.elements().getElementById(`partition${i}`));

                            orbits.push(
                                this.cy.collection(
                                    partitions[i].children()
                                    ).union(
                                        this.cy.elements().getElementById(`core${i}`).children()
                                    )
                            );

                            let npos = this.cy.elements().getElementById(`core${i}`).position();
                            orbits[i].layout({
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
                                    switch(n.data().element_type) {
                                        case "common": 
                                            return 2;
                                        case "graph_1":
                                            return 0;
                                        case "graph_2": 
                                            return 1;
                                        default:
                                            return 1;
                                    }
                                },
                                levelWidth: function() {
                                    return 1;
                                } 
                            }).run();
                        }
                        
                        cy.collection(partitions).layout({
                            name: 'cose',
                            randomize: false
                        }).run();

                    }}
                />
                <div className="dropdown" onClick={this.toggleOpen}>
                    <button
                    className="btn btn-secondary dropdown-toggle"
                    type="button"
                    id="dropdownMenuButton"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    >
                        Menu
                    </button>
                    {/* <div className={menuClass} aria-labelledby="dropdownMenuButton">
                        <button className="dropdown-item" href="#nogo" onClick={this.showEdgeDependencies("static")}>
                            Static
                        </button>
                        <button className="dropdown-item" href="#nogo" onClick={this.showEdgeDependencies("class name")}>
                            Class Name
                        </button>
                        <button className="dropdown-item" href="#nogo">
                            Custom
                        </button>
                    </div> */}
                </div>
            </div>
        );
    }
}

export default DiffTool;