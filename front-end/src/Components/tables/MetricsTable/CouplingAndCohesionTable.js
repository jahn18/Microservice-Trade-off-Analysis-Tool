import React from "react";
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import Collapse from '@material-ui/core/Collapse';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import IconButton from '@material-ui/core/IconButton';
import TableHead from '@material-ui/core/TableHead';
import Utils from "../../../utils/utils";

/**
 * A table that shows coupling and cohesion metrics for a given microservice decomposition (uses Normalized TurboMQ)
 * For more information on how the decompositions and dependencies props should be formatted, refer to the @method calculateNormalizedTurboMQ in the utils folder.
 * 
 * @param {Dictionary} props.styles additional styles you want to add to each element in the table. 
 * @param {Elements} props.additionalElements additional elements you want to add to the table. (e.g a sider or switch) should be a javascript element. 
 * @param {Dictionary<Array<Array<T>>>} props.decompositions an adjacency list representation of a microservice decomposition. e.g [[all elements in partition 1], [all elements in partition 2]... etc.] 
 *                                                           This can contain multiple decompositions {decomposition1: [[...], ...], decomposition2: [[...], ...]}  
 * @param {Dictionary} props.dependencies a dictionary containing all the dependencies shared between the elements in the decomposition. {[name of dependency e.g. 'static']: [{source: 'nodeA', target: 'nodeB', weight: 1.0}, ...], ...}
 *    
 * @param {boolean} props.openTable a variable that keeps track of the state of the table (open or closed).
 * @param {() => void} props.onOpenTableChange a callback function that is called when the table is opened/closed.
 */
export const CouplingAndCohesionTable = (props) => {

    const relationshipTypeTable = Object.keys(props.dependencies).map(
        (dependencyKey) => 
            <TableRow key={dependencyKey}>
                <TableCell style={{'fontSize': 'Normal'}}>
                    {dependencyKey}
                </TableCell>
                {
                    Object.keys(props.decompositions).map((decompositionKey) => 
                        <TableCell>
                            {
                                Utils.calculateNormalizedTurboMQ(
                                    props.dependencies[dependencyKey],
                                    props.decompositions[decompositionKey]
                                ).toFixed(2)
                            }
                        </TableCell>
                    )
                }
                {
                    Object.keys(props?.additionalElements || []).map((index) => props.additionalElements[index])
                }
            </TableRow>
    )

    const widthOfTable = Object.keys(props.decompositions).length + 1;

    return (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell style={{'font-weight': 'bold'}}>
                        <IconButton 
                            size="small" 
                            onClick={() => props.onOpenTableChange()}
                        >
                            {props.openTable ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                        Metrics
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} >
                        <Collapse in={props.openTable} timeout="auto" unmountOnExit>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell colSpan={widthOfTable} style={{'font-weight': 'bold'}}>
                                            Coupling & Cohesion (0-100%)
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            Dependencies
                                        </TableCell>
                                        {
                                            Object.keys(props.decompositions).map((decompositionKey) => 
                                                <TableCell
                                                    style={props.styles[decompositionKey]}
                                                >
                                                    {decompositionKey}
                                                </TableCell>
                                            )   
                                        }
                                    </TableRow>
                                </TableHead>
                                {relationshipTypeTable}
                            </Table>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}