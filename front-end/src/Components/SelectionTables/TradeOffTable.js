import React, { useState } from 'react';
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import Button from '@material-ui/core/Button';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import { GraphMatchingUtils } from '../../utils/GraphMatchingUtils';

export default function TradeOffSelectionTable(props) {
    const getSimilarityValue = (matching, similarityMatrix) => {
        let sum = 0;
        matching.forEach(match => {
            sum += similarityMatrix[match[0]][match[1]];
        });
        return sum / similarityMatrix.length;
    }

    let keys = Object.keys(props.decompositions).map((key) => key);

    let tableHeader = [
        <TableRow key={'empty-space'}>
            <TableCell key={'empty-space'}>
            </TableCell>
            {Object.keys(props.decompositions).map(
                (key, index) =>
                    <TableCell key={`header-${key}`}>
                        {`V${index + 1} (by ${key.charAt(0).toUpperCase() + key.slice(1)})`}
                    </TableCell>
            )}
        </TableRow>
    ];

    let trackKeys = [];
    let tradeOffTable = [
        keys.map(
            (keyA, indexA) => {
                trackKeys.push(keyA);
                return (
                    <TableRow key={`trade-off-${keyA}`}>
                        <TableCell key={`trade-off-${keyA}`}>
                            {`V${indexA + 1} (by ${keyA.charAt(0).toUpperCase() + keyA.slice(1)})`}
                        </TableCell>
                        {keys.map(
                            (keyB, indexB) => {
                                if (trackKeys.includes(keyB) && keyB !== keyA) {
                                    return (
                                        <TableCell key={`empty-key`}>
                                        </TableCell>
                                    )
                                }
                                if ((keyA !== 'weighted-view' && keyB !== 'weighted-view') || props.weightedViewExists) {
                                    let matchedPartitions = new GraphMatchingUtils().matchPartitions(
                                        props.decompositions[keyA],
                                        props.decompositions[keyB]
                                    );
                                    return (
                                        <TableCell key={`similarity-value-${keyB}`}>
                                            <Button variant="text" onClick={() => props.updateSelectedDecompositions([keyA, indexA], [keyB, indexB])}>
                                                {(getSimilarityValue(matchedPartitions.matching, matchedPartitions.similarityMatrix) * 100).toFixed(2)}
                                            </Button>
                                        </TableCell>
                                    );
                                }
                                else {
                                    return (
                                        <TableCell key={`similarity-value-${keyB}`}>
                                            {"N/A"}
                                        </TableCell>
                                    );
                                }
                            }
                        )}
                    </TableRow>
                )
            }
        )
    ];

    return (
        <TableContainer
            component={Paper}
            style={
                {
                    width: '65%',
                    border: '1px solid grey',
                    left: '17%',
                    bottom: '10%',
                    position: 'fixed',
                }
            }
            size="small">
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={100}>
                            <Typography variant="overline">
                                {"Compare Two Decompositions"}
                            </Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tableHeader}
                    {tradeOffTable}
                </TableBody>
            </Table>
        </TableContainer>
    )
}