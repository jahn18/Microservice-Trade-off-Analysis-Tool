import React from "react";
import withStyles, {WithStylesProps} from "react-jss";
import { getSelectors } from "./FileInputSelectorsUI";
import { styles } from "./FileInputStyles";
import {connect} from 'react-redux';
import { IFileInputViewUIState } from "../FileInputTypes";
import { clearErrorAction, setJSONGraphInputAction, getDemoJSONGraphAction, toggleWeightedViewAction } from "../FileInputAction";
import { FileInputView } from "../../../../components/FileInput/FileInputView";
import { FormControlLabel, Switch } from "@mui/material";
import { loadToolState } from "../../../../store/localStorage";

export interface FileInputProps extends WithStylesProps<typeof styles>, IFileInputViewUIState, TActionTypes {
}

class FileInputViewBase extends React.PureComponent<FileInputProps> {
    render() {
        return (
            <>
                <FormControlLabel control={<Switch onChange={(e) => this._enableWeightedView(e.target.checked)} defaultChecked={loadToolState()}/>} label="OFF - Diff Mode / ON - Weighted Mode" />
                <FileInputView 
                    onFileUpload={this._readFile.bind(this)}
                    getDemoGraph={this._getDemoGraph.bind(this)}
                    jsonGraph={this.props.jsonGraph}
                />
            </>
        );
    }

    _getDemoGraph(projectName: string) {
        this.props.getDemoGraph({projectName: projectName});
    }

    _readFile(file: any) {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onloadend = (event: any) => {this.props.addFileInput({file: event.target.result})};
    }

    _clearError() {
        this.props.clearError();
    }

    _enableWeightedView(enable: boolean) {
        this.props.toggleWeightedView({toggleWeightedView: enable});
    }
}

const mapStateToProps = (state: any) => getSelectors(state);
const mapDispatchToProps = {
    addFileInput: setJSONGraphInputAction.getReduxAction(),
    clearError: clearErrorAction.getReduxAction(),
    getDemoGraph: getDemoJSONGraphAction.getReduxAction(),
    toggleWeightedView: toggleWeightedViewAction.getReduxAction()
}

type TActionTypes = typeof mapDispatchToProps;

export const FileInput = withStyles(styles)(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(FileInputViewBase)
)