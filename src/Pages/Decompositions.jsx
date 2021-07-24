import React, {useRef} from "react";
import cytoscape from 'cytoscape';
import Utils from './../Components/Utils'
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
import Slider from '@material-ui/core/Slider';
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
            default_nodes.push(
                {
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
                },
                {
                    data: {
                        id: `invisible_node${i}`,
                        label: `invisible_node${i}`,
                        background_color: 'grey',
                        colored: false,
                        element_type: 'invisible',
                        showMinusSign: false, 
                        partition: `partition${i}`,
                        parent: `core${i}`
                    },
                } 
            )
        }

        let colors = ['#ff7f50', '#9b59b6', '#9fe2bf', '#40e0d0', '#6495ed', '#c4c4c4'];
        let relationshipTypes = {};
        let i = 0;

        for (const [key, value] of Object.entries(this.props.graphData)) {
            if("links" in this.props.graphData[key]) {
                relationshipTypes[key] = {
                    checked: false,
                    links: value["links"],
                    minimumEdgeWeight: 0,
                    color: colors[i]
                }
                i++;
            }
        }
        
        this.state = {
            num_of_partitions: num_of_partitions,
            nodes: default_nodes,
            common_elements: common,
            relationshipTypes: relationshipTypes
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
                        'width': 0.85,
                        // 'line-color': '#c4c4c4',
                        'line-color': 'data(color)',
                        'target-arrow-color': 'data(color)',
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

        cy.nodes().forEach((ele) => {
            if(ele.data().element_type === 'invisible') {
                ele.addClass('hide');
            }
        });

        let partitions = [];
        for(let i = 0; i < num_of_partitions; i++) {
            partitions.push(cy.elements().getElementById(`partition${i}`));
        }
        let previous_graph_positions = null;

        let lastCustomRenderedState = storeProvider.getStore().getState().custom_graph;
        if(this._canLoadCustomStateGraph(lastCustomRenderedState)) {
            previous_graph_positions = this._getLastRenderedNodePositions(lastCustomRenderedState.graph);
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
            if(!this._canLoadCustomStateGraph(lastCustomRenderedState)) {
                this._renderCocentricLayout(
                    cy.collection(partitions[i].children())
                        .union(cy.elements().getElementById(`core${i}`).children()),
                    cy.elements().getElementById(`core${i}`).position()
                );
            } else {
                this._renderCocentricLayout(
                    cy.collection(partitions[i].children())
                        .union(cy.elements().getElementById(`core${i}`).children()),
                    {
                        x: previous_graph_positions[`partition${i}`].x,
                        y: previous_graph_positions[`partition${i}`].y
                    }
                );
            }
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
        cy.on('mouseover', 'node', (e) => this.preventNonVisibleNodeFromMoving(e));
        cy.on('mouseout', 'node', () => { cy.elements().grabify(); });

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
                    case "invisible":
                        return 3;
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
    getEdgeDependencies(graph, common_elements, graph_type, minimumEdgeWeight, color) {
        let edge_dependencies = [];
        for(let i = 0; i < graph.length; i++) {
            let edge = graph[i];
            if(minimumEdgeWeight <= parseFloat(edge.weight)) {
                edge_dependencies.push({
                    group: 'edges', 
                    data: {
                        source: (common_elements.includes(edge.source)) ? `graph_0_${edge.source}` : `${graph_type}_${edge.source}`,
                        target: (common_elements.includes(edge.target)) ? `graph_0_${edge.target}` : `${graph_type}_${edge.target}`,
                        weight: parseFloat(edge.weight).toFixed(2),
                        element_type: graph_type,
                        color: color
                    } 
                }); 
            }
        }
        return edge_dependencies;
    };  

    findMaxEdgeWeight(edge_graph) {
        let max_edge_weight = 0;

        for(let i = 0; i < edge_graph.length; i++) {
            let edge = edge_graph[i];
            if(parseFloat(edge.weight) > max_edge_weight) {
                max_edge_weight = parseFloat(edge.weight);
            }
        }
        return max_edge_weight.toFixed(0);
    }

    // Do this is a different place as well. 
    setUpPartitions(graph_nodes, partition_num, graph_num, isCoreElement) {  
        let color = 'grey';
        let element_list = [];

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
        cy.elements().forEach(ele => {
            if(ele.data().element_type !== 'invisible') {
                ele.removeClass('hide');
            }
        })

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
        } else if (sel.data().element_type === 'invisible') {
            sel.ungrabify();
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
            relationshipTypes,
            common_elements
        } = this.state;

        let selectedRelationshipType = this.props.relationshipType;
        let edges = []

        switch(selectedRelationshipType) {
            case 'static':
                for(let key in relationshipTypes) {
                    if(relationshipTypes[key].checked) {
                        edges = [].concat(edges, this.getEdgeDependencies(
                            relationshipTypes[key].links, 
                            common_elements, 
                            'graph_1',
                            relationshipTypes[key].minimumEdgeWeight,
                            relationshipTypes[key].color)
                        );
                    }
                }
                break;
            case 'class name':
                for(let key in relationshipTypes) {
                    if(relationshipTypes[key].checked) {
                        edges = [].concat(edges, this.getEdgeDependencies(
                            relationshipTypes[key].links, 
                            common_elements, 
                            'graph_2',
                            relationshipTypes[key].minimumEdgeWeight,
                            relationshipTypes[key].color));
                    }
                }
                break;
            case 'default':
        }

        return edges;
    }

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
            relationshipTypes,
            num_of_partitions
        } = this.state; 

        let selectedRelationshipType = this.props.relationshipType; 
        let diffGraph = this.props.graphData.diff_graph;
        let decomposition = [];
        let relationshipTypeTable = []

        for(let i = 0; i < num_of_partitions; i++) {
            let partition = (selectedRelationshipType === 'static') ? 
                [].concat(diffGraph[i].common, diffGraph[i].graph_one_diff) : 
                [].concat(diffGraph[i].common, diffGraph[i].graph_two_diff);
            decomposition.push(partition);
        }

        Object.keys(relationshipTypes).map(
            (key, index) => {
                relationshipTypeTable.push(<TableRow>
                    <TableCell style={{'font-size': 'small'}}>
                        {key}
                    </TableCell>
                    <TableCell align="left">
                        {
                            Utils.calculateNormalizedTurboMQ(
                                relationshipTypes[key]["links"],
                                decomposition
                            ).toFixed(2)
                        }
                    </TableCell>
                    <TableCell>
                        <AntSwitch 
                            onChange={(event, status) => {
                                let relationshipTypesCopy = {...this.state.relationshipTypes};
                                relationshipTypesCopy[key].checked = status; 
                                this.setState({relationshipTypes: relationshipTypesCopy});
                            }}
                            color={relationshipTypes[key].color}
                        />
                    </TableCell>
                    <TableCell>
                        <Slider
                            defaultValue={0}
                            aria-labelledby="discrete-slider"
                            valueLabelDisplay="auto"
                            step={this.findMaxEdgeWeight(relationshipTypes[key].links) / 10}
                            marks={true}
                            min={0}
                            max={this.findMaxEdgeWeight(relationshipTypes[key].links)}
                            style={{
                                width: '25vh',
                                color: relationshipTypes[key].color
                            }}
                            onChange={(event, weight) => {
                                let relationshipTypesCopy = {...this.state.relationshipTypes};
                                relationshipTypesCopy[key].minimumEdgeWeight = weight; 
                                this.setState({relationshipTypes: relationshipTypesCopy});
                            }}
                        />
                    </TableCell>
                </TableRow>)
            }
        )

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
                                <TableCell align="" colSpan={4} style={{'font-weight': 'bold'}}>
                                    Coupling & Cohesion (0-100%)
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={3}>
                                    Dependencies
                                </TableCell>
                                <TableCell>
                                    Minimum Edge Weight
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {relationshipTypeTable}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );
    }
};

// export default Test;
export default connect(null, { updateDiffGraph })(Decompositions);
