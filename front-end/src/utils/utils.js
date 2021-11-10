export default class Utils {
    constructor() {}

    /**
     *  Measures the coupling and cohesion for a given decomposition from a scale of 0->100%. 100%
     *  indicates the current decomposition is extremely well defined and cohesive; 0% indicates
     *  the partitions are extremely and dependent between each other.
     *
     *  @param {Array<>} - A list of edge dependencies in the given graph.
     *                              The elements in this list should contain a dictionary indicating
     *                              the source of the edge, its corresponding target, and the weight
     *                              of the edge.
     *                              e.g. [{source: 'nodeA', target: 'nodeB', weight: 1.0}, ...]
     *
     *  @param {string[][]} decompositionArray
     *
     *  @returns {float} the normalized TurboMQ value.
     *
     */
    static calculateNormalizedTurboMQ = (edge_dependencies, decomposition) => {
        let CF = decomposition.reduce((CF, partition) => {
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
            let value = (internal_edges !== 0) ? ((internal_edges) / ( (internal_edges) + external_edges)) : 0;
            return CF + value;
        }, 0.0);
        
        return ( CF / (decomposition.length) ) * 100;
    };

    static updateGraphEdges(edgeRelationshipTypes) {
        let edges = []
        for (let key in edgeRelationshipTypes) {
            const minimumEdgeWeight = edgeRelationshipTypes[key].minimumEdgeWeight;
            edges = edges.concat(
                edgeRelationshipTypes[key]['edgeFilter'][minimumEdgeWeight]
            )
        }
        return edges;
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
                    relationshipTypes[key].color,
                    targetNode
                ),
            );
        }
        cy.add(edges);
    }

    static addEdgesForCustomGraph(edge_graph, common_elements, num_of_decompositions, color, targetNode) {
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
