import React from "react";
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
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

// import compoundDragAndDrop from 'cytoscape-compound-drag-and-drop';

// Cytoscape.use(compoundDragAndDrop);

class DiffTool extends React.Component {
    constructor(props) {
        super(props);

        let json_graph_data = this.props.location.state; 
        let diffGraph = json_graph_data.data.diff_graph; 
        let num_of_partitions = Object.keys(diffGraph).length;

        let default_nodes = []; 
        let common = [];
        for(let i = 0; i < num_of_partitions; i++) {
            common = [].concat(common, diffGraph[i].common);
            default_nodes = [].concat(default_nodes, this.setUpPartitions(diffGraph[i].graph_one_diff, i, 1, false));
        }
        
        this.state = {
            graphData: json_graph_data,
            diffGraph: diffGraph,
            selectedRelationshipType: 'static',
            // I have to change this when the two decompositions have a different number of partitions.
            num_of_partitions: num_of_partitions,
            data: {
                common_elements: common,
                edges: this.getEdgeDependencies(json_graph_data.data.static_graph.links, common),
                nodes: default_nodes
            }
        }

        this.changeRelationshipType = this.changeRelationshipType.bind(this);
        this.getEdgeDependencies = this.getEdgeDependencies.bind(this);
    };

    calculateNormalizedTurboMQ = (diffGraph, common_elements, graph_num) => {
        const {num_of_partitions, graphData} = this.state;
        let CF_0 = 0.0;
        let CF_1 = 0.0;
        for(let i = 0; i < num_of_partitions; i++) {
            /* 
                Later change this so that graph_num is the actual number so it is "graph_${graph_num}_diff" when we have
                multiple partitions. 
            */
            let partition_classes = (graph_num == 1) ? [].concat(diffGraph[i].common, diffGraph[i].graph_one_diff) : 
                                        [].concat(diffGraph[i].common, diffGraph[i].graph_two_diff); 
            let internal_edges = 0.0;
            let external_edges = 0.0; 
            let edge_graph = graphData.data.static_graph.links;
            for(let j = 0; j < edge_graph.length; j++) {
                let edge = edge_graph[j];
                if(partition_classes.includes(edge.source) && partition_classes.includes(edge.target)) {
                    internal_edges += parseFloat(edge.weight);
                } else if (partition_classes.includes(edge.source) || partition_classes.includes(edge.target)) {
                    external_edges += parseFloat(edge.weight); 
                }
            }
            CF_0 += (internal_edges != 0) ? ((2*internal_edges) / ( (2*internal_edges) + external_edges)) : 0; 

            internal_edges = 0.0;
            external_edges = 0.0; 
            edge_graph = graphData.data.class_name_graph.links;
            for(let j = 0; j < edge_graph.length; j++) {
                let edge = edge_graph[j];
                if(partition_classes.includes(edge.source) && partition_classes.includes(edge.target)) {
                    internal_edges += parseFloat(edge.weight);
                } else if (partition_classes.includes(edge.source) || partition_classes.includes(edge.target)) {
                    external_edges += parseFloat(edge.weight); 
                }
            }
            CF_1 += (internal_edges != 0) ? ((2*internal_edges) / ( (2*internal_edges) + external_edges)) : 0; 
        }
        return [(CF_0 / num_of_partitions) * 100, (CF_1 / num_of_partitions) * 100];
    };

    // When the user clicks on a tab it changes the relationship type.
    changeRelationshipType = (common_elements, relationshipType) => {
        let edge_graph = [];
        let node_graph = [];
        const {graphData, num_of_partitions, diffGraph} = this.state;

        switch(relationshipType) {
            case 'static':
                let static_graph = graphData.data.static_graph.links;
                edge_graph = this.getEdgeDependencies(static_graph, common_elements);
                for(let i = 0; i < num_of_partitions; i++) {
                    node_graph = [].concat(node_graph, this.setUpPartitions(diffGraph[i].graph_one_diff, i, 1, false));
                }
                break; 
            case 'class name':
                let class_name_graph = graphData.data.class_name_graph.links;
                edge_graph = this.getEdgeDependencies(class_name_graph, common_elements);
                for(let i = 0; i < num_of_partitions; i++) {
                    node_graph = [].concat(node_graph, this.setUpPartitions(diffGraph[i].graph_two_diff, i, 2, false));
                }
                break;
            default: 
                for(let i = 0; i < num_of_partitions; i++) {
                    node_graph = [].concat(node_graph, this.setUpPartitions(diffGraph[i].graph_one_diff, i, 1, false), 
                                    this.setUpPartitions(diffGraph[i].graph_two_diff, i, 2, false));
                }
                break;
        }
        this.setState({data: {edges: edge_graph, nodes: node_graph}});
    };

    getEdgeDependencies = (graph, common_elements) => {
        let edge_dependencies = [];
        for(let i = 0; i < graph.length; i++) {
            let edge = graph[i];
            edge_dependencies.push({
                group: 'edges', 
                data: {
                    source: (common_elements.includes(edge.source)) ? `graph_0_${edge.source}` : `graph_1_${edge.source}`,
                    target: (common_elements.includes(edge.target)) ? `graph_0_${edge.target}` : `graph_1_${edge.target}`,
                    weight: edge.weight
                } 
            }); 
        }
        return edge_dependencies;
    };  

    setUpPartitions = (graph_nodes, partition_num, graph_num, isCoreElement) => {  
        let color;
        let element_list = [];

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

        return element_list;
    };

    // highlightEdge = () => {
        
    // }

    render() {
        const {num_of_partitions, diffGraph} = this.state;
        const {edges, nodes} = this.state.data;

        var elements = [].concat(nodes, edges);
        let common_elements = [];

        for(let i = 0; i < num_of_partitions; i++) {
            common_elements = [].concat(common_elements, diffGraph[i].common);
            elements.push({
                data: {
                    id: `partition${i}`,
                    background_color: 'white',
                    colored: false
                } 
            },
            {
                data: {
                    id: `core${i}`, 
                    parent: `partition${i}`,
                    background_color: 'white',
                    colored: true
                } 
            });
            elements = [].concat(elements, this.setUpPartitions(diffGraph[i].common, i, 0, true));
        }

        let static_turboMQ = this.calculateNormalizedTurboMQ(diffGraph, common_elements, 1);
        let class_name_turboMQ = this.calculateNormalizedTurboMQ(diffGraph, common_elements, 2);

        return (
            <div>
                <Paper square>
                    <Tabs
                    value={this.state.selectedRelationshipType}
                    textColor="primary"
                    indicatorColor="primary"
                    onChange={(event, newValue) => {
                        this.setState({selectedRelationshipType: newValue});
                        this.changeRelationshipType(common_elements, newValue);
                    }}
                    >
                    <Tab label="static" value="static"/>
                    <Tab label="class name" value="class name"/>
                    <Tab label="diff" value="diff"/>
                    <Tab label="Custom" disabled />
                    </Tabs>
                </Paper>
                <CytoscapeComponent
                    elements={elements} 
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
                                'opacity': 0.05
                            }
                        },
                        {
                            'selector': 'edge.highlight',
                            'style': {
                                'mid-target-arrow-color': 'black',
                                'width': '3',
                                'label': 'data(weight)',
                                'text-outline-width': '3',
                                'text-outline-color': 'white',
                            }
                        },
                        { 
                            'selector': 'edge.deactivate',
                            'style': {
                                'opacity': 0.1
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
                        
                        cy.on('tap', 'node', function(e) {
                            var sel = e.target; 
                            let selected_elements = sel.outgoers().union(sel.incomers()); 
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

                        cy.collection(partitions).layout({
                            name: 'cose',
                            randomize: false
                        }).run();

                    }}
                />
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
                            <TableRow key={'static'}>
                            <TableCell component="th" scope="row">
                                {'STATIC'}
                            </TableCell>
                            <TableCell align="center">{static_turboMQ[0].toFixed(2)}</TableCell>
                            <TableCell align="center">{static_turboMQ[1].toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow key={'class name'}>
                            <TableCell component="th" scope="row">
                                {'CLASS NAME'}
                            </TableCell>
                            <TableCell align="center">{class_name_turboMQ[1].toFixed(2)}</TableCell>
                            <TableCell align="center">{class_name_turboMQ[0].toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );
    }
};

export default DiffTool;