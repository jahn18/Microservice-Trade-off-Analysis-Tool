import React from "react";
import withStyles, { WithStylesProps } from "react-jss";
import { styles } from './WeightedViewStyles';
import { connect } from "react-redux";
import { IWeightedViewUIState } from "../WeightedViewTypes";
import { getSelectors } from "./WeightedViewUISelectors";
import { JSONGraphParserUtils } from "../../../../utils/JSONGraphParserUtils";
import { fetchWeightedDecompositionAction, setWeightsAction } from "../WeightedViewActions";
import { Table, TableContainer, TableBody, TableRow, Slider, Paper, Button, Grid, Box } from "@mui/material";
import { Metrics } from "../../../metric-table/src/ui/MetricTableUI";
import Utils from "../../../../utils";
import { addNewMoveAction, selectElementsAction, undoMoveAction, resetChangeHistoryAction } from "../../../change-history-table/src/ChangeHistoryActions";
import { ChangeHistory } from "../../../change-history-table/src/ui/ChangeHistoryUI";
import { ChangeHistoryService } from "../../../change-history-table/service/ChangeHistoryService";
import { CustomDecomposition } from "../../../../views/custom-decomposition/CustomDecomposition";
import { resetCytoscapeGraphAction, saveCytoscapeGraphAction, updateRelationshipTypeAction } from "../../../custom-view/src/CustomViewActions";
import WeightedRelationshipSelectionTable from "../../../../components/SelectionTables/WeightedRelationshipTable";
import { SearchBar } from "../../../../components/SearchBar/SearchBar";

export interface WeightedViewProps extends WithStylesProps<typeof styles>, IWeightedViewUIState, TActionTypes {
    relationships: any,
    colors: any
}

interface WeightedViewState {
    mouseOverRow: any,
    reset: boolean,
    newWeights: boolean
    searchedClassName: string
}

class WeightedViewBase extends React.PureComponent<WeightedViewProps> {
    readonly state: WeightedViewState = {
        mouseOverRow: [],
        reset: false,
        newWeights: false,
        searchedClassName: ""
    }

    render() {
        if (this.state.newWeights) {
            delete this.props.cytoscapeGraphs["weighted-view"];
        }

        return (
            <>
            {
                (!this.props.cytoscapeGraphs["weighted-view"]) ?
                    <div style={{position: 'absolute', top: '50%', left: '50%', msTransform: "translateX(-50%) translateY(-50%)", WebkitTransform: "translate(-50%,-50%)", transform: 'translate(-50%,-50%)', maxHeight: '75%'}}>
                        <WeightedRelationshipSelectionTable 
                            graphData={this.props.jsonGraph}
                            fetchWeightedDecomposition={this._fetchWeightedGraph.bind(this)}
                            setNewWeights={() => this.setState({newWeights: false})}
                            clustering={this.props.loading}
                            setWeights={this._setWeights.bind(this)}
                            weights={(Object.keys(this.props.weights).length === 0) ? undefined : this.props.weights}
                        />
                    </div> 
                    : 
                    <div>
                        <Grid container direction={'row'} style={{position: "fixed", display: "flex"}}>
                            <Grid item xs={9.5}>
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
                                    searchedClassName={this.state.searchedClassName}
                                />
                                <Button variant="outlined" color="primary"
                                        style={{
                                            marginTop: 10,
                                            marginLeft: 10
                                        }}
                                        onClick={() => {
                                            this._resetAllMoves();
                                            this._setWeights({});
                                            delete this.props.cytoscapeGraphs["weighted-view"];
                                            this.setState({newWeights: true});
                                        }
                                    }>
                                        New Weights
                                </Button>
                            </Grid>
                            <Grid item xs={2.5}>
                                <Box style={{width: "100%", height: "100vh", border: '1px solid grey'}}>
                                    <TableContainer 
                                        style={{
                                            maxHeight: "100%"
                                        }}
                                    >
                                        <Table stickyHeader size="small">
                                            <TableBody >
                                                <TableRow>
                                                    <SearchBar 
                                                        changeClassName={(className: string) => this.setState({searchedClassName: className})}
                                                    />
                                                </TableRow>
                                                <TableRow>
                                                    <Metrics 
                                                        headers={[["Coupling & Cohesion"], ["Dependencies", "Values", "Edge Filter"]]}
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
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
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
                                </Box>
                            </Grid>
                        </Grid>
                    </div>
                }
            </>
        );
    }

    _setWeights(weights: any) {
        this.props.setWeights({weights: weights});
    }

    _fetchWeightedGraph(weights: any, jsonGraph: any) {
        this.props.fetchWeightedDecomposition({weights: weights, jsonGraph: jsonGraph});
    }

    _resetAllMoves() {
        this.props.resetAllMoves({selectedTab: this._getSelectedTab()});
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
        return this.props.relationshipTypes[selectedTab] || this.props.relationships;
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
    fetchWeightedDecomposition: fetchWeightedDecompositionAction.getReduxAction(),
    addMove: addNewMoveAction.getReduxAction(),
    undoMove: undoMoveAction.getReduxAction(),
    resetAllMoves: resetChangeHistoryAction.getReduxAction(),
    setWeights: setWeightsAction.getReduxAction()
}

type TActionTypes = typeof mapDispatchToProps;

export const WeightedView = withStyles(styles)(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(WeightedViewBase)
);
