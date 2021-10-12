import React, {useState} from 'react';
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
import Utils from '../Utils/utils';

export default function TradeOffSelectionTable(props) {
    let [relationshipCheckBox, updateCheckBox] = useState({});

    const getSimilarityValue = (matching, similarityMatrix) => {
        let sum = 0;
        matching.forEach(match => {
            sum += similarityMatrix[match[0]][match[1]];
        });
        return sum / similarityMatrix.length;
    }

    let similarityValue = 0;
    let selectedDecompositions = props.selectedDecompositions.map((selectedDecomposition) => {
        return selectedDecomposition[0];
    });
    if (props.numDecompositionsSelected == 2) {
        let matchedPartitions;
        if(selectedDecompositions.includes("weighted-relationship")) {
            if(selectedDecompositions[0] === "weighted-relationship") {
                matchedPartitions = Utils.matchPartitions(
                    props.weightedDecomposition.decomposition,
                    props.graphData[selectedDecompositions[1]].decomposition
                );
            } else {
                matchedPartitions = Utils.matchPartitions(
                    props.graphData[selectedDecompositions[0]].decomposition, 
                    props.weightedDecomposition.decomposition,
                );
            }
        } else {
            matchedPartitions = Utils.matchPartitions(
                props.graphData[selectedDecompositions[0]].decomposition, 
                props.graphData[selectedDecompositions[1]].decomposition
            );
        }
        similarityValue = getSimilarityValue(matchedPartitions.matching, matchedPartitions.similarityMatrix) * 100;
    }
    

    let tradeOffTable = [];
    Object.keys(props.graphData).map(
        (key, index) => {
            tradeOffTable.push(
                <TableRow key={`trade-off-${key}`}>
                    <TableCell key={`trade-off-${key}`} colSpan={4}>
                        <Checkbox
                            onChange={(event, newValue) => props.updateSelectedDecompositions(newValue, key, index)}
                            checked={selectedDecompositions.includes(key)}
                        />
                        {`V${index + 1} (by ${key.charAt(0).toUpperCase() + key.slice(1)})`} 
                    </TableCell>
                </TableRow>
            )
        }
    )
    tradeOffTable.push(
        <TableRow key={`trade-off-weighted-relationship`}>
            <TableCell key={`trade-off-weighted-relationship`} colSpan={4}>
                <Checkbox
                    onChange={(event, newValue) => props.updateSelectedDecompositions(newValue, 'weighted-relationship', tradeOffTable.length - 1)}
                    checked={selectedDecompositions.includes("weighted-relationship")}
                    disabled={!props.weightedDecomposition.exists}
                />
                {`V${tradeOffTable.length + 1} (Weighted View)`} 
            </TableCell>
        </TableRow>
    );

    return(
        <TableContainer
        component={Paper} 
        style={
                {
                    width: '50%',
                    border: '1px solid grey',
                    left: '25%',
                    bottom: '10%',
                    position: 'fixed',
                }
            } 
        size="small">
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={2}>
                            <Typography variant="overline">
                                {"Compare Two Decompositions"}
                            </Typography>
                        </TableCell>
                        <TableCell align="center" colSpan={1}>
                            <Typography>
                                {"Similiarity Value (0-100%):  "}
                            </Typography>
                            <Typography>
                                {(props.numDecompositionsSelected == 2) ? similarityValue.toFixed(2) : "N/A"}
                            </Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {/* <TableRow>
                        {tradeOffRow}
                    </TableRow> */}
                    {tradeOffTable}
                    <TableCell colSpan={4}>
                        <Button variant="contained" color="primary"
                            style={{
                                width: '100%'
                            }}
                            onClick={props.updateGraphStatus} 
                            disabled={props.numDecompositionsSelected !== 2}
                        >
                            Compare
                        </Button>
                    </TableCell>
                </TableBody>
            </Table>
        </TableContainer>
    )
}