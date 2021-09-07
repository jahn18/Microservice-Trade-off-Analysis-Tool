import React from 'react';
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import Button from '@material-ui/core/Button';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';

export default function TradeOffSelectionTable(props) {

    let tradeOffTable = [];
    Object.keys(props.graphData).map(
        (key, index) => {
            tradeOffTable.push(
                <TableRow key={`trade-off-${key}`}>
                    <TableCell key={`trade-off-${key}`}>
                        <Checkbox
                            onChange={(event, newValue) => props.updateSelectedDecompositions(newValue, key, index)}
                        />
                        {`V${index + 1} (by ${key.charAt(0).toUpperCase() + key.slice(1)})`} 
                    </TableCell>
                </TableRow>
            )
        }
    )

    return(
        <TableContainer
        component={Paper} 
        style={
                {
                    width: '50%',
                    border: '1px solid grey',
                    left: '25%',
                    bottom: '20%',
                    position: 'fixed',
                }
            } 
        size="small">
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <Typography variant="overline">
                                {"Select Two Decompositions to Compare"}
                            </Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tradeOffTable}
                    <Button variant="contained" color="primary"
                        style={{
                            width: '100%'
                        }}
                        onClick={props.updateGraphStatus} 
                        disabled={props.numDecompositionsSelected !== 2}
                    >
                        Compare
                    </Button>
                </TableBody>
            </Table>
        </TableContainer>
    )
}