import React from "react";
import withStyles, { WithStylesProps } from "react-jss";
import { styles } from './CustomViewStyles';
import { connect } from "react-redux";
import { ICustomViewUIState } from "../CustomViewTypes";
import { getSelectors } from "./CustomViewUISelectors";
import {CustomDecomposition} from "../../../../views/custom-decomposition/CustomDecomposition";
import { resetCytoscapeGraphAction, saveCytoscapeGraphAction, updateRelationshipTypeAction } from "../CustomViewActions";
import { JSONGraphParserUtils } from "../../../../utils/JSONGraphParserUtils";
import { Table, TableContainer, TableBody, TableRow, Slider, Paper } from "@mui/material";
import { Metrics } from "../../../metric-table/src/ui/MetricTableUI";
import Utils from "../../../../utils";
import { addNewMoveAction, selectElementsAction, undoMoveAction } from "../../../change-history-table/src/ChangeHistoryActions";
import { ChangeHistory } from "../../../change-history-table/src/ui/ChangeHistoryUI";
import { ChangeHistoryService } from "../../../change-history-table/service/ChangeHistoryService";

export interface CustomViewProps extends WithStylesProps<typeof styles>, ICustomViewUIState, TActionTypes {
    relationships: any,
    colors: any
}

interface CustomViewState {
    mouseOverRow: any,
    reset: boolean
}

class CustomViewBase extends React.PureComponent<CustomViewProps> {
    readonly state: CustomViewState = {
        mouseOverRow: [],
        reset: false
    }

    render() {
        return (
            <>
                <CustomDecomposition 
                    decomposition={this._getCytoscapeGraph(this._getSelectedTab())}
                    selectedTab={this._getSelectedTab()}
                    relationshipTypes={this._getRelationshipTypes(this._getSelectedTab())}
                    saveGraph={this._saveCytoscapeGraph.bind(this)}
                    addMove={this._addMove.bind(this)}
                    undoMove={this._undoMove.bind(this)}
                    selectedElements={[...this._getSelectedElementsChangeHistory(), ...this.state.mouseOverRow]}
                    mouseOverChangeHistory={this.state.mouseOverRow.length !== 0}
                    resetMoves={this.state.reset}
                    clearChangeHistoryTable={() => {
                        this.setState({reset: false});
                    }}
                    resetDecomposition={{elements: new JSONGraphParserUtils().getDecomposition(this.props.jsonGraph[this._getSelectedTab()].decomposition, 1).getCytoscapeData()}}
                />
                <TableContainer 
                    component={Paper}
                    style={{
                        width: "30%",
                        border: '1px solid grey',
                        'left': '69%',
                        position: 'fixed',
                        maxHeight: '700px'
                    }}
                >
                    <Table stickyHeader size="small">
                        <TableBody >
                            <TableRow>
                                <Metrics 
                                    headers={[["Coupling & Cohesion (0-100%)"], ["Dependencies", "Values", "Edge Filter"]]}
                                    title={"Metrics + Edge Filter"}
                                    rows={
                                        Object.keys(this._getRelationshipTypes(this._getSelectedTab())).map((key) => {
                                            return [
                                                key, 
                                                Utils.calculateNormalizedTurboMQ(this._getRelationshipTypes(this._getSelectedTab())[key]["cytoscapeEdges"], this._getDecompositionConfig()).toFixed(2),
                                                <Slider 
                                                    size="small"
                                                    aria-labelledby="discrete-slider"
                                                    valueLabelDisplay="auto"
                                                    value={this._getRelationshipTypes(this._getSelectedTab())[key].minimumEdgeWeight}
                                                    step={10}
                                                    marks={true}
                                                    defaultValue={0}
                                                    min={0}
                                                    max={100}
                                                    style={{
                                                        width: '100%',
                                                        color: this.props.colors[key]
                                                    }}
                                                    onChange={(event, weight) => {
                                                        const relationshipType = this._getRelationshipTypes(this._getSelectedTab());
                                                        relationshipType[key].minimumEdgeWeight = weight; 
                                                        this._updateRelationshipType(this._getSelectedTab(), relationshipType)
                                                    }}
                                                />
                                            ];
                                        })
                                    }
                                />
                            </TableRow>
                            <TableRow>
                                <ChangeHistory 
                                    selectedTab={this._getSelectedTab()}
                                    formatMoveOperationContent={new ChangeHistoryService().printMoveOperationIndividualView}
                                    onSelectedElements={(elementList: any) => {
                                        this._setSelectedElementsChangeHistory(elementList);
                                    } }
                                    resetChangeHistory={() => {
                                        this._getSelectedElementsChangeHistory().forEach((moveOperation: any) => {
                                            this._undoMove(moveOperation);
                                        });
                                        this.setState({reset: true});
                                    } }
                                    onMouseOver={(ele: any) => { this.setState({ mouseOverRow: [ele] }); } }
                                    onMouseOut={() => { this.setState({ mouseOverRow: [] }); } } 
                                />
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </>
        );
    }

    _getDecompositionConfig() {
        // Get all moved elements. 
        let cytoscapeElements: any = this._getCytoscapeGraph(this._getSelectedTab());

        let elements = (cytoscapeElements.elements.nodes) ? cytoscapeElements.elements.nodes : cytoscapeElements.elements;

        let decomposition = [];
        const numOfPartitions = this._getTotalNumOfPartitions(elements);

        for(let i = 0; i < numOfPartitions; i++) {
            let partition: any[] = []; 
            elements.forEach((ele: any) => {
                if (ele.data.partition === `partition${i}`) {
                    if (ele.data.element_type === "common" || ele.data.element_type === "common*") {
                        partition.push(ele.data.label);
                    } 
                }
            })
            if(partition.length !== 0) {
                decomposition.push(partition);
            }
        }

        return decomposition;
    }

    _getSelectedTab() {
        return (this.props.selectedTab === "") ? Object.keys(this.props.jsonGraph)[0] : this.props.selectedTab;
    }

    _getTotalNumOfPartitions(cytoscapeElements: any) {
        return cytoscapeElements.reduce((numOfPartitions: number, ele: any) => {
            return (ele.data.element_type === "partition") ? numOfPartitions + 1 : numOfPartitions; 
        }, 0);
    }

    _getSelectedElementsChangeHistory() {
        return this.props.selectedElements[this._getSelectedTab()] || [];
    }

    _setSelectedElementsChangeHistory(selectedElements: any[]) {
        this.props.selectElementsChangeHistory({selectedTab: this._getSelectedTab(), selectedElements: selectedElements});
    }

    _saveCytoscapeGraph(modifiedCytoscapeGraph: JSON, selectedTab: string = this._getSelectedTab()) {
        this.props.saveCytoscapeGraph({selectedTab: selectedTab, modifiedCytoscapeGraph: modifiedCytoscapeGraph});
    }

    _getCytoscapeGraph(selectedTab: string) {
        return this.props.cytoscapeGraphs[selectedTab] || {elements: new JSONGraphParserUtils().getDecomposition(this.props.jsonGraph[selectedTab].decomposition, 1).getCytoscapeData()};
    }

    _getRelationshipTypes(selectedTab: string) {
        return this.props.relationshipTypes[selectedTab] || this._getPresetRelationshipType(selectedTab);
    }

    _getPresetRelationshipType(selectedTab: string) {
        Object.keys(this.props.relationships).forEach((key) => {
            if (selectedTab === key) {
                this.props.relationships[key].minimumEdgeWeight = 100; 
            } else {
                this.props.relationships[key].minimumEdgeWeight = 0;
            }
        }); 
        return this.props.relationships;
    }

    _updateRelationshipType(selectedTab: string, relationshipTypes: any) {
        this.props.updateRelationshipType({selectedTab: selectedTab, updatedRelationshipType: relationshipTypes});
    }

    _undoMove(moveOperation: any) {
        this.props.undoMove({selectedTab: this._getSelectedTab(), moveOperation: moveOperation});
    }

    _addMove(sourceNode: any, currPartitionNode: any, newPartitionNode: any) {
        this.props.addMove({selectedTab: this._getSelectedTab(), sourceNode: sourceNode, currPartitionNode: currPartitionNode, newPartitionNode: newPartitionNode});
    }

}

const mapStateToProps = (state: any) => getSelectors(state);

const mapDispatchToProps = {
    saveCytoscapeGraph: saveCytoscapeGraphAction.getReduxAction(),
    resetCytoscapeGraph: resetCytoscapeGraphAction.getReduxAction(),
    selectElementsChangeHistory: selectElementsAction.getReduxAction(),
    updateRelationshipType: updateRelationshipTypeAction.getReduxAction(),
    addMove: addNewMoveAction.getReduxAction(),
    undoMove: undoMoveAction.getReduxAction()
}

type TActionTypes = typeof mapDispatchToProps;

export const CustomView = withStyles(styles)(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(CustomViewBase)
);
