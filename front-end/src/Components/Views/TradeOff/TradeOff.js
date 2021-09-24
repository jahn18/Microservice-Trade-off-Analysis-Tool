import React from "react";
import cytoscape from 'cytoscape';
import Utils from '../../Utils';
import compoundDragAndDrop from '../../DragAndDrop';
import AppendixLayout from '../../AppendixLayout';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import storeProvider from '../../../storeProvider';
import {updateTradeOffGraph} from '../../../Actions';
import {connect} from 'react-redux';
import Paper from "@material-ui/core/Paper";
import Collapse from '@material-ui/core/Collapse';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import 'react-pro-sidebar/dist/css/styles.css';
import Tooltip from '@material-ui/core/Tooltip';
import UndoIcon from '@material-ui/icons/Undo';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import cxtmenu from 'cytoscape-cxtmenu';


cytoscape.use( cxtmenu );
cytoscape.use( nodeHtmlLabel );

class TradeOffGraph extends React.Component {
    constructor(props) {
        super(props);

        const selectedDecompositions = this.props.selectedDecompositions.sort((v1, v2) => (v1[1] > v2[1]) ? 1 : -1);
        let parsedDiffGraph = Utils.matchDecompositions(selectedDecompositions[0][0], selectedDecompositions[1][0], this.props.graphData);
        let parsedGraph = Utils.parseDiffGraphFile(
            parsedDiffGraph, 
            [this.props.colors.relationship_type_colors[selectedDecompositions[0][1]], 
            this.props.colors.relationship_type_colors[selectedDecompositions[1][1]]]
        );

        this.state = {
            savePreviousState: true,
            selectedDecompositions: selectedDecompositions,
            nodes: parsedGraph.elements,
            common_elements: parsedGraph.common_elements,
            num_of_partitions: parsedGraph.num_of_partitions,
            relationshipTypeTable: [],
            decomposition_attributes: {
                num_of_decompositions: 2,
                colors: this.props.colors.relationship_type_colors
            },
            changeHistory: {
                table: [],
                nodeMoveHistory: {}
            },
            elementsSelectedOnTable: [],
            removed_node: null,
            tableBodyRenderKey: 0,
            element_types: {
                partition: 'partition',
                appendix: 'appendix',
                diff_node: 'diff', 
                common_node: 'common',
                invisible_node: 'invisible',
                moved_node: 'common*',
                unobserved_node: 'unobserved_node'
            },
            openTable: {
                metrics: false,
                changeHistory: false,
                edgeFilter: false,
            },
        }

        this.ref = React.createRef();
    };

    componentDidMount() {
        const {
            nodes,
            num_of_partitions,
            changeHistory,
            decomposition_attributes,
            element_types,
            selectedDecompositions,
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
                        'min-zoomed-font-size': '10px',
                        'font-size': '25px'
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
                        'font-weight': 'bold',
                        'text-halign': 'center',
                        'background-color': function(node) {
                            if (node.data("colored"))
                                return "#f9f9f9";
                                // return "white";
                            else
                                return "white";
                        },
                        'border-style': function(node) {
                            if (node.data("colored"))
                                return "solid";
                            else
                                return "double";
                        },
                        'border-color': function(node) {
                            if(node.data('element_type') === element_types.appendix) {
                                if(node.data('version') === 1) {
                                    return decomposition_attributes.colors[selectedDecompositions[0][1]];
                                } else {
                                    return decomposition_attributes.colors[selectedDecompositions[1][1]];
                                }
                            } else {
                                return '#cdcdcd';
                            }
                        },
                        'min-width': function(node) {
                            return node.data('width');
                        },
                        'min-height': function(node) {
                            return node.data('height');
                        },
                    }
                },
                {
                    'selector': 'edge',
                    'style': {
                        'width': 2,
                        'line-style': 'dashed',
                        'line-color': 'data(color)',
                        'target-arrow-color': 'data(color)',
                        'target-arrow-shape': 'vee',
                        'curve-style': 'bezier',
                        'arrow-scale': 2.25
                    }
                },
                {
                    'selector': 'edge.dependency',
                    'style': {
                        'line-style': 'solid',
                        'label': 'data(weight)',
                        'font-size': '25px',
                        'text-outline-width': '3.5',
                        'text-outline-color': 'white',
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
                        'opacity': 0.50
                    }
                },
                {
                    selector: '.cdnd-drop-target',
                    style: {
                      'border-color': 'red',
                      'border-style': 'dashed'
                    }
                }
            ],
        });

        let lastRenderedState;
        let loadedChangeHistory;
        let relationshipTypes = storeProvider.getStore().getState().diff_graph.edgeRelationshipTypes;
        
        // If the custom graph hasn't been loaded yet then load the positions of the current diff-graph. 
        if(storeProvider.getStore().getState().trade_off_graph.graph.length === 0) {
            loadedChangeHistory = changeHistory;
            let options = {
                num_of_versions: 2,
                partitions_per_row: 5,
                width: 100,
                height: 100,
            };
            let layout = new AppendixLayout( cy, options );
            layout.run()

            cy.nodes().forEach((ele) => {
                if(ele.data('element_type') === element_types.invisible_node) {
                    ele.addClass('hide');
                }
            });
        } else {
            loadedChangeHistory = storeProvider.getStore().getState().trade_off_graph.changeHistory;
            cy.elements().remove();
            lastRenderedState = storeProvider.getStore().getState().trade_off_graph.graph;
            let principle_elements = [];
            for(let i = 0; i < lastRenderedState.elements.nodes.length; i++) {
                if(lastRenderedState.elements.nodes[i].data.element_type === element_types.appendix 
                    || lastRenderedState.elements.nodes[i].data.element_type === element_types.partition) {
                        principle_elements.push(lastRenderedState.elements.nodes[i]);
                }
            }
            cy.add(principle_elements);
            cy.json({elements:lastRenderedState.elements}).layout({name: 'preset'}).run();

            cy.pan(storeProvider.getStore().getState().trade_off_graph.graph.pan);
            cy.zoom(storeProvider.getStore().getState().trade_off_graph.graph.zoom);
        }

        // This must be rendered first before the menu or else the DOM elements will not be configured correctly.
        cy.nodeHtmlLabel([{
                query: 'node',
                halign: 'center',
                valign: 'center',
                halignBox: 'center',
                valignBox: 'center',
                tpl: (data) => {
                    let element = cy.getElementById(data.id);
                    if(data.element_type === element_types.moved_node || data.isMovedGhostNode === true) {
                        return '<h1 style="color:white;">' + '+' + '</h1>';
                    } else if (!this._isNodeCommonBetweenDecompositions(data.element_type) && data.showMinusSign === true) {
                        return '<h1 style="color:white;">' + '-' + '</h1>';
                    } else if(data.element_type === element_types.appendix) { // add the labels to the appendices
                        const color = (data.showMinusSign) ? this.props.colors.relationship_type_colors[selectedDecompositions[data.version - 1][1]] + '27' : this.props.colors.relationship_type_colors[selectedDecompositions[data.version - 1][1]]; 
                        return `<div> <h3 style="color:${color};font-weight: bold; position: absolute; top: ${element.boundingBox().y1 - element.position().y + 5}; right: ${element.position().x - element.boundingBox().x1 - 45};">` 
                                + `V${this.props.selectedDecompositions[data.version - 1][1] + 1}` 
                                + '</h3> </div>';
                    } 
                }
        }]);

        cy.cxtmenu({
            selector: 'node[element_type != "partition"][element_type != "appendix"]',
            openMenuEvents: 'cxttapstart taphold',
            commands: [
                {
                    content: 'Show Edges',
                    contentStyle: {
                        position: 'absolute'
                    },
                    select: (node) => this.showEdgeDependencies(node),
                    enabled: true
                },
                {
                    content: 'Show Relative Node',
                    contentStyle: {
                        position: 'absolute'
                    },
                    select: (node) => this.onClickedNode(node),
                    enabled: (node) => {
                        return node.data('element_type') === "diff"},
                }
            ]
        });

        let cdnd = new compoundDragAndDrop(
            cy, 
            {
                padding: 10, 
                grabbedNode: node => true, 
                dropTarget: node => node.data('element_type') === element_types.partition,
                onMovedNode: (event, sourceNode, targetNode) => this.onMovedNode(event, sourceNode, targetNode)
            }
        );
        cdnd.run();

        /*
            All event handlers.
        */
        cy.on('tap', () => this.onUnhighlightNodes());
        cy.on('mouseover', 'node', (e) => this.disableHandleAndInteraction(e.target));
        cy.on('mouseout', 'node', (e) => { 
            if(e.target.data().element_type !== undefined) {
                e.target.grabify();
            }
        });

        let relationshipTypeTable = [];

        Object.keys(relationshipTypes).map(
            (key, index) => {
                relationshipTypeTable.push(<TableRow>
                    <TableCell style={{'font-size': 'Normal'}}>
                        {key}
                    </TableCell>
                    {
                        [...Array(decomposition_attributes.num_of_decompositions)].map((x, i) => 
                            <TableCell>
                                {
                                    Utils.calculateNormalizedTurboMQ(
                                        relationshipTypes[key]["links"],
                                        this._getCurrentDecomposition(i + 1, cy)
                                    ).toFixed(2)
                                }
                            </TableCell>
                        )
                    }
                </TableRow>)
            }
        )

        this.setState({
            cy: cy,
            partitions: this.getAllPartitionIds(num_of_partitions),
            relationshipTypes: relationshipTypes,
            changeHistory: loadedChangeHistory,
            relationshipTypeTable: relationshipTypeTable
        });
    }

    showEdgeDependencies(targetNode) {
        const {
            cy,
            element_types,
            selectedDecompositions,
            relationshipTypes,
            common_elements
        } = this.state;

        // Clear the selected nodes when right clicking on a new node
        this.onUnhighlightNodes();
        targetNode = cy.getElementById(targetNode.data('realNodeId'))
        Utils.showCustomGraphEdges(cy, [selectedDecompositions[0][0], selectedDecompositions[1][0]], relationshipTypes, common_elements, targetNode);
        let selected_elements = cy.collection(targetNode);
        selected_elements = selected_elements.union(cy.elements().filter((ele) => {
            return ele.data('element_type') === element_types.invisible_node;
        }));
        selected_elements = selected_elements.union(targetNode.incomers()).union(targetNode.outgoers());
        targetNode.incomers().forEach((ele) => {
            selected_elements = selected_elements.union(cy.getElementById(ele.data('source')))
                                                .union(cy.getElementById(cy.getElementById(ele.data('source')).data('partition')))
                                                .union(cy.getElementById(ele.data('source')).parent());
        });
        targetNode.outgoers().forEach((ele) => {
            selected_elements = selected_elements.union(cy.getElementById(ele.data('target')))
                                                .union(cy.getElementById(cy.getElementById(ele.data('target')).data('partition')))
                                                .union(cy.getElementById(ele.data('target')).parent());
        });
        let unselected_elements = cy.elements().difference(selected_elements);
        unselected_elements.forEach((ele) => {
            if(this._isNodeCommonBetweenDecompositions(ele.data().element_type)) {
                ele.data().showMinusSign = true; 
            }
        });
        unselected_elements.addClass('deactivate');
    }

    getAllPartitionIds(num_of_partitions) {
        let partitions = [];
        for(let i = 0; i < num_of_partitions; i++) {
            partitions.push(`partition${i}`);
        }
        return partitions; 
    }

    disableHandleAndInteraction(element, handler = null) {
        const {
            element_types
        } = this.state;

        if(element.data('element_type') === 'invisible' || element.data('element_type') === element_types.appendix) {
            element.ungrabify(); 
        } 
    } 

    _getLastRenderedNodePositions(lastRenderedGraph) {
        let previous_graph_positions = {};
        for(let node_i in lastRenderedGraph.elements.nodes) {
            let element_name = lastRenderedGraph.elements.nodes[node_i].data.id;
            previous_graph_positions[element_name] = lastRenderedGraph.elements.nodes[node_i].position;
        }
        return previous_graph_positions;
    }

    _isNodeCommonBetweenDecompositions(element_type) {
        const {
            element_types
        } = this.state;

        if(element_type === element_types.diff_node) {
            return false;
        }
        return true;
    }

    onClickedNode(sel) {
        if(sel.data().element_type === undefined) {
            return;
        }

        const {
            cy,
            decomposition_attributes,
            element_types,
            selectedDecompositions
        } = this.state; 

        // Get the actual node, not just the ghost node. 
        sel = cy.getElementById(sel.data('realNodeId'));
        let selected_elements = cy.elements().filter((ele) => {
            return ele.data('element_type') === element_types.invisible_node;
        }); 

        switch(sel.data().element_type) {
            case element_types.diff_node:
                if(!sel.data('showMinusSign')) {
                    for(let i = 1; i <= decomposition_attributes.num_of_decompositions; i++) {
                        let node = cy.getElementById(`graph_${i}_${sel.data().label}`)
                        selected_elements = selected_elements.union(
                            cy.collection([node, cy.getElementById(node.data().partition), node.parent()])
                        );
                    }
                    break;
                }
            case element_types.moved_node:
                // REFACTOR
                if(sel.data('prev_element_type') !== element_types.common_node || sel.data('element_type') === element_types.diff_node) {
                    sel = cy.getElementById(sel.data('label'));
                    for(let i = 1; i <= decomposition_attributes.num_of_decompositions; i++) {
                        let graph_node = cy.getElementById(`graph_${i}_${sel.id()}`)
                        selected_elements = selected_elements.union(
                            cy.collection([graph_node, cy.getElementById(graph_node.data('partition')), graph_node.parent()])
                        );
                        cy.add([{
                            group: 'edges',
                            data: {
                                target: sel.id(),
                                source: `graph_${i}_${sel.id()}`,
                                color: this.props.colors.relationship_type_colors[selectedDecompositions[i - 1][1]]
                            }
                        }])
                    }
                } else {
                    selected_elements = selected_elements.union(cy.getElementById(sel.data().prev_partition)).union(sel.parent());
                    cy.add([{
                        group: 'edges',
                        data: {
                            target: sel.id(),
                            source: sel.data().prev_partition,
                            color: 'grey'
                        }
                    }]);
                }
                selected_elements = selected_elements.union(sel.parent())
                break;
            default: 
                selected_elements = cy.elements();
        }

        selected_elements = selected_elements.union(sel);

        let unselected_elements = cy.elements().difference(selected_elements);
        unselected_elements.forEach((ele) => {
            if(this._isNodeCommonBetweenDecompositions(ele.data().element_type)) {
                ele.data().showMinusSign = true; 
            }
        })
        unselected_elements.addClass('deactivate');
    }

    onUnhighlightNodes() {
        const {
            cy
        } = this.state;

        cy.elements().forEach((ele) => {
            ele.removeClass('deactivate');
            if(this._isNodeCommonBetweenDecompositions(ele.data().element_type)) {
                ele.data().showMinusSign = false;
            }
        })
        cy.remove('edge');
    }

    highlightSelectedElements(changeHistoryRowElementInfo) {
        let {
            cy,
            decomposition_attributes,
            element_types,
            elementsSelectedOnTable,
            selectedDecompositions
        } = this.state; 

        let selectedElementsInChangedHistory = elementsSelectedOnTable.slice();
        if(changeHistoryRowElementInfo !== null && !selectedElementsInChangedHistory.includes(changeHistoryRowElementInfo)) {
            selectedElementsInChangedHistory.push(changeHistoryRowElementInfo);
        }
        let selected_elements = cy.collection();

        for(let movedElementInfo of selectedElementsInChangedHistory) {
            let sel = cy.getElementById(movedElementInfo.movedNode.data('label'));
            if(this._checkifFirstMoveForClass(movedElementInfo)) {
                selected_elements = selected_elements.union(sel).union(movedElementInfo.targetPartition); 
                if(sel.data('prev_element_type') === element_types.diff_node) {
                    for(let i = 1; i <= decomposition_attributes.num_of_decompositions; i++) {
                        let graph_node = cy.getElementById(`graph_${i}_${sel.id()}`)
                        selected_elements = selected_elements.union(
                            cy.collection([graph_node, cy.getElementById(graph_node.data().partition), graph_node.parent()])
                        );
                        cy.add([{
                            group: 'edges',
                            data: {
                                target: sel.id(),
                                source: `graph_${i}_${sel.id()}`,
                                color: this.props.colors.relationship_type_colors[selectedDecompositions[i - 1][1]]
                            }
                        }])
                    }
                } else {
                    selected_elements = selected_elements.union(cy.getElementById(sel.data('prev_partition')));
                    cy.add([{
                        group: 'edges',
                        data: {
                            target: sel.id(),
                            source: sel.data('prev_partition'),
                            color: 'grey'
                        }
                    }]);
                }
            } else {
                selected_elements = selected_elements.union(
                                            movedElementInfo.movedNode
                                        ).union(
                                            movedElementInfo.targetPartition
                                        ).union(
                                            cy.getElementById(movedElementInfo.movedNode.data('partition'))
                                        ); 
                cy.add({
                    group: 'edges',
                    data: {
                        target: movedElementInfo.movedNode.id(),
                        source: movedElementInfo.movedNode.data('partition'),
                        color: 'grey'
                    }
                });
            }
        }

        selected_elements = selected_elements.union(cy.elements().filter((ele) => {
            return ele.data('element_type') === element_types.invisible_node;
        }));

        let unselected_elements = cy.elements().difference(selected_elements);
        unselected_elements.forEach((ele) => {
            if(this._isNodeCommonBetweenDecompositions(ele.data('element_type'))) {
                ele.data().showMinusSign = true; 
            }
        })
        unselected_elements.addClass('deactivate');
    }

    updateChangeHistory(sourceNode, targetNode) {
        const {
            cy
        } = this.state;

        // Get the node's position relative to the center position of the partition 
        let partition = cy.getElementById(sourceNode.data('partition'));
        const relative_center_position = {
            x: sourceNode.position('x') - partition.position('x'),
            y: sourceNode.position('y') - partition.position('y'),
        }

        this.setState((prevState) => ({
            changeHistory: {
                table: [...prevState.changeHistory.table, 
                    {
                        movedNode: sourceNode, 
                        targetPartition: targetNode,
                        moveNumber: !(sourceNode.data().label in prevState.changeHistory.nodeMoveHistory) ? 0 : prevState.changeHistory.nodeMoveHistory[sourceNode.data().label].length
                    }
                ],
                nodeMoveHistory: !(sourceNode.data().label in prevState.changeHistory.nodeMoveHistory) ? ({
                    ...prevState.changeHistory.nodeMoveHistory,
                    [sourceNode.data().label]: [{
                        movedNode: sourceNode, 
                        targetPartition: targetNode, 
                        relative_position_in_partition: relative_center_position,
                        moveNumber: 0
                    }]
                }) : ({
                    ...prevState.changeHistory.nodeMoveHistory,
                    [sourceNode.data().label]: [...prevState.changeHistory.nodeMoveHistory[sourceNode.data().label], 
                        {
                            movedNode: sourceNode, 
                            targetPartition: targetNode, 
                            relative_position_in_partition: relative_center_position,
                            moveNumber: prevState.changeHistory.nodeMoveHistory[sourceNode.data().label].length
                        }
                    ]
                })
            }
        }));
    }

    onMovedNode(position, sourceNode, targetNode) { 
        const {
            cy,
            partitions,
            decomposition_attributes,
            element_types,
        } = this.state; 

        if(sourceNode.data().showMinusSign === false && 
            partitions.includes(targetNode.id()) &&
            !sourceNode.hasClass('deactivate') &&
            sourceNode.data().element_type !== element_types.partition) 
            {

            let prev_element = sourceNode.data().element_type;
            let prev_partition = sourceNode.data().partition; 

            if(sourceNode.data().element_type === element_types.moved_node) {
                cy.remove(sourceNode);
                prev_element = sourceNode.data().prev_element_type;
                prev_partition = sourceNode.data().prev_partition;
            } 
                
            cy.add({
                group: 'nodes',
                data: {
                    id: sourceNode.data().label,
                    label: sourceNode.data().label,
                    parent: targetNode.id(),
                    element_type: element_types.moved_node,
                    prev_element_type: prev_element,
                    background_color: 'grey',
                    partition: targetNode.id(),
                    prev_partition: prev_partition,
                    showMinusSign: false
                },
                position: position 
            });

            // Should also hide common elements if they get moved. 
            if(this._isNodeCommonBetweenDecompositions(sourceNode.data().element_type)) {
                cy.remove(sourceNode);
                let common_nodes = sourceNode.parent().children().filter((ele) => {
                        return ele.data('element_type') === element_types.common_node;
                });
                let appendices = sourceNode.parent().children().filter((ele) => {
                        return ele.data('element_type') === element_types.appendix;
                });
                // If there are no common nodes remaining in the partition after the node has been moved, then add an invisible node. 
                if(common_nodes.length === 0) {
                    cy.add([{
                        data: {
                            id: `invisible_node_${sourceNode.parent().id()}`,
                            label: `invisible_node${sourceNode.parent().id().match('[0-9]')}`,
                            background_color: 'grey',
                            colored: false,
                            element_type: 'invisible',
                            showMinusSign: false, 
                            partition: sourceNode.parent().id(),
                            parent: sourceNode.parent().id()
                        },
                        position: {
                            x: sourceNode.parent().position().x,
                            y: appendices[0].boundingBox().y1 - 55,
                        }
                    }]); 
                    cy.getElementById(`invisible_node_${sourceNode.parent().id()}`).addClass('hide');
                }
            } else {
                for(let i = 0; i < decomposition_attributes.num_of_decompositions; i++) {
                    let diff_graph_node = cy.getElementById(`graph_${i+1}_${sourceNode.data().label}`)
                    diff_graph_node.data().showMinusSign = true;
                }
            }

            // Update the evolutionary history table. 
            this.updateChangeHistory(sourceNode, targetNode)
        }
        this._renderNodes(); 
    }

    _renderNodes() {
        const {
            cy
        } = this.state;
        // Used to update the minus/plus sign after a node has been moved or deleted.
        cy.nodes().addClass('deactivate');
        cy.nodes().removeClass('deactivate');
    }

    _getCurrentDecomposition(decomposition_version_number, cy) {
        const {
            num_of_partitions,
            decomposition_attributes,
            element_types
        } = this.state; 

        let decomposition_versions = [];
        for(let i = 1; i <= decomposition_attributes.num_of_decompositions; i++) {
            if(i !== decomposition_version_number) {
                decomposition_versions.push(i);
            }
        }

        // Get all moved elements. 
        let moved_elements = cy.nodes().map((ele) => {
            if(ele.data('element_type') === element_types.moved_node) {
                return ele.data('label');
            }
        });

        let decomposition = [];

        for(let i = 0; i < num_of_partitions; i++) {
            let partition = []; 
            cy.nodes().forEach((ele) => {
                if(ele.data('partition') === `partition${i}`) {
                    if(ele.data('element_type') === element_types.common_node || ele.data('element_type') === element_types.moved_node) {
                        partition.push(ele.data().label);
                    } else if (ele.data('element_type') === element_types.diff_node 
                        && !moved_elements.includes(ele.data().label)
                        && !decomposition_versions.includes(ele.data('version'))) {
                        partition.push(ele.data().label);
                    }
                }
            })
            if(partition.length !== 0) {
                decomposition.push(partition);
            }
        }

        if (cy.getElementById('unobserved') !== undefined) {
            let partition = []; 
            cy.nodes().forEach((ele) => {
                if(ele.data('partition') === 'unobserved') {
                    if(ele.data('element_type') === element_types.unobserved_node || ele.data('element_type') === element_types.moved_node) {
                        partition.push(ele.data().label);
                    } else if (ele.data('element_type') === element_types.diff_node 
                        && !moved_elements.includes(ele.data().label)
                        && !decomposition_versions.includes(ele.data('version'))) {
                        partition.push(ele.data().label);
                    }
                }
            })
            if(partition.length !== 0) {
                decomposition.push(partition);
            }
        }
        return decomposition;
    }

    updateRedux() {
        const {
            cy,
            changeHistory,
            savePreviousState
        } = this.state;

        if(savePreviousState) {
            this.props.updateTradeOffGraph(
                {
                    graph: cy.json(),
                    changeHistory: changeHistory,
                }
            );
        } else {
            this.props.updateTradeOffGraph({
                graph: cy.collection(),
                changeHistory: [],
            });
        }

    }

    _updateSelectedEvolutionaryList(isBoxChecked, element) {
        const {
            elementsSelectedOnTable
        } = this.state;

        if(isBoxChecked) {
            this.setState(prevState => ({
                elementsSelectedOnTable: [...prevState.elementsSelectedOnTable, element]
            }))
        } else {
            this.setState({elementsSelectedOnTable: elementsSelectedOnTable.filter((ele) => {
                return ele !== element;
            })});
        }
    }

    _onDeleteRowsFromChangeHistory() {
        const {
            cy,
            elementsSelectedOnTable, 
            changeHistory,
            tableBodyRenderKey,
            decomposition_attributes,
            element_types
        } = this.state;

        const zoom = cy.zoom();
        const pan = cy.pan();

        let nodeMoveHistory = {...changeHistory.nodeMoveHistory};

        // Remove elements from the table
        for(let ele in elementsSelectedOnTable) {
            let movedElementInfo = elementsSelectedOnTable[ele];
            const index = nodeMoveHistory[movedElementInfo.movedNode.data().label].length - 1;
            let previous_move = {
                element: nodeMoveHistory[movedElementInfo.movedNode.data().label].slice(-1)[0].movedNode, 
                partition: nodeMoveHistory[movedElementInfo.movedNode.data().label].slice(-1)[0].targetPartition, 
                position: nodeMoveHistory[movedElementInfo.movedNode.data().label].slice(-1)[0].relative_position_in_partition
            };

            cy.remove(cy.getElementById(movedElementInfo.movedNode.data('label'))); 
            // If it is not the first move for the class, then add the previous move, or if the move is a common element.
            if(!this._checkifFirstMoveForClass(movedElementInfo) || previous_move.element.data('element_type') === element_types.common_node) {
                // Position the element back to its relative position of the partition.
                let partition = cy.getElementById(previous_move.element.data('partition'));
                previous_move.element.position({
                    x: partition.position('x') + previous_move.position.x,
                    y: partition.position('y') + previous_move.position.y,
                });
                cy.add(previous_move.element);
            } else {
                if(!this._isNodeCommonBetweenDecompositions(movedElementInfo.movedNode.data('element_type'))) {
                    for(let i = 0; i < decomposition_attributes.num_of_decompositions; i++) {
                        let diff_node = cy.getElementById(`graph_${i+1}_${movedElementInfo.movedNode.data('label')}`)
                        diff_node.data().showMinusSign = false;
                    }
                }
            }
            nodeMoveHistory[movedElementInfo.movedNode.data('label')].splice(index, 1);
        }

        cy.pan(pan);
        cy.zoom(zoom);

        this.onUnhighlightNodes();
        this._renderNodes();

        this.setState(() => ({
            changeHistory: {
                table: changeHistory.table.filter((ele) => {
                    return !elementsSelectedOnTable.includes(ele);
                }),
                nodeMoveHistory: nodeMoveHistory,
            },
            elementsSelectedOnTable: [],
            tableBodyRenderKey: tableBodyRenderKey + 1
        }));
    }

    _printEvolutionaryHistoryText(movedElementInfo) {
        const {
            cy,
            decomposition_attributes,
            changeHistory,
            element_types
        } = this.state;
        const nodeMoveHistory = changeHistory.nodeMoveHistory;
        let target_node = movedElementInfo.movedNode.data().label;
        let previous_partitions = "";

        if(movedElementInfo.movedNode.data('element_type') === element_types.common_node || movedElementInfo.movedNode.data('prev_element_type') === element_types.common_node) {
            let partition_num = parseInt(movedElementInfo.movedNode.data('partition').match('[0-9]')) + 1;
            previous_partitions = `P${partition_num}`;
        } else if (this._checkifFirstMoveForClass(movedElementInfo)){
            for(let i = 1; i <= decomposition_attributes.num_of_decompositions; i++) {
                let partition_num = parseInt(cy.getElementById(`graph_${i}_${movedElementInfo.movedNode.data('label')}`).data().partition.match('[0-9]')) + 1;
                previous_partitions = previous_partitions.concat(`V${this.props.selectedDecompositions[i - 1][1] + 1}-P${partition_num}`);
                if(i !== decomposition_attributes.num_of_decompositions) {
                    previous_partitions = previous_partitions.concat(" ᐱ ");
                }
            }
        } else {
            let index = this._findIndexInMoveHistory(movedElementInfo);
            let previous_node = nodeMoveHistory[movedElementInfo.movedNode.data('label')][index].movedNode
            let partition_num = parseInt(previous_node.data('partition').match('[0-9]')) + 1;
            previous_partitions = `P${partition_num}`;
        }

        let target_partition = parseInt(movedElementInfo.targetPartition.id().match('[0-9]')) + 1;
        return `${target_node}: ${previous_partitions} → P${target_partition}`;
    }

    _findIndexInMoveHistory(movedElementInfo) {
        return movedElementInfo.moveNumber;
    }

    _checkIfLastMoveForClass(movedElementInfo) {
        const {
            nodeMoveHistory
        } = this.state.changeHistory;
        return (nodeMoveHistory[movedElementInfo.movedNode.data('label')].length - 1) === this._findIndexInMoveHistory(movedElementInfo);
    }

    _checkifFirstMoveForClass(movedElementInfo) {
        return this._findIndexInMoveHistory(movedElementInfo) === 0;
    }

    _createRelationshipTypeTable() {
        const {
            decomposition_attributes,
            relationshipTypes,
            cy
        } = this.state;

        let relationshipTypeTable = []

        Object.keys(relationshipTypes).map(
            (key, index) => {
                relationshipTypeTable.push(
                    <TableRow>
                        <TableCell style={{'font-size': 'Normal'}}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </TableCell>
                        {
                            [...Array(decomposition_attributes.num_of_decompositions)].map((x, i) => 
                                <TableCell>
                                    {
                                        Utils.calculateNormalizedTurboMQ(
                                            relationshipTypes[key]["links"],
                                            this._getCurrentDecomposition(i + 1, cy)
                                        ).toFixed(2)
                                    }
                                </TableCell>
                            )
                        }
                    </TableRow>
                )
            }
        )
        return relationshipTypeTable;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(JSON.stringify(prevState.relationshipTypeTable) !== JSON.stringify(this._createRelationshipTypeTable())) {
            this.setState({relationshipTypeTable: this._createRelationshipTypeTable()});
        }
        // if(JSON.stringify(prevState.edges) !== JSON.stringify(Utils.updateGraphEdges(selectedTab, relationshipTypes, common_elements, this.props.colors, null))) {
        //     Utils.addEdges(cy, selectedTab, relationshipTypes, common_elements, this.props.colors);
        //     // Do not highlight any node if the toggles are pressed. 
        //     cy.elements().forEach((ele) => {
        //         // ele.data().showMinusSign = false; 
        //         ele.removeClass('deactivate');
        //         ele.removeClass('highlight');
        //     });
        // }
    }
    
    componentWillUnmount() {
        this.updateRedux();
    }

    render() {
        let {
            changeHistory,
            elementsSelectedOnTable,
            tableBodyRenderKey,
            decomposition_attributes,
            relationshipTypeTable,
            openTable,
            selectedDecompositions
        } = this.state;

        // movedElementInfo contains the sourceNode that was moved, the target partition it is moving to, and its relative position in the current partition.
        const changeHistoryList = changeHistory.table.map(
            (movedElementInfo, index) => 
            <TableRow key={index}
                hover={this._checkIfLastMoveForClass(movedElementInfo)} 
                onMouseOver={(event) => {
                    if(this._checkIfLastMoveForClass(movedElementInfo)) {
                        this.highlightSelectedElements(movedElementInfo);
                    }
                }}
                onMouseOut={(event) => {
                    if(this._checkIfLastMoveForClass(movedElementInfo)) {
                        this.onUnhighlightNodes();
                        this.setState({relationshipTypeTable: this._createRelationshipTypeTable()});
                    }
                }}
            >
                <TableCell>
                    <Checkbox
                        checked={elementsSelectedOnTable.includes(movedElementInfo)}
                        onChange={(event, newValue) => this._updateSelectedEvolutionaryList(newValue, movedElementInfo, index)}
                        disabled={!this._checkIfLastMoveForClass(movedElementInfo)}
                    />
                    {this._printEvolutionaryHistoryText(movedElementInfo)}
                </TableCell>
            </TableRow>
        );

        return (
            <div>
                <div className="custom-graph-container">
                    <div style={{height: '100%', width: '100%', position: 'fixed'}} ref={ref => (this.ref = ref)}></div>
                </div>
                <Button variant="outlined" color="primary"
                    style={{
                        position: 'fixed',
                        'margin-top': '0.75%',
                        'left': '1%'
                    }}
                    onClick={() => {
                        this.state.savePreviousState = false;
                        this.props.onChange(true);
                    }
                }>
                    Compare new 
                </Button>
                <TableContainer 
                component={Paper} 
                style={
                        {
                            width: '30%',
                            border: '1px solid grey',
                            'left': '69%',
                            'margin-top': '1%',
                            position: 'fixed',
                            maxHeight: '700px'
                        }
                    } 
                size="small">
                    <Table stickyHeader aria-label="simple table" size="small">
                        <TableBody key={tableBodyRenderKey}>
                            <TableRow>
                                <TableCell style={{'font-weight': 'bold'}}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => {
                                            this.setState({
                                                openTable: {
                                                    ...this.state.openTable,
                                                    metrics: !openTable.metrics 
                                                }
                                            })
                                        }}
                                    >
                                        {openTable.metrics ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                    </IconButton>
                                    Metrics
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} >
                                    <Collapse in={openTable.metrics} timeout="auto" unmountOnExit>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell colSpan={4} style={{'font-weight': 'bold'}}>
                                                        Coupling & Cohesion (0-100%)
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>
                                                        Dependencies
                                                    </TableCell>
                                                    {
                                                        [...Array(decomposition_attributes.num_of_decompositions)].map((x, i) => 
                                                            <TableCell 
                                                                style={{
                                                                    'color': this.props.colors.relationship_type_colors[selectedDecompositions[i][1]]
                                                                }}
                                                            >
                                                                V{selectedDecompositions[i][1] + 1}
                                                            </TableCell>
                                                        )
                                                    }
                                                </TableRow>
                                            </TableHead>
                                            {relationshipTypeTable}
                                        </Table>
                                    </Collapse>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                {elementsSelectedOnTable.length > 0 ? (
                                    <TableCell
                                        onMouseOver={(event) => {
                                            this.highlightSelectedElements(null);
                                        }}
                                        onMouseOut={(event) => {
                                            this.onUnhighlightNodes();
                                        }}
                                    >
                                        <IconButton 
                                            size="small" 
                                            onClick={() => {
                                                this.setState({
                                                    openTable: {
                                                        ...this.state.openTable,
                                                        changeHistory: !openTable.changeHistory 
                                                    }
                                                })
                                            }}
                                        >
                                            {openTable.changeHistory ? <KeyboardArrowUpIcon onClick={(event) => this.onUnhighlightNodes()}/> : <KeyboardArrowDownIcon onClick={(event) => this.onUnhighlightNodes()}/>}
                                        </IconButton>
                                    {elementsSelectedOnTable.length} selected
                                        <Tooltip title="Undo">
                                            <IconButton 
                                                aria-label="undo" 
                                                onClick={(event) => this._onDeleteRowsFromChangeHistory()}
                                            >
                                                <UndoIcon
                                                    onClick={(event) => this.onUnhighlightNodes()}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                    ) : (
                                    <TableCell style={{'font-weight': 'bold'}}>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => {
                                                this.setState({
                                                    openTable: {
                                                        ...this.state.openTable,
                                                        changeHistory: !openTable.changeHistory 
                                                    }
                                                })
                                            }}
                                        >
                                            {openTable.changeHistory ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                        </IconButton>
                                        Change History
                                    </TableCell> 
                                )}
                            </TableRow>
                            <TableRow>
                                <TableCell style={{ paddingBottom: 0, paddingTop: 0}} >
                                    <Collapse in={openTable.changeHistory} timeout="auto" unmountOnExit>
                                        <Table size="small">
                                            {changeHistoryList}
                                        </Table>
                                    </Collapse>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );
    }
};

export default connect(null, { updateTradeOffGraph })(TradeOffGraph);
