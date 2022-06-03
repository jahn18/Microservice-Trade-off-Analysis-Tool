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
    const [weightedSum, setWeightedSum] = useState(0);
    const [relationshipWeights, setRelationshipWeights] = useState(props.weights || Object.keys(props.graphData).reduce((weights, key) => {return weights = {...weights, [key]: 0}}, {}));
    
    let weightedRelationshipTable = [];
    Object.keys(props.graphData).map(
        (key, index) => {
            weightedRelationshipTable.push(
                <TableRow key={`weighted-view-${key}`}>
                    <TableCell key={`weighted-view-${key}`}>
                        <TextField 
                            id="standard-basic" 
                            label={key.toUpperCase()} 
                            defaultValue={relationshipWeights[key]}
                            onChange={(event) => {
                                relationshipWeights[key] = parseFloat(event.target.value);
                                setWeightedSum(Object.keys(relationshipWeights).reduce((sum, key) => {return sum = sum + relationshipWeights[key]}, 0.0))
                            }}
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
                    width: '100%',
                    border: '1px solid grey',
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
                        { (props.clustering) ?
                            <TableCell>
                                <LinearProgress /> 
                            </TableCell> :
                            <Button variant="contained" color="primary"
                                style={{
                                    width: '100%'
                                }}
                                onClick={() => {
                                    props.fetchWeightedDecomposition(relationshipWeights, props.graphData);
                                    props.setNewWeights();
                                    props.setWeights(relationshipWeights);
                                }}
                                disabled={weightedSum < 0.99 || weightedSum > 1}
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