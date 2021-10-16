import munkres from 'munkres-js';


/**
 *  Measures the coupling and cohesion for a given decomposition from a scale of 0->100%. 100%
 *  indicates the current decomposition is extremely well defined and cohesive; 0% indicates
 *  the partitions are extremely and dependent between each other.
 *
 *  @param {List} - A list of edge dependencies in the given graph.
 *                              The elements in this list should contain a dictionary indicating
 *                              the source of the edge, its corresponding target, and the weight
 *                              of the edge.
 *                              e.g. [{source: 'nodeA', target: 'nodeB', weight: 1.0}, ...]
 *
 *  @param {Array<Array<T>>} - A list representing the decomposition configuration of nodes in a given graph.
 *                         Index i of decomposition[i] must indicate the partition the nodes are a part of.
 *                         e.g [['nodeA'], ['nodeB']]. Here, 'nodeA' is in partition0, and 'nodeB' is in partition1.
 *
 *  @returns {float} the normalized TurboMQ value.
 *
 */
export const calculateNormalizedTurboMQ = (edge_dependencies, decomposition) => {
    let CF = 0.0;
    let num_of_partitions = decomposition.length;

    for(let i = 0; i < num_of_partitions; i++) {
        let partition = decomposition[i];
        let internal_edges = 0.0;
        let external_edges = 0.0;

        for(let j = 0; j < edge_dependencies.length; j++) {
            let edge = edge_dependencies[j];
            if(partition.includes(edge.source) && partition.includes(edge.target)) {
                internal_edges += parseFloat(edge.weight);
            } else if (partition.includes(edge.source)) {
                external_edges += parseFloat(edge.weight);
            }
        }
        CF += (internal_edges !== 0) ? ((internal_edges) / ( (internal_edges) + external_edges)) : 0;
    }
    return ( CF / (num_of_partitions) ) * 100;
};


export default class Utils {
    constructor() {}

    /**
     *  Measures the coupling and cohesion for a given decomposition from a scale of 0->100%. 100%
     *  indicates the current decomposition is extremely well defined and cohesive; 0% indicates
     *  the partitions are extremely and dependent between each other.
     *
     *  @param {List} - A list of edge dependencies in the given graph.
     *                              The elements in this list should contain a dictionary indicating
     *                              the source of the edge, its corresponding target, and the weight
     *                              of the edge.
     *                              e.g. [{source: 'nodeA', target: 'nodeB', weight: 1.0}, ...]
     *
     *  @param {Array<Array<T>>} - A list representing the decomposition configuration of nodes in a given graph.
     *                         Index i of decomposition[i] must indicate the partition the nodes are a part of.
     *                         e.g [['nodeA'], ['nodeB']]. Here, 'nodeA' is in partition0, and 'nodeB' is in partition1.
     *
     *  @returns {float} the normalized TurboMQ value.
     *
     */
    static calculateNormalizedTurboMQ = (edge_dependencies, decomposition) => {
        let CF = 0.0;
        let num_of_partitions = decomposition.length;

        for(let i = 0; i < num_of_partitions; i++) {
            let partition = decomposition[i];
            let internal_edges = 0.0;
            let external_edges = 0.0;

            for(let j = 0; j < edge_dependencies.length; j++) {
                let edge = edge_dependencies[j];
                if(partition.includes(edge.source) && partition.includes(edge.target)) {
                    internal_edges += parseFloat(edge.weight);
                } else if (partition.includes(edge.source)) {
                    external_edges += parseFloat(edge.weight);
                }
            }
            CF += (internal_edges !== 0) ? ((internal_edges) / ( (internal_edges) + external_edges)) : 0;
        }
        return ( CF / (num_of_partitions) ) * 100;
    };

    // --> All used for the decomposition views:
    static parseDecompositionFromJSON(decompositionGraph) {
        let decomposition = [];

        let parsedDecomposition = Object.values(decompositionGraph).filter((partition => {
                return partition.length > 0;
        }));

        for(let i = 0; i < parsedDecomposition.length; i++) {
            decomposition.push(
                {
                    data: {
                        id: `partition${i}`,
                        label: `P${i + 1}`,
                        background_color: 'white',
                        colored: false,
                        element_type: 'partition',
                        width: 0,
                        height: 0,
                        showMinusSign: false,
                    }
                }
            );
            decomposition = decomposition.concat(this.formCytoscapeElements(parsedDecomposition[i], `partition${i}`, 'common'));
        }

        return {
            decomposition: decomposition,
            num_of_partitions: parsedDecomposition.length
        };
    }

    static formCytoscapeElements(elements, parent, element_type) {
        let element_list = [];
        for(let i = 0; i < elements.length; i++) {
            let classNode = elements[i];
            element_list.push({
                group: 'nodes',
                data: {
                    id: classNode.id,
                    label: classNode.id,
                    element_type: element_type,
                    parent: parent,
                    background_color: 'grey',
                    colored: true,
                    showMinusSign: false,
                    partition: parent
                }
            });
        }
        return element_list;
    }

    static getEdgeRelationshipTypes(json_graph, colors) {
        let edgeRelationshipTypes = {};
        let i = 0;
        for (const [key, value] of Object.entries(json_graph)) {
            let edgeCache = {};
            edgeRelationshipTypes[key] = {
                checked: false,
                links: value["links"],
                minimumEdgeWeight: 0,
                color: colors.relationship_type_colors[i],
            }

            let maxEdgeWeight = this.findMaxEdgeWeight(value["links"]);
            for(let j = 0; j <= 100; j += 10) {
                edgeCache[j] = this.formCytoscapeEdges(value["links"], maxEdgeWeight, j, colors.relationship_type_colors[i]);
            }
            edgeRelationshipTypes[key]['edgeCache'] = edgeCache;
            i++;
        }
        return edgeRelationshipTypes;
    }

    static updateGraphEdges(edgeRelationshipTypes) {
        let edges = []
        for (let key in edgeRelationshipTypes) {
            const minimumEdgeWeight = edgeRelationshipTypes[key].minimumEdgeWeight;
            edges = edges.concat(
                edgeRelationshipTypes[key]['edgeCache'][minimumEdgeWeight]
            )
        }
        return edges;
    }

    static formCytoscapeEdges(edges, maxEdgeWeight, minimumEdgeWeight, edge_color) {
        if(minimumEdgeWeight === 0) {
            return [];
        }

        let cytoscape_edges = [];
        for(let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            if((maxEdgeWeight * (1 - ( minimumEdgeWeight / 100 ))) < parseFloat(edge.weight)) {
                cytoscape_edges.push({
                    group: 'edges',
                    data: {
                        source: edge.source,
                        target: edge.target,
                        weight: parseFloat(edge.weight).toFixed(2),
                        element_type: 'edge',
                        color: edge_color
                    }
                });
            }
        }
        return cytoscape_edges;
    }

    /**
     * Matches the decompositions in the diff-view and provides a graph representation. 
     * 
     * @param {*} chosenDecompositionOne formatted as follows [[...elements in partition one], [...elements in partition 2], ... so on]
     * @param {*} chosenDecompositionTwo formatted as follows [[...elements in partition one], [...elements in partition 2], ... so on]
     * @returns 
     */
    static matchDecompositions(chosenDecompositionOne, chosenDecompositionTwo) {
        const getIntersection = (cluster_one, cluster_two) => {return cluster_one.filter(x => cluster_two.includes(x))}
        // ORDER matters here! This gets the different elements in cluster one opposed to cluster two 
        const getDifference = (cluster_one, cluster_two) => {return cluster_one.filter(x => !cluster_two.includes(x));}

        let matchedPartitions = this.matchPartitions(chosenDecompositionOne, chosenDecompositionTwo);

        const decompositionOnePartitions = Object.values(chosenDecompositionOne).filter((partition => {
            return partition.length > 0;
        }));
        const decompositionTwoPartitions = Object.values(chosenDecompositionTwo).filter((partition => {
            return partition.length > 0;
        }));

        let diff_graph = {};
        for(let i = 0; i < matchedPartitions.costMatrix.length; i++) {
            let clusterOne = decompositionOnePartitions[i];
            let clusterTwo = decompositionTwoPartitions[i];

            if(clusterOne !== undefined && clusterTwo !== undefined) {
                diff_graph[i] = {
                    common: getIntersection(clusterOne.map(nodeInfo => {return nodeInfo.id}), clusterTwo.map(nodeInfo => {return nodeInfo.id})),
                    diff_one: getDifference(clusterOne.map(nodeInfo => {return nodeInfo.id}), clusterTwo.map(nodeInfo => {return nodeInfo.id})),
                    diff_two: getDifference(clusterTwo.map(nodeInfo => {return nodeInfo.id}), clusterOne.map(nodeInfo => {return nodeInfo.id})),
                    match: [matchedPartitions.matching[i][0] + 1, matchedPartitions.matching[i][1] + 1]
                }
            } else if (clusterOne === undefined) {
                diff_graph[i] = {
                    common: [],
                    diff_one: [],
                    diff_two: clusterTwo.map(nodeInfo => {return nodeInfo.id}),
                    match: ["", matchedPartitions.matching[i][1] + 1]
                }
            } else if (clusterTwo === undefined) {
                diff_graph[i] = {
                    common: [],
                    diff_one: clusterOne.map(nodeInfo => {return nodeInfo.id}),
                    diff_two: [],
                    match: [matchedPartitions.matching[i][0] + 1, ""]
                }
            }
        }

        return diff_graph;
    }

    /**
     * Matches the partitions using the hungarian algorithm between two decompositions 
     * 
     * @param {*} decomposition_one formatted as follows [[...elements in partition one], [...elements in partition 2], ... so on]
     * @param {*} decomposition_two formatted as follows [[...elements in partition one], [...elements in partition 2], ... so on]
     * @returns 
     */
    static matchPartitions(decomposition_one, decomposition_two) {
        const clusterSimilarityMetric = (cluster_one, cluster_two) => {
            let intersection = cluster_one.filter(x => cluster_two.includes(x));
            let union = new Set([...cluster_one, ...cluster_two]);
            if(union.size === 0 || intersection === 0) {
                return 0;
            }
            return (intersection.length / union.size);
        }

        const decompositionOnePartitions = Object.values(decomposition_one).filter((partition => {
            return partition.length > 0;
        }));
        const decompositionTwoPartitions = Object.values(decomposition_two).filter((partition => {
            return partition.length > 0;
        }));

        let max_num_of_partitions = (decompositionOnePartitions.length > decompositionTwoPartitions.length) ? decompositionOnePartitions.length : decompositionTwoPartitions.length;

        let costMatrix = [];
        let max_value = 0;
        for (let i = 0; i<max_num_of_partitions; i++) {
            costMatrix[i] = [];
            for(let j = 0; j<max_num_of_partitions; j++) {
                let clusterOne = decompositionOnePartitions[i];
                let clusterTwo = decompositionTwoPartitions[j];

                if(clusterOne !== undefined && clusterTwo !== undefined) {
                    let similarity_value = clusterSimilarityMetric(clusterOne.map(nodeInfo => {return nodeInfo.id}), clusterTwo.map(nodeInfo => {return nodeInfo.id}));
                    if(similarity_value > max_value) {
                        max_value = similarity_value;
                    }
                    costMatrix[i][j] = similarity_value;
                } else {
                    costMatrix[i][j] = 0;
                }
            }
        }

        const similarityMatrix = costMatrix.map((arr) => {
            return arr.slice();
        }); 

        // Subtract all values by the maximum, so we can find the maximum weighted matching.
        for (let i = 0; i<max_num_of_partitions; i++) {
            for(let j = 0; j<max_num_of_partitions; j++) {
                costMatrix[i][j] = max_value - costMatrix[i][j];
            }
        }
        
        return {
            matching: munkres(costMatrix),
            costMatrix: costMatrix,
            similarityMatrix: similarityMatrix
        };
    }

    /**
     * 
     * @param {*} diff_graph 
     * @param {*} colors 
     * @returns 
     */
    static parseDiffGraphFile(diff_graph, colors, matchedDecompositionOne, matchedDecompositionTwo) {
        let all_elements = [];
        let common_elements = [];

        let num_of_partitions = Object.keys(diff_graph).length;
        for(let i = 0; i < num_of_partitions; i++) {
            common_elements = common_elements.concat(diff_graph[i].common);
            all_elements = all_elements.concat(
                                        this.getJSONNodeElements(diff_graph[i].common, i, 0, false, colors),
                                        this.getJSONNodeElements(diff_graph[i].diff_one, i, 1, true, colors),
                                        this.getJSONNodeElements(diff_graph[i].diff_two, i, 2, true, colors),
                                    );
            let partitionLabel = `M${i + 1} = V${matchedDecompositionOne + 1}-P${diff_graph[i].match[0]} ᐱ V${matchedDecompositionTwo + 1}-P${diff_graph[i].match[1]}`;
            if(diff_graph[i].match[0] === "") {
                partitionLabel = `M${i + 1} = V${matchedDecompositionTwo + 1}-P${diff_graph[i].match[1]}`;
            } else if (diff_graph[i].match[1] === "") {
                partitionLabel = `M${i + 1} = V${matchedDecompositionOne + 1}-P${diff_graph[i].match[0]}`; 
            }

            all_elements.push(
                {
                    data: {
                        id: `partition${i}`,
                        label: partitionLabel,
                        background_color: 'white',
                        colored: false,
                        element_type: 'partition',
                        width: 0,
                        height: 0,
                        showMinusSign: false,
                    }
                })

            if(diff_graph[i].common.length === 0) {
                all_elements.push(
                    {
                        data: {
                            id: `invisible_node_partition${i}`,
                            label: `invisible_node${i}`,
                            background_color: 'grey',
                            colored: false,
                            element_type: 'invisible',
                            showMinusSign: false,
                            partition: `partition${i}`,
                            parent: `partition${i}`
                        },
                    },
                )
            }
        }

        return {
            elements: all_elements,
            common_elements: common_elements,
            num_of_partitions: num_of_partitions
        }
    }

    /**
     * Parses the class names from the JSON file and formats it according to "elements-json" in cytoscape.js.
     * Reference: https://js.cytoscape.org/#notation/elements-json.
     *
     * @returns {list} Of elements.
     */
    static getJSONNodeElements = (graph_list, partition_num, decomposition_version, isDiffElement, colors) => {
        let color = 'grey';
        if(decomposition_version === 1) {
            color = colors[0];
        } else if (decomposition_version === 2) {
            color = colors[1];
        }

        let element_list = [];

        for(let i = 0; i < graph_list.length; i++) {
            let classNode = graph_list[i];
            element_list.push({
                group: 'nodes',
                data: {
                    id: `graph_${decomposition_version}_${classNode}`,
                    label: classNode,
                    element_type: (isDiffElement) ? 'diff': 'common',
                    parent: `partition${partition_num}`,
                    version: decomposition_version,
                    background_color: color,
                    colored: true,
                    showMinusSign: false,
                    partition: `partition${partition_num}`
                }
            });
        }
        return element_list;
    }

    static showCustomGraphEdges(cy, chosen_relationship_types, relationshipTypes, common_elements, targetNode) {
        cy.remove('edge');
        let edges = [];
        console.log(chosen_relationship_types);
        for(let key of chosen_relationship_types) {
            edges = edges.concat(
                this.addEdgesForCustomGraph(
                    relationshipTypes[key].links,
                    common_elements,
                    chosen_relationship_types.length,
                    relationshipTypes[key].minimumEdgeWeight,
                    relationshipTypes[key].color,
                    targetNode
                ),
            );
        }
        cy.add(edges);
    }

    static addEdgesForCustomGraph(edge_graph, common_elements, num_of_decompositions, minimumEdgeWeight, color, targetNode) {
        let edge_dependencies = [];
        let targets = [];
        let sources = [];
        for(let i = 0; i < edge_graph.length; i++) {
            let edge = edge_graph[i];
            // if ((this.findMaxEdgeWeight(edge_graph) * (1 - ( minimumEdgeWeight / 100 ))) < parseFloat(edge.weight)) {
            if (0 < parseFloat(edge.weight)) {
                for(let j = 1; j <= num_of_decompositions; j++) {
                    let add_edge = null;
                    if (edge.source === targetNode.data('label')) {
                        add_edge = {
                            classes: 'dependency',
                            group: 'edges',
                            data: {
                                source: targetNode.data('id'),
                                target: (common_elements.includes(edge.target)) ? `graph_0_${edge.target}` : `graph_${j}_${edge.target}`,
                                weight: parseFloat(edge.weight).toFixed(2),
                                element_type: 'edge',
                                color: color
                            }
                        };
                        if(!targets.includes(add_edge.data.target)) {
                            edge_dependencies.push(add_edge);
                        }
                        targets.push(add_edge.data.target);
                    } else if (edge.target === targetNode.data('label')) {
                        add_edge = {
                            classes: 'dependency',
                            group: 'edges',
                            data: {
                                source: (common_elements.includes(edge.source)) ? `graph_0_${edge.source}` : `graph_${j}_${edge.source}`,
                                target: targetNode.data('id'),
                                weight: parseFloat(edge.weight).toFixed(2),
                                element_type: 'edge',
                                color: color
                            }
                        };
                        if(!sources.includes(add_edge.data.source)) {
                            edge_dependencies.push(add_edge);
                        }
                        sources.push(add_edge.data.source);
                    }
                }
            }
        }
        return edge_dependencies;
    }
    /**
     *
     * @param {List of Dictionaries} edge_graph
     * @returns {Float} The highest edge-weight in the given edge_graph
     */
    static findMaxEdgeWeight(edge_graph) {
        let max_edge_weight = 0;

        for(let i = 0; i < edge_graph.length; i++) {
            let edge = edge_graph[i];
            if(parseFloat(edge.weight) > max_edge_weight) {
                max_edge_weight = parseFloat(edge.weight);
            }
        }
        return max_edge_weight.toFixed(0);
    }
}
