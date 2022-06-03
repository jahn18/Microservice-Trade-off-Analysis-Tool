/*
 * Enables drag-and-drop features to the cytoscape instance used. 
 */

import { PartitionNode } from "../../models/Nodes/PartitionNode";

/**
 * Constructor of the method. 
 * @param {*} cy - the cytoscape instance.
 * @param {*} options - padding: how much the partition should expand before the child node is pulled out.
 *                    - dropTarget: (filter function) specifies what can be the drop target. n => ... funciton
 *                    - grabbedNode: (filter function) specifies which nodes are valid to grab and drop
 *                    - dropBoundary: (node: selectedNode) => {bb: boundingBox} determine the x1, x2, y1, y2 bounds where a node can be dropped on a compound node. 
 *                    - canMoveNode: string[] the node type that can move. 
 *                    - onMovedNode: when a node is moved
 */
function CompoundDragAndDrop(cy, options) {
    this.cy = cy;
    this.options = options;
}

CompoundDragAndDrop.prototype.run = function () {
    let cy = this.cy;
    const options = this.options;

    options.canMoveNode = ["ghost", ...options.canMoveNode];

    // init variables
    let potentialMovingNode = cy.collection();
    let clickedNode = false;

    // Helper functions
    const isParent = n => n.isParent();
    const isChild = n => n.isChild();
    const isOnlyChild = n => isChild(n) && n.parent().children().length === 1;

    const getBounds = n => n.boundingBox({ includeOverlays: false });
    const getBoundsTuple = n => ({ node: n, bb: copyBounds(getBounds(n)) });
    const copyBounds = bb => ({ x1: bb.x1, x2: bb.x2, y1: bb.y1, y2: bb.y2, w: bb.w, h: bb.h });
    const getBoundsCopy = n => copyBounds(getBounds(n));
    const getPositionCopy = p => ({ x: p.x, y: p.y });

    const removeParent = n => n.move({ parent: null });
    const setParent = (n, parent) => n.move({ parent: parent.id() });

    const canBeGrabbed = n => !isParent(n) && !isMultiplySelected(n) && options.grabbedNode(n);
    const canBeDropTarget = n => !isChild(n) && options.dropTarget(n);

    const isMultiplySelected = n => n.selected() && cy.elements('node:selected').length > 1;
    // const canBeDropSibling = n => isChild(n) && !n.same(grabbedNode) && options.dropSibling(n);
    const canPullFromParent = n => isChild(n);
    const canBeInBoundsTuple = n => (canBeDropTarget(n)); // || canBeDropSibling(n));

    // Updated this function so that the bounds of the partitions will be restricted to the "common node" space.
    const updateBoundsTuples = () => {
        return cy.nodes(canBeInBoundsTuple).map(ele => { return { node: ele, ...options.dropBoundary(ele) } });
    };

    const getNumOfPartitions = () => {
        return cy.elements().filter((ele) => ele.data("element_type") === "partition").length;
    }

    const getAllPartitionNodes = () => {
        return cy.elements().filter((ele) => ele.data("element_type") === "partition");
    }
    
    const updateAllPartitionLabels = (removedPartition) => {
        let removedPartitionNum = parseInt(removedPartition.data().label.match("[0-9]"));
        getAllPartitionNodes().forEach((partition) => {
            let partitionNum = parseInt(partition.data().label.match("[0-9]"));
            if (partitionNum > removedPartitionNum) {
                // partition.data().id = `partition${partitionNum - 1}`;
                partition.data().label = `P${partitionNum - 1}`;
            }
        });
    }

    const getAllParentNodes = () => {
        return cy.elements().filter((ele) => ele.isParent()).map(ele => {return {node: ele, bb: copyBounds(ele.boundingBox())}});
    }

    const boundsOverlap = (bb1, bb2) => {
        // case: one bb to right of other
        if (bb1.x1 > bb2.x2) { return false; }
        if (bb2.x1 > bb1.x2) { return false; }

        // case: one bb to left of other
        if (bb1.x2 < bb2.x1) { return false; }
        if (bb2.x2 < bb1.x1) { return false; }

        // case: one bb above other
        if (bb1.y2 < bb2.y1) { return false; }
        if (bb2.y2 < bb1.y1) { return false; }

        // case: one bb below other
        if (bb1.y1 > bb2.y2) { return false; }
        if (bb2.y1 > bb1.y2) { return false; }

        // otherwise, must have some overlap
        return true;
    };
    const expandBounds = (bb, padding) => {
        return {
            x1: bb.x1 - padding,
            x2: bb.x2 + padding,
            w: bb.w + 2 * padding,
            y1: bb.y1 - padding,
            y2: bb.y2 + padding,
            h: bb.h + 2 * padding
        };
    };

    // Gets all the potential partitions
    let boundsTuples = updateBoundsTuples();
    let chosenParent = cy.collection();

    cy.on('mouseover', 'node', e => {
        const node = e.target;

        if (!options.canMoveNode.includes(node.data("element_type"))) {
            if (node.data("element_type") === "common+") {
                options.onMouseOver(node);
            } else {
                options.onMouseOut();
            }
            cy.remove(cy.getElementById('ghost_node'));
            return;
        }

        // If the element being hovered over is not a ghost node, and a potential moving node
        // has not been selected then set the potential moving node. 
        if (node.data('element_type') !== 'ghost' && potentialMovingNode.length === 0 || (e.target.id() !== "ghost_node" && potentialMovingNode.length > 0)) {
            cy.remove(cy.getElementById('ghost_node'));

            potentialMovingNode = node;
            options.onMouseOver(potentialMovingNode);
            // Add the ghost node. 
            cy.add({
                classes: 'eh-source',
                data: {
                    id: `ghost_node`,
                    label: node.data('label'),
                    background_color: node.data('background_color'),
                    colored: false,
                    element_type: 'ghost',
                    showMinusSign: false,
                    partition: null,
                    parent: null,
                    realNodeId: node.id(),
                    isMovedGhostNode: (potentialMovingNode.data('element_type') === 'common+') ? true : false
                },
                position: getPositionCopy(node.position()),
                classes: "l1"
            });
        }
    });

    cy.on('mouseout', (e) => {
        if (e.target.data && (e.target.data("element_type") !== "common" && e.target.data("element_type") !== "common+" && e.target.data("element_type") !== "ghost")) {
            options.onMouseOut();
        }
    })

    cy.on('mouseout', 'node', (e) => {
        if ((e.target.data('element_type') !== 'ghost' && e.target.id() !== potentialMovingNode.id())) {
            // options.onMouseOut();
            cy.remove(cy.getElementById("ghost_node"));
            potentialMovingNode.removeClass('hide');
            potentialMovingNode = cy.collection();
        }
        clickedNode = false;
    });

    cy.on('click', 'node', e => {
        clickedNode = true;
        potentialMovingNode.removeClass('hide');
    })

    cy.on('grab', 'node', e => {
        cy.startBatch();
        cy.elements().removeClass('deactivate');
        cy.elements().forEach((ele) => {
            if (ele.data().element_type !== 'diff') {
                ele.data().showMinusSign = false;
            }
        })
        cy.endBatch();
        potentialMovingNode.addClass('hide');
        boundsTuples = updateBoundsTuples();
    });

    cy.on('drag', 'node', (e) => {
        const node = e.target;
        // Prevents all children of the partition from being called in this event. A potential moving node will only have length > 0 if a non-compound node is dragged.
        // if (!options.canMoveNode.includes(node.data("element_type")) || potentialMovingNode.length === 0) {
        //     return;
        // }

        if (potentialMovingNode.length === 0) {
            return;
        }
        
        const bb = expandBounds(getBounds(node), 0);
        const tupleOverlaps = t => boundsOverlap(bb, t.bb);
        // Clear the highlight of partitions when hovering over it when a node
        cy.elements().removeClass('cdnd-drop-target');
        chosenParent = cy.collection();
        const overlappingNodes = boundsTuples.filter(tupleOverlaps).map(t => t.node);
        if (overlappingNodes.length > 0) { // potential parent
            const overlappingParents = overlappingNodes.filter(isParent);
            if (overlappingParents.length > 0) {
                chosenParent = overlappingParents[0];
            }
            chosenParent.addClass('cdnd-drop-target');
        }
    });

    cy.on('free', 'node', (event) => {

        const bb = expandBounds(getBounds(event.target), 0);
        const tupleOverlaps = t => boundsOverlap(bb, t.bb);
        const overlappingCompoundNodes = getAllParentNodes().filter(tupleOverlaps).map(t => t.node);
        const position = getPositionCopy(event.target.position());
        // let removeParentPartition = undefined;

        // if (isOnlyChild(potentialMovingNode) && potentialMovingNode.data('partition') !== chosenParent.id()) {
        //     removeParentPartition = potentialMovingNode.parent(); 
        // }
        if (chosenParent.length > 0 && chosenParent.data('element_type') === 'partition' && event.target.data('element_type') !== 'partition') {
            // if (chosenParent.length > 0 && !canBeDropTarget(event.target)) {
            // Just move the node within the partition itself if the a user moves it. 
            if ((potentialMovingNode.data('element_type') === 'common+'
                || potentialMovingNode.data('element_type') === 'common')
                && potentialMovingNode.data('partition') === chosenParent.id()) {
                potentialMovingNode.shift({
                    x: position.x - potentialMovingNode.position().x,
                    y: position.y - potentialMovingNode.position().y
                });
            } else {
                // Move it to a new partition
                options.onMovedNode(position, potentialMovingNode, chosenParent);
                cy.startBatch();
                cy.elements().addClass('addPlusSign');
                cy.endBatch();
            }
        }
        // No parent was chosen here, so create a new partition for the new node. 
        else if (chosenParent.length === 0 && overlappingCompoundNodes.length === 0 && isChild(potentialMovingNode)) {
            const numOfPartitions = getNumOfPartitions();
            let partition = new PartitionNode(`partition${numOfPartitions}`, `P${numOfPartitions + 1}`).getCytoscapeData();
            partition['position'] = {
                x: position.x,
                y: position.y
            }
            partition = cy.add(partition);
            options.onMovedNode(position, potentialMovingNode, partition);
            cy.startBatch();
            cy.elements().addClass('addPlusSign');
            cy.endBatch();
        }

        // Handles the case when all nodes have been moved, then 
        // if (removeParentPartition) {
        //     updateAllPartitionLabels(removeParentPartition);
        //     cy.remove(removeParentPartition); 
        // }

        if (!clickedNode) {
            let collection = cy.nodes(e => e.data('element_type') === 'ghost');
            cy.remove(collection);
            // Clear the highlight of partitions when hovering over it when a node
            cy.elements().removeClass('cdnd-drop-target');
            chosenParent = cy.collection();
            potentialMovingNode.removeClass('hide');
            potentialMovingNode = cy.collection();
        } else {
            clickedNode = false;
        }
    })
}

export default CompoundDragAndDrop;