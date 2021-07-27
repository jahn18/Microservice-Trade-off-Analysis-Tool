export default class Utils {
    constructor() {}

    /*
     *  Measures the coupling and cohesion for a given decomposition from a scale of 0->100%. 100% 
     *  indicates the current decomposition is extremely well defined and cohesive; 0% indicates 
     *  the partitions are extremely and dependent between each other.
     * 
     *  @param: edge_dependencies - A list of edge dependencies in the given graph. 
     *                              The elements in this list should contain a dictionary indicating
     *                              the source of the edge, its corresponding target, and the weight 
     *                              of the edge.
     *                              e.g. [{source: 'nodeA', target: 'nodeB', weight: 1.0}, ...]
     * 
     *  @param decomposition - A list representing the decomposition configuration of nodes in a given graph. 
     *                         Index i of decomposition[i] must indicate the partition the nodes are a part of. 
     *                         e.g [['nodeA'], ['nodeB']]. Here, 'nodeA' is in partition0, and 'nodeB' is in partition1.
     * 
     *  @returns (float) the normalized TurboMQ value. 
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

    /*
     * Parses the JSON file inputted into the tool. 
     *
     * @param json_graph - the JSON file representing a graph.
     * 
     * @param showColor - whether to show color on the nodes or not. 
     * 
     * @returns A list, where list[0] contains all the elements in each decomposition, 
     *          list[1] contains all the elements that are common between all decompostions,
     *          list[2] has the total number of partitions between all decompositions, and 
     *          list[3] contains all the edges in the graph with respect to the relationship-type.
     */
    static parseGraphJSONFile = (json_graph, showColor) => {
        let all_elements = []; 
        let common_elements = [];

        let num_of_partitions = Object.keys(json_graph.diff_graph).length;
        for(let i = 0; i < num_of_partitions; i++) {
            common_elements = [].concat(common_elements, json_graph.diff_graph[i].common);
            all_elements = [].concat(all_elements, 
                                    this.parseNodes(json_graph.diff_graph[i].common, i, 0, false, showColor), 
                                    this.parseNodes(json_graph.diff_graph[i].graph_one_diff, i, 1, true, showColor), 
                                    this.parseNodes(json_graph.diff_graph[i].graph_two_diff, i, 2, true, showColor));
            all_elements.push(
                {
                    data: {
                        id: `partition${i}`,
                        label: `partition${i}`,
                        background_color: 'white',
                        colored: false,
                        element_type: 'partition',
                        width: 200,
                        height: 350
                    } 
                },
                {
                    data: {
                        id: `diff${i}_graph_1`, 
                        background_color: 'grey',
                        colored: true,
                        element_type: 'diff_graph',
                        width: 100,
                        height: 350,
                        parent: `partition${i}`,
                        partition: `partition${i}`
                    } 
                },
                {
                    data: {
                        id: `diff${i}_graph_2`, 
                        background_color: 'grey',
                        colored: true,
                        element_type: 'diff_graph',
                        width: 100,
                        height: 350,
                        parent: `partition${i}`,
                        partition: `partition${i}`
                    } 
                },
                {
                    data: {
                        id: `invisible_node${i}_diff_graph_1`,
                        label: `invisible_node${i}`,
                        background_color: 'grey',
                        colored: false,
                        element_type: 'invisible',
                        showMinusSign: false, 
                        partition: `partition${i}`,
                        parent: `diff${i}_graph_1`
                    },
                }, 
                {
                    data: {
                        id: `invisible_node${i}_diff_graph_2`,
                        label: `invisible_node${i}`,
                        background_color: 'grey',
                        colored: false,
                        element_type: 'invisible',
                        showMinusSign: false, 
                        partition: `partition${i}`,
                        parent: `diff${i}_graph_2`
                    },
                }
            )
        }

        let colors = ['#ff7f50', '#9b59b6', '#9fe2bf', '#40e0d0', '#6495ed', '#c4c4c4'];
        let relationshipTypes = {};

        for (const [key, value] of Object.entries(json_graph)) {
            if("links" in json_graph[key]) {
                relationshipTypes[key] = {
                    checked: false,
                    links: value["links"],
                    minimumEdgeWeight: 0,
                    color: colors.shift()
                }
            }
        }

        return [all_elements, common_elements, Object.keys(json_graph.diff_graph).length, relationshipTypes];
    }

    /*
     * Parses the class names from the JSON file and formats it according to "elements-json" in cytoscape.js. 
     * Reference: https://js.cytoscape.org/#notation/elements-json.
     * 
     * @returns A list of elements.
     */
    static parseNodes = (graph_nodes, partition_num, graph_num, isDiffElement, showColor) => { 
        let color = 'grey';

        if(showColor) {
            if(graph_num === 1) {
                color = '#4169e1';
            } else if (graph_num === 2) {
                color = '#e9253e';
            }
        }

        let element_list = [];

        for(let i = 0; i < graph_nodes.length; i++) {
            let classNode = graph_nodes[i];
            element_list.push({
                group: 'nodes', 
                data: {
                    id: `graph_${graph_num}_${classNode}`, 
                    label: classNode,
                    element_type: (isDiffElement) ? `graph_${graph_num}`: 'common',
                    parent: (isDiffElement) ? `diff${partition_num}_graph_${graph_num}`: `partition${partition_num}`,
                    background_color: color,
                    colored: true,
                    showMinusSign: false,
                    partition: `partition${partition_num}`
                } 
            });
        }
        return element_list; 
    }

}