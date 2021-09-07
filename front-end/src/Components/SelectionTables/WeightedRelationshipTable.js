import React, {useState} from "react";
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import Button from '@material-ui/core/Button';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import LinearProgress from '@material-ui/core/LinearProgress';


export default function WeightedRelationshipSelectionTable(props) {
    
    let weightedRelationshipTable = [];
    Object.keys(props.graphData).map(
        (key, index) => {
            weightedRelationshipTable.push(
                <TableRow key={`weighted-relationship-${key}`}>
                    <TableCell key={`weighted-relationship-${key}`}>
                        <TextField 
                            id="standard-basic" 
                            label={key.toUpperCase()} 
                            defaultValue={props.relationshipWeights[key]}
                            onChange={(event) => props.updateRelationshipWeights(key, event.target.value)}
                        />
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
                                {"Provide weights for each Relationship Type"}
                            </Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {weightedRelationshipTable}
                    <TableRow>
                        { (props.clickedCluster && !props.fetchedWeightedRelationshipDecomposition) ?
                            <TableCell>
                                <LinearProgress /> 
                            </TableCell> :
                            <Button variant="contained" color="primary"
                                style={{
                                    width: '100%'
                                }}
                                onClick={() => {
                                    props.setClickCluster();
                                    props.getWeightedDecomposition()
                                }}
                                disabled={props.getTotalRelationshipWeightSum() !== 1}
                            >
                                Cluster
                            </Button> 
                        }
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )
}