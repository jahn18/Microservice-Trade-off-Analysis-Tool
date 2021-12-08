import React, {useState} from "react";
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import Collapse from '@material-ui/core/Collapse';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import IconButton from '@material-ui/core/IconButton';
import UndoIcon from '@material-ui/icons/Undo';


/**
 * The main functionality of this table is centralized around what is passed in the allMoveOperations props.
 * This will contain all the information on the move operations you want to store within the change history table.  
 * 
 * All other props are functions that indicate what user event should occur based on the move operation selected.
 * 
 * @param {Array<T>} props.allMoveOperations All the current move operations ordered in sequence. 
 * @param {(allMoveOperations[i], allSelectedElements) => void} props.onMouseOver what to do when the user has their mouse over each row.
 * @param {(allMoveOperations[i], allSelectedElements) => void} props.onMouseOut [function]: what to do when the user moves their mouse away from each row. 
 * @param {(allMoveOperations[i], allSelectedElements) => string | number} props.formatMoveOperationContent the content that should be printed in each row using the info given each move operation. 
 * @param {(allSelectedElements) => void} props.onSelectedElements function to deal with elements when they are selected.
 */
export const ChangeHistoryTable = (props) => {
    const [tableState, setTableState] = useState(false);

    const changeSelectedEles = (isSelected, newSelectedEle) => {
        if (isSelected) {
            props.onSelectedElements([...props.selectedElements, newSelectedEle]) 
        } else {
            const removedSelectedEleFromList = props.selectedElements.filter((ele) => {
                return ele !== newSelectedEle;
            });
            props.onSelectedElements(removedSelectedEleFromList); 
        }
    }

    const {
        allMoveOperations,
        onMouseOut,
        onMouseOver,
        formatMoveOperationContent,
    } = props;

    const changeHistoryList = allMoveOperations.map((movedElementOperation, index) =>
        <TableRow key={`move-operation-${index}`}
            hover={true}
            onMouseOver={() => onMouseOver(movedElementOperation)}
            onMouseOut={() => onMouseOut()}
        >
            <TableCell size="small">
                <Checkbox
                    checked={props.selectedElements.includes(movedElementOperation)}
                    onChange={(event, checked) => {
                        changeSelectedEles(checked, movedElementOperation)
                    }}
                />
                {formatMoveOperationContent(movedElementOperation, props.selectedElements)}
            </TableCell>
        </TableRow>
    );

    return (
        <Table stickyHeader aria-label="change-history-table" size="small">
            <TableBody>
                <TableRow>
                    {props.selectedElements.length > 0 ? (
                        <TableCell // onMouseOver={() => this.highlightSelectedElements(null)}
                        >
                            <IconButton 
                                size="small" 
                                onClick={() => setTableState(!tableState)}
                            >
                                {tableState ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                            </IconButton>
                        {props.selectedElements.length} selected
                            <Tooltip title="Undo">
                                <IconButton 
                                    aria-label="undo" 
                                    onClick={() => {
                                        props.resetChangeHistory();
                                        props.onSelectedElements([]);
                                    }}
                                >
                                    <UndoIcon/>
                                </IconButton>
                            </Tooltip>
                        </TableCell>
                        ) : (
                        <TableCell style={{'font-weight': 'bold'}}>
                            <IconButton 
                                size="small" 
                                onClick={() => setTableState(!tableState)}
                            >
                                {tableState ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                            Change History
                        </TableCell> 
                    )}
                </TableRow>
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0}} >
                        <Collapse in={tableState} timeout="auto" unmountOnExit>
                            <Table size="small">
                                {changeHistoryList}
                            </Table>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}