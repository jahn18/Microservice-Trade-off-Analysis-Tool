import React from "react";
import cytoscape from 'cytoscape';
import Utils from '../../../utils';
import CompoundDragAndDrop from '../../DragAndDrop';
import AppendixLayout from '../../AppendixLayout';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import storeProvider from '../../../storeProvider';
import {updateTradeOffGraph} from '../../../Actions';
import {connect} from 'react-redux';
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import 'react-pro-sidebar/dist/css/styles.css';
import Button from '@material-ui/core/Button';
import cxtmenu from 'cytoscape-cxtmenu';
import { Typography } from "@material-ui/core";

// import {ChangeHistoryStore} from '@service/ChangeHistoryStore';
import {ChangeHistoryStore} from '../../../service/ChangeHistoryStore';
import {ChangeHistoryTable} from '../../tables/ChangeHistoryTable/ChangeHistoryTable';
import {CouplingAndCohesionTable} from '../../tables/MetricsTable/CouplingAndCohesionTable';

cytoscape.use( cxtmenu );
cytoscape.use( nodeHtmlLabel );


class DiffView extends React.Component {
    _changeHistory = new ChangeHistoryStore();

    constructor(props) {
        super(props);

        this.state = {
            consideredRelationshipEdges: this.props.selectedDecompositions.map((sel) => sel[0]),
            allMovedElements: [],
            savePreviousState: true,
            common_elements: this.props.decomposition.getClassNodeList().flat().filter((node) => node.getType() === "common").map((node) => node.getLabel()), // TODO: update the usage of this.,
            colors: this.props.colors,
            selectedDecompositions: this.props.selectedDecompositions,
            relationshipTypeTable: [],
            numOfDiffDecompositions: 2,
            tableBodyRenderKey: 0,
            element_types: {
                partition: 'partition',
                appendix: 'appendix',
                diff_node: 'diff', 
                common_node: 'common',
                invisible_node: 'invisible',
                moved_node: 'common*',
            },
            openTable: {
                metrics: false,
                changeHistoryTable: false,
                edgeFilter: false,
            },
        }

        this.ref = React.createRef();
    };

    componentDidMount() {
        const {
            numOfDiffDecompositions,
            selectedDecompositions,
            element_types,
            colors
        } = this.state;

        const cy = cytoscape({
            container: this.ref,
            elements: this.props.decomposition.getCytoscapeData(),
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
                                    return colors.relationship_type_colors[selectedDecompositions[0][1]];
                                } else {
                                    return colors.relationship_type_colors[selectedDecompositions[1][1]];
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
                    'selector': '.cdnd-drop-target',
                    'style': {
                      'border-color': 'red',
                      'border-style': 'dashed'
                    }
                }
            ],
        });

        let lastRenderedState;
        
        let relationshipTypes = storeProvider.getStore().getState().diff_graph.edgeRelationshipTypes;
        // If the custom graph hasn't been loaded yet then load the positions of the current diff-graph. 
        if(storeProvider.getStore().getState().trade_off_graph.graph.length === 0) {
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
            this._changeHistory.loadChangeHistoryStore(storeProvider.getStore().getState().trade_off_graph.changeHistory);
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
                        const color = (data.showMinusSign) ? 
                            this.props.colors.relationship_type_colors[this.props.selectedDecompositions[data.version - 1][1]] + '27' : 
                            this.props.colors.relationship_type_colors[this.props.selectedDecompositions[data.version - 1][1]]; 
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

        let cdnd = new CompoundDragAndDrop(
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

        const allDecompositions = {};
        const styles = {};
        for(let i = 0; i < numOfDiffDecompositions; i++) {
            let decompositionName = `V${this.props.selectedDecompositions[i][1] + 1}`;
            allDecompositions[decompositionName] = this._getCurrentDecomposition(i + 1, cy);
            styles[decompositionName] = {'color': this.props.colors.relationship_type_colors[this.props.selectedDecompositions[i][1]]}
        }

        const allDependencies = {};
        Object.keys(relationshipTypes).map((key) => {
            allDependencies[key] = relationshipTypes[key]["links"];
        });

        this.setState({
            cy: cy,
            couplingAndCohesionTable: {
                decompositions: allDecompositions,
                styles: styles,
                dependencies: allDependencies
            },
            relationshipTypes: relationshipTypes,
            allMovedElements: this._changeHistory.getAllMoveOperations()
        });
    }

    showEdgeDependencies(targetNode) {
        const {
            cy,
            element_types,
            relationshipTypes,
            common_elements,
            consideredRelationshipEdges
        } = this.state;

        // Clear the selected nodes when right clicking on a new node
        this.onUnhighlightNodes();
        targetNode = cy.getElementById(targetNode.data('realNodeId'))
        Utils.showCustomGraphEdges(cy, consideredRelationshipEdges, relationshipTypes, common_elements, targetNode);
        let selectedElements = cy.collection(targetNode);
        selectedElements = selectedElements.union(cy.elements().filter((ele) => {
            return ele.data('element_type') === element_types.invisible_node;
        }));
        selectedElements = selectedElements
            .union(
                cy.collection(selectedElements.incomers().map((ele) => (ele.isEdge()) ? ele : [ele, ele.parent()]).flat())
            ).union(
                cy.collection(selectedElements.outgoers().map((ele) => (ele.isEdge()) ? ele : [ele, ele.parent()]).flat())
            );
        let unselectedElements = cy.elements().difference(selectedElements);
        unselectedElements.forEach((ele) => {
            if(this._isNodeCommonBetweenDecompositions(ele.data().element_type)) {
                ele.data().showMinusSign = true; 
            }
        });
        unselectedElements.addClass('deactivate');
    }

    disableHandleAndInteraction(element) {
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
            numOfDiffDecompositions,
            element_types,
        } = this.state; 

        // Get the actual node, not just the ghost node created in the compound drag-and-drop. 
        sel = cy.getElementById(sel.data('realNodeId'));
        let selected_elements = cy.elements().filter((ele) => {
            return ele.data('element_type') === element_types.invisible_node;
        }); 

        switch(sel.data().element_type) {
            case element_types.diff_node:
                if(!sel.data('showMinusSign')) {
                    for(let i = 1; i <= numOfDiffDecompositions; i++) {
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
                    for(let i = 1; i <= numOfDiffDecompositions; i++) {
                        let graph_node = cy.getElementById(`graph_${i}_${sel.id()}`)
                        selected_elements = selected_elements.union(
                            cy.collection([graph_node, cy.getElementById(graph_node.data('partition')), graph_node.parent()])
                        );
                        cy.add([{
                            group: 'edges',
                            data: {
                                target: sel.id(),
                                source: `graph_${i}_${sel.id()}`,
                                color: this.props.colors.relationship_type_colors[this.props.selectedDecompositions[i - 1][1]]
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

    highlightSelectedElements = (changeHistoryRowElementInfo, elementsSelectedOnTable) => {
        let {
            cy,
            numOfDiffDecompositions,
            element_types,
        } = this.state; 

        // This is where I'm trying to highlight all objects that were being selected. 
        let selectedElementsInChangedHistory = elementsSelectedOnTable.slice();
        if(changeHistoryRowElementInfo !== null && !selectedElementsInChangedHistory.includes(changeHistoryRowElementInfo)) {
            selectedElementsInChangedHistory.push(changeHistoryRowElementInfo);
        }
        let selected_elements = cy.collection();

        for(let movedElementInfo of selectedElementsInChangedHistory) {
            let sel = cy.getElementById(movedElementInfo.movedNode.data('label'));
            if(this._changeHistory.isFirstMove(movedElementInfo)) {
                selected_elements = selected_elements.union(sel).union(movedElementInfo.targetPartition); 
                if(sel.data('prev_element_type') === element_types.diff_node) {
                    for(let i = 1; i <= numOfDiffDecompositions; i++) {
                        let graph_node = cy.getElementById(`graph_${i}_${sel.id()}`)
                        selected_elements = selected_elements.union(
                            cy.collection([graph_node, cy.getElementById(graph_node.data().partition), graph_node.parent()])
                        );
                        cy.add([{
                            group: 'edges',
                            data: {
                                target: sel.id(),
                                source: `graph_${i}_${sel.id()}`,
                                color: this.props.colors.relationship_type_colors[this.props.selectedDecompositions[i - 1][1]]
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

    onMovedNode(position, sourceNode, targetNode) { 
        const {
            cy,
            numOfDiffDecompositions,
            element_types,
            couplingAndCohesionTable
        } = this.state; 

        if(sourceNode.data().showMinusSign === false && 
            this.props.decomposition.getAllPartitionIds().includes(targetNode.id()) &&
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
                for(let i = 0; i < numOfDiffDecompositions; i++) {
                    let diff_graph_node = cy.getElementById(`graph_${i+1}_${sourceNode.data().label}`);
                    diff_graph_node.data().showMinusSign = true;
                }
            }

            // Update the evolutionary history table. 
            this._changeHistory.addNewMove(sourceNode, cy.getElementById(sourceNode.data('partition')), targetNode);
        }
        this._renderNodes(); 

        this.setState({
            allMovedElements: this._changeHistory.getAllMoveOperations(),
            couplingAndCohesionTable: {
                ...couplingAndCohesionTable,
                decompositions: this._getDecompositions()
            }
        });
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
            numOfDiffDecompositions,
            element_types
        } = this.state; 

        let decomposition_versions = [];
        for(let i = 1; i <= numOfDiffDecompositions; i++) {
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

        for(let i = 0; i < this.props.decomposition.getNumOfPartitions(); i++) {
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

        return decomposition;
    }

    updateRedux() {
        const {
            cy,
            // changeHistory,
            savePreviousState
        } = this.state;

        if(savePreviousState) {
            this.props.updateTradeOffGraph(
                {
                    graph: cy.json(),
                    changeHistory: this._changeHistory.getChangeHistory()
                }
            );
        } else {
            this.props.updateTradeOffGraph({
                graph: cy.collection(),
                changeHistory: {},
            });
        }

    }

    _getDecompositions() {
        const {
            cy,
            numOfDiffDecompositions
        } = this.state;

        // Update the metrics once a node is moved
        const allDecompositions = {};
        for(let i = 0; i < numOfDiffDecompositions; i++) {
            let decompositionName = `V${this.props.selectedDecompositions[i][1] + 1}`;
            allDecompositions[decompositionName] = this._getCurrentDecomposition(i + 1, cy);
        }

        return allDecompositions;
    }

    _onDeleteRowsFromChangeHistory = (elementsSelectedOnTable) => {
        const {
            cy,
            tableBodyRenderKey,
            numOfDiffDecompositions,
            element_types,
            couplingAndCohesionTable
        } = this.state;

        const zoom = cy.zoom();
        const pan = cy.pan();

        elementsSelectedOnTable.forEach((movedElementInfo) => {
            const {movedNode, currPartition, currPartitionRelativePos, moveNumber} = movedElementInfo; 
            this._changeHistory.undoMove(movedNode);  

            // Remove the moved node. 
            cy.remove(cy.getElementById(movedNode.data('label'))); 

            if(moveNumber > 0 || movedNode.data('element_type') === element_types.common_node) {
                cy.add(movedNode.move({parent: currPartition.id()}).position({
                    x: currPartition.position('x') + currPartitionRelativePos.x,
                    y: currPartition.position('y') + currPartitionRelativePos.y
                }));
            } else if (movedNode.data('element_type') === element_types.diff_node) {
                for(let i = 0; i < numOfDiffDecompositions; i++) {
                    let diff_node = cy.getElementById(`graph_${i+1}_${movedNode.data('label')}`)
                    diff_node.data().showMinusSign = false;
                }
            }
        });
        cy.pan(pan);
        cy.zoom(zoom);

        this.onUnhighlightNodes();
        this._renderNodes();

        this.setState(() => ({
            allMovedElements: this._changeHistory.getAllMoveOperations(),
            tableBodyRenderKey: tableBodyRenderKey + 1,
            couplingAndCohesionTable: {
                ...couplingAndCohesionTable,
                decompositions: this._getDecompositions()
            }
        }));
    }

    _printEvolutionaryHistoryText = (movedElementInfo) => {
        const {
            cy,
            numOfDiffDecompositions,
            element_types
        } = this.state;

        const nodeMoveHistory = this._changeHistory.getChangeHistory().indivElementHistories;
        let target_node = movedElementInfo.movedNode.data('label');
        let previous_partitions = "";

        if(movedElementInfo.movedNode.data('element_type') === element_types.common_node || movedElementInfo.movedNode.data('prev_element_type') === element_types.common_node) {
            let partition_num = parseInt(movedElementInfo.movedNode.data('partition').match('[0-9]')) + 1;
            previous_partitions = `M${partition_num}`;
        } else if (this._changeHistory.isFirstMove(movedElementInfo)) {
            for(let i = 1; i <= numOfDiffDecompositions; i++) {
                let partition_num = parseInt(cy.getElementById(`graph_${i}_${movedElementInfo.movedNode.data('label')}`).data().partition.match('[0-9]')) + 1;
                previous_partitions = previous_partitions.concat(`V${this.props.selectedDecompositions[i - 1][1] + 1}-M${partition_num}`);
                if(i !== numOfDiffDecompositions) {
                    previous_partitions = previous_partitions.concat(" ᐱ ");
                }
            }
        } else {
            let index = movedElementInfo.moveNumber;
            let previous_node = nodeMoveHistory[movedElementInfo.movedNode.data('label')][index].movedNode
            let partition_num = parseInt(previous_node.data('partition').match('[0-9]')) + 1;
            previous_partitions = `M${partition_num}`;
        }

        let target_partition = parseInt(movedElementInfo.targetPartition.id().match('[0-9]')) + 1;
        return `${target_node}: ${previous_partitions} → M${target_partition}`;
    }

    _createRelationshipTypeTable() {
        const {
            relationshipTypes,
            numOfDiffDecompositions,
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
                            [...Array(numOfDiffDecompositions)].map((x, i) => 
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
        // if(JSON.stringify(prevState.relationshipTypeTable) !== JSON.stringify(this._createRelationshipTypeTable())) {
        //     this.setState({relationshipTypeTable: this._createRelationshipTypeTable()});
        // }
    }
    
    componentWillUnmount() {
        this.updateRedux();
    }

    highlightElements = (movedElementInfo, allSelectedElements) => {
        if(this._changeHistory.isLastestMove(movedElementInfo)) {
            this.highlightSelectedElements(movedElementInfo, allSelectedElements);
        }
    }

    updateRelationshipMetrics = (movedElementOperation) => {
        if(this._changeHistory.isLastestMove(movedElementOperation)) {
            this.onUnhighlightNodes();
            this.setState({relationshipTypeTable: this._createRelationshipTypeTable()});
        }
    }

    render() {
        let {
            allMovedElements,
            tableBodyRenderKey,
            openTable,
            couplingAndCohesionTable
        } = this.state;

        return (
            <div>
                <div className="custom-graph-container">
                    <div style={{height: '100%', width: '100%', position: 'fixed'}} ref={ref => (this.ref = ref)}></div>
                </div>
                <div
                    style={{
                        position: 'fixed',
                        'margin-top': '0.75%',
                        'left': '1%',
                        display: 'flex'
                    }}
                >
                    <Typography style={{'margin-top': '1%', display: 'flex'}} variant="h5"> 
                        <div style={{'margin-right': '8px', color: this.props.colors.relationship_type_colors[this.props.selectedDecompositions[0][1]]}}>
                            {`V${this.props.selectedDecompositions[0][1] + 1}`}
                        </div>
                        <div style={{'margin-right': '3px'}}>
                            {'vs.'}
                        </div>
                        <div style={{color: this.props.colors.relationship_type_colors[this.props.selectedDecompositions[1][1]]}}>
                            {`V${this.props.selectedDecompositions[1][1] + 1}`}
                        </div>
                    </Typography>
                    <Button variant="outlined" color="primary"
                        style={{
                            'left': '10%'
                        }}
                        onClick={() => {
                            this.state.savePreviousState = false;
                            this.props.onChange(true);
                        }
                    }>
                        Compare new 
                    </Button>
                </div>
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
                                <CouplingAndCohesionTable 
                                    styles={couplingAndCohesionTable?.styles || {}}
                                    decompositions={couplingAndCohesionTable?.decompositions || []}
                                    dependencies={couplingAndCohesionTable?.dependencies || []}
                                    openTable={openTable.metrics}
                                    onOpenTableChange={() => this.setState({openTable: {...openTable, metrics: !openTable.metrics}})}
                                />
                            </TableRow>
                            <TableRow>
                                <ChangeHistoryTable
                                    allMoveOperations={allMovedElements}
                                    enableHover={this._changeHistory.isLastestMove}
                                    onMouseOver={this.highlightElements}
                                    onMouseOut={this.updateRelationshipMetrics}
                                    disable={this._changeHistory.isLastestMove}
                                    moveOperationContent={this._printEvolutionaryHistoryText}
                                    onAllSelectedElements={this._onDeleteRowsFromChangeHistory}
                                    openTable={openTable.changeHistoryTable}
                                    onOpenTableChange={() => this.setState({openTable: {...openTable, changeHistoryTable: !openTable.changeHistoryTable}})}
                                />
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );
    }
};

export default connect(null, { updateTradeOffGraph })(DiffView);