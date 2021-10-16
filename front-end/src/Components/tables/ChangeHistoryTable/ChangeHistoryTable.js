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
 * @param {(allMoveOperations[i], allSelectedElements) => boolean} props.enableHover a function determining when a table row can be hovered over
 * @param {(allMoveOperations[i], allSelectedElements) => boolean} props.disable[boolean]: if the current row should be disabled from user interfaction.  
 * @param {(allMoveOperations[i], allSelectedElements) => void} props.onMouseOver what to do when the user has their mouse over each row.
 * @param {(allMoveOperations[i], allSelectedElements) => void} props.onMouseOut [function]: what to do when the user moves their mouse away from each row. 
 * @param {(allMoveOperations[i], allSelectedElements) => string | number} props.moveOperationContent the content that should be printed in each row using the info given each move operation. 
 * @param {(allSelectedElements) => void} props.onAllSelectedElements function to deal with elements when they are selected.
 * @param {boolean} props.openTable if true, opens the table. if false, then the table is closed.   
 * @param {() => void} props.onOpenTableChange callback when the table is opened or closed   
 */
export const ChangeHistoryTable = (props) => {
    const [selectedElesList, updateSelectedElesList] = useState([]);

    const changeSelectedEles = (isSelected, newSelectedEle) => {
        if (isSelected) {
            updateSelectedElesList((oldSelectedEles) => [...oldSelectedEles, newSelectedEle]);
        } else {
            const removedSelectedEleFromList = selectedElesList.filter((ele) => {
                return ele !== newSelectedEle;
            });
            updateSelectedElesList(removedSelectedEleFromList);
        }
    }

    const {
        allMoveOperations,
        enableHover,
        onMouseOut,
        onMouseOver,
        disable, 
        moveOperationContent,
        onAllSelectedElements,
        openTable,
        onOpenTableChange
    } = props;

    const changeHistoryList = allMoveOperations.map((movedElementOperation, index) =>
        <TableRow key={`move-operation-${index}`}
            hover={enableHover(movedElementOperation)}
            onMouseOver={() => onMouseOver(movedElementOperation, selectedElesList)}
            onMouseOut={() => onMouseOut(movedElementOperation, selectedElesList)}
        >
            <Checkbox
                checked={selectedElesList.includes(movedElementOperation)}
                onChange={(event, checked) => changeSelectedEles(checked, movedElementOperation)}
                disabled={!disable(movedElementOperation, selectedElesList)}
            />
            <TableCell>
                {moveOperationContent(movedElementOperation, selectedElesList)}
            </TableCell>
        </TableRow>
    );

    return (
        <Table stickyHeader aria-label="change-history-table" size="small">
            <TableBody>
                <TableRow>
                    {selectedElesList.length > 0 ? (
                        <TableCell // onMouseOver={() => this.highlightSelectedElements(null)}
                        >
                            <IconButton 
                                size="small" 
                                onClick={() => onOpenTableChange()}
                            >
                                {openTable ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                            </IconButton>
                        {selectedElesList.length} selected
                            <Tooltip title="Undo">
                                <IconButton 
                                    aria-label="undo" 
                                    onClick={() => {
                                        onAllSelectedElements(selectedElesList);
                                        updateSelectedElesList([]); // Clears the selected element list. 
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
                                onClick={() => onOpenTableChange()}
                            >
                                {openTable ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                            Change History
                        </TableCell> 
                    )}
                </TableRow>
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0}} >
                        <Collapse in={openTable} timeout="auto" unmountOnExit>
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