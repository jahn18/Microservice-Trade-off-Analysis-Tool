import React from "react";
import cytoscape from 'cytoscape';
import Utils from '../../../utils';
import CompoundDragAndDrop from '../../DragAndDrop';
import AppendixLayout from '../../AppendixLayout';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import 'react-pro-sidebar/dist/css/styles.css';
import cxtmenu from 'cytoscape-cxtmenu';

cytoscape.use( cxtmenu );
cytoscape.use( nodeHtmlLabel );


export class DiffDecomposition extends React.Component {
    constructor(props) {
        super(props);

        let consideredRelationshipEdges = this.props.selectedDecompositions.map((sel) => sel[0]);
        if (consideredRelationshipEdges.includes('weighted-view')) {
            const index = consideredRelationshipEdges.indexOf('weighted-view');
            if (index > -1) {
                consideredRelationshipEdges.splice(index, 1);
            }
            // consideredRelationshipEdges = Array.from(new Set(consideredRelationshipEdges.concat(this.props.consideredWeightedRelationships)));
        }

        let cytoscapeElements = (this.props.decomposition.elements.nodes) ? this.props.decomposition.elements.nodes : this.props.decomposition.elements;

        this.state = {
            consideredRelationshipEdges: consideredRelationshipEdges,
            allMovedElements: [],
            savePreviousState: true,
            common_elements: cytoscapeElements.filter((node) => node.data.element_type === "common").map((node) => node.data.label), // TODO: update the usage of this.,
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
            selectedDecompositions,
            element_types,
            colors
        } = this.state;

        const cy = cytoscape({
            container: this.ref,
            wheelSensitivity: 0.015,
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
                                    return colors[selectedDecompositions[0][0]];
                                } else {
                                    return colors[selectedDecompositions[1][0]];
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
                        'width': function(edge) {
                            if(!edge.data("weight")) {
                                return 3;
                            }
                            return (parseFloat(edge.data("weight")) * 3.5 + 3)  
                        },
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
                    'selector': 'node.addPlusSign',
                    'style': {
                        'opacity': 1.0
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

        let relationshipTypes = this.props.relationshipTypes;
        if(this.props.decomposition.elements.nodes) {
            cy.add(this.props.decomposition.elements.nodes).layout({name: 'preset'}).run()
            cy.pan(this.props.decomposition.pan);
            cy.zoom(this.props.decomposition.zoom);
        } else {
            cy.add(this.props.decomposition.elements);
            let options = {
                num_of_versions: 2,
                partitions_per_row: 5,
                width: 100,
                height: 100,
            };
            let layout = new AppendixLayout( cy, options );
            layout.run()
        }

        cy.nodes().forEach((ele) => {
            if(ele.data('element_type') === element_types.invisible_node) {
                ele.addClass('hide');
            }
        });

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
                            this.props.colors[this.props.selectedDecompositions[data.version - 1][0]] + '27' : 
                            this.props.colors[this.props.selectedDecompositions[data.version - 1][0]]; 
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
                onMovedNode: (event, sourceNode, targetNode) => this.onMovedNode(event, sourceNode, targetNode),
                dropBoundary: (ele) => { 
                    let appendices = ele.children().filter(
                        (ele) => {
                            return ele.data('element_type') === 'appendix';
                        }
                    );
                    // Get the current bounding-box where the common nodes should lie. 
                    const boundingBox = {
                        x1: ele.boundingBox().x1,
                        x2: ele.boundingBox().x2,
                        y1: ele.boundingBox().y1,
                        y2: appendices[0].boundingBox().y1 
                    };
                    return {
                        node: ele,
                        bb: boundingBox
                    }
               },
                canMoveNode: [element_types.common_node, element_types.diff_node],
                onMouseOver: () => {cy.elements().addClass('addPlusSign')},
                onMouseOut: () => {cy.elements().removeClass('addPlusSign')}
            }
        );
        cdnd.run();

        /*
            All event handlers.
        */
        cy.on('tap', () => this.onUnhighlightNodes());
        cy.on('mouseover', 'node', (e) => this.disableHandleAndInteraction(e.target));
        cy.on('mouseout','node', (e) => { 
            if(e.target.data().element_type !== undefined) {
                e.target.grabify();
            }
        });

        this.setState({
            cy: cy,
            relationshipTypes: relationshipTypes,
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
        // let edges = consideredRelationshipEdges.map((key) => relationshipTypes[key].cytoscapeEdges).flat();
        // cy.add(edges.map((edge) => edge.getCytoscapeData()));
        targetNode = cy.getElementById(targetNode.data('realNodeId'));
        // let targetNodeEdges = new Set(targetNode.)

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
                                color: this.props.colors[this.props.selectedDecompositions[i - 1][0]]
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

    highlightSelectedElements = (elementsSelectedOnTable) => {
        let {
            cy,
            numOfDiffDecompositions,
            element_types,
        } = this.state; 

        // This is where I'm trying to highlight all objects that were being selected. 
        let selected_elements = cy.collection();
        elementsSelectedOnTable = [...new Set(elementsSelectedOnTable)];
        for(let movedElementInfo of elementsSelectedOnTable) {
            let sel = cy.getElementById(movedElementInfo.movedNode.data('label'));
            // if(this._changeHistory.isFirstMove(movedElementInfo)) {
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
                                color: this.props.colors[this.props.selectedDecompositions[i - 1][0]]
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
            element_types
        } = this.state; 

        if(sourceNode.data().showMinusSign === false && 
            targetNode.data('element_type') === element_types.partition &&
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
            let diffNode;
            if (sourceNode.data('element_type') === element_types.diff_node) {
                diffNode = cy.elements().filter((ele) => ele.data('label') === sourceNode.data('label') && ele.data('version') !== sourceNode.data('version') && ele.data('element_type') === element_types.diff_node);
            }

            const originalPartition = sourceNode.data('prev_partition') ? sourceNode.data('prev_partition') : sourceNode.data('partition');
            this.props.addMove(sourceNode, cy.getElementById(originalPartition), targetNode, diffNode);
            this.props.saveGraph(cy.json());
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

    _onDeleteRowsFromChangeHistory = (elementsSelectedOnTable) => {
        const {
            cy,
            numOfDiffDecompositions,
            element_types,
        } = this.state;

        const zoom = cy.zoom();
        const pan = cy.pan();

        elementsSelectedOnTable.forEach((movedElementInfo) => {
            const {movedNode, currPartition, currPartitionRelativePos} = movedElementInfo; 
            // Remove the moved node. 
            cy.remove(cy.getElementById(movedNode.data('label'))); 
            if(movedNode.data('element_type') === element_types.common_node) {
                movedNode.data().parent = currPartition.id();
                cy.add(movedNode.position({
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
        this.props.saveGraph(cy.json());
        cy.pan(pan);
        cy.zoom(zoom);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {
            cy
        } = this.state;

        if (this.props.resetMoves) {
            this._onDeleteRowsFromChangeHistory(prevProps.selectedElements);
            this.props.clearChangeHistoryTable();
        }

        if (prevProps.selectedElements !== this.props.selectedElements) {
            cy.elements().removeClass('deactivate');
            cy.edges().remove();
            if (this.props.mouseOverChangeHistory) {
                this.highlightSelectedElements(this.props.selectedElements);
            } else {
                this.onUnhighlightNodes();
            }
        }
    }

    highlightElements = (movedElementInfo, allSelectedElements) => {
        if(this._changeHistory.isLastestMove(movedElementInfo)) {
            this.highlightSelectedElements(movedElementInfo, allSelectedElements);
        }
    }

    componentWillUnmount() {
        this.props.saveGraph(this.state.cy.json());
    }

    render() {
        return (
            <div>
                <div className="custom-graph-container">
                    <div style={{height: '100%', width: '100%', position: 'fixed'}} ref={ref => (this.ref = ref)}></div>
                </div>
            </div>
        );
    }
};