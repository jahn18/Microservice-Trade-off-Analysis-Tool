import React from "react";
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Custom from './../Components/Custom';
import AntSwitch from './../Components/Switch';

/* 
    TODO: 
    - Fix the initial starting view.  
    - Improve dragging partitions. 
    ** - Make an extra grey box if no common elements exist.
    ***THREE MAIN THINGS:
    1. Have the positions be consistent with the custom view.
    2. Update the metrics for the custom view. 
    ** 3. Toggle edges for the DIFF View. 
    4. Location not saving when changing to custom view. 
*/

class DiffTool extends React.Component {
    constructor(props) {
        super(props);

        let json_graph_data = this.props.location.state; 
        let diffGraph = this.props.location.state.data.diff_graph; 
        let num_of_partitions = Object.keys(diffGraph).length;

        let default_nodes = []; 
        let common = [];
        for(let i = 0; i < num_of_partitions; i++) {
            common = [].concat(common, diffGraph[i].common);
            default_nodes = [].concat(default_nodes, this.setUpPartitions(diffGraph[i].common, i, 0, true), this.setUpPartitions(diffGraph[i].graph_one_diff, i, 1, false), 
                                    this.setUpPartitions(diffGraph[i].graph_two_diff, i, 2, false));
        }

        let core_elements = [];
        for(let i = 0; i < num_of_partitions; i++) {
            core_elements.push({
                data: {
                    id: `partition${i}`,
                    label: `partition${i}`,
                    background_color: 'white',
                    colored: false,
                    element_type: 'partition'
                } 
            },
            {
                data: {
                    id: `core${i}`, 
                    label: `core${i}`,
                    parent: `partition${i}`,
                    background_color: 'grey',
                    colored: true,
                    element_type: 'core'
                } 
            });
        }

        let static_graph = json_graph_data.data.static_graph.links;
        let static_edge_graph = this.getEdgeDependencies(static_graph, common, 'graph_1');

        core_elements = [].concat(core_elements, default_nodes);

        let cy = cytoscape({
            elements: core_elements,
            style: {width: "100%", height: "100%", position: 'fixed'} 
        });

        let w = window.innerWidth;
        let partitions = [];
        let orbits = [];

        for(let i = 0; i < num_of_partitions; i++) {
            partitions.push(cy.elements().getElementById(`partition${i}`));
            orbits.push(
                cy.collection(partitions[i].children())
                    .union(cy.elements().getElementById(`core${i}`).children())
            );

            let npos = cy.elements().getElementById(`core${i}`).position();
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
                            return 2;
                    }
                },
                levelWidth: function() {
                    return 1;
                } 
            }).run();
        }

        cy.collection(partitions).layout({
            name: 'cose',
            randomize: true,
            fit: true,
            nodeRepulsion: 80000,
            gravity: 0.75
        }).run();


        this.state = {
            graph: cy,
            selectedRelationshipType: 'static',
            // I have to change this when the two decompositions have a different number of partitions.
            num_of_partitions: num_of_partitions,
            nodes: cy.elements().forEach((ele) => {
                                if(ele.data().element_type === 'graph_2') {
                                    ele.addClass('hide');
                                }
                            }).jsons(),
            edges: static_edge_graph, 
            common_elements: common,
            static_checked: false,
            class_name_checked: false
        }

        this.changeRelationshipType = this.changeRelationshipType.bind(this);
        this.getEdgeDependencies = this.getEdgeDependencies.bind(this);
    };

    calculateNormalizedTurboMQ = (diffGraph, common_elements, graph_num) => {
        const {num_of_partitions} = this.state;
        let CF_0 = 0.0;
        let CF_1 = 0.0;
        for(let i = 0; i < num_of_partitions; i++) {
            /* 
                Later change this so that graph_num is the actual number so it is "graph_${graph_num}_diff" when we have
                multiple partitions. 
            */
            let partition_classes = (graph_num === 1) ? [].concat(diffGraph[i].common, diffGraph[i].graph_one_diff) : 
                                        [].concat(diffGraph[i].common, diffGraph[i].graph_two_diff); 
            let internal_edges = 0.0;
            let external_edges = 0.0; 
            let edge_graph = this.props.location.state.data.static_graph.links;
            for(let j = 0; j < edge_graph.length; j++) {
                let edge = edge_graph[j];
                if(partition_classes.includes(edge.source) && partition_classes.includes(edge.target)) {
                    internal_edges += parseFloat(edge.weight);
                } else if (partition_classes.includes(edge.source) || partition_classes.includes(edge.target)) {
                    external_edges += parseFloat(edge.weight); 
                }
            }
            CF_0 += (internal_edges !== 0) ? ((2*internal_edges) / ( (2*internal_edges) + external_edges)) : 0; 

            internal_edges = 0.0;
            external_edges = 0.0; 
            edge_graph = this.props.location.state.data.class_name_graph.links;
            for(let j = 0; j < edge_graph.length; j++) {
                let edge = edge_graph[j];
                if(partition_classes.includes(edge.source) && partition_classes.includes(edge.target)) {
                    internal_edges += parseFloat(edge.weight);
                } else if (partition_classes.includes(edge.source) || partition_classes.includes(edge.target)) {
                    external_edges += parseFloat(edge.weight); 
                }
            }
            CF_1 += (internal_edges !== 0) ? ((2*internal_edges) / ( (2*internal_edges) + external_edges)) : 0; 
        }
        return [(CF_0 / num_of_partitions) * 100, (CF_1 / num_of_partitions) * 100];
    };

    // When the user clicks on a tab it changes the relationship type.
    changeRelationshipType = (relationshipType, common_elements) => {
        const {
            graph,
        } = this.state;
        let renderedGraph = [];
        let edges = [];
        graph.elements().removeClass('hide');

        switch(relationshipType) {
            case 'static':
                renderedGraph = graph.elements().forEach((ele) => {
                    if(ele.data().element_type === 'graph_2') {
                        if(ele.group() === 'nodes') {
                            ele.addClass('hide');
                        } 
                    }
                }).jsons()
                let static_graph = this.props.location.state.data.static_graph.links;
                edges = this.getEdgeDependencies(static_graph, common_elements, 'graph_1');
                break; 
            case 'class name':
                renderedGraph = graph.elements().forEach((ele) => {
                    if(ele.data().element_type === 'graph_1') {
                        if(ele.group() === 'nodes') {
                            ele.addClass('hide');
                        } 
                    }
                }).jsons()
                let class_name_graph = this.props.location.state.data.class_name_graph.links;
                edges = this.getEdgeDependencies(class_name_graph, common_elements, 'graph_2');
                break;
            default: 
                renderedGraph = graph.nodes().jsons();
                break;
        }
        this.setState({
            nodes: renderedGraph, 
            edges: edges, 
            static_checked: false,
            class_name_checked: false
        });
    };

    getEdgeDependencies = (graph, common_elements, graph_type) => {
        let edge_dependencies = [];
        for(let i = 0; i < graph.length; i++) {
            let edge = graph[i];
            edge_dependencies.push({
                group: 'edges', 
                data: {
                    source: (common_elements.includes(edge.source)) ? `graph_0_${edge.source}` : `${graph_type}_${edge.source}`,
                    target: (common_elements.includes(edge.target)) ? `graph_0_${edge.target}` : `${graph_type}_${edge.target}`,
                    weight: edge.weight,
                    element_type: graph_type
                } 
            }); 
        }
        return edge_dependencies;
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
                    parent: (isCoreElement) ? `core${partition_num}` : `partition${partition_num}`,
                    background_color: color
                } 
            });
        }

        return element_list;
    };

    toggleSwitch = () => {
        const {
            class_name_checked, 
            static_checked,
            common_elements
        } = this.state;

        let class_name_graph = this.props.location.state.data.class_name_graph.links;
        let static_graph = this.props.location.state.data.static_graph.links;
        let edges = []

        if(class_name_checked) {
            edges = this.getEdgeDependencies(class_name_graph, common_elements, 'graph_2');
        }

        if(static_checked) {
            edges = [].concat(edges, this.getEdgeDependencies(static_graph, common_elements, 'graph_1'))
        }
        return edges;
    }

    render() {
        const {
            num_of_partitions, 
            selectedRelationshipType, 
            graph, 
            nodes, 
            common_elements, 
            edges,
        } = this.state;

        // Update the graph if elements are moved. 
        graph.json(nodes);

        let diffGraph = this.props.location.state.data.diff_graph; 

        let static_turboMQ = this.calculateNormalizedTurboMQ(diffGraph, common_elements, 1);
        let class_name_turboMQ = this.calculateNormalizedTurboMQ(diffGraph, common_elements, 2);

        let graph_edges = (this.toggleSwitch().length !== 0) ? this.toggleSwitch() : edges;

        return (
            <div>
                <Paper square>
                    <Tabs
                    value={selectedRelationshipType}
                    textColor="primary"
                    indicatorColor="primary"
                    onChange={(event, newValue) => {
                        this.setState({selectedRelationshipType: newValue});
                        this.changeRelationshipType(newValue, common_elements);
                    }}
                    >
                    <Tab label="static" value="static"/>
                    <Tab label="class name" value="class name"/>
                    <Tab label="diff" value="diff"/>
                    <Tab label="custom" value="custom"
                    //disabled 
                    />
                    </Tabs>
                </Paper>
                {(selectedRelationshipType === 'custom') && 
                    <Custom graphData={this.props.location.state} nodes={nodes}/>
                }
                {(selectedRelationshipType !== 'custom') && 
                <CytoscapeComponent
                    elements={CytoscapeComponent.normalizeElements({
                        nodes: nodes,
                        edges: graph_edges
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
                            'selector': 'node.highlight',
                            'style': {
                                'opacity': 1.0
                            }
                        },
                        {
                            'selector': 'node.deactivate',
                            'style': {
                                'opacity': 0.035
                            }
                        },
                        {
                            'selector': 'edge.highlight',
                            'style': {
                                'mid-target-arrow-color': 'black',
                                'target-arrow-color': 'grey',
                                'width': '3',
                                'label': 'data(weight)',
                                'text-outline-width': '3',
                                'text-outline-color': 'white',
                            }
                        },
                        { 
                            'selector': 'edge.deactivate',
                            'style': {
                                'opacity': 0.2,
                                'target-arrow-shape': 'none'
                            }
                        },
                        {
                            'selector': 'node.hide',
                            'style': {
                                'opacity': 0
                            }
                        },
                        {
                            'selector': 'edge.hide',
                            'style': {
                                'opacity': 0
                            }
                        }
                    ]}
                    cy={(cy) => { 
                        // Orbit View
                        this.cy = cy;
                        console.log(cy.viewport())

                        cy.on('tap', 'node', function(e) {
                            let sel = e.target; 
                            let selected_elements = sel.outgoers().union(sel.incomers()); 

                            if(sel.data().element_type === 'graph_1') {
                                selected_elements = selected_elements.union(cy.elements().getElementById(`graph_2_${sel.data().label}`));
                            } else if (sel.data().element_type === 'graph_2') {
                                selected_elements = selected_elements.union(cy.elements().getElementById(`graph_1_${sel.data().label}`));
                            } 
                            // else if (sel.data().element_type === 'partition') {
                            //     selected_elements = selected_elements.union(sel.children());
                            // }

                            for(let i = 0; i < num_of_partitions; i++) {
                                selected_elements = selected_elements.union(cy.elements().getElementById(`partition${i}`))
                                selected_elements = selected_elements.union(cy.elements().getElementById(`core${i}`))
                            }

                            let unselected_elements = cy.elements().not(sel).difference(selected_elements);

                            
                            unselected_elements.addClass('deactivate');
                            selected_elements.addClass('highlight');
                            sel.addClass('highlight');
                        });

                        cy.on('click', function(e){
                            cy.elements().removeClass('deactivate');
                            cy.elements().removeClass('highlight');
                        });
                        
                        /* 
                            Need to have a more efficient design to prevent nodes from being dragged 
                            when the window isn't on its respective relationship type tab. 
                            Right now, there are areas that can't be grabbed, which makes the UI a little
                            frustrating...
                        */
                        cy.on('mousedown', 'node', function(e) {
                            let sel = e.target;
                            if(selectedRelationshipType === 'static' && sel.data().element_type === 'graph_2') {
                                sel.ungrabify();
                            } else if (selectedRelationshipType === 'class name' && sel.data().element_type === 'graph_1') {
                                sel.ungrabify();
                            } else {
                                sel.grabify();
                            }
                        })

                        cy.on('mouseup', 'node', function(e) {
                            cy.elements().grabify();
                        })

                    }}
                />}
                <TableContainer 
                component={Paper} 
                style={
                        {
                            width: '25%',
                            border: '1px solid grey',
                            'left': '74%',
                            'margin-top': '1%',
                            position: 'fixed',
                        }
                    } 
                size="small">
                    <Table aria-label="simple table">
                        <TableHead>
                        <TableRow>
                            <TableCell>Coupling & Cohesion (0-100%)</TableCell>
                            <TableCell align="center">Static Dependencies</TableCell>
                            <TableCell align="center">Class Name Dependencies</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                            {(selectedRelationshipType === 'static' || selectedRelationshipType === 'diff') && <TableRow key={'static'}>
                            <TableCell component="th" scope="row" style={{color:'#4169e1'}}>
                                {'STATIC'}
                                {(selectedRelationshipType === 'diff') 
                                && <AntSwitch onChange={(event, status) => {
                                    this.setState({static_checked: status});
                                }}/>}
                            </TableCell>
                            <TableCell align="center">{static_turboMQ[0].toFixed(2)}</TableCell>
                            <TableCell align="center">{static_turboMQ[1].toFixed(2)}</TableCell>
                            </TableRow>}
                            {(selectedRelationshipType === 'class name' || selectedRelationshipType === 'diff') &&
                            <TableRow key={'class name'}>
                            <TableCell component="th" scope="row" style={{color: '#e9253e'}}>
                                {'CLASS NAME'}
                                {(selectedRelationshipType === 'diff') && 
                                <AntSwitch onChange={(event, status) => {
                                    this.setState({class_name_checked: status});
                                }}/>}
                            </TableCell>
                            <TableCell align="center">{class_name_turboMQ[1].toFixed(2)}</TableCell>
                            <TableCell align="center">{class_name_turboMQ[0].toFixed(2)}</TableCell>
                            </TableRow>}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );
    }
};

export default DiffTool;
