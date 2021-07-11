import React from "react";
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import edgehandles from 'cytoscape-edgehandles';
import automove from 'cytoscape-automove';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import Metrics from './../Metrics';

cytoscape.use( nodeHtmlLabel );
cytoscape.use( automove );
cytoscape.use( edgehandles );

class Custom extends React.Component {
    constructor(props) {
        super(props);

        // let diffGraph = this.props.location.state.data.diff_graph; 
        let diffGraph = this.props.graphData.data.diff_graph; 
        console.log(diffGraph);
        let num_of_partitions = Object.keys(diffGraph).length;

        let default_nodes = []; 
        let common = [];

        for(let i = 0; i < num_of_partitions; i++) {
            common = [].concat(common, diffGraph[i].common);
            default_nodes = [].concat(
                default_nodes, 
                this.setUpPartitions(diffGraph[i].common, i, 0, true), 
                this.setUpPartitions(diffGraph[i].graph_one_diff, i, 1, false), 
                this.setUpPartitions(diffGraph[i].graph_two_diff, i, 2, false), 
                [{
                    data: {
                        id: `partition${i}`,
                        label: `partition${i}`,
                        background_color: 'grey',
                        colored: true,
                        element_type: 'partition',
                        hide: false 
                    }
                }] 
            );
        }

        let cy = cytoscape({
            elements: default_nodes,
            style: {width: "100%", height: "100%", position: 'fixed'} 
        });

        let w = window.innerWidth;
        let orbits = [];

        for(let i = 0; i < num_of_partitions; i++) {
            orbits.push(
                cy.elements().getElementById(`partition${i}`).children().union(
                    cy.elements().filter((ele)=> {
                        return ele.data().partition === `partition${i}`;
                    })
                )
            );
            let npos = cy.elements().getElementById(`partition${i}`).position();
            orbits[i].layout({
                name: 'concentric',
                spacingFactor: 15,
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


        this.state = {
            graph: cy,
            num_of_partitions: num_of_partitions,
            nodes: cy.elements().jsons(),
            selectedRelationshipType: 'custom',
            partitions: orbits
        }
    };

    setUpPartitions = (graph_nodes, partition_num, graph_num, isCoreElement) => {  
        let color;
        let element_list = [];

        if(graph_num === 1) {
            color = '#4169e1';
        } else if (graph_num === 2) {
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
                    parent: (isCoreElement) ? `partition${partition_num}` : null,
                    partition: `partition${partition_num}`,
                    background_color: color,
                    hide: false
                }
            });
        }
        return element_list;
    };

    render() {
        const {num_of_partitions, selectedRelationshipType, graph, nodes, orbits} = this.state;

        let w = window.innerWidth;

        // Update the graph if elements are moved. 
        graph.json(nodes);

        return (
            <div>
                {/* <Paper square>
                    <Tabs
                    value={selectedRelationshipType}
                    textColor="primary"
                    indicatorColor="primary"
                    onChange={(event, newValue) => {
                        this.setState({selectedRelationshipType: newValue});
                    }}
                    >
                    <Tab label="custom" value="custom"
                    //disabled 
                    />
                    </Tabs>
                </Paper> */}
                {/* <Metrics /> */}
                <CytoscapeComponent
                    elements={CytoscapeComponent.normalizeElements({
                        nodes: nodes
                    })} 
                    style={{width: "100%", height: "100%", position: 'fixed'}} 
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
                                'label': 'data(label)',
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
                        },
                        {
                            'selector': 'node.hide',
                            'style': {
                                'opacity': 0.0
                            }
                        },
                        {
                            'selector': 'node.deactivate',
                            'style': {
                                'opacity': 0.025
                            }
                        },
                        {
                            selector: '.eh-handle',
                            style: {
                              'background-color': 'red',
                              'width': 13,
                              'height': 13,
                              'shape': 'ellipse',
                              'overlay-opacity': 0,
                              'border-width': 12, // makes the handle easier to hit
                              'border-opacity': 0
                            }
                        },
                        {
                            selector: '.eh-hover',
                            style: {
                              'background-color': 'red'
                            }
                          },
              
                          {
                            selector: '.eh-source',
                            style: {
                              'border-width': 2,
                              'border-color': 'red'
                            }
                          },
              
                          {
                            selector: '.eh-target',
                            style: {
                              'border-width': 2,
                              'border-color': 'red'
                            }
                          },
              
                          {
                            selector: '.eh-preview, .eh-ghost-edge',
                            style: {
                              'background-color': 'red',
                              'line-color': 'red',
                              'target-arrow-color': 'red',
                              'source-arrow-color': 'red'
                            }
                          },
                          {
                            selector: '.eh-ghost-edge.eh-preview-active',
                            style: {
                              'opacity': 0
                            }
                          }
                    ]}
                    cy={(cy) => { 
                        // Orbit View
                        this.cy = cy;
                        let partitions = []
                        
                        cy.nodeHtmlLabel([{
                                query: 'node',
                                halign: 'center',
                                valign: 'center',
                                halignBox: 'center',
                                valignBox: 'center',
                                tpl: (data) => {
                                    if(data.element_type === 'common*' && data.hide === false) {
                                        return '<h1 style="color:white;">' + '+' + '</h1>';
                                    } else if ((data.element_type === 'graph_1' || data.element_type === 'graph_2') && data.hide === true) {
                                        return '<h1 style="color:white;">' + '-' + '</h1>';
                                    }
                                }
                        }]);

                        for(let i = 0; i < num_of_partitions; i++) {
                            cy.automove({
                                nodesMatching: 
                                    cy.elements().filter((ele)=> {
                                        return ele.data().partition === `partition${i}`;
                                    }),
                                reposition: 'drag',
                                dragWith: cy.elements().getElementById(`partition${i}`)
                            });
                            partitions.push(`partition${i}`);
                        }

                        let eh = cy.edgehandles();

                        cy.on('ehcomplete', (event, sourceNode, targetNode, addedEles) => {
                            console.log(sourceNode)
                            if(sourceNode.data().hide === false 
                                && partitions.includes(targetNode.id())) {
                                // Fix if a common element is moved.
                                // Implement a way to add an additional partition. 
                                let prev_element = sourceNode.data().element_type;
                                let prev_partition = sourceNode.data().partition; 

                                if(sourceNode.data().element_type === 'common*') {
                                    cy.remove(sourceNode);
                                    prev_element = sourceNode.data().prev_element_type;
                                    prev_partition = sourceNode.data().prev_partition;
                                }

                                cy.add({
                                    group: 'nodes',
                                    data: {
                                        id: sourceNode.data().label,
                                        label: sourceNode.data().label,
                                        parent: targetNode.id(),
                                        element_type: 'common*',
                                        prev_element_type: prev_element,
                                        background_color: 'grey',
                                        partition: targetNode.id(),
                                        prev_partition: prev_partition,
                                        hide: false
                                    },
                                })

                                let npos = cy.elements().getElementById(targetNode.id()).position();
                                cy.elements().getElementById(targetNode.id()).children().union(
                                    cy.elements().filter((ele)=> {
                                        return ele.data().partition === targetNode.id();
                                    })).layout({
                                    name: 'concentric',
                                    spacingFactor: 2,
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
                                            case "common*":
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
                                    }, 
                                    equidistant: true, 
                                }).run();

                                // Should also hide common elements if they get moved. 
                                if(sourceNode.data().element_type === 'common') {
                                    cy.remove(sourceNode);
                                } else {
                                    cy.elements().getElementById(`graph_1_${sourceNode.data().label}`).addClass('hide');
                                    cy.elements().getElementById(`graph_2_${sourceNode.data().label}`).addClass('hide');
                                }
                            }
                            cy.remove(addedEles);
                        })

                        cy.on('mouseover', 'node', function(e) {
                            let sel = e.target;
                            if(!partitions.includes(sel.id())) {
                                eh.enableDrawMode();
                            }
                        })

                        cy.on('mouseout', 'node', function(e) {
                            eh.disableDrawMode();
                        })

                        cy.on('tap', 'node', function(e) {
                            let sel = e.target; 
                            let selected_elements = cy.collection().union(sel).union(cy.elements().getElementById(sel.data().partition)); 

                            if(sel.data().element_type === 'common*') {
                                if(sel.data().prev_element_type !== 'common') {
                                    selected_elements = selected_elements.union(cy.elements().getElementById(`graph_2_${sel.id()}`));
                                    selected_elements = selected_elements.union(cy.elements().getElementById(`graph_1_${sel.id()}`));
                                    let graph_1_partition = cy.elements().getElementById(`graph_1_${sel.id()}`).data().partition
                                    let graph_2_partition = cy.elements().getElementById(`graph_2_${sel.id()}`).data().partition

                                    selected_elements = selected_elements.union(
                                        cy.elements().getElementById(graph_1_partition)
                                    );
                                    selected_elements = selected_elements.union(
                                        cy.elements().getElementById(graph_2_partition)
                                    );
                                    cy.elements().getElementById(`graph_1_${sel.id()}`).data().hide = true;
                                    cy.elements().getElementById(`graph_2_${sel.id()}`).data().hide = true;
                                } else {
                                    selected_elements = selected_elements.union(cy.elements().getElementById(sel.data().prev_partition));
                                }
                            }
                            else if (sel.data().element_type === 'graph_1') {
                                selected_elements = selected_elements.union(cy.elements().getElementById(`graph_2_${sel.data().label}`));
                            } 
                            else if (sel.data().element_type === 'graph_2') {
                                selected_elements = selected_elements.union(cy.elements().getElementById(`graph_1_${sel.data().label}`));
                            } 
                            else if (sel.data().element_type === 'partition') {
                                selected_elements = selected_elements.union(sel.children()).union(
                                    cy.elements().filter((ele)=> {
                                        return ele.data().partition === sel.id();
                                    }),
                                )
                            }

                            let unselected_elements = cy.elements().not(sel).difference(selected_elements);
                            unselected_elements.forEach((ele) => {
                                if(ele.data().element_type !== 'graph_1' && ele.data().element_type !== 'graph_2') {
                                    ele.data().hide = true; 
                                }
                            })
                            
                            unselected_elements.addClass('deactivate');
                            selected_elements.removeClass('hide');
                        });

                        cy.on('click', function(e){
                            cy.elements().removeClass('deactivate');
                            cy.elements().forEach((ele) => {
                                if(ele.data().element_type === 'common*') {
                                    if(ele.data().prev_element_type !== 'common') {
                                        cy.elements().getElementById(`graph_1_${ele.id()}`).addClass('hide');
                                        cy.elements().getElementById(`graph_2_${ele.id()}`).addClass('hide');
                                        // cy.elements().getElementById(`graph_1_${ele.id()}`).data().hide = false;
                                        // cy.elements().getElementById(`graph_2_${ele.id()}`).data().hide = false;
                                    } 
                                }
                                ele.data().hide = false;
                            })
                        });
                        
                    }}
                />
            </div>
        );
    }
};

export default Custom;
