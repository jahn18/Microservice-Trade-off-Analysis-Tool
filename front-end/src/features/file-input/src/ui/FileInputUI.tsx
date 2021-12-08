import React from "react";
import withStyles, {WithStylesProps} from "react-jss";
import { getSelectors } from "./FileInputSelectorsUI";
import { styles } from "./FileInputStyles";
import {connect} from 'react-redux';
import { IFileInputViewUIState } from "../FileInputTypes";
import { clearErrorAction, setJSONGraphInputAction, getDemoJSONGraphAction } from "../FileInputAction";
import { FileInputView } from "../../../../components/FileInput/FileInputView";

export interface FileInputProps extends WithStylesProps<typeof styles>, IFileInputViewUIState, TActionTypes {
}

class FileInputViewBase extends React.PureComponent<FileInputProps> {
    render() {
        return (
            <>
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
        fileReader.onloadend = (event: any) => this.props.addFileInput({file: event.target.result});
    }

    _clearError() {
        this.props.clearError();
    }
}

const mapStateToProps = (state: any) => getSelectors(state);
const mapDispatchToProps = {
    addFileInput: setJSONGraphInputAction.getReduxAction(),
    clearError: clearErrorAction.getReduxAction(),
    getDemoGraph: getDemoJSONGraphAction.getReduxAction()
}

type TActionTypes = typeof mapDispatchToProps;

export const FileInput = withStyles(styles)(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(FileInputViewBase)
)