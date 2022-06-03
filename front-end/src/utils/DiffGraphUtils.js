import { Decomposition } from "../models/Decomposition";
import { CommonClassNode } from "../models/Nodes/CommonClassNode";
import { DiffClassNode } from "../models/Nodes/DiffClassNode";
import { InvisibleClassNode } from "../models/Nodes/InvisibleClassNode";
import { MatchedPartitionNode } from "../models/Nodes/MatchedPartitionNode";
import { GraphMatchingUtils } from "./GraphMatchingUtils";

var VERSION_ZERO = 0
var VERSION_ONE = 1
var VERSION_TWO = 2

/**
 * Matches two decompositions and produces a graph (in Cytoscape format) for the diff-view.
 * The ids for common nodes are denoted as "graph_0_[node_id]." They have a "graph_0" in their name
 * The ids for the diff nodes either have a "graph_1" or a "graph_2" in their name. 
 * The ids for partitions/clusters are "partition[number]."
 * Invisible nodes are needed for the visualization; they will "invisible" in their ids.   
 */

export class DiffGraphUtils {

    /**
     * Returns a decomposition used for the diff-view. 
     */
    getDiffDecomposition(decompositionOne, decompositionTwo, diffNodeOneColor, diffNodeTwoColor, versionOne, versionTwo) {
        let classNodeList = [];
        let matchedPartitionList = [];

        new GraphMatchingUtils().matchPartitions(decompositionOne, decompositionTwo).partitionMatching.forEach((match, index) => {
            let cytoscapeElementsOne = decompositionOne.elements.nodes;
            let cytoscapeElementsTwo = decompositionTwo.elements.nodes;
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
        return partitionOne.filter((x) => !partitionTwo.includes(x)).map((nodeId) => new DiffClassNode(`graph_${VERSION_ONE}_${nodeId}`, nodeId, VERSION_ONE, diffOneColor, matchedPartitionId))
            .concat(
                partitionTwo.filter((x) => !partitionOne.includes(x)).map((nodeId) => new DiffClassNode(`graph_${VERSION_TWO}_${nodeId}`, nodeId, VERSION_TWO, diffTwoColor, matchedPartitionId))
            )
    }

    _getCommonClassNodes(partitionOne, partitionTwo, matchedPartitionId) {
        return partitionOne.filter(x => partitionTwo.includes(x)).map((nodeId) => new CommonClassNode(`graph_${VERSION_ZERO}_${nodeId}`, nodeId, matchedPartitionId));
    }
}