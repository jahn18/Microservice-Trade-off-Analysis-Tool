import React from "react";
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import Utils from '../Components/Utils';
import AppendixLayout from '../Components/AppendixLayout'
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


cytoscape.use( nodeHtmlLabel );
cytoscape.use( cola );

class Decompositions extends React.Component {
    constructor(props) {
        super(props);

        let parsedGraph = Utils.parseJSONGraphFile(this.props.graphData, this.props.colors);
        let num_of_decompositions = 2;

        this.state = {
            nodes: parsedGraph[0],
            common_elements: parsedGraph[1],
            num_of_partitions: parsedGraph[2],
            relationshipTypes: parsedGraph[3],
            num_of_decompositions: 2,
            element_types: {
                partition: 'partition',
                appendix: 'appendix',
                diff_node: 'diff', 
                common_node: 'common',
                invisible_node: 'invisible'
            },
            openTable: false,
        }

        this.ref = React.createRef();
        this.getEdgeDependencies = this.getEdgeDependencies.bind(this);
    };

    componentDidMount() {
        const {
            nodes,
            num_of_partitions,
            element_types
        } = this.state; 

        let lastCustomRenderedState = storeProvider.getStore().getState().custom_graph;

        let cy = cytoscape({
            container: this.ref,
            elements: nodes,
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

        const edges = this._updateGraphEdges();

        if(!this._canLoadCustomStateGraph(lastCustomRenderedState)) {
            let options = {
                    num_of_versions: 2,
                    partitions_per_row: 3,
                    width: 100,
                    height: 100,
                    edges: edges
            };
            let layout = new AppendixLayout( cy, options );
            layout.run()

            cy.nodes().forEach((ele) => {
                if(ele.data('element_type') === element_types.invisible_node) {
                    ele.addClass('hide');
                }
            });
        } 
        else {
            // Load previous state for decomposition versions.
            cy.elements().remove();
            let lastRenderedState = storeProvider.getStore().getState().diff_graph;
            cy.json({elements:lastRenderedState.elements}).layout({name: 'preset'}).run();

            let customGraphState = storeProvider.getStore().getState().custom_graph.graph;
            let customGraphPartitions = [];
            for(let i = 0; i < customGraphState.elements.nodes.length; i++) {
                if(customGraphState.elements.nodes[i].data.element_type === element_types.partition) {
                    customGraphPartitions.push(customGraphState.elements.nodes[i]);
                }
            }
            
            // Adjust the partitions and their positions based on the positions of the partitions in the custom graph view. 
            for(let i in customGraphPartitions) {
                let partition = cy.getElementById(customGraphPartitions[i].data.id);
                partition.shift(
                    {
                        x: (partition.position().x > customGraphPartitions[i].position.x) ? 
                            -(partition.position().x - customGraphPartitions[i].position.x) :
                            (customGraphPartitions[i].position.x - partition.position().x),
                        y: (partition.position().y > customGraphPartitions[i].position.y) ? 
                            -(partition.position().y - customGraphPartitions[i].position.y) :
                            (customGraphPartitions[i].position.y - partition.position().y)
                    }
                )
            }
            cy.pan(customGraphState.pan);
            cy.zoom(customGraphState.zoom);
        }

        cy.nodeHtmlLabel([{
                query: 'node',
                halign: 'center',
                valign: 'center',
                halignBox: 'center',
                valignBox: 'center',
                tpl: (data) => {
                    let element = cy.getElementById(data.id);
                    if(data.element_type === element_types.appendix && data.showMinusSign === false) {
                        return `<h3 style="color:#808080; font-weight: bold; position: absolute; top: ${element.boundingBox().y1 - element.position().y + 5}; right: ${element.position().x - element.boundingBox().x1 - 45};">` 
                                + `V${data.version}` 
                                + '</h3>';
                    } 
                }
        }]);

        /*
            All event handlers when interacting with the graph. 
        */       
        cy.on('tap', 'node', (e) => this.onSelectedNode(e));
        cy.on('click', (e) => { 
            cy.elements().forEach((ele) => {
                ele.data().showMinusSign = false; 
                ele.removeClass('deactivate');
                ele.removeClass('highlight');
            });
        });
        cy.on('mouseover', 'node', (e) => this.preventNonVisibleNodeFromMoving(e));
        cy.on('mouseout', 'node', () => { cy.elements().grabify(); });

        this.setState({
            cy: cy,
            nodes: cy.nodes().forEach((ele) => {
                if(ele.data().element_type === element_types.appendix) {
                    switch(this.props.relationshipType) {
                        case 'static':
                            if(ele.data().version === 2) {
                                ele.children().addClass('hide');
                            } 
                            break;
                        case 'class name':
                            if(ele.data().version === 1) {
                                ele.children().addClass('hide');
                            } 
                            break;
                        default:
                    }
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
            element_types
        } = this.state;

        let renderNewGraph = [];
        cy.elements().forEach(ele => {
            if(ele.data().element_type !== element_types.invisible_node) {
                ele.removeClass('hide');
            }
        })

        switch(relationshipType) {
            case 'static':
                renderNewGraph = cy.elements().filter((ele) => {
                    return (ele.data('element_type') === element_types.appendix)
                }).forEach((appendix) => {
                    if(appendix.data().version === 2) {
                        appendix.children().addClass('hide');
                    }
                }).jsons();
                break; 
            case 'class name':
                renderNewGraph = cy.elements().filter((ele) => {
                    return (ele.data('element_type') === element_types.appendix)
                }).forEach((appendix) => {
                    if(appendix.data().version === 1) {
                        appendix.children().addClass('hide');
                    }
                }).jsons();
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
            case element_types.appendix:
                selected_elements = selected_elements.union(sel.children());
                break;
            case element_types.diff_node:
            case element_types.common_node:
                selected_elements = selected_elements.union(cy.getElementById(sel.data().partition)); 
                break;
            default: 
                selected_elements = cy.collection();
        }

        selected_elements = selected_elements.union(selected_elements.incomers()).union(selected_elements.outgoers());
        selected_elements.incomers().forEach((ele) => {
            selected_elements = selected_elements.union(cy.getElementById(ele.data('target')))
                                                .union(cy.getElementById(cy.getElementById(ele.data('target')).data('partition')))
                                                .union(cy.getElementById(ele.data('target')).parent());
        })
        selected_elements.outgoers().forEach((ele) => {
            selected_elements = selected_elements.union(cy.getElementById(ele.data('source')))
                                                .union(cy.getElementById(cy.getElementById(ele.data('source')).data('partition')))
                                                .union(cy.getElementById(ele.data('source')).parent());
        })
        
        let unselected_elements = cy.elements().difference(selected_elements);
        unselected_elements.forEach((ele) => {
            ele.data().showMinusSign = true; 
        });

        unselected_elements.addClass('deactivate');
        selected_elements.addClass('highlight');
    }

    preventNonVisibleNodeFromMoving(ele) {
        const {
            element_types
        } = this.state;

        const selectedRelationshipType = this.props.relationshipType;

        let sel = ele.target;
        if(selectedRelationshipType === 'static' && sel.parent().data('version') === 2) {
            sel.ungrabify();
        } else if (selectedRelationshipType === 'class name' && sel.parent().data('version') === 1) {
            sel.ungrabify();
        } else if (sel.data().element_type === element_types.invisible_node) {
            sel.ungrabify();
        } 
    }

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

    getEdgeDependencies(edge_graph, common_elements, graph_type, minimumEdgeWeight, color) {
        let edge_dependencies = [];
        for(let i = 0; i < edge_graph.length; i++) {
            let edge = edge_graph[i];
            if((this.findMaxEdgeWeight(edge_graph) * (1 - ( minimumEdgeWeight / 100 ))) < parseFloat(edge.weight)) {
                edge_dependencies.push({
                    group: 'edges', 
                    data: {
                        source: (common_elements.includes(edge.source)) ? `graph_0_${edge.source}` : `${graph_type}_${edge.source}`,
                        target: (common_elements.includes(edge.target)) ? `graph_0_${edge.target}` : `${graph_type}_${edge.target}`,
                        weight: parseFloat(edge.weight).toFixed(2),
                        element_type: 'edge',
                        color: color
                    } 
                }); 
            }
        }
        return edge_dependencies;
    };  

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
                    edges = [].concat(edges, this.getEdgeDependencies(
                        relationshipTypes[key].links, 
                        common_elements, 
                        'graph_1',
                        relationshipTypes[key].minimumEdgeWeight,
                        relationshipTypes[key].color)
                    );
                }
                break;
            case 'class name':
                for(let key in relationshipTypes) {
                    edges = [].concat(edges, this.getEdgeDependencies(
                        relationshipTypes[key].links, 
                        common_elements, 
                        'graph_2',
                        relationshipTypes[key].minimumEdgeWeight,
                        relationshipTypes[key].color));
                }
                break;
            case 'default':
        }

        return edges;
    }

    onFilterEdges() {
        let {cy} = this.state;
        cy.remove('edge');

        const edges = this._updateGraphEdges();
        cy.add(edges);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {
            cy
        } = this.state;
        // Check if the user has toggled the switch, which will add edges to the graph. 
        if(JSON.stringify(prevState.edges) !== JSON.stringify(this._updateGraphEdges())) {
            this.onFilterEdges();
            // Do not highlight any node if the toggles are pressed. 
            cy.elements().forEach((ele) => {
                ele.data().showMinusSign = false; 
                ele.removeClass('deactivate');
                ele.removeClass('highlight');
            });
        }

        if(prevProps.relationshipType !== this.props.relationshipType) {
            this.onRelationshipTypeChange(this.props.relationshipType);
        }
    }

    updateRedux() {
        const {
            cy,
            element_types
        } = this.state;

        cy.elements().forEach(ele => {
            if(ele.data().element_type !== element_types.invisible_node) {
                ele.removeClass('hide');
            }
        });
        cy.remove('edge');
        this.props.updateDiffGraph(cy.json());
    }

    componentWillUnmount() {
        this.updateRedux();
    }

    render() {
        const {
            relationshipTypes,
            num_of_partitions,
            openTable
        } = this.state; 

        let selectedRelationshipType = this.props.relationshipType; 
        let diffGraph = this.props.graphData.diff_graph;
        let decomposition = [];
        let relationshipTypeTable = []

        for(let i = 0; i < num_of_partitions; i++) {
            let partition = (selectedRelationshipType === 'static') ? 
                [].concat(diffGraph[i].common, diffGraph[i].graph_1_diff) : 
                [].concat(diffGraph[i].common, diffGraph[i].graph_2_diff);
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
                        <Slider
                            defaultValue={relationshipTypes[key].minimumEdgeWeight}
                            aria-labelledby="discrete-slider"
                            valueLabelDisplay="auto"
                            step={10}
                            marks={true}
                            min={0}
                            max={100}
                            style={{
                                width: '100%',
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
