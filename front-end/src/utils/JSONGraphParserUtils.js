import { keys } from "@material-ui/core/styles/createBreakpoints";
import {CytoscapeEdge} from "../models/CytoscapeEdge";
import { Decomposition } from "../models/Decomposition";
import {ClassNode} from "../models/Nodes/ClassNode";
import {PartitionNode} from "../models/Nodes/PartitionNode";

/**
 * A class to parse the JSON file inputted into the tool.
 * 
 * @class JSONParser
 */
export class JSONGraphParserUtils { 

    /**
     * Parses all the edges given for each relationship-type.
     * 
     * @param {*} jsonGraph the JSON graph inputted into the tool 
     * @param {*} edgeColors the color for each edge relationship-type 
     * @return {Dictionary} an object of all 
     */
    getEdges(jsonGraph, edgeColors) {
        let edgeRelationshipTypes = {}; 
        let i = 0;
        for (const [key, value] of Object.entries(jsonGraph)) {
            let edgeFilter = {};
            const average = arr => arr.reduce((a,b) => a + b, 0) / arr.length;
            const sd = (array) => {
                const n = array.length
                const mean = array.reduce((a, b) => a + b) / n
                return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
            }

            let allEdges = this.getCytoscapeEdges(value["links"], average(value["links"].map((edge) => parseFloat(edge["weight"]))), sd(value["links"].map((edge) => parseFloat(edge["weight"]))), edgeColors[key]);

            edgeRelationshipTypes[key] = {
                checked: false,
                links: value["links"],
                minimumEdgeWeight: 0,
                color: edgeColors[key],
                cytoscapeEdges: allEdges
            }

            for(let j = 0; j <= 100; j += 10) {
                edgeFilter[j] = allEdges.filter((edge) => {
                    return ((1 - (j / 100))) < edge.getEdgeWeight();
                }).map((cytoscapeEdge) => cytoscapeEdge.getCytoscapeData());
            }
            edgeRelationshipTypes[key]['edgeFilter'] = edgeFilter;
            i++;
        }
        return edgeRelationshipTypes;
    }

    getCytoscapeEdges(edges, mean, sd, color) {
        const sigmoid = (z) => {
            return 1 / (1 + Math.exp(-z));
        }
        return edges.map((edge) => new CytoscapeEdge(edge.source, edge.target, sigmoid((parseFloat(edge.weight) - mean) / sd).toFixed(2), color));
    }

    _findMaxEdgeWeight(edges) {
        let maxEdgeWeight = 0;

        for(let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            if(parseFloat(edge.weight) > maxEdgeWeight) {
                maxEdgeWeight = parseFloat(edge.weight);
            }
        }
        return maxEdgeWeight;
    }

    /**
     * Parses the decomposition given in the JSON graph 
     * 
     * @param {*} jsonGraph the JSON graph inputted into the tool
     * @param {number} version the version number of the decomposition 
     * @returns {Decomposition}
     */
    getDecomposition(jsonGraph, version) {
        let classNodeList = [];
        let partitionList = [];
        
        const partitions = Object.keys(jsonGraph).filter((key) => {
            return key !== "unobserved";
        }).map((key) => jsonGraph[key]);

        for (let i = 0; i < partitions.length; i++) {
            partitionList.push(new PartitionNode(`partition${i}`, `P${i + 1}`)); 
            classNodeList.push(this._getClassNodes(partitions[i], `partition${i}`));
        } 

        if (jsonGraph["unobserved"] && jsonGraph["unobserved"].length > 0) {
            partitionList.push(new PartitionNode(`unobserved`, 'unobserved')); 
            classNodeList.push(this._getClassNodes(jsonGraph["unobserved"], 'unobserved'));
        }

        return new Decomposition(classNodeList, partitionList, version);
    }

    _getClassNodes(partition, parent) {
        return partition.map((element) => new ClassNode(element.id, element.id, parent));
    }
    
    getWeightedDiffDecomposition(jsonGraph, version) {
        let classNodeList = [];
        let partitionList = [];
        
        const partitions = Object.keys(jsonGraph).filter((key) => {
            return key !== "unobserved";
        }).map((key) => jsonGraph[key]);

        for (let i = 0; i < partitions.length; i++) {
            partitionList.push(new PartitionNode(`partition${i}`, `P${i + 1}`)); 
            classNodeList.push(this._getClassNodes(partitions[i], `partition${i}`));
        } 

        if (jsonGraph["unobserved"] && jsonGraph["unobserved"].length > 0) {
            partitionList.push(new PartitionNode(`unobserved`, 'unobserved')); 
            classNodeList.push(this._getClassNodes(jsonGraph["unobserved"], 'unobserved'));
        }

        return new Decomposition(classNodeList, partitionList, version);
    }
}