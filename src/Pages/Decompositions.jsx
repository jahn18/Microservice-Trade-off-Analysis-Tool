import React, {useRef} from "react";
import cytoscape from 'cytoscape';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import AntSwitch from '../Components/Switch';
import 'react-pro-sidebar/dist/css/styles.css';
import {connect} from 'react-redux';
import {updateDiffGraph} from '../Actions';
import storeProvider from '../storeProvider';


class Decompositions extends React.Component {
    constructor(props) {
        super(props);

        let diffGraph = this.props.graphData.diff_graph; 
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

        core_elements = [].concat(core_elements, default_nodes);

        this.state = {
            num_of_partitions: num_of_partitions,
            nodes: core_elements,
            common_elements: common,
            static_checked: false,
            class_name_checked: false
        }

        this.ref = React.createRef();
        this.getEdgeDependencies = this.getEdgeDependencies.bind(this);
    };

    componentDidMount() {
        const {
            nodes,
            num_of_partitions,
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
                        'opacity': 0.0
                    }
                },
                {
                    'selector': 'edge.hide',
                    'style': {
                        'display': 'none'
                    }
                }
            ],
        });

        let partitions = [];
        for(let i = 0; i < num_of_partitions; i++) {
            partitions.push(cy.elements().getElementById(`partition${i}`));
        }

        let lastCustomRenderedState = storeProvider.getStore().getState().custom_graph;
        if(this._canLoadCustomStateGraph(lastCustomRenderedState)) {
            let previous_graph_positions = this._getLastRenderedNodePositions(lastCustomRenderedState.graph);
            for(let i = 0; i < num_of_partitions; i++) {
                cy.elements().getElementById(`core${i}`).position(
                    {
                        x: previous_graph_positions[`partition${i}`].x,
                        y: previous_graph_positions[`partition${i}`].y
                    }
                );
            }
        } else {
            cy.collection(partitions).layout({
                name: 'cose',
                fit: true,
                randomize: true
            }).run();
        }
        
        for(let i = 0; i < num_of_partitions; i++) {
            this._renderCocentricLayout(
                cy.collection(partitions[i].children())
                    .union(cy.elements().getElementById(`core${i}`).children()),
                cy.elements().getElementById(`core${i}`).position()
            );
        }

        if(this._canLoadCustomStateGraph(lastCustomRenderedState)) {
            cy.pan(lastCustomRenderedState.graph.pan);
            cy.zoom(lastCustomRenderedState.graph.zoom);
        }

        /*
            All event handlers when interacting with the graph. 
        */       
        cy.on('tap', 'node', (e) => this.onSelectedNode(e));
        cy.on('click', (e) => { cy.elements().removeClass('deactivate').removeClass('highlight'); });
        cy.on('mousedown', 'node', (e) => this.preventNonVisibleNodeFromMoving(e));
        cy.on('mouseup', 'node', (e) => { cy.elements().grabify(); });

        this.setState({
            cy: cy,
            nodes: cy.nodes().forEach((ele) => {
                switch(this.props.relationshipType) {
                    case 'static': 
                        if(ele.data().element_type === 'graph_2') {
                            if(ele.group() === 'nodes') {
                                ele.addClass('hide');
                            } 
                        }
                        break;
                    case 'class name':
                        if(ele.data().element_type === 'graph_1') {
                            if(ele.group() === 'nodes') {
                                ele.addClass('hide');
                            } 
                        }
                        break;
                    default:
                }
            }).jsons(),
        })
    }

    _getLastRenderedNodePositions(lastRenderedGraph) {
        let previous_graph_positions = {};
        for(let node_i in lastRenderedGraph.elements.nodes) {
            previous_graph_positions[lastRenderedGraph.elements.nodes[node_i].data.id] = lastRenderedGraph.elements.nodes[node_i].position;
        }
        return previous_graph_positions;
    }

    _canLoadCustomStateGraph(lastCustomRenderedState) {
        if(Object.keys(lastCustomRenderedState).length === 0) {
            return false;
        }
        return true;
    }

    _renderCocentricLayout(elementCollection, centerElementPosition) {
        let w = window.innerWidth;

        elementCollection.layout({
            name: 'concentric',
            spacingFactor: 3.5,
            boundingBox: {
                x1: centerElementPosition.x - w/2,
                x2: centerElementPosition.x + w/2,
                y1: centerElementPosition.y - w/2,
                y2: centerElementPosition.y + w/2 
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
            }, 
            minNodeSpacing: 10,
            equidistant: false, 
        }).run();
    }

    // Do this in a different place.
    getEdgeDependencies(graph, common_elements, graph_type) {
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

    // Do this is a different place as well. 
    setUpPartitions(graph_nodes, partition_num, graph_num, isCoreElement) {  
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

    // When the user clicks on a tab it changes the relationship type.
    onRelationshipTypeChange(relationshipType) {
        const {
            cy
        } = this.state;
        this.setState({nodes: this._updateGraphNodes(relationshipType)});
    }

    _updateGraphNodes(relationshipType) {
        const {
            cy,
        } = this.state;

        let renderNewGraph = [];
        cy.elements().removeClass('hide');

        switch(relationshipType) {
            case 'static':
                renderNewGraph = cy.nodes().forEach((ele) => {
                    if(ele.data().element_type === 'graph_2') {
                        if(ele.group() === 'nodes') {
                            ele.addClass('hide');
                        } 
                    }
                }).jsons()
                break; 
            case 'class name':
                renderNewGraph = cy.nodes().forEach((ele) => {
                    if(ele.data().element_type === 'graph_1') {
                        if(ele.group() === 'nodes') {
                            ele.addClass('hide');
                        } 
                    }
                }).jsons()
                break;
            default: 
                renderNewGraph = cy.nodes().jsons();
                break;
        }
        return renderNewGraph;
    }

    onSelectedNode(ele) { 
        const {
            cy,
            num_of_partitions
        } = this.state; 

        let sel = ele.target;

        let selected_elements = sel.outgoers().union(sel.incomers()); 

        if(sel.data().element_type === 'graph_1') {
            selected_elements = selected_elements.union(cy.elements().getElementById(`graph_2_${sel.data().label}`));
        } else if (sel.data().element_type === 'graph_2') {
            selected_elements = selected_elements.union(cy.elements().getElementById(`graph_1_${sel.data().label}`));
        } 

        for(let i = 0; i < num_of_partitions; i++) {
            selected_elements = selected_elements.union(cy.elements().getElementById(`partition${i}`))
            selected_elements = selected_elements.union(cy.elements().getElementById(`core${i}`))
        }

        let unselected_elements = cy.elements().not(sel).difference(selected_elements);

        unselected_elements.addClass('deactivate');
        selected_elements.addClass('highlight');
        sel.addClass('highlight');
    }

    preventNonVisibleNodeFromMoving(ele) {
        const selectedRelationshipType = this.props.relationshipType;

        let sel = ele.target;
        if(selectedRelationshipType === 'static' && sel.data().element_type === 'graph_2') {
            sel.ungrabify();
        } else if (selectedRelationshipType === 'class name' && sel.data().element_type === 'graph_1') {
            sel.ungrabify();
        } else {
            sel.grabify();
        }
    }

    onToggleSwitch() {
        let {cy} = this.state;
        cy.remove('edge');

        const edges = this._updateGraphEdges();
        cy.add(edges);
    }

    _updateGraphEdges() {
        const {
            class_name_checked, 
            static_checked,
            common_elements,
        } = this.state;

        let selectedRelationshipType = this.props.relationshipType;
        let class_name_graph = this.props.graphData.class_name_graph.links;
        let static_graph = this.props.graphData.static_graph.links;
        let edges = []

        switch(selectedRelationshipType) {
            case 'static':
                if(class_name_checked) {
                    edges = this.getEdgeDependencies(class_name_graph, common_elements, 'graph_1');
                }
                if(static_checked) {
                    edges = [].concat(edges, this.getEdgeDependencies(static_graph, common_elements, 'graph_1'))
                }
                break;
            case 'class name':
                if(class_name_checked) {
                    edges = this.getEdgeDependencies(class_name_graph, common_elements, 'graph_2');
                }
                if(static_checked) {
                    edges = [].concat(edges, this.getEdgeDependencies(static_graph, common_elements, 'graph_2'))
                }
                break;
            case 'default':
        }

        return edges;
    }

    calculateNormalizedTurboMQ = (diffGraph, graph_num) => {
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
            let edge_graph = this.props.graphData.static_graph.links;
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
            edge_graph = this.props.graphData.class_name_graph.links;
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

    componentDidUpdate(prevProps, prevState, snapshot) {
        // Check if the user has toggled the switch, which will add edges to the graph. 
        if(JSON.stringify(prevState.edges) !== JSON.stringify(this._updateGraphEdges())) {
            this.onToggleSwitch();
        }

        if(prevProps.relationshipType !== this.props.relationshipType) {
            this.onRelationshipTypeChange(this.props.relationshipType);
        }
    }

    updateRedux() {
        const {
            cy
        } = this.state;

        this.props.updateDiffGraph(cy.json());
    }

    componentWillUnmount() {
        this.updateRedux();
    }

    render() {
        const {
            cy,
        } = this.state; 

        let selectedRelationshipType = this.props.relationshipType; 
        let diffGraph = this.props.graphData.diff_graph; 
        let static_turboMQ = this.calculateNormalizedTurboMQ(diffGraph, 1);
        let class_name_turboMQ = this.calculateNormalizedTurboMQ(diffGraph, 2);

        return (
            <div>
                <div className="graph-container">
                    <div style={{height: '100%', width: '100%', position: 'fixed'}} ref={ref => (this.ref = ref)}></div>
                </div>
                <TableContainer 
                component={Paper} 
                style={
                        {
                            width: '30%',
                            border: '1px solid grey',
                            'left': '68%',
                            'margin-top': '1%',
                            position: 'fixed',
                        }
                    } 
                size="small">
                    <Table aria-label="simple table" size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell align="" colSpan={3} style={{'font-weight': 'bold'}}>
                                    Coupling & Cohesion (0-100%)
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell style={{'font-size': 'small'}}>Decomposition</TableCell>
                                <TableCell style={{'font-size': 'small'}}>
                                    Static Dependencies
                                    {(selectedRelationshipType !== 'diff') 
                                    && <AntSwitch onChange={(event, status) => {
                                        this.setState({static_checked: status});
                                    }}/>}
                                </TableCell>
                                <TableCell style={{'font-size': 'small'}}>
                                    Class Name Dependencies
                                    {(selectedRelationshipType !== 'diff') && 
                                    <AntSwitch onChange={(event, status) => {
                                        this.setState({class_name_checked: status});
                                    }}/>}
                                </TableCell>
                            </TableRow>
                            {(selectedRelationshipType === 'static' || 
                            selectedRelationshipType === 'diff') && 
                            <TableRow key={'static'}>
                            <TableCell component="th" scope="row" style={{color:'#4169e1'}}>
                                {'VER 1 (by STATIC)'}
                            </TableCell>
                            <TableCell align="center">{static_turboMQ[0].toFixed(2)}</TableCell>
                            <TableCell align="center">{static_turboMQ[1].toFixed(2)}</TableCell>
                            </TableRow>}
                            {(selectedRelationshipType === 'class name' 
                            || selectedRelationshipType === 'diff') &&
                            <TableRow key={'class name'}>
                            <TableCell component="th" scope="row" style={{color: '#e9253e'}}>
                                {'VER 2 (by CLASS NAME)'}
                            </TableCell>
                            <TableCell align="center">{class_name_turboMQ[0].toFixed(2)}</TableCell>
                            <TableCell align="center">{class_name_turboMQ[1].toFixed(2)}</TableCell>
                            </TableRow>}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );
    }
};

// export default Test;
export default connect(null, { updateDiffGraph })(Decompositions);
