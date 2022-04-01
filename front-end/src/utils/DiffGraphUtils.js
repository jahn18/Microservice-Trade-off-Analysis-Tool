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
    getDiffDecomposition(decompositionOne, decompositionTwo, diffNodeOneColor, diffNodeTwoColor, versionOne, versionTwo) {
        let classNodeList = [];
        let matchedPartitionList = [];

        new GraphMatchingUtils().matchPartitions(decompositionOne, decompositionTwo).partitionMatching.forEach((match, index) => {
            let cytoscapeElementsOne = (decompositionOne.elements.nodes) ? decompositionOne.elements.nodes : decompositionOne.elements;
            let cytoscapeElementsTwo = (decompositionTwo.elements.nodes) ? decompositionTwo.elements.nodes : decompositionTwo.elements;
            let partitionLabelOne = cytoscapeElementsOne.filter((ele) => ele.data.id === match[0])[0]?.data.label || undefined;
            let partitionLabelTwo = cytoscapeElementsTwo.filter((ele) => ele.data.id === match[1])[0]?.data.label || undefined;
            let partitionOne = cytoscapeElementsOne.filter((ele) => ele.data.parent && ele.data.parent === match[0] && ele.data.element_type !== "invisible").map((ele) => ele.data.id); 
            let partitionTwo = cytoscapeElementsTwo.filter((ele) => ele.data.parent && ele.data.parent === match[1] && ele.data.element_type !== "invisible").map((ele) => ele.data.id);

            let commonClassNodes = this._getCommonClassNodes(partitionOne, partitionTwo, `partition${index}`);
            // There are no common nodes between the matched partitions, then add an invisible node. 
            if (commonClassNodes.length === 0) {
                commonClassNodes.push(new InvisibleClassNode(`invisible_node_partition${index}`, `invisible_node${index}`, `partition${index}`));
            }
            classNodeList.push(commonClassNodes.concat(this._getDiffClassNodes(partitionOne, partitionTwo, diffNodeOneColor, diffNodeTwoColor, `partition${index}`)));
            matchedPartitionList.push(new MatchedPartitionNode(`partition${index}`, index, versionOne, versionTwo, partitionLabelOne, partitionLabelTwo))
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