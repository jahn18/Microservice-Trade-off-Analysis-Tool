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

    /**
     * Parses the JSON file inputted into the tool. 
     *
     * @param {json_graph} - the JSON file representing a graph.
     * 
     * @param {showColor} - whether to show color on the nodes or not. 
     * 
     * @returns {list} Where list[0] contains all the elements in each decomposition, 
     *          list[1] contains all the elements that are common between all decompostions,
     *          list[2] has the total number of partitions between all decompositions, and 
     *          list[3] contains all the edges in the graph with respect to the relationship-type.
     */
    static parseJSONGraphFile = (json_graph, colors) => {
        let all_elements = []; 
        let common_elements = [];

        let num_of_partitions = Object.keys(json_graph.diff_graph).length;
        for(let i = 0; i < num_of_partitions; i++) {
            common_elements = [].concat(common_elements, json_graph.diff_graph[i].common);
            all_elements = [].concat(all_elements, 
                                    this.getJSONNodeElements(json_graph.diff_graph[i].common, i, 0, false), 
                                    this.getJSONNodeElements(json_graph.diff_graph[i].graph_1_diff, i, 1, true), 
                                    this.getJSONNodeElements(json_graph.diff_graph[i].graph_2_diff, i, 2, true), 
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

            if(json_graph.diff_graph[i].common.length === 0) { 
                all_elements.push(
                    {
                        data: {
                            id: `invisible_node_partition${i}`,
                            label: `invisible_node${i}`,
                            background_color: 'grey',
                            colored: false,
                            element_type: 'invisible',
                            showminussign: false, 
                            partition: `partition${i}`,
                            parent: `partition${i}`
                        },
                    }, 
                )
            }
        }

        let relationshipTypes = {};

        let i = 0;
        for (const [key, value] of Object.entries(json_graph)) {
            if("links" in json_graph[key]) {
                relationshipTypes[key] = {
                    checked: false,
                    links: value["links"],
                    minimumEdgeWeight: 0,
                    color: colors.relationship_type_colors[i],
                }
                i++;
            }
        }

        return [all_elements, common_elements, Object.keys(json_graph.diff_graph).length, relationshipTypes];
    }

    /**
     * Parses the class names from the JSON file and formats it according to "elements-json" in cytoscape.js. 
     * Reference: https://js.cytoscape.org/#notation/elements-json.
     * 
     * @returns {list} Of elements.
     */
    static getJSONNodeElements = (graph_list, partition_num, decomposition_version, isDiffElement) => { 
        let color = 'grey';
        let decomposition_colors = ['#F4145B', '#495CBE'];
        if(decomposition_version === 1) {
            color = decomposition_colors[0];
        } else if (decomposition_version === 2) {
            color = decomposition_colors[1];
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
                    // parent: (isDiffElement) ? `graph${partition_num}_${decomposition_version}_diff`: `partition${partition_num}`,
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

    /**
     * Verifies each points of the bounding box (a) and looks if any of these points are inside the second bounding box (b)
     * @param {CytoscapeElement} a Node to compare
     * @param {CytoscapeElement} b Node to compare
     * @returns {boolean} Return true if node a overlaps node b
     */
    static compareNodes(a, b) {
        let isOverlapping = false;
        // bottom right
        if (a.x1 < b.x2 &&
            a.x1 > b.x1 &&
            a.y1 < b.y2 &&
            a.y1 > b.y1) {
            isOverlapping = true;
        }
        // bottom left
        if (a.x2 < b.x2 &&
            a.x2 > b.x1 &&
            a.y1 < b.y2 &&
            a.y1 > b.y1) {
            isOverlapping = true;
        }
        // top left
        if (a.x2 < b.x2 &&
            a.x2 > b.x1 &&
            a.y2 > b.y1 &&
            a.y2 < b.y2) {
            isOverlapping = true;
        }
        // top right
        if (a.x1 < b.x2 &&
            a.x1 > b.x1 &&
            a.y2 < b.y2 &&
            a.y2 > b.y1) {
            isOverlapping = true;
        }
        return isOverlapping;
    }

    /**
     * Recursively checks if a node or it's parent overlaps any of the shown nodes
     * @param {CytoscapeElement} node The node to verify
     * @param {number} padding A bigger padding will make the overlap happen before
     * @returns {boolean} True if the node overlaps any of the other nodes
     */
    static checkIfOverlaps(node, padding, cy, num_of_decompositions) {
        let siblings;
        if (node.isChild()) {
            if (node.data('element_type') === 'diff') {
                // siblings = node.parent().children().difference(node);
                siblings = cy.collection();
                for(let i = 1; i <= num_of_decompositions; i++) {
                    if (node.parent().data('version') !== i) {
                        siblings = siblings.union(
                            cy.getElementById(`${node.data('partition')}_appendix${i}`)
                        );
                    }
                }
            } else if (node.data('element_type') === 'common' || node.data('element_type') === 'common*') {
                siblings = node.parent().children().filter( ele => {
                    return ele.data('element_type') !== 'common' && ele.data('element_type') !== 'common*';
                });
            } else {
                siblings = node.parent().children().difference(node);
            }
        } else {
            // siblings = node.cy().nodes().orphans().difference(node);
            siblings = cy.collection();
        }
        let isOverlapping = false;
        siblings.forEach(neighbor => {
            const neighborBB = {
                w: neighbor.renderedOuterWidth(),
                h: neighbor.renderedOuterHeight(),
                x1: neighbor.renderedPoint().x - neighbor.renderedOuterWidth() / 2 - padding,
                x2: neighbor.renderedPoint().x + neighbor.renderedOuterWidth() / 2 + padding,
                y1: neighbor.renderedPoint().y - neighbor.renderedOuterHeight() / 2 - padding,
                y2: neighbor.renderedPoint().y + neighbor.renderedOuterHeight() / 2 + padding
            };
            const currentNodeBB = {
                w: node.renderedOuterWidth(),
                h: node.renderedOuterHeight(),
                x1: node.renderedPoint().x - node.renderedOuterWidth() / 2 - padding,
                x2: node.renderedPoint().x + node.renderedOuterWidth() / 2 + padding,
                y1: node.renderedPoint().y - node.renderedOuterHeight() / 2 - padding,
                y2: node.renderedPoint().y + node.renderedOuterHeight() / 2 + padding
            };
            if (this.compareNodes(currentNodeBB, neighborBB)) {
                isOverlapping = true;
            }
            if (this.compareNodes(neighborBB, currentNodeBB)) {
                isOverlapping = true;
            }
        });
        if (node.parent().length > 0) {
            if (this.checkIfOverlaps(node.parent(), padding, cy, num_of_decompositions)) {
                isOverlapping = true;
            }
        }
        return isOverlapping;
    }

    /**
     * 
     * @param {Cytoscape Instance} cy 
     * @param {String} selectedTab The selected tab on the tool.
     * @param {Dictionary} relationshipTypes contains all relevant information for each relationship type. See method parseJSONGraphFile for more info.
     * @param {List of strings} common_elements All common elements between decompositions
     * @param {Dictionary} colors colors used to color the edges 
     * @param {Cytoscape Element} targetNode Show edges only with this specific node. 
     */
    static addEdges(cy, selectedTab, relationshipTypes, common_elements, colors, num_of_decompositions, targetNode = null) {
        cy.remove('edge');
        const edges = this.updateGraphEdges(selectedTab, relationshipTypes, common_elements, colors, num_of_decompositions, targetNode);
        cy.add(edges);
    }

    /**
     * 
     * @param {String} selectedTab The selected tab on the tool.
     * @param {Dictionary} relationshipTypes contains all relevant information for each relationship type. See method parseJSONGraphFile for more info.
     * @param {List of strings} common_elements All common elements between decompositions
     * @param {Dictionary} colors colors used to color the edges 
     * @param {Cytoscape Element} targetNode Show edges only with this specific node. 
     * @returns {List} A list of edges 
     */
    static updateGraphEdges(selectedTab, relationshipTypes, common_elements, colors, num_of_decompositions, targetNode) {
        let edges = []

        switch(selectedTab) {
            case 'static':
                for(let key in relationshipTypes) {
                    edges = edges.concat(this.getEdgeDependencies(
                        relationshipTypes[key].links, 
                        common_elements, 
                        'graph_1',
                        relationshipTypes[key].minimumEdgeWeight,
                        relationshipTypes[key].color)
                    );
                }
                break;
            case 'class name':
                for(let key in relationshipTypes) {
                    edges = edges.concat(this.getEdgeDependencies(
                        relationshipTypes[key].links, 
                        common_elements, 
                        'graph_2',
                        relationshipTypes[key].minimumEdgeWeight,
                        relationshipTypes[key].color));
                }
                break;
            case 'custom':
                for(let key in relationshipTypes) {
                    edges = edges.concat(
                        this.addEdgesForCustomGraph(
                            relationshipTypes[key].links, 
                            common_elements, 
                            num_of_decompositions,
                            relationshipTypes[key].minimumEdgeWeight,
                            colors.decomposition_colors,
                            targetNode
                        ), 
                    );
                };
                break;
            default: 
        }
        return edges;
    }

    /**
     * 
     * @param {List of Dictionaries} edge_graph An array of edges, where each element in the array contains a dictionary formatted as so: {source: '', target '', weight: ''}   
     * @param {List of Strings} common_elements All common elements between the decompositions 
     * @param {number} decomposition_version The decomposition verison number that the tool is comparing
     * @param {integer number between 0-100} minimumEdgeWeight The percentage of edges to show. (e.g if 10, then we show 10% of the highest edges)
     * @param {hexadecimal string} color the edge color 
     * @param {Cytoscape Element} targetNode Show edges only with this specific node. 
     * @returns 
     */
    static getEdgeDependencies(edge_graph, common_elements, decomposition_version, minimumEdgeWeight, color) {
        let edge_dependencies = [];
        for(let i = 0; i < edge_graph.length; i++) {
            let edge = edge_graph[i];
            if((this.findMaxEdgeWeight(edge_graph) * (1 - ( minimumEdgeWeight / 100 ))) < parseFloat(edge.weight)) {
                let add_edge = {
                    group: 'edges', 
                    data: {
                        source: (common_elements.includes(edge.source)) ? `graph_0_${edge.source}` : `${decomposition_version}_${edge.source}`,
                        target: (common_elements.includes(edge.target)) ? `graph_0_${edge.target}` : `${decomposition_version}_${edge.target}`,
                        weight: parseFloat(edge.weight).toFixed(2),
                        element_type: 'edge',
                        color: color
                    } 
                }; 
                edge_dependencies.push(add_edge);
            }
        }
        return edge_dependencies;
    };  

    static addEdgesForCustomGraph(edge_graph, common_elements, num_of_decompositions, minimumEdgeWeight, decomposition_colors, targetNode) {
        let edge_dependencies = [];
        let targets = [];
        let sources = [];
        for(let i = 0; i < edge_graph.length; i++) {
            let edge = edge_graph[i];
            if ((this.findMaxEdgeWeight(edge_graph) * (1 - ( minimumEdgeWeight / 100 ))) < parseFloat(edge.weight)) {
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
                                color: (common_elements.includes(edge.target)) ? 'grey' : decomposition_colors[j - 1]
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
                                color: (common_elements.includes(edge.source)) ? 'grey' : decomposition_colors[j - 1]
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