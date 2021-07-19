import React, {createRef} from "react";
import cytoscape from 'cytoscape';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import edgehandles from 'cytoscape-edgehandles';
import automove from 'cytoscape-automove';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import Metrics from '../Metrics/Metrics'
import storeProvider from './../../storeProvider';
import {updateCustomGraph} from './../../Actions';
import {connect} from 'react-redux';

import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';


cytoscape.use( nodeHtmlLabel );
cytoscape.use( automove );
cytoscape.use( edgehandles );

class CustomGraph extends React.Component {
    constructor(props) {
        super(props);

        let diffGraph = this.props.graphData.diff_graph; 
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
                    },
                }] 
            );
        }

        this.state = {
            num_of_partitions: num_of_partitions,
            nodes: default_nodes,
            common_elements: common,
            static_metrics: [0, 0],
            class_name_metrics: [0, 0],
            evolutionaryHistory: []
        }

        this.ref = React.createRef();
    };


    componentDidMount() {
        const {
            nodes,
            num_of_partitions
        } = this.state;

        const cy = cytoscape({
            container: this.ref,
            elements: nodes,
            style: [
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
                        'background-color': "#e9e9e9"
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
                        'opacity': 0.05
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
            ],
        });

        let partitions = [];
        let lastRenderedState = storeProvider.getStore().getState().custom_graph;

        // If the custom graph hasn't been loaded yet then load the positions of the current diff-graph. 
        if(Object.keys(lastRenderedState).length === 0) {
            lastRenderedState = storeProvider.getStore().getState().diff_graph;
        } else {
            cy.json(lastRenderedState);
        }

        let lastRenderedNodePositions = this._getLastRenderedNodePositions(lastRenderedState);

        cy.nodes().positions((node, i) => {
            return {
                x: lastRenderedNodePositions[node.id()].x,
                y: lastRenderedNodePositions[node.id()].y,
            };
        });

        cy.layout({
            name: 'preset',
            positions: function(node) {
                return (lastRenderedNodePositions[node.id()]);   
            },
            fit: true
        }).run();

        /*
            Removes strange red nodes that were added because of the edge handles functionality. 
        */
        let collection = cy.elements().filter((ele) => {
            return (ele.data().element_type === undefined);
        });
        cy.remove(collection);

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
                spacingFactor: 4,
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
                } 
            }).run();
        }

        cy.pan(lastRenderedState.pan);
        cy.zoom(lastRenderedState.zoom);
        
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

        /*
            All event handlers.
        */
        cy.on('ehcomplete', (event, sourceNode, targetNode, addedEles) => this.onMovedNode(sourceNode, targetNode, addedEles));
        cy.on('mouseover', 'node', (e) => {
            let sel = e.target;
            if(!partitions.includes(sel.id()) && sel.data().element_type !== 'common*' && sel.data().element_type !== 'common') {
                eh.enableDrawMode();
            }
        })
        cy.on('mouseout', 'node', (e) => { eh.disableDrawMode(); })
        cy.on('tap', 'node', (e) => this.onClickedNode(e)); 
        cy.on('click', (e) => this.onUnclickNode(e));
        cy.on('add', 'node', () => this._calculateMetrics());

        this.setState({
            cy: cy,
            partitions: partitions
        });
    }

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

    _getLastRenderedNodePositions(lastRenderedGraph) {
        let previous_graph_positions = {};
        for(let node_i in lastRenderedGraph.elements.nodes) {
            previous_graph_positions[lastRenderedGraph.elements.nodes[node_i].data.id] = lastRenderedGraph.elements.nodes[node_i].position;
        }
        return previous_graph_positions;
    }

    onClickedNode(ele) {
        let {
            cy
        } = this.state; 

        let sel = ele.target; 
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
    }

    onUnclickNode(ele) {
        const {
            cy
        } = this.state;
        cy.elements().forEach((ele) => {
            ele.removeClass('deactivate')
            if(ele.data().element_type === 'common*') {
                if(ele.data().prev_element_type !== 'common') {
                    cy.elements().getElementById(`graph_1_${ele.id()}`).addClass('hide');
                    cy.elements().getElementById(`graph_2_${ele.id()}`).addClass('hide');
                } 
            }
            ele.data().hide = false;
        })
        cy.remove('edge');
    }

    onHoverOverTableRow(movedElements) {
        let {
            cy
        } = this.state; 

        let sel = cy.elements().getElementById(movedElements[0].data().label); 
        let selected_elements = cy.collection().union(sel).union(cy.elements().getElementById(sel.data().partition)); 

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

        let unselected_elements = cy.elements().not(sel).difference(selected_elements);
        unselected_elements.forEach((ele) => {
            if(ele.data().element_type !== 'graph_1' && ele.data().element_type !== 'graph_2') {
                ele.data().hide = true; 
            }
        })
        
        unselected_elements.addClass('deactivate');
        selected_elements.removeClass('hide');
    }

    onMovedNode(sourceNode, targetNode, addedEles) { 
        const {
            cy,
            partitions,
            evolutionaryHistory
        } = this.state; 

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

            const npos = cy.elements().getElementById(targetNode.id()).position();
            const target_pos = {
                x: npos.x, 
                y: npos.y
            }; 

            let w = window.innerWidth;

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
            });

            cy.elements().getElementById(targetNode.id()).children().union(
                cy.elements().filter((ele)=> {
                    return ele.data().partition === targetNode.id();
                })).layout({
                name: 'concentric',
                spacingFactor: 3.5,
                boundingBox: {
                    x1: target_pos.x - w/2,
                    x2: target_pos.x + w/2,
                    y1: target_pos.y - w/2,
                    y2: target_pos.y + w/2 
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
                minNodeSpacing: 10,
                equidistant: false, 
            }).run();

            // Should also hide common elements if they get moved. 
            if(sourceNode.data().element_type === 'common') {
                cy.remove(sourceNode);
            } else {
                cy.elements().getElementById(`graph_1_${sourceNode.data().label}`).addClass('hide');
                cy.elements().getElementById(`graph_2_${sourceNode.data().label}`).addClass('hide');
            }

            evolutionaryHistory.unshift([sourceNode, targetNode]);
        } 
        cy.remove(addedEles);
    }

    _calculateMetrics() {
        const {
            cy,
            num_of_partitions
        } = this.state;

        let movedNodes = []; 
        let partitions = {}
        let updatedGraph = cy.nodes().jsons();

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

        let static_edge_graph = this.props.graphData.static_graph.links;
        let class_name_edge_graph = this.props.graphData.class_name_graph.links;

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

        static_TurboMQ_value[0] = (static_TurboMQ_value[0] / num_of_partitions) * 100;
        static_TurboMQ_value[1] = (static_TurboMQ_value[1] / num_of_partitions) * 100;
        class_name_TurboMQ_value[0] = (class_name_TurboMQ_value[0] / num_of_partitions) * 100;
        class_name_TurboMQ_value[1] = (class_name_TurboMQ_value[1] / num_of_partitions) * 100;

        let static_g = static_TurboMQ_value;
        let class_name_g = class_name_TurboMQ_value;
        this.setState({
            static_metrics: static_g,
            class_name_metrics: class_name_g
        })
    }

    updateRedux() {
        let {
            cy
        } = this.state;

        this.props.updateCustomGraph(cy.json());
    }

    componentWillUnmount() {
        this.updateRedux();
    }

    render() {
        const {
            static_metrics,
            class_name_metrics,
            cy,
            evolutionaryHistory
        } = this.state;

        const evolutionaryHistoryList = evolutionaryHistory.map(
            moved_element => 
            <TableRow 
                hover={true} 
                onMouseOver={(event) => {
                    this.onHoverOverTableRow(moved_element);
                }}
                onMouseOut={(event) => {
                    this.onUnclickNode();
                }}
            >
                <TableCell>
                    <Checkbox
                        // //   checked={isItemSelected}
                        //   inputProps={{ 'aria-labelledby': labelId }}
                    />
                    {`Moved class '${moved_element[0].data().label}' to ${moved_element[1].id()}`}
                </TableCell>
            </TableRow>
        )

        return (
            <div>
                <div className="custom-graph-container">
                    <div style={{height: '100%', width: '100%', position: 'fixed'}} ref={ref => (this.ref = ref)}></div>
                </div>
                <div className="table-container" style={{position: 'absolute', left: '68%', width: '100%', 'margin-top': '1%'}}>
                    <Metrics static={static_metrics} classname={class_name_metrics}/>
                    <TableContainer 
                    component={Paper} 
                    style={
                            {
                                width: '30%',
                                border: '1px solid grey',
                                'margin-top': '10px',
                                maxHeight: '300px'
                            }
                        } 
                    >
                        <Table stickyHeader aria-label="simple table" size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="" colSpan={3} style={{'font-weight': 'bold'}}>
                                        Evolutionary History
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {evolutionaryHistoryList}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </div>
        );
    }
};

export default connect(null, { updateCustomGraph })(CustomGraph);
