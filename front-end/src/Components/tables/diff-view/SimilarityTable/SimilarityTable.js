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
import { GraphMatchingUtils } from '../../../../utils/GraphMatchingUtils';


/**
 * 
 * @param {Function} props.updateSelectedDecomposition - updates current list of decompositions to compare
 * @param {List} props.decompositions - a list of all decompositions
 * @param {List} props.keys - a list of all tabs used in the tool  
 * @returns 
 */
export default function SimilarityTable(props) {

    const getSimilarityValue = (matching, similarityMatrix) => {
        let sum = 0;
        matching.forEach(match => {
            sum += similarityMatrix[match[0]][match[1]];
        });
        return sum;
    }

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
        props.keys.map(
            (keyA, indexA) => {
                trackKeys.push(keyA);
                return (
                    <TableRow key={`trade-off-${keyA}`}>
                        <TableCell key={`trade-off-${keyA}`}>
                            {`V${indexA + 1} (by ${keyA.charAt(0).toUpperCase() + keyA.slice(1)})`}
                        </TableCell>
                        {props.keys.map(
                            (keyB, indexB) => {
                                if (trackKeys.includes(keyB) && keyB !== keyA) {
                                    return (
                                        <TableCell key={`empty-key`}>
                                        </TableCell>
                                    )
                                }
                                let matchedPartitions = new GraphMatchingUtils().matchPartitions(
                                    props.decompositions[keyA],
                                    props.decompositions[keyB]
                                );

                                // Bug Fix: Similarity metric should only normalize using non-empty partitions  
                                let nonEmptyPartitionsOne = [...new Set(props.decompositions[keyA].elements.nodes.filter((ele) => {return (ele.data.parent !== undefined && ele.data.parent !== "unobserved" && ele.data.element_type !== "invisible")}).map((ele) => ele.data.parent))];
                                let nonEmptyPartitionsTwo = [...new Set(props.decompositions[keyB].elements.nodes.filter((ele) => {return (ele.data.parent !== undefined && ele.data.parent !== "unobserved" && ele.data.element_type !== "invisible")}).map((ele) => ele.data.parent))];
                                
                                let normalizeValue = Math.max(nonEmptyPartitionsOne.length, nonEmptyPartitionsTwo.length) 

                                return (
                                    <TableCell key={`similarity-value-${keyB}`}>
                                        <Button variant="text" onClick={() => props.updateSelectedDecompositions([[keyA, indexA], [keyB, indexB]])}>
                                            {(getSimilarityValue(matchedPartitions.matching, matchedPartitions.similarityMatrix) / normalizeValue * 100).toFixed(2)}
                                        </Button>
                                    </TableCell>
                                );
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
                    width: '100%',
                    border: '1px solid grey',
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