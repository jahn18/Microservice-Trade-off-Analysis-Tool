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

    /*
     * Parses the class names from the JSON file and formats it according to "elements-json" in cytoscape.js. 
     * Reference: https://js.cytoscape.org/#notation/elements-json.
     * 
     * @returns A list of elements.
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
}