/**
 * A store to manage and retrieve data for a change history table. 
 */
export class ChangeHistoryStore {
    _changeHistoryCache; 

    constructor() {
        this._changeHistoryCache = {
            allMoveOps: [],
            indivElementHistories: {}
        };
    }

    /**
     * Sets the current cache to a change history store that was saved locally.
     * (Used for REDUX) 
     */
    loadChangeHistoryStore(loadedChangeHistoryStore) {
        this._changeHistoryCache = {...loadedChangeHistoryStore};
    }

    /**
     * Adds a new move to the change history table when the user moves a node into a different partition. 
     * 
     * @param {CytoscapeElement} sourceNode the node that is being moved. 
     * @param {CytoscapeElement} prevPartitionNode the compound node the source node was previously in. 
     * @param {CytoscapeElement} newPartitionNode the new compound node the source node is being moved to. 
     */
    addNewMove(sourceNode, currPartitionNode, newPartitionNode) {
        const newMoveInfo = this._formatMoveElementInfo(sourceNode, currPartitionNode, newPartitionNode);

        if (!this._changeHistoryCache.indivElementHistories[sourceNode.data('label')]) {
            this._changeHistoryCache.indivElementHistories[sourceNode.data('label')] = [newMoveInfo];
        } else {
            this._changeHistoryCache.indivElementHistories[sourceNode.data('label')].push(newMoveInfo);
        }

        this._changeHistoryCache.allMoveOps.push(newMoveInfo);
    }

    /**
     * Undo a move operation. Removes the move operation that is stored in the cache.  
     * Under the specifications of the tool, you can only "undo" the last move operation performed on a particular element. 
     * 
     * @param {CytoscapeElement} movedElement the cytoscape node you would like to "undo" a move operation on. 
     * @return {Dictionary} returns the information on the move operation that was reverted.
     */
    undoMove(movedElement) {
        const movedElementInfo = this._changeHistoryCache.indivElementHistories[movedElement.data('label')].pop();
        this._changeHistoryCache.allMoveOps = this._changeHistoryCache.allMoveOps.filter((eleInfo) => eleInfo !== movedElementInfo);
        return movedElementInfo;
    }  

    /**
     * Formats the information for a given move operation. 
     * This content is stored in the change history cache.   
     * 
     * @returns {Dictionary} the info on the move operation.
     */
    _formatMoveElementInfo(sourceNode, currPartitionNode, newPartitionNode) {
        return {
            movedNode: sourceNode,
            currPartition: currPartitionNode,
            currPartitionRelativePos: this._getRelativePositionInPartition(sourceNode, currPartitionNode),
            targetPartition: newPartitionNode,
            moveNumber: this._changeHistoryCache.indivElementHistories[sourceNode.data('label')]?.length || 0
        };
    }

    /**
     * Get's the source node's relative position within the partition (compound node) its in. 
     * 
     * @returns {Dictionary} the relative position coordinates.  
     */
    _getRelativePositionInPartition(sourceNode, partitionNode) {
        return {
            x: sourceNode.position('x') - partitionNode.position('x'), 
            y: sourceNode.position('y') - partitionNode.position('y')
        };
    }

    /**
     * Give a node's move-number, this function checks if it is the first move operation performed on that element.
     *  
     * @returns {boolean} true if it's the first move, false if not. 
     */
    isFirstMove = (moveElementInfo) => {
        return moveElementInfo.moveNumber === 0;
    }

    /**
     * Given a node and its move-number, this function checks if it is the lastest move operation 
     * performed on that element.
     * 
     * @returns {boolean} true if it's the lastest move, false if not. 
     */
    isLastestMove = (moveElementInfo) => {
        return moveElementInfo.moveNumber === this._changeHistoryCache.indivElementHistories[moveElementInfo.movedNode.data('label')].length - 1; 
    }

    getAllMoveOperations = () => {
        return [...this._changeHistoryCache.allMoveOps];
    }

    /**
     * @returns a copy of all the data stored in the Change History
     */
    getChangeHistory = () => {
        return {...this._changeHistoryCache};
    }
    
} 