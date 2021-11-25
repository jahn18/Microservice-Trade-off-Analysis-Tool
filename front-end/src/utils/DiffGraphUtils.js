import { Decomposition } from "../models/Decomposition";
import { CommonClassNode } from "../models/Nodes/CommonClassNode";
import { DiffClassNode } from "../models/Nodes/DiffClassNode";
import { InvisibleClassNode } from "../models/Nodes/InvisibleClassNode";
import { MatchedPartitionNode } from "../models/Nodes/MatchedPartitionNode";
import { GraphMatchingUtils } from "./GraphMatchingUtils";

export class DiffGraphUtils {

    /**
     * Returns a decomposition used for the diff-view. 
     */
    getDiffDecomposition(decompositionOne, decompositionTwo, diffNodeOneColor, diffNodeTwoColor) {
        let classNodeList = [];
        let matchedPartitionList = [];

        new GraphMatchingUtils().matchPartitions(decompositionOne, decompositionTwo).matching.forEach((match, index) => {
            let partitionOne = [];
            let partitionTwo = [];
            let partitionLabelOne = undefined;
            let partitionLabelTwo = undefined;

            try {
                partitionOne = decompositionOne.getPartitionClassNodes(match[0], true);
                partitionLabelOne = decompositionOne.getPartitionNode(match[0]).getLabel();
            } catch (e) {} 

            try {
                partitionTwo = decompositionTwo.getPartitionClassNodes(match[1], true);
                partitionLabelTwo = decompositionTwo.getPartitionNode(match[1]).getLabel();
            } catch (e) {}

            let commonClassNodes = this._getCommonClassNodes(partitionOne, partitionTwo, `partition${index}`);
            // There are no common nodes between the matched partitions, then add an invisible node. 
            if (commonClassNodes.length === 0) {
                commonClassNodes.push(new InvisibleClassNode(`invisible_node_partition${index}`, `invisible_node${index}`, `partition${index}`));
            }
            classNodeList.push(commonClassNodes.concat(this._getDiffClassNodes(partitionOne, partitionTwo, diffNodeOneColor, diffNodeTwoColor, `partition${index}`)));
            matchedPartitionList.push(new MatchedPartitionNode(`partition${index}`, decompositionOne.getVersion(), decompositionTwo.getVersion(), partitionLabelOne, partitionLabelTwo))
        });

        return new Decomposition(classNodeList, matchedPartitionList); 
    }

    _getDiffClassNodes(partitionOne, partitionTwo, diffOneColor, diffTwoColor, matchedPartitionId) {
        return partitionOne.filter((x) => !partitionTwo.includes(x)).map((nodeId) => new DiffClassNode(`graph_1_${nodeId}`, nodeId, 1, diffOneColor, matchedPartitionId))
            .concat(
                partitionTwo.filter((x) => !partitionOne.includes(x)).map((nodeId) => new DiffClassNode(`graph_2_${nodeId}`, nodeId, 2, diffTwoColor, matchedPartitionId))
            )
    }

    _getCommonClassNodes(partitionOne, partitionTwo, matchedPartitionId) {
        return partitionOne.filter(x => partitionTwo.includes(x)).map((nodeId) => new CommonClassNode(`graph_0_${nodeId}`, nodeId, matchedPartitionId));
    }
}