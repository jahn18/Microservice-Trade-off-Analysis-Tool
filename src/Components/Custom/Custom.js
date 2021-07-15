import React, {createRef, useLayoutEffect} from "react";
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import edgehandles from 'cytoscape-edgehandles';
import automove from 'cytoscape-automove';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import {connect} from 'react-redux';
import {updateCustomGraph} from './../../Actions';
import storeProvider from './../../storeProvider';
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Metrics from './../Metrics/Metrics'

cytoscape.use( nodeHtmlLabel );
cytoscape.use( automove );
cytoscape.use( edgehandles );


class Custom extends React.Component {
    constructor(props) {
        super(props);
        this.myRef = React.createRef();

        let diffGraph = this.props.graphData.data.diff_graph; 
        let num_of_partitions = Object.keys(diffGraph).length;

        let default_nodes = []; 
        let common = [];

        let set_graph_positions = {};
        for(let node in this.props.nodes) {
            set_graph_positions[this.props.nodes[node].data.id] = this.props.nodes[node].position;
        }

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
                    },
                }] 
            );
        }

        let cy = cytoscape({
            elements: default_nodes,
            style: {width: "100%", height: "100%", position: 'fixed'} 
        });

        let w = window.innerWidth;
        let orbits = [];

        cy.layout({
            name: 'preset',
            positions: function(node) {
                return (set_graph_positions[node.id()]);   
            }
        }).run();

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
            partitions: orbits,
            static_metrics: [],
            class_name_metrics: []
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

    /*
        This is used to update the state in redux 
    */
    handleUpdateGraph = (graph) => {
        this.props.updateCustomGraph(graph);
    }

    handleClick = () => {
        let movedNodes = []; 
        let partitions = {}
        let updatedGraph = this.myRef.current._cy.nodes().jsons();

        for(let i in updatedGraph) {
            let node = updatedGraph[i].data;
            if(node.element_type === 'common*') {
                movedNodes.push(`graph_1_${node.id}`, `graph_2_${node.id}`);
            } 
        }

        for(let i in updatedGraph) {
            let node = updatedGraph[i].data;
            if(!movedNodes.includes(node.id) && node.element_type !== 'partition') {
                if(partitions[node.partition] === undefined) {
                    partitions[node.partition] = {
                        graph_1: [],
                        graph_2: []
                    };
                } 
                if(node.element_type === 'common' || node.element_type === 'common*') {
                    partitions[node.partition]['graph_1'].push(node.label);
                    partitions[node.partition]['graph_2'].push(node.label);
                } else if (node.element_type === 'graph_1' || node.element_type === 'graph_2') {
                    partitions[node.partition][node.element_type].push(node.label);
                }
            }    
        }

        let static_edge_graph = this.props.graphData.data.static_graph.links;
        let class_name_edge_graph = this.props.graphData.data.class_name_graph.links;

        let static_TurboMQ_value = [0, 0];
        let class_name_TurboMQ_value = [0, 0];

        for(let j in partitions) {
            let sie = 0.0;
            let see = 0.0; 
            let cie = 0.0;
            let cee = 0.0;

            for(let i in static_edge_graph) {
                let edge = static_edge_graph[i];
                if(partitions[j]['graph_1'].includes(edge.source) && partitions[j]['graph_1'].includes(edge.target)) {
                    sie += parseFloat(edge.weight);
                }
                else if (partitions[j]['graph_1'].includes(edge.source) || partitions[j]['graph_1'].includes(edge.target)) {
                    see += parseFloat(edge.weight); 
                }
                
                if(partitions[j]['graph_2'].includes(edge.source) && partitions[j]['graph_2'].includes(edge.target)) {
                    cie += parseFloat(edge.weight);
                }
                else if (partitions[j]['graph_2'].includes(edge.source) || partitions[j]['graph_2'].includes(edge.target)) {
                    cee += parseFloat(edge.weight); 
                }
            }
            class_name_TurboMQ_value[0] += (cie !== 0) ? ((2*cie) / ( (2*cie) + cee)) : 0; 
            static_TurboMQ_value[0] += (sie !== 0) ? ((2*sie) / ( (2*sie) + see)) : 0; 

            sie = 0.0;
            see = 0.0; 
            cie = 0.0;
            cee = 0.0;
            for(let i in class_name_edge_graph) {
                let edge = class_name_edge_graph[i];
                if(partitions[j]['graph_1'].includes(edge.source) && partitions[j]['graph_1'].includes(edge.target)) {
                    sie += parseFloat(edge.weight);
                }
                else if (partitions[j]['graph_1'].includes(edge.source) || partitions[j]['graph_1'].includes(edge.target)) {
                    see += parseFloat(edge.weight); 
                }

                if(partitions[j]['graph_2'].includes(edge.source) && partitions[j]['graph_2'].includes(edge.target)) {
                    cie += parseFloat(edge.weight);
                }
                else if (partitions[j]['graph_2'].includes(edge.source) || partitions[j]['graph_2'].includes(edge.target)) {
                    cee += parseFloat(edge.weight); 
                }
            }
            class_name_TurboMQ_value[1] += (cie !== 0) ? ((2*cie) / ( (2*cie) + cee)) : 0; 
            static_TurboMQ_value[1] += (sie !== 0) ? ((2*sie) / ( (2*sie) + see)) : 0; 

        }

        let num_of_partitions = Object.keys(partitions).length;
        static_TurboMQ_value[0] = static_TurboMQ_value[0] / num_of_partitions;
        static_TurboMQ_value[1] = static_TurboMQ_value[1] / num_of_partitions;
        class_name_TurboMQ_value[0] = class_name_TurboMQ_value[0] / num_of_partitions;
        class_name_TurboMQ_value[1] = class_name_TurboMQ_value[1] / num_of_partitions;

        let static_g = static_TurboMQ_value;
        let class_name_g = class_name_TurboMQ_value;
        this.setState({
            static_metrics: static_g,
            class_name_metrics: class_name_g
        })
    }

    componentDidUpdate() {
        console.log('componenet updated!');
    }

    render() {
        const {num_of_partitions, nodes} = this.state;

        let w = window.innerWidth;
        let state = storeProvider.getStore().getState();

        return (
            <div>
                <button onClick={this.handleClick}>Show real name</button>
                <CytoscapeComponent
                    ref={this.myRef}
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
                                'opacity': 0.03
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
                    cy={
                        (cy) => { 
                        //Orbit View
                        this.cy = cy;
                        let partitions = []

                        cy.viewport({
                            zoom: this.props.diffGraph.zoom,
                            pan: this.props.diffGraph.pan
                        });
                        
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
                            if(sourceNode.data().hide === false 
                                && partitions.includes(targetNode.id())
                                && !sourceNode.hasClass('deactivate')) {
                                // Fix if a common element is moved.
                                // Implement a way to add an additional partition. 
                                let prev_element = sourceNode.data().element_type;
                                let prev_partition = sourceNode.data().partition; 

                                if(sourceNode.data().element_type === 'common*') {
                                    cy.remove(sourceNode);
                                    prev_element = sourceNode.data().prev_element_type;
                                    prev_partition = sourceNode.data().prev_partition;
                                }

                                let npos = cy.elements().getElementById(targetNode.id()).position();

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
                            if(!partitions.includes(sel.id()) && sel.data().element_type !== 'common*' && sel.data().element_type !== 'common') {
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

                                    cy.add([{
                                        group: 'edges',
                                        data: {
                                            target: sel.id(),
                                            source: `graph_1_${sel.id()}`
                                        }
                                    },
                                    {
                                        group: 'edges',
                                        data: {
                                            target: sel.id(),
                                            source: `graph_2_${sel.id()}`
                                        }
                                    }]);
                                } else {
                                    selected_elements = selected_elements.union(cy.elements().getElementById(sel.data().prev_partition));
                                }
                            }
                            else if (sel.data().element_type === 'graph_1') {
                                let graph_2 = cy.elements().getElementById(`graph_2_${sel.data().label}`)
                                selected_elements = selected_elements.union(graph_2).union(cy.elements().getElementById(graph_2.data().partition));
                            } 
                            else if (sel.data().element_type === 'graph_2') {
                                let graph_1 = cy.elements().getElementById(`graph_1_${sel.data().label}`)
                                selected_elements = selected_elements.union(graph_1).union(cy.elements().getElementById(graph_1.data().partition));
                            } 
                            else if (sel.data().element_type === 'partition') {
                                selected_elements = selected_elements.union(sel.children()).union(
                                    cy.elements().filter((ele)=> {
                                        return (ele.data().partition === sel.id() && !ele.hasClass('hide'));
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

                        cy.on('click', function(e) {
                            cy.elements().removeClass('deactivate');
                            cy.elements().forEach((ele) => {
                                if(ele.data().element_type === 'common*') {
                                    if(ele.data().prev_element_type !== 'common') {
                                        cy.elements().getElementById(`graph_1_${ele.id()}`).addClass('hide');
                                        cy.elements().getElementById(`graph_2_${ele.id()}`).addClass('hide');
                                    } 
                                }
                                ele.data().hide = false;
                            })
                            cy.remove('edge');
                        });
                    }}
                />
                <Metrics/>
            </div>
        );
    }
};

export default connect(null, { updateCustomGraph })(Custom);
