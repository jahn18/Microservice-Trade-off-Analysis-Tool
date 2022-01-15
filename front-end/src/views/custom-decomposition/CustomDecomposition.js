import React from "react";
import cytoscape from 'cytoscape';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import cxtmenu from 'cytoscape-cxtmenu';
import coseBilkent from 'cytoscape-cose-bilkent';
import CompoundDragAndDrop from '../../components/DragAndDrop/CompoundDragAndDrop';
import Utils from '../../utils';

cytoscape.use( cxtmenu );
cytoscape.use( nodeHtmlLabel );
cytoscape.use( coseBilkent );

export class CustomDecomposition extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            element_types: {
                partition: 'partition',
                common_node: 'common',
                invisible_node: 'invisible',
                moved_node: 'common*'
            },
        }

        this.ref = React.createRef();
        this.onSelectedNode = this.onSelectedNode.bind(this);
        this.unhighlightNodes = this.unhighlightNodes.bind(this);
        this._onDeleteRowsFromChangeHistory = this._onDeleteRowsFromChangeHistory.bind(this);
    };

    componentDidMount() {
        const {
            element_types,
        } = this.state;
        
        let cy = cytoscape({
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
                            return '#cdcdcd';
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
                            return (parseFloat(edge.data('weight')) * 3.5 + 3)  
                        },
                        'line-color': 'data(color)',
                        'target-arrow-color': 'data(color)',
                        'target-arrow-shape': 'vee',
                        'curve-style': 'bezier',
                        'arrow-scale': 1.25
                    }
                },
                {
                    'selector': 'edge.control',
                    'style': {
                        'line-style': 'dashed',
                        'line-color': 'red',
                        'target-arrow-color': 'red',
                        'target-arrow-shape': 'vee',
                        'curve-style': 'bezier',
                        'arrow-scale': 1.25,
                        'opacity': 1.0
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
                    'selector': 'node.addPlusSign',
                    'style': {
                        'opacity': 1.0
                    }
                },
                {
                    'selector': 'edge.highlight',
                    'style': {
                        'mid-target-arrow-color': 'black',
                        'label': 'data(weight)',
                        'text-outline-width': '3',
                        'text-outline-color': 'white',
                        'font-size': '25px'
                    }
                },
                { 
                    'selector': 'edge.deactivate',
                    'style': {
                        'opacity': 0.075,
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

        // This must be rendered first before the menu or else the DOM elements will not be configured correctly.
        cy.nodeHtmlLabel([{
                query: 'node',
                halign: 'center',
                valign: 'center',
                halignBox: 'center',
                valignBox: 'center',
                tpl: (data) => {
                    if(data.element_type === element_types.moved_node || data.isMovedGhostNode === true) {
                        return '<h1 style="color:white;">' + '+' + '</h1>';
                    } 
                }
        }]);

        let cdnd = new CompoundDragAndDrop(
            cy, 
            {
                padding: 10, 
                grabbedNode: node => true, 
                dropTarget: node => node.data('element_type') === element_types.partition,
                onMovedNode: (event, sourceNode, targetNode) => this.onMovedNode(event, sourceNode, targetNode),
                dropBoundary: (ele) => {return { 
                     bb: {
                           x1: ele.boundingBox().x1, 
                           x2: ele.boundingBox().x2, 
                           y1: ele.boundingBox().y1, 
                           y2: ele.boundingBox().y2, 
                        } 
                    } 
                },
                canMoveNode: [element_types.common_node, "ghost"],
                onMouseOver: (node) => this.onSelectedNode(node),
                onMouseOut: () => this.unhighlightNodes()
            }
        );
        cdnd.run();

        if(this.props.decomposition.elements.nodes) {
            cy.add(this.props.decomposition.elements.nodes).layout({name: 'preset'}).run()
            cy.pan(this.props.decomposition.pan);
            cy.zoom(this.props.decomposition.zoom);
        } else {
            cy.add(this.props.decomposition.elements);
            cy.layout({
                name: 'cose-bilkent',
                nodeDimensionsIncludeLabels: true,
                tilingPaddingVertical: 40,
                tilingPaddingHorizontal: 40,
                fit: true,
                animate: false
            }).run();
            this.adjustPartitionPositions(cy, 5);
            cy.fit(cy.elements(), 100);
        }


        this.setState({
            cy: cy,
            edges: []
        });
    }

    unhighlightNodes() {
        const {
            cy
        } = this.state;
        cy.elements().removeClass('highlight').removeClass('deactivate').removeClass('addPlusSign');
    }

    adjustPartitionPositions(cy, partitions_per_row) {
        let previous_partition_position = {
            x: 0,
            y: 0,
            first_row_x1_pos: 0, 
            first_row_y2_pos: 0
        }
        
        cy.elements().filter((ele) => ele.data().element_type === "partition").map((node) => node.data().id).sort().forEach((partitionName, i) => {
            let partition = cy.getElementById(partitionName);
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
        });
    }

    onSelectedNode(ele) { 
        const {
            cy,
        } = this.state; 

        let sel = ele;
        let selectedElements = cy.collection([sel, sel.parent()]);
        selectedElements = selectedElements
            .union(
                cy.collection(selectedElements.incomers().map((ele) => (ele.isEdge()) ? ele : [ele, ele.parent()]).flat())
            ).union(
                cy.collection(selectedElements.outgoers().map((ele) => (ele.isEdge()) ? ele : [ele, ele.parent()]).flat())
            );
        
        selectedElements.addClass('highlight');
        cy.elements().difference(selectedElements).addClass('deactivate');
    }

    highlightSelectedElements = (elementsSelectedOnTable) => {
        let {
            cy,
            element_types
        } = this.state; 

        let selected_elements = cy.collection();

        elementsSelectedOnTable = [...new Set(elementsSelectedOnTable)]
        for(let movedElementInfo of elementsSelectedOnTable) {
            selected_elements = selected_elements.union(
                                        movedElementInfo.movedNode
                                    ).union(
                                        movedElementInfo.currPartition
                                    ).union(
                                        movedElementInfo.targetPartition
                                    ); 
                                        
            cy.add({
                group: 'edges',
                data: {
                    source: movedElementInfo.currPartition.id(),
                    target: movedElementInfo.movedNode.id(),
                    weight: 0.1,
                    color: 'black'
                },
                classes: 'control'
            });
        }

        selected_elements = selected_elements.union(cy.elements().filter((ele) => {
            return ele.data('element_type') === element_types.invisible_node || ele.hasClass('control');
        }));

        let unselected_elements = cy.elements().difference(selected_elements);

        unselected_elements.addClass('deactivate');
    }

    onMovedNode(position, sourceNode, targetNode) { 
        const {
            cy,
            element_types,
            edges
        } = this.state; 

        if(sourceNode.data().element_type !== element_types.partition) {

            let prev_element = sourceNode.data().element_type;
            let prev_partition = sourceNode.data().partition; 

            cy.remove(sourceNode);

            if(sourceNode.data().element_type === element_types.moved_node) {
                prev_element = sourceNode.data().prev_element_type;
                prev_partition = sourceNode.data().prev_partition;
            } 


            cy.add({
                group: 'nodes',
                data: {
                    id: sourceNode.data('id'),
                    label: sourceNode.data('label'),
                    parent: targetNode.id(),
                    // if the node is moved back to its original position, then keep its type to common node
                    element_type: element_types.moved_node,
                    prev_element_type: prev_element,
                    background_color: 'grey',
                    partition: targetNode.id(),
                    prev_partition: prev_partition,
                    showMinusSign: false
                },
                position: position,
            });
            
            // Should also hide common elements if they get moved. 
            let common_nodes = sourceNode.parent().children().filter((ele) => {
                    return ele.data('element_type') === element_types.common_node;
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
                        y: sourceNode.parent().position().y,
                    }
                }]); 
                cy.getElementById(`invisible_node_${sourceNode.parent().id()}`).addClass('hide');
            }
            const originalPartition = sourceNode.data('prev_partition') ? sourceNode.data('prev_partition') : sourceNode.data('partition');
            // Update the evolutionary history table. 
            this.props.addMove(sourceNode, cy.getElementById(originalPartition), targetNode);
            this.props.saveGraph(cy.json());

            // fixes the bug where edges are not attached after moving a node.
            cy.edges().remove();
            cy.add(edges);
        }
    }

    _onDeleteRowsFromChangeHistory = (elementsSelectedOnTable) => {
        const {
            cy,
            edges
        } = this.state;

        const zoom = cy.zoom();
        const pan = cy.pan();

        elementsSelectedOnTable.forEach((movedElementInfo) => {
            const {movedNode, currPartition, currPartitionRelativePos} = movedElementInfo; 
            // Remove the moved node. 
            let currentMovedNode = cy.getElementById(movedNode.data('label'));
            let parentNode = currentMovedNode.parent();
            if (parentNode.children().length === 1) {
                cy.remove(parentNode);
            } 
            cy.remove(currentMovedNode); 
            movedNode.data().parent = currPartition.id();
            cy.add(movedNode.position({
                x: currPartition.position('x') + currPartitionRelativePos.x,
                y: currPartition.position('y') + currPartitionRelativePos.y
            }));
        });

        cy.elements().removeClass('addPlusSign');
        cy.edges().remove();
        cy.add(edges);
        this.props.saveGraph(cy.json());
        cy.pan(pan);
        cy.zoom(zoom);
    }

    componentDidUpdate(prevProps) {
        const {
            cy
        } = this.state;

        if (this.props.resetMoves) {
            this._onDeleteRowsFromChangeHistory(prevProps.selectedElements);
            this.props.clearChangeHistoryTable();
        }

        if (prevProps.selectedElements !== this.props.selectedElements) {
            cy.elements().removeClass('deactivate').removeClass('highlight');
            cy.elements().filter((ele) => ele.hasClass('control')).remove();
            if (this.props.mouseOverChangeHistory) {
                this.highlightSelectedElements(this.props.selectedElements);
            }
        }
        
        if (prevProps.selectedTab !== this.props.selectedTab) {
            this.props.saveGraph(cy.json(), prevProps.selectedTab);
            this._onDecompositionChange();
        }
        
        const newEdges = Utils.updateGraphEdges(this.props.relationshipTypes);
        // if (Object.keys(prevProps.relationshipTypes).map((key) => prevProps.relationshipTypes[key].minimumEdgeWeight) !== Object.keys(this.props.relationshipTypes).map((key) => this.props.relationshipTypes[key].minimumEdgeWeight)) {
        if (newEdges.length !== this.state.edges.length) {
            cy.edges().filter((edge) => !edge.hasClass('control')).remove();
            cy.add(newEdges);
            this.setState({edges: newEdges});
        }

        if(prevProps.searchedClassName !== this.props.searchedClassName) {
            this._onSearchedClassName();
        }
    }

    _onSearchedClassName() {
        if(this.props.searchedClassName !== "") {
            let selectedElements = this.state.cy.elements().filter((ele) => {
                return ele.id().toLowerCase().startsWith(this.props.searchedClassName.toLowerCase()) && !ele.isEdge() || ele.data('element_type') === this.state.element_types.invisible_node;
            });

            selectedElements.forEach((ele) => {
                if (!ele.isParent()) {
                    selectedElements = selectedElements.union(ele.parent());
                }
            });

            let unselectedElements = this.state.cy.elements().difference(selectedElements);
            unselectedElements.addClass('deactivate');
        }
    }

    _onDecompositionChange() {
        let {
            cy,
            element_types,
            edges
        } = this.state;

        cy.remove('node');
        if(this.props.decomposition.elements.nodes) {
            let partitions = [];
            for(let i = 0; i < this.props.decomposition.elements.nodes.length; i++) {
                if(this.props.decomposition.elements.nodes[i].data.element_type === element_types.partition) {
                        partitions.push(this.props.decomposition.elements.nodes[i]);
                }
            }
            cy.add(partitions);
            cy.json({elements:this.props.decomposition.elements.nodes}).layout({name: 'preset'}).run();
            cy.pan(this.props.decomposition.pan);
            cy.zoom(this.props.decomposition.zoom);
        } else {
            cy.add(this.props.decomposition.elements);
            cy.layout({
                name: 'cose-bilkent',
                nodeDimensionsIncludeLabels: true,
                tilingPaddingVertical: 40,
                tilingPaddingHorizontal: 40,
                fit: true,
                animate: false
            }).run();
            this.adjustPartitionPositions(cy, 5);
            cy.fit(cy.elements(), 100);
        }
        cy.add(edges);
    }

    componentWillUnmount(){
        this.props.saveGraph(this.state.cy.json(), this.props.selectedTab);
    }

    render() {
        return (
            <div style={{height: '100%', width: '79%', position: 'fixed'}} ref={ref => (this.ref = ref)}></div>
        );
    }
};
