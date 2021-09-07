import munkres from 'munkres-js';

export default class Utils {
    constructor() {}

    /** 
     *  Measures the coupling and cohesion for a given decomposition from a scale of 0->100%. 100% 
     *  indicates the current decomposition is extremely well defined and cohesive; 0% indicates 
     *  the partitions are extremely and dependent between each other.
     * 
     *  @param {edge_dependencies} - A list of edge dependencies in the given graph. 
     *                              The elements in this list should contain a dictionary indicating
     *                              the source of the edge, its corresponding target, and the weight 
     *                              of the edge.
     *                              e.g. [{source: 'nodeA', target: 'nodeB', weight: 1.0}, ...]
     * 
     *  @param {decomposition} - A list representing the decomposition configuration of nodes in a given graph. 
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
                } else if (partition.includes(edge.source) || partition.includes(edge.target)) {
                    external_edges += parseFloat(edge.weight); 
                }
            }
            CF += (internal_edges !== 0) ? ((2*internal_edges) / ( (2*internal_edges) + external_edges)) : 0; 
        }
        return (CF / num_of_partitions) * 100;
    };

    // --> All used for the decomposition views:
    static parseDecompositionFromJSON(relationshipType, json_graph) {
        let decomposition = [];
        let num_of_partitions = Object.keys(json_graph[relationshipType].decomposition).length;
        for(let i = 0; i < num_of_partitions; i++) {
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
            decomposition = decomposition.concat(this.formCytoscapeElements(json_graph[relationshipType].decomposition[`partition${i}`], i));
        }
        return {
            decomposition: decomposition,
            num_of_partitions: num_of_partitions
        };
    }

    static formCytoscapeElements(elements, partition_num) {
        let element_list = [];
        for(let i = 0; i < elements.length; i++) {
            let classNode = elements[i];
            element_list.push({
                group: 'nodes', 
                data: {
                    id: classNode.id, 
                    label: classNode.id,
                    element_type: 'common',
                    parent: `partition${partition_num}`,
                    background_color: 'grey',
                    colored: true,
                    showMinusSign: false,
                    partition: `partition${partition_num}`
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
            for(let j = 0; j <= 100; j += 10) {
                edgeCache[j] = this.formCytoscapeEdges(value["links"], j, colors.relationship_type_colors[i]);
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

    static formCytoscapeEdges(edges, minimumEdgeWeight, edge_color) {
        if(minimumEdgeWeight === 0) {
            return [];
        }

        let cytoscape_edges = [];
        for(let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            if((this.findMaxEdgeWeight(edges) * (1 - ( minimumEdgeWeight / 100 ))) < parseFloat(edge.weight)) {
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
    // <-- fin

    // Used for custom graph --> 
    // Uses the hungarian algorithm to match two decompositions together
    static matchDecompositions(chosenDecompositionOne, chosenDecompositionTwo, json_graph) {
        const getUnion = (cluster_one, cluster_two) => {return [...new Set([...cluster_one, ...cluster_two])]}
        const getIntersection = (cluster_one, cluster_two) => {return cluster_one.filter(x => cluster_two.includes(x))}
        // Gets all the elements that are in cluster_one, but not in cluster_two
        const getDifference = (cluster_one, cluster_two) => {return cluster_one.filter(x => !cluster_two.includes(x));}
        const clusterSimilarityMetric = (cluster_one, cluster_two) => {
            let intersection = cluster_one.filter(x => cluster_two.includes(x));
            let union = new Set([...cluster_one, ...cluster_two]);
            return (intersection.length / union.size);
        }
        // First create the matrix
        let max_num_of_partitions;
        if (Object.keys(json_graph[chosenDecompositionOne].decomposition).length > Object.keys(json_graph[chosenDecompositionTwo].decomposition).length) {
            max_num_of_partitions = Object.keys(json_graph[chosenDecompositionOne].decomposition).length; 
        } else {
            max_num_of_partitions = Object.keys(json_graph[chosenDecompositionTwo].decomposition).length; 
        }

        let costMatrix = [];
        let max_value = 0;
        for (let i = 0; i<max_num_of_partitions; i++) {
            costMatrix[i] = [];
            for(let j = 0; j<max_num_of_partitions; j++) {
                let cluster_one = json_graph[chosenDecompositionOne].decomposition[`partition${i}`];
                let cluster_two = json_graph[chosenDecompositionTwo].decomposition[`partition${j}`];
                if(cluster_one !== undefined && cluster_two !== undefined) {
                    let similarity_value = clusterSimilarityMetric(cluster_one.map(nodeInfo => {return nodeInfo.id}), cluster_two.map(nodeInfo => {return nodeInfo.id}));
                    if(similarity_value > max_value) {
                        max_value = similarity_value;
                    }
                    costMatrix[i][j] = similarity_value;
                } else {
                    costMatrix[i][j] = 0;
                }
            }
        }      
        // Subtract all values by the maximum, so we can find the maximum weighted matching. 
        for (let i = 0; i<max_num_of_partitions; i++) {
            for(let j = 0; j<max_num_of_partitions; j++) {
                costMatrix[i][j] = max_value - costMatrix[i][j];
            }
        }
        let partition_matches = munkres(costMatrix);
        let diff_graph = {};
        for(let i = 0; i < max_num_of_partitions; i++) {
            let cluster_one = json_graph[chosenDecompositionOne].decomposition[`partition${partition_matches[i][0]}`];
            let cluster_two = json_graph[chosenDecompositionTwo].decomposition[`partition${partition_matches[i][1]}`];
            if(cluster_one !== undefined && cluster_two !== undefined) {
                diff_graph[i] = {
                    common: getIntersection(cluster_one.map(nodeInfo => {return nodeInfo.id}), cluster_two.map(nodeInfo => {return nodeInfo.id})),
                    diff_one: getDifference(cluster_one.map(nodeInfo => {return nodeInfo.id}), cluster_two.map(nodeInfo => {return nodeInfo.id})),
                    diff_two: getDifference(cluster_two.map(nodeInfo => {return nodeInfo.id}), cluster_one.map(nodeInfo => {return nodeInfo.id}))
                }
            } else if (cluster_one === undefined) {
                diff_graph[i] = {
                    common: [],
                    diff_one: [],
                    diff_two: cluster_two.map(nodeInfo => {return nodeInfo.id})
                }
            } else if (cluster_two === undefined) {
                diff_graph[i] = {
                    common: [],
                    diff_one: cluster_one.map(nodeInfo => {return nodeInfo.id}),
                    diff_two: [],
                }
            }
        }
        return diff_graph;
    }

    static parseDiffGraphFile(diff_graph, colors) {
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
            all_elements.push(
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

    // Weighted Relationship View 
    static getAllNodes(json_graph) {
        
    }
}