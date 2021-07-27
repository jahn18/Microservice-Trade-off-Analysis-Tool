import React, {useRef} from "react";
import cytoscape from 'cytoscape';
import Utils from '../Components/Utils'
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

        let parsedGraph = Utils.parseGraphJSONFile(this.props.graphData, false);

        this.state = {
            nodes: parsedGraph[0],
            common_elements: parsedGraph[1],
            num_of_partitions: parsedGraph[2],
            relationshipTypes: parsedGraph[3]
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
                        'label': 'data(label)',
                        'min-zoomed-font-size': '15px', 
                        'font-size': '25px'
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
                                return "#f9f9f9";
                            else
                                return "white";
                        },
                        'border-style': function(node) {
                            if (node.data("colored"))
                                return "solid";
                            else
                                return "double";
                        },
                        'min-width': function(node) {
                            return node.data('width');
                        },
                        'min-height': function(node) {
                            return node.data('height');
                        }
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

        for(let i = 0; i < num_of_partitions; i++) {
            let previous_pos_x = 0; 
            let previous_pos_y = 0;   
            let ele = cy.getElementById(`partition${i}`);
            ele.children().layout({
                name: 'grid',
                boundingBox: {
                    x1: ele.position().x - ele.data().width/2,
                    x2: ele.position().x + ele.data().width/2,
                    y1: ele.position().y - ele.data().height/2,
                    y2: ele.position().y + ele.data().height/2 
                },
                condense: false
            }).run();

            for(let j = 1; j <= 2; j++) {
                ele = cy.getElementById(`diff${i}_graph_${j}`);
                ele.children().layout({
                    name: 'grid',
                    boundingBox: {
                        x1: ele.position().x - ele.data().width/2,
                        x2: ele.position().x + ele.data().width/2,
                        y1: ele.position().y - ele.data().height/2,
                        y2: ele.position().y + ele.data().height/2 
                    }
                }).run();

                let ele_partition = cy.getElementById(`partition${i}`);

                ele.position({
                    x: ele_partition.position().x,
                    y: ele_partition.position().y 
                })

                ele.shift({
                    x: (j === 1) ? (ele_partition.position().x - ele.boundingBox().x2): 
                                    (previous_pos_x - ele.boundingBox().x1),
                    y: (j === 1) ? ele_partition.boundingBox().h / 1.25: previous_pos_y - ele.boundingBox().y1,
                })
                previous_pos_x = ele.boundingBox().x2;
                previous_pos_y = ele.boundingBox().y1;
            }
        }
        
        // let previous_graph_positions = null;
        // let lastCustomRenderedState = storeProvider.getStore().getState().custom_graph;
        // if(this._canLoadCustomStateGraph(lastCustomRenderedState)) {
        //     previous_graph_positions = this._getLastRenderedNodePositions(lastCustomRenderedState.graph);
        //     for(let i = 0; i < num_of_partitions; i++) {
        //         cy.elements().getElementById(`core${i}`).position(
        //             {
        //                 x: previous_graph_positions[`partition${i}`].x,
        //                 y: previous_graph_positions[`partition${i}`].y
        //             }
        //         );
        //     }
        // } else {
        //     cy.collection(partitions).layout({
        //         name: 'cose',
        //         fit: true,
        //         randomize: true
        //     }).run();
        // }

        // for(let i = 0; i < num_of_partitions; i++) {
        //     if(!this._canLoadCustomStateGraph(lastCustomRenderedState)) {
        //         this._renderCocentricLayout(
        //             cy.collection(partitions[i].children())
        //                 .union(cy.elements().getElementById(`core${i}`).children()),
        //             cy.elements().getElementById(`core${i}`).position()
        //         );
        //     } else {
        //         this._renderCocentricLayout(
        //             cy.collection(partitions[i].children())
        //                 .union(cy.elements().getElementById(`core${i}`).children()),
        //             {
        //                 x: previous_graph_positions[`partition${i}`].x,
        //                 y: previous_graph_positions[`partition${i}`].y
        //             }
        //         );
        //     }
        // }

        // if(this._canLoadCustomStateGraph(lastCustomRenderedState)) {
        //     cy.pan(lastCustomRenderedState.graph.pan);
        //     cy.zoom(lastCustomRenderedState.graph.zoom);
        // }

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
            selected_elements = selected_elements.union(cy.elements().getElementById(`diff${i}_graph_1`))
            selected_elements = selected_elements.union(cy.elements().getElementById(`diff${i}_graph_2`))
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
                    <TableCell style={{'font-size': 'Normal'}}>
                        {key}
                    </TableCell>
                    <TableCell align="left" style={{'font-size': 'Normal'}}>
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
