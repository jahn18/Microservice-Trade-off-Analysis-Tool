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
        let {similarityMatrix, maxValue} = this._constructSimilarityMatrix(decompositionOne, decompositionTwo);

        return {similarityMatrix: similarityMatrix, matching: this._getMaximumWeightedMatch(maxValue, similarityMatrix)}
    }

    _constructSimilarityMatrix(decompositionOne, decompositionTwo) {
        let maxNumOfPartitions = (decompositionOne.getNumOfPartitions() > decompositionTwo.getNumOfPartitions()) 
            ? decompositionOne.getNumOfPartitions() : decompositionTwo.getNumOfPartitions();
        let similarityMatrix = [];
        let maxValue = 0;

        for (let i = 0; i < maxNumOfPartitions; i++) {
            similarityMatrix[i] = [];
            for (let j = 0; j < maxNumOfPartitions; j++) {
                try {
                    let partitionSim = this._getPartitionSimilarity(decompositionOne.getPartitionClassNodes(i, true), decompositionTwo.getPartitionClassNodes(j, true));
                    if (partitionSim > maxValue) {
                        maxValue = partitionSim; 
                    }
                    similarityMatrix[i][j] = partitionSim;
                } catch (e) {
                    similarityMatrix[i][j] = 0;
                }
            }
        }   
        return {similarityMatrix: similarityMatrix, maxValue: maxValue}; 
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