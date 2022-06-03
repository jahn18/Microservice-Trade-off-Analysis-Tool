import React, { version } from "react";
import cytoscape from 'cytoscape';
import Utils from '../../utils';
import CompoundDragAndDrop from '../../cytoscape-plugins/DragAndDrop';
import AppendixLayout from '../../cytoscape-plugins/AppendixLayout';
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

        let cytoscapeElements = this.props.decomposition.elements.nodes;

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
                moved_node: 'common+',
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
        if(this.props.decomposition["saved"]) {
            cy.add(this.props.decomposition.elements.nodes).layout({name: 'preset'}).run()
            cy.pan(this.props.decomposition.pan);
            cy.zoom(this.props.decomposition.zoom);
        } else {
            cy.add(this.props.decomposition.elements.nodes);
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
                        y2: appendices.length > 0 ? appendices[0].boundingBox().y1 : ele.boundingBox().y2
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
        if (cy.getElementById(targetNode.data('realNodeId')).length !== 0) {
            targetNode = cy.getElementById(targetNode.data('realNodeId'));
        }
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
                    showMinusSign: false,
                    version: 0
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

            let currentMovedNode = cy.getElementById(movedNode.data('label'));           
            let parentNode = currentMovedNode.parent();
            if (parentNode.children().length === 1) {
                this.state.cy.remove(parentNode);
            }
            // Remove the moved node. 
            cy.remove(currentMovedNode); 
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

        if (JSON.stringify(prevProps.selectedElements.map((move) => {return move.movedNode.id()})) !== JSON.stringify(this.props.selectedElements.map((move) => {return move.movedNode.id()}))) {
            cy.elements().removeClass('deactivate');
            cy.edges().remove();
            if (this.props.mouseOverChangeHistory) {
                this.highlightSelectedElements(this.props.selectedElements);
            } else {
                this.onUnhighlightNodes();
            }
        }

        if (prevProps.weightedDiffMoves !== this.props.weightedDiffMoves) {
            this.props.weightedDiffMoves["moves"].forEach((move) => {
                this.onMovedNode(
                    {
                        x: cy.getElementById(move["target"]).position().x,
                        y: cy.getElementById(move["target"]).position().y,
                    }, 
                    cy.getElementById(`graph_1_${move["label"]}`), 
                    cy.getElementById(move["target"])
                );
            }); 
            
            let options = {
                num_of_versions: 2,
                partitions_per_row: 5,
                width: 100,
                height: 100
            };
            let layout = new AppendixLayout( cy, options );
            layout.reformat();
            // let options = {
            //     num_of_versions: 2,
            //     partitions_per_row: 5,
            //     width: 100,
            //     height: 100,
            // };
            // const partitionLayoutOptions = {
            //     name: 'grid',
            //     nodeDimensionsIncludeLabels: true,
            //     avoidOverlap: true,
            //     condense: true,
            // };
            // const partitions = cy.nodes().filter((ele) => {
            //     return ele.data('element_type') === 'partition';
            // }); 
            // for(let i = 0; i < partitions.length; i++) {
            //     partitions[i].children().layout(partitionLayoutOptions).run();
            // }

            // const getAppendicesInfo = function() {
            //     let info = {};
            //     for(let i = 0; i < partitions.length; i++) {
            //         let partition_appendices = cy.filter((ele) => {
            //             return ele.data('parent') === `partition${i}` && ele.data('element_type') === 'appendix';
            //         })
            //         let total_width = 0;
            //         for(let j = 0; j < partition_appendices.length; j++) {
            //             total_width += partition_appendices[j].width();
            //             partition_appendices[j].data().width = partition_appendices[j].width();
            //         }
        
            //         info[`partition${i}`] = {
            //             total_width: total_width,
            //             largest_height: cy.collection(partition_appendices).max((ele) => {return ele.boundingBox().h})
            //         }
            //     }
            //     return info;
            // } 
            // const getBoundingBoxOfCommonNodes = function(cy_partition_node) {
            //     let common_nodes = cy_partition_node.children().filter((ele) => {
            //         return (ele.data('element_type') === 'common' || ele.data('element_type') === 'invisible' || ele.data('element_type') === 'common+');
            //     });
                
            //     let boundingBox = {
            //         x1: common_nodes[0].boundingBox().x1,
            //         x2: common_nodes[0].boundingBox().x2,
            //         y1: common_nodes[0].boundingBox().y1,
            //         y2: common_nodes[0].boundingBox().y2,
            //     }
            //     let center_point = {
            //         x1: common_nodes[0].position().x,
            //         x2: common_nodes[0].position().x,
            //         y1: common_nodes[0].position().y,
            //         y2: common_nodes[0].position().y,
            //     }

            //     for(let i = 1; i < common_nodes.length; i++) {
            //         if (common_nodes[i].boundingBox().x1 < boundingBox.x1) {
            //             boundingBox.x1 = common_nodes[i].boundingBox().x1; 
            //             center_point.x1 = common_nodes[i].position().x; 
            //         } else if (common_nodes[i].boundingBox().x2 > boundingBox.x2) {
            //             boundingBox.x2 = common_nodes[i].boundingBox().x2; 
            //             center_point.x2 = common_nodes[i].position().x; 
            //         }

            //         if (common_nodes[i].boundingBox().y1 < boundingBox.y1) {
            //             boundingBox.y1 = common_nodes[i].boundingBox().y1; 
            //             center_point.y1 = common_nodes[i].position().y; 
            //         } else if (common_nodes[i].boundingBox().y2 > boundingBox.y2) {
            //             boundingBox.y2 = common_nodes[i].boundingBox().y2; 
            //             center_point.y2 = common_nodes[i].position().y; 
            //         }
            //     }

            //     boundingBox['center_point'] = {
            //         x: boundingBox.x1 + (boundingBox.x2 - boundingBox.x1) / 2,
            //         y: boundingBox.y1 + (boundingBox.y2 - boundingBox.y1) / 2 
            //     }

            //     return boundingBox;
            // }

            // const adjustDimensionsOfAppendices = function(appendix_info) {
            //     let adjusted_appendix_info = {};
            //     for(let partition in appendix_info) {
            //         let appendices = cy.filter((ele) => {
            //             return ele.data('parent') === partition && ele.data('element_type') === 'appendix';
            //         })
            //         let added_width = 0;
        
            //         for(let j = 0; j < appendices.length; j++) {
            //             appendices[j].data().height = appendix_info[partition].largest_height.value;
            //             if(cy.getElementById(partition).width() > appendix_info[partition].total_width) {
            //                 let remaining_width = cy.getElementById(partition).width() - appendix_info[partition].total_width;
            //                 appendices[j].data().width += (remaining_width / 2); // **Adjust this to add more width to the appendices
            //                 added_width += (remaining_width / 2);
            //             }
            //         }
        
            //         adjusted_appendix_info[partition] = {
            //             total_width: appendix_info[partition].total_width + added_width,
            //             largest_height: appendix_info[partition].largest_height.value
            //         } 
            //     }
            //     return adjusted_appendix_info;
            // }

            // const shiftAppendices = function(appendix_info) {
            //     for(let i = 0; i < partitions.length; i++) {
            //         let boundingBox = getBoundingBoxOfCommonNodes(cy.getElementById(`partition${i}`));
            //         let last_appendix_x_pos = boundingBox['center_point'].x + ( appendix_info[`partition${i}`].total_width / 2);
            //         for(let j = options.num_of_versions; j > 0; j--) {
            //             let appendix = cy.getElementById(`partition${i}_appendix${j}`);
            //             appendix.shift({
            //                 x: last_appendix_x_pos - appendix.boundingBox().x2,
            //                 y: (boundingBox.y2 - appendix.boundingBox().y1) + 50
            //             });
            //             last_appendix_x_pos = appendix.boundingBox().x1; 
            //         }
            //     }
            // } 


            // const adjustPartitionPositions = function() {
            //     const partitions_per_row = options.partitions_per_row;
            //     let previous_partition_position = {
            //         x: 0,
            //         y: 0,
            //         first_row_x1_pos: 0, 
            //         first_row_y2_pos: 0
            //     }
        
            //     for(let i = 0; i < partitions.length; i++ ) {
            //         let partition = cy.getElementById(`partition${i}`);
            //         if(i % partitions_per_row === 0) {
            //             partition.shift({
            //                 x: previous_partition_position.first_row_x1_pos - partition.boundingBox().x1,
            //                 y: previous_partition_position.first_row_y2_pos - partition.boundingBox().y1 + 100
            //             });
            //             previous_partition_position.first_row_x1_pos = partition.boundingBox().x1;
            //             previous_partition_position.first_row_y2_pos = partition.boundingBox().y2;
            //         } else {
            //             partition.shift({
            //                 x: previous_partition_position.x - partition.boundingBox().x1 + 100,
            //                 y: previous_partition_position.y - partition.boundingBox().y1
            //             });
            //         }
            //         previous_partition_position.x = partition.boundingBox().x2; 
            //         previous_partition_position.y = partition.boundingBox().y1; 
            //         if(partition.boundingBox().y2 > previous_partition_position.first_row_y2_pos) {
            //             previous_partition_position.first_row_y2_pos = partition.boundingBox().y2;
            //         }
            //     }
        
            //     cy.fit();
            // }

            // let appendix_info = getAppendicesInfo();
            // shiftAppendices(appendix_info);
            // // appendix_info = adjustDimensionsOfAppendices(appendix_info);
            // adjustPartitionPositions();
        }

        if(prevProps.searchedClassName !== this.props.searchedClassName) {
            cy.elements().removeClass('deactivate').removeClass('highlight');
            this._onSearchClassName();
        }

        if (prevProps.clickedClassName !== this.props.clickedClassName) {
            cy.fit(cy.elements().filter((ele) => {
                return ele.id().toLowerCase() == (this.props.clickedClassName.toLowerCase()) && !ele.isEdge();
            }), 50);
        }
    }

    _onSearchClassName() {
        let selectedElements = [];
        let displaySearchResults = [];

        if(this.props.searchedClassName !== "") {
            selectedElements = this.state.cy.elements().filter((ele) => {
                return (ele.data("label") && ele.data().label.toLowerCase().includes(this.props.searchedClassName.toLowerCase().trim()) && !ele.isEdge()) || ele.data('element_type') === this.state.element_types.invisible_node;
            });
        
            selectedElements.forEach((ele) => {
                if (!ele.isParent()) {
                    selectedElements = selectedElements.union(ele.parent());
                    if (ele.parent().parent()) {
                        selectedElements = selectedElements.union(ele.parent().parent());
                    }
                }
            });

            let unselectedElements = this.state.cy.elements().difference(selectedElements);
            unselectedElements.addClass('deactivate');
            
            displaySearchResults = selectedElements.filter((ele) => {
               return !(ele.data('element_type') == 'partition' || ele.data('element_type') == 'invisible' || ele.data('id').toLowerCase().includes('appendix'));
           })
           .map((ele) => {
                {
                    if (ele.data("version") === 0) {
                        return ele;
                    } else {
                        let copy_ele = ele.copy(); 
                        copy_ele.data().label = `V${this.props.selectedDecompositions[ele.data("version") - 1][1] + 1}-${ele.data("label")}`;
                        return copy_ele;
                    }
                }}
           )

           console.log(displaySearchResults)

            if (selectedElements.length == 0) {
                this.state.cy.fit(this.state.cy.elements(), 50);
            } else {
                this.state.cy.fit(displaySearchResults, 50);
            }
        } else {
            this.state.cy.fit(this.state.cy.elements(), 50);
        }

        this.props.updateSearchResults(displaySearchResults);
    }

    componentWillUnmount() {
        this.props.saveGraph(this.state.cy.json());
    }

    render() {
        return (
            <div>
                <div className="custom-graph-container">
                    <div style={{height: '100%', width: '79%', position: 'fixed'}} ref={ref => (this.ref = ref)}></div>
                </div>
            </div>
        );
    }
};