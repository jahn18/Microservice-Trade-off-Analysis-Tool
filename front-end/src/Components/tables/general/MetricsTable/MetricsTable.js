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
import Utils from "../../../../utils/utils";
import { TableContainer } from "@mui/material";

/**
 * A table that shows coupling and cohesion metrics for a given microservice decomposition (uses Normalized TurboMQ)
 * For more information on how the decompositions and dependencies props should be formatted, refer to the @method calculateNormalizedTurboMQ in the utils folder.
 * 
 * @param {Dictionary} props.styles additional styles you want to add to each element in the table. 
 * @param {Elements} props.additionalElements additional elements you want to add to the table. (e.g a sider or switch) should be a javascript element. 
 * @param {Dictionary<Array<Array<T>>>} props.decompositions an adjacency list representation of a microservice decomposition. e.g [[all elements in partition 1], [all elements in partition 2]... etc.] 
 *                                                           This can contain multiple decompositions {decomposition1: [[...], ...], decomposition2: [[...], ...]}  
 * @param {Dictionary} props.dependencies a dictionary containing all the dependencies shared between the elements in the decomposition. {[name of dependency e.g. 'static']: [{source: 'nodeA', target: 'nodeB', weight: 1.0}, ...], ...}
 * @param {Dictionary} props.headers the headers used for the table    
 * 
 * The architecture should be as follows:
 * The table should be organized like so --> 
 * [Title of the table]
 * [Headers (this determines the number of columns)]
 * [Values under the headers] 
 * 
 * @param {string} props.title 
 * @param {Array} props.headers (you can have multiple headers [[], []] each array will be an individual row)
 * @param {Array} props.rows 
 */
export const MetricTable = (props) => {    
    // const [tableState, setTableState] = React.useState(false);

    const relationshipTypeTable = props.rows.map((row, i) => 
        <TableRow key={i}>
            {row.map((ele, j) => 
                <TableCell id={i + j} >
                    {ele}
                </TableCell>
            )}
        </TableRow>
    )

    return (
        <TableContainer>
            <Table size="small">
                <TableBody>
                    <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} >
                                <Table size="small">
                                    <TableHead>
                                        {props.headers.map((headerRow) => 
                                            <TableRow>
                                                {headerRow.map((header) => 
                                                    <TableCell> 
                                                        {header}
                                                    </TableCell>
                                                )}
                                            </TableRow>        

                                        )}
                                    </TableHead>
                                    {relationshipTypeTable}
                                </Table>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )
}