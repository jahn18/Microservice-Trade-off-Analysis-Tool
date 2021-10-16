/*
 * Enables drag-and-drop features to the cytoscape instance used. 
 */

/**
 * Constructor of the method. 
 * @param {*} cy - the cytoscape instance.
 * @param {*} options - padding: how much the partition should expand before the child node is pulled out.
 *                    - dropTarget: (filter function) specifies what can be the drop target. n => ... funciton
 *                    - grabbedNode: (filter function) specifies which nodes are valid to grab and drop
 */
function CompoundDragAndDrop( cy, options ) {
    this.cy = cy;
    this.options = options;
}

CompoundDragAndDrop.prototype.run = function() {
    let cy = this.cy;
    const options = this.options;

    // Instantiate variables
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
    const getPositionCopy = p => ({x: p.x, y: p.y});

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
        return cy.nodes(canBeInBoundsTuple).map( ele => {
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
        })
    };

    const boundsOverlap = (bb1, bb2) => {
        // case: one bb to right of other
        if( bb1.x1 > bb2.x2 ){ return false; }
        if( bb2.x1 > bb1.x2 ){ return false; }
      
        // case: one bb to left of other
        if( bb1.x2 < bb2.x1 ){ return false; }
        if( bb2.x2 < bb1.x1 ){ return false; }
      
        // case: one bb above other
        if( bb1.y2 < bb2.y1 ){ return false; }
        if( bb2.y2 < bb1.y1 ){ return false; }
      
        // case: one bb below other
        if( bb1.y1 > bb2.y2 ){ return false; }
        if( bb2.y1 > bb1.y2 ){ return false; }
      
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

    // Fix a bug if the node clicks. 

    cy.on('mouseover', 'node', e => {
        const node = e.target;

        // If you're not hovering over a common node, then remove the "Ghost node" that 
        // is currently being highlighted. 
        if(node.data('element_type') === 'partition' || 
            node.data('element_type') === 'appendix' || 
            node.data('element_type') === 'invisible') {
            let collection = cy.nodes(e => e.data('element_type') === 'ghost');
            cy.remove(collection);
            return;
        }

        // If the element being hovered over is not a ghost node, and a potential moving node
        // has not been selected then set the potential moving node. 
        if(node.data('element_type') !== 'ghost' && potentialMovingNode.length === 0) {
            potentialMovingNode = node;
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
                    isMovedGhostNode: (potentialMovingNode.data('element_type') === 'common*') ? true : false
                },
                position: getPositionCopy(node.position())
            });
        }
        // mouseoverNode.addClass('hide');
        // cy.remove(node);
    });

    cy.on('mouseout', 'node', (e) => {
        if((e.target.data('element_type') !== 'ghost' && e.target.id() !== potentialMovingNode.id())) {
            let collection = cy.nodes(e => e.data('element_type') === 'ghost');
            cy.remove(collection);
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
        // MODIFY** This is to remove the highlights if edges are shown
        cy.remove('edge');
        cy.elements().forEach((ele) => {
            ele.removeClass('deactivate');
            if(ele.data().element_type !== 'diff') {
                ele.data().showMinusSign = false;
            }
        })
        potentialMovingNode.addClass('hide');
        boundsTuples = updateBoundsTuples();
    });

    cy.on('drag', 'node', (e) => {
        const node = e.target;
        if(node.data('element_type') === 'partition' || 
            node.data('element_type') === 'appendix' || 
            node.data('element_type') === 'invisible' ||
            // Prevents all children of the partition from being called in this event. A potential moving node will only have length > 0 if a non-compound node is dragged.
            potentialMovingNode.length === 0 ) {
            return;
        }
        const bb = expandBounds( getBounds(node), 0 );
        const tupleOverlaps = t => boundsOverlap(bb, t.bb);
        // Clear the highlight of partitions when hovering over it when a node
        cy.elements().removeClass('cdnd-drop-target');
        chosenParent = cy.collection();
        const overlappingNodes = boundsTuples.filter(tupleOverlaps).map(t => t.node);
        if( overlappingNodes.length > 0 ){ // potential parent
            const overlappingParents = overlappingNodes.filter(isParent);
            if( overlappingParents.length > 0 ){
                chosenParent = overlappingParents[0]; 
            }
            chosenParent.addClass('cdnd-drop-target');
        }
    });

    cy.on('free', 'node', (event) => {
        // Add the node here. 
        if (chosenParent.length > 0 && event.target.data('element_type') !== 'partition') {
            const position = getPositionCopy(event.target.position());
            // Just move the node within the partition itself if the a user moves it. 
            if ((potentialMovingNode.data('element_type') === 'common*' || potentialMovingNode.data('element_type') === 'common') 
                && potentialMovingNode.data('partition') === chosenParent.id()) {
                potentialMovingNode.shift({
                    x: position.x - potentialMovingNode.position().x,
                    y: position.y - potentialMovingNode.position().y
                });
            } else {
                // Move it to a new partition
                options.onMovedNode(position, potentialMovingNode, chosenParent);
            }
        }
        
        if(!clickedNode) {
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