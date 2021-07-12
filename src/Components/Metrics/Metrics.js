import React from "react";
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

class Metrics extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    };

    calculateNormalizedTurboMQ = (diffGraph, common_elements, graph_num) => {
        const {num_of_partitions} = this.state;
        let CF_0 = 0.0;
        let CF_1 = 0.0;
        for(let i = 0; i < num_of_partitions; i++) {
            /* 
                Later change this so that graph_num is the actual number so it is "graph_${graph_num}_diff" when we have
                multiple partitions. 
            */
            let partition_classes = (graph_num === 1) ? [].concat(diffGraph[i].common, diffGraph[i].graph_one_diff) : 
                                        [].concat(diffGraph[i].common, diffGraph[i].graph_two_diff); 
            let internal_edges = 0.0;
            let external_edges = 0.0; 
            let edge_graph = this.props.location.state.data.static_graph.links;
            for(let j = 0; j < edge_graph.length; j++) {
                let edge = edge_graph[j];
                if(partition_classes.includes(edge.source) && partition_classes.includes(edge.target)) {
                    internal_edges += parseFloat(edge.weight);
                } else if (partition_classes.includes(edge.source) || partition_classes.includes(edge.target)) {
                    external_edges += parseFloat(edge.weight); 
                }
            }
            CF_0 += (internal_edges !== 0) ? ((2*internal_edges) / ( (2*internal_edges) + external_edges)) : 0; 

            internal_edges = 0.0;
            external_edges = 0.0; 
            edge_graph = this.props.location.state.data.class_name_graph.links;
            for(let j = 0; j < edge_graph.length; j++) {
                let edge = edge_graph[j];
                if(partition_classes.includes(edge.source) && partition_classes.includes(edge.target)) {
                    internal_edges += parseFloat(edge.weight);
                } else if (partition_classes.includes(edge.source) || partition_classes.includes(edge.target)) {
                    external_edges += parseFloat(edge.weight); 
                }
            }
            CF_1 += (internal_edges !== 0) ? ((2*internal_edges) / ( (2*internal_edges) + external_edges)) : 0; 
        }
        return [(CF_0 / num_of_partitions) * 100, (CF_1 / num_of_partitions) * 100];
    };

    render() {
        return(
            <div>
                <TableContainer 
                component={Paper} 
                style={
                        {
                            width: '25%',
                            border: '1px solid grey',
                            'left': '74%',
                            'margin-top': '1%',
                            position: 'fixed',
                        }
                    } 
                size="small">
                    <Table aria-label="simple table">
                        <TableHead>
                        <TableRow>
                            <TableCell>Coupling & Cohesion (0-100%)</TableCell>
                            <TableCell align="center">Static Dependencies</TableCell>
                            <TableCell align="center">Class Name Dependencies</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow key={'static'}>
                            <TableCell component="th" scope="row">
                                {'STATIC'}
                            </TableCell>
                            <TableCell align="center">{0}</TableCell>
                            <TableCell align="center">{0}</TableCell>
                            </TableRow>
                            <TableRow key={'class name'}>
                            <TableCell component="th" scope="row">
                                {'CLASS NAME'}
                            </TableCell>
                            <TableCell align="center">{0}</TableCell>
                            <TableCell align="center">{0}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );
    };
}

export default Metrics;
