import React, {createRef} from "react";
import cytoscape from 'cytoscape';
import Utils from './../Utils'
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import edgehandles from 'cytoscape-edgehandles';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import storeProvider from './../../storeProvider';
import {updateCustomGraph} from './../../Actions';
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
import Tooltip from '@material-ui/core/Tooltip';
import UndoIcon from '@material-ui/icons/Undo';
import IconButton from '@material-ui/core/IconButton';

cytoscape.use( nodeHtmlLabel );
cytoscape.use( edgehandles );

class CustomGraph extends React.Component {
    constructor(props) {
        super(props);

        let parsedGraph = Utils.parseJSONGraphFile(this.props.graphData, this.props.colors);

        this.state = {
            nodes: parsedGraph[0],
            common_elements: parsedGraph[1],
            num_of_partitions: parsedGraph[2],
            relationshipTypes: parsedGraph[3],
            relationshipTypeTable: [],
            decomposition_attributes: {
                num_of_decompositions: 2,
                colors: this.props.colors.decomposition_colors
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
                moved_node: 'common*'
            },
            openTable: {
                metrics: false,
                changeHistory: false
            },
        }

        this.ref = React.createRef();
    };

    componentDidMount() {
        const {
            nodes,
            num_of_partitions,
            changeHistory,
            relationshipTypes,
            decomposition_attributes,
            element_types 
        } = this.state;

        const cy = cytoscape({
            container: this.ref,
            nodes,
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
                                    return decomposition_attributes.colors[0];
                                } else {
                                    return decomposition_attributes.colors[1];
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
                        'line-color': 'data(color)',
                        'target-arrow-color': 'data(color)',
                        'target-arrow-shape': 'vee',
                        'curve-style': 'bezier',
                        'arrow-scale': 2.25
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
                        'opacity': 0.75
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
                        'background-color': 'white',
                    }
                },
                {
                    selector: '.eh-source',
                    style: {
                        'border-width': 3,
                        'border-color': 'red'
                    }
                },
                {
                    selector: '.eh-preview, .eh-ghost-edge',
                    style: {
                        'line-color': 'red',
                        'target-arrow-color': 'red',
                        'source-arrow-color': 'red'
                    }
                },
                {
                    selector: '.showPreview',
                    style: {
                        'background-color': 'red'
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

        let lastRenderedState;
        let loadedChangeHistory;
        
        // If the custom graph hasn't been loaded yet then load the positions of the current diff-graph. 
        if(Object.keys(storeProvider.getStore().getState().custom_graph).length === 0) {
            loadedChangeHistory = changeHistory;
            lastRenderedState = storeProvider.getStore().getState().diff_graph;
            cy.json({elements:lastRenderedState.elements}).layout({name: 'preset'}).run();
        } else {
            loadedChangeHistory = storeProvider.getStore().getState().custom_graph.changeHistory;
            cy.elements().remove();
            lastRenderedState = storeProvider.getStore().getState().custom_graph.graph;
            
            let principle_elements = [];
            for(let i = 0; i < lastRenderedState.elements.nodes.length; i++) {
                if(lastRenderedState.elements.nodes[i].data.element_type === element_types.appendix 
                    || lastRenderedState.elements.nodes[i].data.element_type === element_types.partition) {
                        principle_elements.push(lastRenderedState.elements.nodes[i]);
                }
            }

            cy.add(principle_elements);
            cy.json({elements:lastRenderedState.elements}).layout({name: 'preset'}).run();

            let diffGraphState = storeProvider.getStore().getState().diff_graph;
            let diffGraphPartitions = [];
            for(let i = 0; i < diffGraphState.elements.nodes.length; i++) {
                if(diffGraphState.elements.nodes[i].data.element_type === element_types.partition) {
                    diffGraphPartitions.push(diffGraphState.elements.nodes[i]);
                }
            }

            for(let i in diffGraphPartitions) {
                let partition = cy.getElementById(diffGraphPartitions[i].data.id);
                partition.shift(
                    {
                        x: (partition.position().x > diffGraphPartitions[i].position.x) ? 
                            -(partition.position().x - diffGraphPartitions[i].position.x) :
                            (diffGraphPartitions[i].position.x - partition.position().x),
                        y: (partition.position().y > diffGraphPartitions[i].position.y) ? 
                            -(partition.position().y - diffGraphPartitions[i].position.y) :
                            (diffGraphPartitions[i].position.y - partition.position().y)
                    }
                )
            }
        }

        cy.pan(storeProvider.getStore().getState().diff_graph.pan);
        cy.zoom(storeProvider.getStore().getState().diff_graph.zoom);

        /*
            Removes additional red nodes that were added because of the edge handles functionality. 
        */
        let collection = cy.elements().filter((ele) => {
            return (ele.data().element_type === undefined);
        });
        cy.remove(collection);

        let eh = cy.edgehandles({
            snap: false,
            snapThreshold: 0
        });

        let partitions = [];
        for(let i = 0; i < num_of_partitions; i++) {
            partitions.push(`partition${i}`);
        }

        cy.nodeHtmlLabel([{
                query: 'node',
                halign: 'center',
                valign: 'center',
                halignBox: 'center',
                valignBox: 'center',
                tpl: (data) => {
                    let element = cy.getElementById(data.id);
                    if(data.element_type === element_types.moved_node) {
                        return '<h1 style="color:white;">' + '+' + '</h1>';
                    } else if (!this._isNodeCommonBetweenDecompositions(data.element_type) && data.showMinusSign === true) {
                        return '<h1 style="color:white;">' + '-' + '</h1>';
                    } else if(data.element_type === element_types.appendix) {
                        const color = (data.showMinusSign) ? this.props.colors.decomposition_colors[data.version - 1] + '27' : this.props.colors.decomposition_colors[data.version - 1]; 
                        return `<h3 style="color:${color};font-weight: bold; position: absolute; top: ${element.boundingBox().y1 - element.position().y + 5}; right: ${element.position().x - element.boundingBox().x1 - 45};">` 
                                + `V${data.version}` 
                                + '</h3>';
                    } 
                }
        }]);

        /*
            All event handlers.
        */
        cy.on('ehcomplete', (event, sourceNode, targetNode, addedEles) => {
            cy.elements().removeClass('showPreview');
            this.onMovedNode(event, sourceNode, targetNode, addedEles)
        });
        cy.on('ehpreviewon', (event, sourceNode, targetNode, previewEdge) => {
            if (targetNode.data('element_type') === element_types.partition) {
                targetNode.addClass('showPreview');
            }
        });
        cy.on('ehpreviewoff', (event, sourceNode, targetNode, previewEdge) => {
            cy.elements().removeClass('showPreview');
        });
        cy.on('tap', 'node', (e) => {
            this.disableHandleAndInteraction(e.target, eh);
            this.onClickedNode(e)
        }); 
        cy.on('click', (e) => this.onUnhighlightNodes(e));
        cy.on('mouseover', 'node', (e) => this.disableHandleAndInteraction(e.target, eh));
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
                            <TableCell align="left">
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
            partitions: partitions,
            changeHistory: loadedChangeHistory,
            relationshipTypeTable: relationshipTypeTable
        });
    }

    disableHandleAndInteraction(element, handler) {
        const {
            element_types
        } = this.state;

        if(element.data('element_type') === 'invisible' || element.data('element_type') === element_types.appendix) {
            element.ungrabify(); 
            handler.hide();
        } else if (element.data('element_type') === element_types.partition || element.hasClass('deactivate')) {
            handler.hide();
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

    onClickedNode(ele) {
        if(ele.target.data().element_type === undefined) {
            return;
        }

        const {
            cy,
            decomposition_attributes,
            element_types
        } = this.state; 

        let sel = ele.target;
        let selected_elements = cy.elements().filter((ele) => {
            return ele.data('element_type') === element_types.invisible_node;
        }); 
        // if (sel.data().element_type === element_types.partition) {
        //     selected_elements = selected_elements.union(sel.parent()); 
        // }

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
                                color: this.props.colors.decomposition_colors[i - 1]
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
            // case element_types.partition:
            //     selected_elements = selected_elements.union(sel.children()).union(
            //         cy.elements().filter((ele)=> {
            //             return (ele.data().partition === sel.id());
            //         }),
            //     )
            //     break;
            // case element_types.appendix:
            //     selected_elements = selected_elements.union(sel.children());
            //     break;
            // case element_types.common_node:
            //     selected_elements = selected_elements.union(cy.getElementById(sel.data().partition)); 
            //     break;
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
            // removed_node
        } = this.state;

        // if(removed_node !== null) {
        //     let current_node = cy.elements().getElementById(removed_node.data().label);
        //     cy.remove(current_node);
        //     cy.add(removed_node);
        // }

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
            changeHistory,
            decomposition_attributes,
            element_types,
            elementsSelectedOnTable
        } = this.state; 
        // const nodeMoveHistory = changeHistory.nodeMoveHistory;

        let selectedElementsInChangedHistory = elementsSelectedOnTable.slice();
        if(changeHistoryRowElementInfo !== null && !selectedElementsInChangedHistory.includes(changeHistoryRowElementInfo)) {
            selectedElementsInChangedHistory.push(changeHistoryRowElementInfo);
        }
        let selected_elements = cy.collection();

        // let removed_node = null;
        for(let movedElementInfo of selectedElementsInChangedHistory) {
            let sel = cy.getElementById(movedElementInfo.movedNode.data('label'));
            // let index = this._findIndexInMoveHistory(movedElementInfo);

            /*
            * If this is not the most recent move for the current node, then temporarily save 
            * its position and show the move the user is currently hovering on.  
            */
            // if(!this._checkIfLastMoveForClass(movedElementInfo)) {
            //     removed_node = cy.remove(cy.getElementById(movedElementInfo.movedNode.data('label')));
            //     sel = nodeMoveHistory[movedElementInfo.movedNode.data('label')][index + 1];
            //     sel.movedNode.position({
            //         x: cy.getElementById(sel.movedNode.data('partition')).position('x') + sel.relative_position_in_partition.x,
            //         y: cy.getElementById(sel.movedNode.data('partition')).position('y') + sel.relative_position_in_partition.y,
            //     });
            //     sel = sel.movedNode;
            //     selected_elements = selected_elements.union(sel);
            //     cy.add(sel);
            // }

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
                                color: this.props.colors.decomposition_colors[i - 1]
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
                                            movedElementInfo.movedNode.data('partition')
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

        // this.setState({
        //     removed_node: removed_node
        // })
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
                        targetPartition: targetNode
                    }
                ],
                nodeMoveHistory: !(sourceNode.data().label in prevState.changeHistory.nodeMoveHistory) ? ({
                    ...prevState.changeHistory.nodeMoveHistory,
                    [sourceNode.data().label]: [{
                        movedNode: sourceNode, 
                        targetPartition: targetNode, 
                        relative_position_in_partition: relative_center_position}
                    ]
                }) : ({
                    ...prevState.changeHistory.nodeMoveHistory,
                    [sourceNode.data().label]: [...prevState.changeHistory.nodeMoveHistory[sourceNode.data().label], 
                        {
                            movedNode: sourceNode, 
                            targetPartition: targetNode, 
                            relative_position_in_partition: relative_center_position
                        }
                    ]
                })
            }
        }));
    }

    onMovedNode(event, sourceNode, targetNode, addedEles) { 
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
                position: event.position //this.setPositionOfMovedNode(sourceNode, targetNode)
            });

            // Should also hide common elements if they get moved. 
            if(this._isNodeCommonBetweenDecompositions(sourceNode.data().element_type)) {
                // if the sourceNode is removed and there aren't any common nodes left, then add an invisible node
                // to fill the gap.
                cy.remove(sourceNode);
                let common_nodes = sourceNode.parent().children().filter((ele) => {
                        return ele.data('element_type') === element_types.common_node;
                });
                let appendices = sourceNode.parent().children().filter((ele) => {
                        return ele.data('element_type') === element_types.appendix;
                });
                if(common_nodes.length === 0) {
                    cy.add([{
                        data: {
                            id: `invisible_node_${sourceNode.parent().id()}`,
                            label: `invisible_node${sourceNode.parent().id().match('[0-9]')}`,
                            background_color: 'grey',
                            colored: false,
                            element_type: 'invisible',
                            showminussign: false, 
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
        cy.remove(addedEles);
    }

    _renderNodes() {
        const {
            cy
        } = this.state;
        // Used to update the minus/plus sign after a node has been moved or deleted.
        cy.elements().addClass('deactivate');
        cy.elements().removeClass('deactivate');
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
        return decomposition;
    }

    updateRedux() {
        let {
            cy,
            changeHistory
        } = this.state;

        this.props.updateCustomGraph(
            {
                graph: cy.json(),
                changeHistory: changeHistory
            }
        );
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
                previous_partitions = previous_partitions.concat(`V${i}-P${partition_num}`);
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
        const {
            nodeMoveHistory
        } = this.state.changeHistory;

        const index = nodeMoveHistory[movedElementInfo.movedNode.data('label')].findIndex(x => {
            if(x.movedNode !== movedElementInfo.movedNode && x.targetPartition !== movedElementInfo.targetPartition) {
                return false;
            }
            return true;
        });
        return index; 
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
                            {key}
                        </TableCell>
                        {
                            [...Array(decomposition_attributes.num_of_decompositions)].map((x, i) => 
                                <TableCell align="left">
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
        const {
            cy
        } = this.state;

        if(JSON.stringify(prevState.relationshipTypeTable) !== JSON.stringify(this._createRelationshipTypeTable())) {
            this.setState({relationshipTypeTable: this._createRelationshipTypeTable()});
        }
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
            openTable
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
        )

        return (
            <div>
                <div className="custom-graph-container">
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
                                    Coupling & Cohesion (0-100%)
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} >
                                    <Collapse in={openTable.metrics} timeout="auto" unmountOnExit>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        Dependencies
                                                    </TableCell>
                                                    {
                                                        [...Array(decomposition_attributes.num_of_decompositions)].map((x, i) => 
                                                            <TableCell 
                                                                style={{
                                                                    'color': this.props.colors.decomposition_colors[i]
                                                                }}
                                                            >
                                                                V{i+1}
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
                                    <TableCell align="left" style={{'font-weight': 'bold'}}>
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

export default connect(null, { updateCustomGraph })(CustomGraph);
