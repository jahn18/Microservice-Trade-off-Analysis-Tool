import React from "react";
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

const Metrics = (props) => {
    return(
        <div>
            <TableContainer 
            component={Paper} 
            style={
                    {
                        width: '30%',
                        border: '1px solid grey',
                    }
                } 
            size="small">
                <Table aria-label="simple table" size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell align="" colSpan={3} style={{'font-weight': 'bold'}}>
                                Coupling & Cohesion (0-100%)
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell style={{'font-size': 'small'}}>Decomposition</TableCell>
                            <TableCell style={{'font-size': 'small'}}>
                                Static Dependencies
                            </TableCell>
                            <TableCell style={{'font-size': 'small'}}>
                                Class Name Dependencies
                            </TableCell>
                        </TableRow>
                        <TableRow key={'static'}>
                        <TableCell component="th" scope="row" style={{color:'#4169e1'}}>
                            {'VER 1 (by STATIC)'}
                        </TableCell>
                        <TableCell align="center">{props.static[0].toFixed(2)}</TableCell>
                        <TableCell align="center">{props.static[1].toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow key={'class name'}>
                        <TableCell component="th" scope="row" style={{color: '#e9253e'}}>
                            {'VER 2 (by CLASS NAME)'}
                        </TableCell>
                        <TableCell align="center">{props.classname[0].toFixed(2)}</TableCell>
                        <TableCell align="center">{props.classname[1].toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

export default Metrics; 

