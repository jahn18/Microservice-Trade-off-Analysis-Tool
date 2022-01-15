import munkres from "munkres-js";
import { Decomposition } from "../models/Decomposition";

export class GraphMatchingUtils {

    /**
     * Matches the partitions between two decompositions by performing a bipartite matching algorithm 
     * 
     * @param {Decomposition} decompositionOne 
     * @param {Decomposition} decompositionTwo 
     * 
     * @returns the matching of all partitions, the cost matrix, and the similiarity matrix. 
     */
    matchPartitions(decompositionOne, decompositionTwo) {
        let {similarityMatrix, maxValue, partitionsOne, partitionsTwo} = this._constructSimilarityMatrix(decompositionOne, decompositionTwo);

        let matching = this._getMaximumWeightedMatch(maxValue, similarityMatrix);

        // partitionMatching matches the correct partition numbers once they are moved. 
        return {similarityMatrix: similarityMatrix, matching: matching, partitionMatching: matching.map((match) => [partitionsOne[match[0]], partitionsTwo[match[1]]])}
    }

    _getAllPartitions(decomposition) {
        // depends on the format being used: if elements.nodes then cytoscape format, but if decompostion.elements its used the JSON loaded decomposition format. 
        let cytoscapeElements = (decomposition.elements.nodes) ? decomposition.elements.nodes : decomposition.elements;
        return cytoscapeElements.filter((ele) => ele.data.element_type === "partition").map((node) => node.data.id);
    }

    _constructSimilarityMatrix(decompositionOne, decompositionTwo) {
        let cytoscapeElementsOne = (decompositionOne.elements.nodes) ? decompositionOne.elements.nodes : decompositionOne.elements;
        let cytoscapeElementsTwo = (decompositionTwo.elements.nodes) ? decompositionTwo.elements.nodes : decompositionTwo.elements;

        let similarityMatrix = [];
        let maxValue = 0;

        let partitionsOne = this._getAllPartitions(decompositionOne).sort();
        let partitionsTwo = this._getAllPartitions(decompositionTwo).sort();
        let allPartitions;

        if (partitionsTwo.length > partitionsOne.length) {
            allPartitions = partitionsTwo.filter((partition) => partitionsOne.includes(partition));
        } else {
            allPartitions = partitionsOne.filter((partition) => partitionsTwo.includes(partition));
        }

        if (partitionsTwo.includes("unobserved") && partitionsOne.includes("unobserved")) {
            allPartitions.push("unobserved");
        }

        // Add the unobserved node if it hasn't been added already
        allPartitions = [...new Set(allPartitions)].sort();

        allPartitions.forEach((partitionOne, i) => {
            similarityMatrix[i] = []
            allPartitions.forEach((partitionTwo, j) => {
                try {
                    let partitionSim = this._getPartitionSimilarity(
                        cytoscapeElementsOne.filter((ele) => ele.data.parent && ele.data.parent === partitionOne && ele.data.element_type !== "invisible").map((ele) => ele.data.id), 
                        cytoscapeElementsTwo.filter((ele) => ele.data.parent && ele.data.parent === partitionTwo && ele.data.element_type !== "invisible").map((ele) => ele.data.id)
                    );
                    if (partitionSim > maxValue) {
                        maxValue = partitionSim; 
                    }
                    similarityMatrix[i][j] = partitionSim;
                } catch (e) {
                    similarityMatrix[i][j] = 0;
                }
            });
        });
  
        return {similarityMatrix: similarityMatrix, maxValue: maxValue, partitionsOne: partitionsOne, partitionsTwo: partitionsTwo}; 
    }

    _getMaximumWeightedMatch(maxValue, similarityMatrix) {
        let costMatrix = similarityMatrix.map((arr) => arr.slice());
        for (let i = 0; i < costMatrix.length; i++) {
            for(let j = 0; j < costMatrix.length; j++) {
                costMatrix[i][j] = maxValue - costMatrix[i][j];
            }
        }
        return munkres(costMatrix);
    }

    _getPartitionSimilarity(partitionOne, partitionTwo) {
        let intersection = new Set(partitionOne.filter(x => {return partitionTwo.includes(x)}));
        let union = new Set([...partitionOne, ...partitionTwo]);
        if(union.size === 0 || intersection.size === 0) {
            return 0;
        }
        return intersection.size / union.size;
    }
}