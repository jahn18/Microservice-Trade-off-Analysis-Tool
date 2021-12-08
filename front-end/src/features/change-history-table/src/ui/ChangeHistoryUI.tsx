import React from "react";
import withStyles, { WithStylesProps } from "react-jss";
import { styles } from './ChangeHistoryStyles';
import { connect } from "react-redux";
import { IChangeHistoryUIState } from '../ChangeHistoryTypes';
import { getSelectors } from "./ChangeHistorySelectors";
import {ChangeHistoryTable} from "../../../../components/tables/ChangeHistoryTable/ChangeHistoryTable";

export interface ChangeHistoryProps extends WithStylesProps<typeof styles>, IChangeHistoryUIState, TActionTypes {
    selectedTab: string,
    formatMoveOperationContent: (moveOperation: any) => string
    onSelectedElements: Function,
    resetChangeHistory: Function,
    onMouseOver: Function,
    onMouseOut: Function
}

class ChangeHistoryBase extends React.PureComponent<ChangeHistoryProps> {
    render() {
        return (
            <ChangeHistoryTable 
                allMoveOperations={this._getChangeHistory()}
                selectedElements={this._getSelectedElements()}
                formatMoveOperationContent={this.props.formatMoveOperationContent.bind(this)}
                onSelectedElements={this.props.onSelectedElements.bind(this)}
                onMouseOver={this.props.onMouseOver.bind(this)}
                onMouseOut={this.props.onMouseOut.bind(this)}
                resetChangeHistory={this.props.resetChangeHistory.bind(this)}
            />
        )
    }

    _getChangeHistory() {
        return this.props.changeHistory[this.props.selectedTab] || [];
    }

    _getSelectedElements() {
        return this.props.selectedElements[this.props.selectedTab] || [];
    }
}

const mapStateToProps = (state: any) => getSelectors(state);

const mapDispatchToProps = {
}

type TActionTypes = typeof mapDispatchToProps; 

export const ChangeHistory = withStyles(styles)(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(ChangeHistoryBase)
)