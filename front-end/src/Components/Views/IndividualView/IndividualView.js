import React from "react";
import cytoscape from 'cytoscape';
import Utils from '../../../utils';
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
import {updateDiffGraph} from '../../../Actions';
import storeProvider from '../../../storeProvider';
import Button from '@material-ui/core/Button';


cytoscape.use( coseBilkent );

class IndividualView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nodes: [],
            openTable: false,
        }
        this.ref = React.createRef();
    };

    componentDidMount() {
        let cy = cytoscape({
            container: this.ref,
            elements: this.props.decomposition.getCytoscapeData(),
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
                        'opacity': 0.50
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
        this.adjustPartitionPositions(
            cy, 
            this.props.decomposition.getNumOfPartitions(), //parsedGraph.num_of_partitions, 
            num_of_partitions_per_row
        )

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

        cy.fit(cy.elements(), 100);

        // Load elements from redux
        let edgeRelationshipTypes;
        if(Object.keys(storeProvider.getStore().getState().diff_graph).length === 0) {
            edgeRelationshipTypes =  {...this.props.relationshipTypeEdges};
        } else {
            edgeRelationshipTypes = storeProvider.getStore().getState().diff_graph.edgeRelationshipTypes; 
            cy.viewport(storeProvider.getStore().getState().diff_graph.viewports[this.props.selectedTab])
        }

        
        this.setState({
            cy: cy,
            edgeRelationshipTypes: edgeRelationshipTypes,
        })
    }

    adjustPartitionPositions(cy, numPartitions, partitions_per_row) {
        let previous_partition_position = {
            x: 0,
            y: 0,
            first_row_x1_pos: 0, 
            first_row_y2_pos: 0
        }
        
        for(let i = 0; i < numPartitions; i++ ) {
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
    }

    // When the user clicks on a tab it changes the relationship type.
    onRelationshipTypeChange() {
        let {
            cy,
            edgeRelationshipTypes,
        } = this.state;

        cy.remove('node');
        cy.add(this.props.decomposition.getCytoscapeData())
        cy.layout({
            name: 'cose-bilkent',
            nodeDimensionsIncludeLabels: true,
            tilingPaddingVertical: 40,
            tilingPaddingHorizontal: 40,
            fit: true,
            animate: false
        }).run();
        this.adjustPartitionPositions(cy, this.props.decomposition.getNumOfPartitions(), 5)
        cy.fit();

        // This updates the relationship type table and keeps it consistent when the user switches between tabs with edges toggled. 
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
                                this.props.decomposition.getClassNodeList(true)
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
            relationshipTypeTable: relationshipTypeTable,
        });
    }

    onSelectedNode(ele) { 
        const {
            cy,
        } = this.state; 

        let sel = ele.target;
        let selectedElements = (sel.isParent()) ? cy.collection([sel]).union(sel.children()) : cy.collection([sel, sel.parent()]);
        selectedElements = selectedElements
            .union(
                cy.collection(selectedElements.incomers().map((ele) => (ele.isEdge()) ? ele : [ele, ele.parent()]).flat())
            ).union(
                cy.collection(selectedElements.outgoers().map((ele) => (ele.isEdge()) ? ele : [ele, ele.parent()]).flat())
            );
        
        selectedElements.addClass('highlight');
        cy.elements().difference(selectedElements).addClass('deactivate');
    }

    shouldComponentUpdate(nextProps, nextState) {
        if(this.props.selectedTab !== nextProps.selectedTab) {
            this.updateRedux();
        }
        return true;
    }

    componentDidUpdate(prevProps, prevState) {
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
            cy.batch(() => {cy.elements().removeClass("deactivate").removeClass("highlight")});
        }

        if(prevProps.selectedTab !== this.props.selectedTab) {
            this.onRelationshipTypeChange();
            cy.fit(cy.elements(), 100);
            cy.viewport(storeProvider.getStore().getState().diff_graph.viewports[this.props.selectedTab])
        }
    }

    updateRedux() {
        const {
            cy,
            edgeRelationshipTypes,
        } = this.state;

        // cy.remove('edge');
        this.props.updateDiffGraph({
            edgeRelationshipTypes: edgeRelationshipTypes,
            viewports: {
                ...storeProvider.getStore().getState().diff_graph.viewports,
                [this.props.selectedTab]: {
                    zoom: cy.zoom(),
                    pan: cy.pan()
                }
            }
        });
    }

    componentWillUnmount() {
        this.updateRedux();
    }

    render() {
        const {
            openTable,
            cy,
            edgeRelationshipTypes,
        } = this.state; 

        let relationshipTypeTable = [];

        if(cy) {
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
                                    this.props.decomposition.getClassNodeList(true)
                                ).toFixed(2)
                            }
                        </TableCell>
                        <TableCell>
                            <Slider controlled
                                value={edgeRelationshipTypes[key].minimumEdgeWeight}
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
        }

        return (
            <div>
                <div className="graph-container">
                    <div style={{height: '100%', width: '100%', position: 'fixed'}} ref={ref => (this.ref = ref)}></div>
                </div>
                { (this.props.selectedTab === 'weighted-view') && 
                <Button variant="outlined" color="primary"
                    style={{
                        position: 'fixed',
                        'margin-top': '-0.25%',
                        'left': '1%'
                    }}
                    onClick={() => {
                        this.props.onChange(true);
                    }}
                >
                    New Weights 
                </Button>} 
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
                >
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
                                    Metrics + Edge Filter
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                                <Collapse in={openTable} timeout="auto" unmountOnExit>
                                    <Table size="small">
                                        <TableHead size="large">
                                            <TableRow>
                                                <TableCell colSpan={4} style={{'font-weight': '550', height: '40px'}}>
                                                    Coupling & Cohesion (0-100%)
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={1}>
                                                    Dependencies
                                                </TableCell>
                                                <TableCell colSpan={1}>
                                                    Value
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
export default connect(null, { updateDiffGraph })(IndividualView);