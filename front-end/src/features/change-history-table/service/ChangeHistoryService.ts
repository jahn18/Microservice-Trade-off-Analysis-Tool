export class ChangeHistoryService {

    /**
     * Formats the information for a given move operation. 
     * This content is stored in the change history cache.   
     */ 
     formatMoveOperation(sourceNode: any, currPartitionNode: any, newPartitionNode: any, diffNode?: any) {
        return {
            movedNode: sourceNode,
            currPartition: currPartitionNode,
            currPartitionRelativePos: this._getRelativePositionInPartition(sourceNode, currPartitionNode),
            targetPartition: newPartitionNode,
            diffNode: diffNode
        };
    }

     /**
     * Get's the source node's relative position within the partition (compound node) its in. 
     * 
     * @returns {Dictionary} the relative position coordinates.  
     */
      _getRelativePositionInPartition(sourceNode: any, partitionNode: any) {
        return {
            x: sourceNode.position('x') - partitionNode.position('x'), 
            y: sourceNode.position('y') - partitionNode.position('y')
        };
    }

    printMoveOperationIndividualView(moveOperation: any) {
        let movedNode = moveOperation.movedNode.data('label');
        let currPartitionNum = moveOperation.currPartition.data('label');
        let targetPartition = moveOperation.targetPartition.data('label');

        return `${movedNode}: ${currPartitionNum} → ${targetPartition}`;
    }

    formatMoveOperationDiffView(moveOperation: any) {
        // const nodeMoveHistory = this._changeHistory.getChangeHistory().indivElementHistories;
        let target_node = moveOperation.movedNode.data().label;
        let previous_partitions = "";
        
        if(moveOperation.diffNode) {
            let partition_num = parseInt(moveOperation.movedNode.data().partition.match('[0-9]')) + 1;
            let partitionNumTwo = parseInt(moveOperation.diffNode.data().partition.match('[0-9]')) + 1
            previous_partitions = previous_partitions.concat(`M${partition_num} ᐱ M${partitionNumTwo}`);
        } else {
            let partition_num = parseInt(moveOperation.movedNode.data().partition.match('[0-9]')) + 1;
            previous_partitions = `M${partition_num}`;
        }

        let target_partition = parseInt((moveOperation.targetPartition.id()).match('[0-9]')) + 1;
        return `${target_node}: ${previous_partitions} → M${target_partition}`;
    }
}