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
        let {similarityMatrix, maxValue, partitionOneValid, partitionTwoValid} = this._constructSimilarityMatrix(decompositionOne, decompositionTwo);

        let matching = this._getMaximumWeightedMatch(maxValue, similarityMatrix);

        // partitionMatching matches the correct partition numbers once they are moved. 
        return {similarityMatrix: similarityMatrix, matching: matching, partitionMatching: matching.map((match) => [partitionOneValid[match[0]], partitionTwoValid[match[1]]])}
    }

    _getTotalNumOfPartitions(decomposition) {
        let cytoscapeElements = (decomposition.elements.nodes) ? decomposition.elements.nodes : decomposition.elements;
        return cytoscapeElements.reduce((numOfPartitions, ele) => {
            return (ele.data.element_type === "partition") ? numOfPartitions + 1 : numOfPartitions; 
        }, 0);
    }

    _constructSimilarityMatrix(decompositionOne, decompositionTwo) {
        let cytoscapeElementsOne = (decompositionOne.elements.nodes) ? decompositionOne.elements.nodes : decompositionOne.elements;
        let cytoscapeElementsTwo = (decompositionTwo.elements.nodes) ? decompositionTwo.elements.nodes : decompositionTwo.elements;

        let maxNumOfPartitions = (this._getTotalNumOfPartitions(decompositionOne) > this._getTotalNumOfPartitions(decompositionTwo)) 
            ? this._getTotalNumOfPartitions(decompositionOne) : this._getTotalNumOfPartitions(decompositionTwo);
        let similarityMatrix = [];
        let maxValue = 0;

        // Handle the case when all nodes are moved from partition into another
        let partitionOneValid = [];
        let partitionTwoValid = [];
        let emptyPartitions = [];
        for (let i = 0; i < maxNumOfPartitions; i++) {
            for (let j = 0; j < maxNumOfPartitions; j++) {
                let partitionOne = cytoscapeElementsOne.filter((ele) => ele.data.parent && ele.data.parent === `partition${i}` && ele.data.element_type !== "invisible").map((ele) => ele.data.id); 
                let partitionTwo = cytoscapeElementsTwo.filter((ele) => ele.data.parent && ele.data.parent === `partition${j}` && ele.data.element_type !== "invisible").map((ele) => ele.data.id);
                if (partitionOne.length > 0 || partitionTwo.length > 0) {
                    if (!partitionOneValid.includes(i)) {
                        partitionOneValid.push(i);
                    }
                    if (!partitionTwoValid.includes(j)) {
                        partitionTwoValid.push(j);
                    }
                } else {
                    emptyPartitions.push([i, j]);
                }
            }
        }   
        
        emptyPartitions.forEach((val) => {
            let index = partitionOneValid.indexOf(val[0]);
            if (index > -1) {
              partitionOneValid.splice(index, 1);
            }
            index = partitionTwoValid.indexOf(val[1]);
            if (index > -1) {
              partitionTwoValid.splice(index, 1);
            }
        })
        let newPartitionLength = (partitionOneValid.length > partitionTwoValid) ? partitionOneValid.length : partitionTwoValid.length;

        for (let i = 0; i < newPartitionLength; i++) {
            similarityMatrix[i] = [];
            for (let j = 0; j < newPartitionLength; j++) {
                try {
                    let partitionSim = this._getPartitionSimilarity(
                        cytoscapeElementsOne.filter((ele) => ele.data.parent && ele.data.parent === `partition${partitionOneValid[i]}` && ele.data.element_type !== "invisible").map((ele) => ele.data.id), 
                        cytoscapeElementsTwo.filter((ele) => ele.data.parent && ele.data.parent === `partition${partitionTwoValid[j]}` && ele.data.element_type !== "invisible").map((ele) => ele.data.id)
                        );
                    if (partitionSim > maxValue) {
                        maxValue = partitionSim; 
                    }
                    similarityMatrix[i][j] = partitionSim;
                } catch (e) {
                    similarityMatrix[i][j] = 0;
                }
            }
        }   
        return {similarityMatrix: similarityMatrix, maxValue: maxValue, partitionOneValid: partitionOneValid, partitionTwoValid: partitionTwoValid}; 
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