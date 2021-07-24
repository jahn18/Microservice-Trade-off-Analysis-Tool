import React from "react";

export default class Utils extends React.Component {
    constructor(props) {
        super(props);
    }

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
}