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
        let {similarityMatrix, maxValue, partitionsOne, partitionsTwo} = this._constructSimilarityMatrix(decompositionOne.elements.nodes, decompositionTwo.elements.nodes);
        
        let matching = this._getMaximumWeightedMatch(maxValue, similarityMatrix);

        let partitionMatching = []; 
        // Match the unobserved partitions accordingly from both decompositions
        if (partitionsOne.includes("unobserved") || partitionsTwo.includes("unobserved")) {
            partitionMatching.push([partitionsOne.includes("unobserved") ? "unobserved" : undefined, partitionsTwo.includes("unobserved") ? "unobserved" : undefined]);
        }

        matching.forEach((match) => {
            if (partitionsOne[match[0]] !== "unobserved" || partitionsTwo[match[1]] !== "unobserved") {
                partitionMatching.push([partitionsOne[match[0]] === "unobserved" ? undefined : partitionsOne[match[0]], partitionsTwo[match[1]] === "unobserved" ? undefined : partitionsTwo[match[1]]]);
            }
        }); 

        // partitionMatching matches the correct partition numbers once they are moved. 
        return {similarityMatrix: similarityMatrix, matching: matching, partitionMatching: partitionMatching}
    }

    _getAllPartitions(decomposition) {
        // depends on the format being used: if elements.nodes then cytoscape format, but if decompostion.elements its used the JSON loaded decomposition format. 
        return decomposition.filter((ele) => ele.data.element_type === "partition").map((node) => node.data.id);
    }

    _constructSimilarityMatrix(decompositionOne, decompositionTwo) {
        let cytoscapeElementsOne = decompositionOne;
        let cytoscapeElementsTwo = decompositionTwo;

        let similarityMatrix = [];
        let maxValue = 0;

        const customSort = function (a, b) {
            return (Number(a.match(/(\d+)/g)[0]) - Number((b.match(/(\d+)/g)[0])));
        }

        const unobservedSort = function (a, b) {
            if (a === "unobserved") {
                return 1 
            } else if (b === "unobserved") {
                return -1
            }
            return (Number(a.match(/(\d+)/g)[0]) - Number((b.match(/(\d+)/g)[0])));
        }

        let partitionsOne = this._getAllPartitions(decompositionOne);
        let partitionsTwo = this._getAllPartitions(decompositionTwo);

        let allPartitions;

        if (partitionsOne.includes("unobserved")) {
            const index = partitionsOne.indexOf("unobserved");
            if (index > -1) {
              partitionsOne.splice(index, 1);
            }
        } 

        if (partitionsTwo.includes("unobserved")) {
            const index = partitionsTwo.indexOf("unobserved");
            if (index > -1) {
              partitionsTwo.splice(index, 1);
            }
        }

        partitionsOne = partitionsOne.sort(customSort);
        partitionsTwo = partitionsTwo.sort(customSort)


        if (partitionsTwo.length > partitionsOne.length) {
            allPartitions = [...partitionsTwo];
        } else {
            allPartitions = [...partitionsOne];
        }

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

        return {similarityMatrix: similarityMatrix, maxValue: maxValue, partitionsOne: this._getAllPartitions(decompositionOne).sort(unobservedSort), partitionsTwo: this._getAllPartitions(decompositionTwo).sort(unobservedSort)}; 
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