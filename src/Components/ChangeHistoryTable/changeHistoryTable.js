import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';

const ChangeHistoryTable = (props) => {
    return(
        <div>
            <TableContainer 
            component={Paper} 
            style={
                    {
                        width: '30%',
                        border: '1px solid grey',
                        'margin-top': '295px',
                        maxHeight: '300px',
                        position: 'fixed'
                    }
                } 
            >
                <Table stickyHeader aria-label="simple table" size="small" style={{maxHeight: '300px'}}>
                    <TableHead>
                        <TableRow>
                            {props.elementsSelectedOnTable.length > 0 ? (
                                <TableCell>
                                {props.elementsSelectedOnTable.length} selected
                                    <Tooltip title="Delete">
                                        <IconButton 
                                            aria-label="delete" 
                                            onClick={(event) => props.onClick}
                                        >
                                            <DeleteIcon/>
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                                ) : (
                                <TableCell align="left" style={{'font-weight': 'bold'}}>
                                    Change History
                                </TableCell> 
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody key={props.tableRenderKey}>
                        {props.changeHistoryList}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
};

export default ChangeHistoryTable;