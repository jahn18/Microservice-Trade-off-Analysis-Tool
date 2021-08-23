import React from "react";
import cytoscape from 'cytoscape';
import Utils from '../Components/Utils';
import coseBilkent from 'cytoscape-cose-bilkent';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Slider from '@material-ui/core/Slider';
import 'react-pro-sidebar/dist/css/styles.css';
import {connect} from 'react-redux';
import {updateDiffGraph} from '../Actions';
import storeProvider from '../storeProvider';


cytoscape.use( coseBilkent );

class Decompositions extends React.Component {
    constructor(props) {
        super(props);

        const element_types = {
            partition: 'partition',
            common_node: 'common',
        };

        this.state = {
            nodes: [],
            element_types: element_types,
            openTable: false,
        }
        this.ref = React.createRef();
    };

    componentDidMount() {
        let parsedGraph = Utils.parseDecompositionFromJSON(this.props.selectedTab, this.props.graphData);

        let cy = cytoscape({
            container: this.ref,
            elements: parsedGraph.decomposition,
            style: [
                {
                    'selector': 'node',
                    'style': {
                        'background-color': 'grey',
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
                        'font-weight': 'bold',
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
                        'width': 2,
                        'line-color': 'data(color)',
                        'target-arrow-color': 'data(color)',
                        'target-arrow-shape': 'vee',
                        'curve-style': 'bezier',
                        'arrow-scale': 2.25
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
                        'opacity': 0.75
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
                        'font-size': '25px'
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

        let layout = cy.layout({
            name: 'cose-bilkent',
            nodeDimensionsIncludeLabels: true,
            tilingPaddingVertical: 40,
            tilingPaddingHorizontal: 40,
            fit: true,
            animate: false
        });
        layout.run();

        const num_of_partitions_per_row = 5;
        this.adjustPartitionPositions(cy, parsedGraph.num_of_partitions, num_of_partitions_per_row)

        /*
            All event handlers when interacting with the graph. 
        */       
        cy.on('tap', 'node', (e) => {this.onSelectedNode(e)});
        cy.on('click', (e) => { 
            cy.elements().forEach((ele) => {
                ele.data().showMinusSign = false; 
                ele.removeClass('deactivate');
                ele.removeClass('highlight');
            });
        });
        cy.fit();

        // Load elements from redux
        let edgeRelationshipTypes;
        // let allGraphsSavedState;
        if(Object.keys(storeProvider.getStore().getState().diff_graph).length === 0) {
            edgeRelationshipTypes = Utils.getEdgeRelationshipTypes(this.props.graphData, this.props.colors);
            // allGraphsSavedState = storeProvider.getStore().getState().diff_graph.graph;
        } else {
            edgeRelationshipTypes = storeProvider.getStore().getState().diff_graph.edgeRelationshipTypes; 
            // allGraphsSavedState = {};
        }

        let relationshipTypeTable = [];

        Object.keys(edgeRelationshipTypes).map(
            (key, index) => {
                relationshipTypeTable.push(<TableRow>
                    <TableCell style={{'font-size': 'Normal'}}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                    </TableCell>
                    <TableCell align="left" style={{'font-size': 'Normal'}}>
                        {
                            Utils.calculateNormalizedTurboMQ(
                                edgeRelationshipTypes[key]["links"],
                                this.getDecomposition(this.props.selectedTab, this.props.graphData, parsedGraph.num_of_partitions)
                            ).toFixed(2)
                        }
                    </TableCell>
                    <TableCell>
                        <Slider
                            defaultValue={edgeRelationshipTypes[key].minimumEdgeWeight}
                            aria-labelledby="discrete-slider"
                            valueLabelDisplay="auto"
                            step={10}
                            marks={true}
                            min={0}
                            max={100}
                            style={{
                                width: '100%',
                                color: edgeRelationshipTypes[key].color
                            }}
                            onChange={(event, weight) => {
                                let edgeRelationshipTypesCopy = {...this.state.edgeRelationshipTypes};
                                edgeRelationshipTypesCopy[key].minimumEdgeWeight = weight; 
                                this.setState({edgeRelationshipTypes: edgeRelationshipTypesCopy});
                            }}
                        />
                    </TableCell>
                </TableRow>)
            }
        )

        this.setState({
            cy: cy,
            num_of_partitions: parsedGraph.num_of_partitions,
            edgeRelationshipTypes: edgeRelationshipTypes,
            relationshipTypeTable: relationshipTypeTable,
            // allGraphsSavedState: allGraphsSavedState
        })
    }

    getDecomposition(relationshipType, json_graph, num_of_partitions) {
        let decomposition = []
        for(let i = 0; i < num_of_partitions; i++) {
            decomposition.push(json_graph[relationshipType].decomposition[`partition${i}`].map((nodeInfo => {return nodeInfo.id})));
        }
        return decomposition;
    }

    adjustPartitionPositions(cy, num_of_partitions, partitions_per_row) {
        let previous_partition_position = {
            x: 0,
            y: 0,
            first_row_x1_pos: 0, 
            first_row_y2_pos: 0
        }

        for(let i = 0; i < num_of_partitions; i++ ) {
            let partition = cy.getElementById(`partition${i}`);
            if(i % partitions_per_row === 0) {
                partition.shift({
                    x: previous_partition_position.first_row_x1_pos - partition.boundingBox().x1,
                    y: previous_partition_position.first_row_y2_pos - partition.boundingBox().y1 + 100
                });
                previous_partition_position.first_row_x1_pos = partition.boundingBox().x1;
                previous_partition_position.first_row_y2_pos = partition.boundingBox().y2;
            } else {
                partition.shift({
                    x: previous_partition_position.x - partition.boundingBox().x1 + 100,
                    y: previous_partition_position.y - partition.boundingBox().y1
                });
            }
            previous_partition_position.x = partition.boundingBox().x2; 
            previous_partition_position.y = partition.boundingBox().y1; 
            if(partition.boundingBox().y2 > previous_partition_position.first_row_y2_pos) {
                previous_partition_position.first_row_y2_pos = partition.boundingBox().y2;
            }
        }

        cy.fit();
    }

    // When the user clicks on a tab it changes the relationship type.
    onRelationshipTypeChange(relationshipType, prevRelationshipType) {
        let {
            cy,
            edgeRelationshipTypes,
            // allGraphsSavedState
        } = this.state;

        let num_of_partitions;
        let nodes;
        // allGraphsSavedState[prevRelationshipType] = cy.nodes().jsons();

        // if (relationshipType in allGraphsSavedState) {
        //     nodes = allGraphsSavedState[relationshipType].elements;
        //     cy.json({elements: nodes}).layout({name: 'preset'}).run();
        // } else {
            let parsedDecomposition = Utils.parseDecompositionFromJSON(relationshipType, this.props.graphData);
            num_of_partitions = parsedDecomposition.num_of_partitions;
            nodes = parsedDecomposition.decomposition;
            cy.remove('node');
            cy.add(nodes)
            cy.layout({
                name: 'cose-bilkent',
                nodeDimensionsIncludeLabels: true,
                tilingPaddingVertical: 40,
                tilingPaddingHorizontal: 40,
                fit: true,
                animate: false
            }).run();
            this.adjustPartitionPositions(cy, parsedDecomposition.num_of_partitions, 5)
        // }
        cy.fit();

        let relationshipTypeTable = [];
        Object.keys(edgeRelationshipTypes).map(
            (key, index) => {
                relationshipTypeTable.push(<TableRow>
                    <TableCell style={{'font-size': 'Normal'}}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                    </TableCell>
                    <TableCell align="left" style={{'font-size': 'Normal'}}>
                        {
                            Utils.calculateNormalizedTurboMQ(
                                edgeRelationshipTypes[key]["links"],
                                this.getDecomposition(this.props.selectedTab, this.props.graphData, num_of_partitions)
                            ).toFixed(2)
                        }
                    </TableCell>
                    <TableCell>
                        <Slider
                            defaultValue={edgeRelationshipTypes[key].minimumEdgeWeight}
                            aria-labelledby="discrete-slider"
                            valueLabelDisplay="auto"
                            step={10}
                            marks={true}
                            min={0}
                            max={100}
                            style={{
                                width: '100%',
                                color: edgeRelationshipTypes[key].color
                            }}
                            onChange={(event, weight) => {
                                let edgeRelationshipTypesCopy = {...this.state.edgeRelationshipTypes};
                                edgeRelationshipTypesCopy[key].minimumEdgeWeight = weight; 
                                this.setState({edgeRelationshipTypes: edgeRelationshipTypesCopy});
                            }}
                        />
                    </TableCell>
                </TableRow>)
            }
        )

        this.setState({
            nodes: nodes,
            num_of_partitions: num_of_partitions,
            relationshipTypeTable: relationshipTypeTable,
            // allGraphsSavedState: allGraphsSavedState
        });
    }

    onSelectedNode(ele) { 
        const {
            cy,
            element_types
        } = this.state; 

        let sel = ele.target;
        let selected_elements = (sel.data('element_type') === element_types.partition) ? cy.collection(sel) :
                                cy.collection([sel, sel.parent()]); 

        switch(sel.data().element_type) {
            case element_types.partition:
                selected_elements = selected_elements.union(sel.children()).union(
                    cy.elements().filter((ele)=> {
                        return (ele.data().partition === sel.id());
                    }),
                )
                break;
            case element_types.common_node:
                selected_elements = selected_elements.union(cy.getElementById(sel.data().partition)); 
                break;
            default: 
                selected_elements = cy.collection();
        }

        selected_elements = selected_elements.union(selected_elements.incomers()).union(selected_elements.outgoers());
        selected_elements.incomers().forEach((ele) => {
            selected_elements = selected_elements.union(cy.getElementById(ele.data('target')))
                                                .union(cy.getElementById(ele.data('target')).parent());
        })
        selected_elements.outgoers().forEach((ele) => {
            selected_elements = selected_elements.union(cy.getElementById(ele.data('source')))
                                                .union(cy.getElementById(ele.data('source')).parent());
        })
        
        let unselected_elements = cy.elements().difference(selected_elements);
        unselected_elements.addClass('deactivate');
        selected_elements.addClass('highlight');
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {
            cy,
            edgeRelationshipTypes,
        } = this.state;

        // Check if the user has toggled the switch, which will add edges to the graph. 
        const edges = Utils.updateGraphEdges(edgeRelationshipTypes);
        if(JSON.stringify(prevState.edges) !== JSON.stringify(edges)) {
            cy.remove('edge')
            cy.add(edges);
            // Do not highlight any node if the toggles are pressed. 
            cy.elements().forEach((ele) => {
                ele.removeClass('deactivate');
                ele.removeClass('highlight');
            });
        }

        if(prevProps.selectedTab !== this.props.selectedTab) {
            this.onRelationshipTypeChange(this.props.selectedTab, prevProps.selectedTab);
        }
    }

    updateRedux() {
        const {
            cy,
            element_types,
            edgeRelationshipTypes,
        } = this.state;

        cy.elements().forEach(ele => {
            if(ele.data().element_type !== element_types.invisible_node) {
                ele.removeClass('hide');
            }
        });
        cy.remove('edge');
        this.props.updateDiffGraph({
            edgeRelationshipTypes: edgeRelationshipTypes,
            // graph: cy.json()
        });
    }

    componentWillUnmount() {
        this.updateRedux();
    }

    render() {
        const {
            openTable,
            relationshipTypeTable,
        } = this.state; 

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
                            'left': '69%',
                            'margin-top': '1%',
                            position: 'relative',
                        }
                    } 
                size="small">
                    <Table aria-label="simple table" size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell align="" colSpan={2} style={{'font-weight': 'bold'}}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => {this.setState({openTable: !openTable})}}
                                        styles={{margin: '0'}}
                                    >
                                        {openTable ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                    </IconButton>
                                    Coupling & Cohesion (0-100%) + Edge Filter
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                                <Collapse in={openTable} timeout="auto" unmountOnExit>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={2}>
                                                    Dependencies
                                                </TableCell>
                                                <TableCell colSpan={2}>
                                                    Edge Filter
                                                </TableCell>
                                            </TableRow>
                                            {relationshipTypeTable}
                                        </TableBody>
                                    </Table>
                                </Collapse>
                            </TableCell>
                        </TableRow>
                    </Table>
                </TableContainer>
            </div>
        );
    }
};

// export default Test;
export default connect(null, { updateDiffGraph })(Decompositions);
