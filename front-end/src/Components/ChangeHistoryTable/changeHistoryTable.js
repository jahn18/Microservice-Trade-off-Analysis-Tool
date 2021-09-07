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
import Collapse from '@material-ui/core/Collapse';

/**
 * This table is used to render the change history table on the trade-off view. 
 *  
 */
const ChangeHistoryTable = (props) => {

    // The header of the table
    const renderHeader = () => {
        return (
            <TableRow>
                {props.elementsSelectedOnTable.length > 0 ? (
                    <TableCell
                        onMouseOver={(event) => {
                            this.highlightSelectedElements(null);
                        }}
                        onMouseOut={(event) => {
                            this.onUnhighlightNodes();
                        }}
                    >
                        <IconButton 
                            size="small" 
                            onClick={() => {
                                this.setState({
                                    openTable: {
                                        ...this.state.openTable,
                                        changeHistory: !openTable.changeHistory 
                                    }
                                })
                            }}
                        >
                            {openTable.changeHistory ? <KeyboardArrowUpIcon onClick={(event) => this.onUnhighlightNodes()}/> : <KeyboardArrowDownIcon onClick={(event) => this.onUnhighlightNodes()}/>}
                        </IconButton>
                    {elementsSelectedOnTable.length} selected
                        <Tooltip title="Undo">
                            <IconButton 
                                aria-label="undo" 
                                onClick={(event) => this._onDeleteRowsFromChangeHistory()}
                            >
                                <UndoIcon
                                    onClick={(event) => this.onUnhighlightNodes()}
                                />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                    ) : (
                    <TableCell style={{'font-weight': 'bold'}}>
                        <IconButton 
                            size="small" 
                            onClick={() => {
                                this.setState({
                                    openTable: {
                                        ...this.state.openTable,
                                        changeHistory: !openTable.changeHistory 
                                    }
                                })
                            }}
                        >
                            {openTable.changeHistory ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                        Change History
                    </TableCell> 
                )}
            </TableRow>
        )
    };

    // Contains all the information of the moves performed in the trade-off view.
    // The changeHistory table contains the move history and the actual table itself. 
    const changeHistoryMoveList = props.table.map(
        (movedElementInfo, index) => 
        <TableRow key={index}
            hover={props.hover}// {props.checkIfLastMoveForClass(movedElementInfo)} 
            onMouseOver={props.onMouseOver} /*{(event) => {
               if(props.checkIfLastMoveForClass(movedElementInfo)) {
                    props.highlightSelectedElements(movedElementInfo);
                }
            }}*/
            onMouseOut={props.onMouseOut} /*{(event) => {
                if(props.checkIfLastMoveForClass(movedElementInfo)) {
                    props.onUnhighlightNodes();
                    props.setState({relationshipTypeTable: props.createRelationshipTypeTable()});
                }
            }}*/
        >
            <TableCell>
                <Checkbox
                    checked={props.onCheckboxChecked}  //{elementsSelectedOnTable.includes(movedElementInfo)}
                    onChange={props.onCheckBoxChange} //{(event, newValue) => this._updateSelectedEvolutionaryList(newValue, movedElementInfo, index)}
                    disabled={props.onCheckBoxDisable} //{!this._checkIfLastMoveForClass(movedElementInfo)}
                />
                {props.printEvolutionaryHistoryText(movedElementInfo)}
            </TableCell>
        </TableRow>
    );

    return(
        <Table>
            {renderHeader}
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0}} >
                    <Collapse in={props.openChangeHistoryTable} timeout="auto" unmountOnExit>
                        <Table size="small">
                                {changeHistoryMoveList}
                        </Table>
                    </Collapse>
                </TableCell>
            </TableRow>
        </Table>
    )
};

export default ChangeHistoryTable;