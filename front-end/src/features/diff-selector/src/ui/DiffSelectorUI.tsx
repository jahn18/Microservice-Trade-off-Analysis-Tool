import React from 'react'
import withStyles, {WithStylesProps} from "react-jss";
import { styles } from "./DiffSelectorStyles";
import {DiffSelectorView} from '../../../../components/DiffSelector/DiffSelector';
import {toggleDiffViewAction} from "../DiffSelectorAction";
import {IDiffSelectorViewUIState} from "../DiffSelectorTypes";
import {connect} from 'react-redux';
import {getSelectors} from "./DiffSelectorSelectorsUI";

export interface DiffSelectorProps extends IDiffSelectorViewUIState, TActionTypes {
}

class DiffSelectorBase extends React.PureComponent<DiffSelectorProps> {
    render() {
        return (
            <DiffSelectorView
                onChange={this._toggleDiffView.bind(this)}
                diffSelect={this.props.diffSelect}
             />
        );
    }

    _toggleDiffView(diffSelect: boolean) {
        this.props.toggleDiffView({diffSelect: diffSelect});
    }
}

const mapStateToProps = (state: any) => getSelectors(state);
const mapDispatchToProps = {
    toggleDiffView: toggleDiffViewAction.getReduxAction()
}
type TActionTypes = typeof mapDispatchToProps;

export const DiffSelectorUI = connect(mapStateToProps, mapDispatchToProps)(DiffSelectorBase);