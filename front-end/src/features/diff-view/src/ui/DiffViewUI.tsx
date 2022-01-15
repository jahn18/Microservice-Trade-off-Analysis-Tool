import React from "react";
import withStyles, { WithStylesProps } from "react-jss";
import { styles } from './DiffViewStyles';
import { connect } from "react-redux";
import { IDiffViewUIState } from "../DiffViewTypes";
import { getSelectors } from "./DiffViewUISelectors";
import { resetCytoscapeGraphAction, saveCytoscapeGraphAction} from "../../../custom-view/src/CustomViewActions";
import { JSONGraphParserUtils } from "../../../../utils/JSONGraphParserUtils";
import { Table, TableContainer, TableBody, TableRow, Slider, Paper, Typography, Button, Grid, Box } from "@mui/material";
import { Metrics } from "../../../metric-table/src/ui/MetricTableUI";
import Utils from "../../../../utils";
import { addNewMoveAction, resetChangeHistoryAction, selectElementsAction, undoMoveAction } from "../../../change-history-table/src/ChangeHistoryActions";
import { ChangeHistory } from "../../../change-history-table/src/ui/ChangeHistoryUI";
import { ChangeHistoryService } from "../../../change-history-table/service/ChangeHistoryService";
import { DiffDecomposition } from "../../../../components/Views/DiffView/DiffView";
import TradeOffSelectionTable from "../../../../components/SelectionTables/TradeOffTable";
import { DiffGraphUtils } from "../../../../utils/DiffGraphUtils";
import { setSelectedDecompositionsAction } from "../DiffViewAction";
import { SearchBar } from "../../../../components/SearchBar/SearchBar";

export interface DiffViewProps extends WithStylesProps<typeof styles>, IDiffViewUIState, TActionTypes {
    // might want to use selectTabs here. 
    relationships: any,
    colors: any,
}

interface DiffViewState {
    mouseOverRow: any,
    reset: boolean,
    searchedClassName: string
}

class DiffViewBase extends React.PureComponent<DiffViewProps> {
    readonly state: DiffViewState = {
        mouseOverRow: [],
        reset: false,
        searchedClassName: ""
    }

    render() {
        if (this.props.selectedDecompositions.length === 0) {
            delete this.props.cytoscapeGraphs["diff-view"];
        }

        return (
            <>
                {
                    (this.props.selectedDecompositions.length === 0) ?
                        <div style={{position: 'absolute', top: '50%', left: '50%', msTransform: "translateX(-50%) translateY(-50%)", WebkitTransform: "translate(-50%,-50%)", transform: 'translate(-50%,-50%)', maxHeight: '75%'}}>
                            <TradeOffSelectionTable 
                                updateSelectedDecompositions={this._setSelectedDecompostions.bind(this)}
                                decompositions={[...new Set([...Object.keys(this.props.jsonGraph), ...Object.keys(this.props.cytoscapeGraphs)])].reduce((decompositions, key, index) => {return decompositions = {...decompositions, [key]: this._getCytoscapeGraph(key, index + 1)}}, {})}
                                keys={[...new Set([...Object.keys(this.props.jsonGraph), ...Object.keys(this.props.cytoscapeGraphs)])]}
                            /> 
                        </div> 
                    :
                        <div>
                       
                        <Grid container direction={'row'} style={{position: "fixed", display: "flex"}}>
                            <Grid item xs={9.5}>
                                <DiffDecomposition
                                    graphData={this.props.jsonGraph} 
                                    selectedDecompositions={this.props.selectedDecompositions}
                                    selectedTab={this._getSelectedTab()}
                                    relationshipTypes={this._getRelationshipTypes(this._getSelectedTab())} 
                                    colors={this.props.colors} 
                                    weightedViewDecomposition={undefined} 
                                    decomposition={this._getDiffGraph()}
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
                                <Typography style={{marginTop: 10, marginLeft: 27.5, display: 'flex'}} variant="h5"> 
                                    <div style={{marginRight: '8px', color: this.props.colors[this.props.selectedDecompositions[0][0]]}}>
                                        {`V${this.props.selectedDecompositions[0][1] + 1}`}
                                    </div>
                                    <div style={{marginRight: "3px"}}>
                                        {'vs.'}
                                    </div>
                                    <div style={{color: this.props.colors[this.props.selectedDecompositions[1][0]]}}>
                                        {`V${this.props.selectedDecompositions[1][1] + 1}`}
                                    </div>
                                </Typography>
                                <Button variant="outlined" color="primary"
                                    style={{
                                        marginTop: 10,
                                        marginLeft: 10
                                    }}
                                    onClick={() => {
                                        this._resetAllMoves();
                                        this._setSelectedDecompostions([]);
                                    }
                                }>
                                    Compare new 
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
                                                        title={"Metrics"}
                                                        headers={[["Coupling & Cohesion"], ["Dependencies", `V${this.props.selectedDecompositions[0][1] + 1}`, `V${this.props.selectedDecompositions[1][1] + 1}`]]}
                                                        rows={
                                                            Object.keys(this._getRelationshipTypes(this._getSelectedTab())).map((key) => {
                                                                return [
                                                                    key, 
                                                                    Utils.calculateNormalizedTurboMQ(this._getRelationshipTypes(this._getSelectedTab())[key]["cytoscapeEdges"], this._getDecompositionConfig(1)).toFixed(2),
                                                                    Utils.calculateNormalizedTurboMQ(this._getRelationshipTypes(this._getSelectedTab())[key]["cytoscapeEdges"], this._getDecompositionConfig(2)).toFixed(2),
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
                                        formatMoveOperationContent={new ChangeHistoryService().formatMoveOperationDiffView}
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

    _selectDecompositionsToCompare(decompositionA: any, decompositionB: any) {
        this.setState(
            {
                selectedDecompositions: [decompositionA, decompositionB]
            }
        )
    }

    _getDecompositionConfig(decompositionVersion: number) {
        let cytoscapeElements: any = this._getDiffGraph();

        let elements = (cytoscapeElements.elements.nodes) ? cytoscapeElements.elements.nodes : cytoscapeElements.elements;

        const numOfPartitions = this._getTotalNumOfPartitions(elements);

        let decompositionVersions: number[] = [];
        for(let i = 1; i <= 2; i++) {
            if(i !== decompositionVersion) {
                decompositionVersions.push(i);
            }
        }

        let movedElements = elements.filter((ele: any) => ele.data.element_type === "common*").map((ele: any) => ele.data.label); 

        let decomposition = [];

        for(let i = 0; i < numOfPartitions; i++) {
            let partition: any = []; 
            elements.forEach((ele: any) => {
                if(ele.data.partition === `partition${i}`) {
                    if(ele.data.element_type === "common" || ele.data.element_type === "common*") {
                        partition.push(ele.data.label);
                    } else if (ele.data.element_type === "diff" 
                        && !movedElements.includes(ele.data.label)
                        && !decompositionVersions.includes(ele.data.version)) {
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

    _setSelectedDecompostions(selectedDecompostions: any) {
        this.props.setSelectedDecompostions({selectedDecompositions: selectedDecompostions})
    }

    _getSelectedTab() {
        return this.props.selectedTab;
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

    _saveCytoscapeGraph(modifiedCytoscapeGraph: any, selectedTab: string = this._getSelectedTab()) {
        this.props.saveCytoscapeGraph({selectedTab: selectedTab, modifiedCytoscapeGraph: modifiedCytoscapeGraph});
    }

    _getDiffGraph() {
        return this.props.cytoscapeGraphs["diff-view"] || 
            {elements: new DiffGraphUtils().getDiffDecomposition(
                this._getCytoscapeGraph(this.props.selectedDecompositions[0][0], this.props.selectedDecompositions[0][1]),
                this._getCytoscapeGraph(this.props.selectedDecompositions[1][0], this.props.selectedDecompositions[1][1]),
                this.props.colors[this.props.selectedDecompositions[0][0]],
                this.props.colors[this.props.selectedDecompositions[1][0]],
                this.props.selectedDecompositions[0][1] + 1,
                this.props.selectedDecompositions[1][1] + 1
            ).getCytoscapeData()};
    }

    _getCytoscapeGraph(selectedTab: string, version = 1) {
        return this.props.cytoscapeGraphs[selectedTab] || {elements: new JSONGraphParserUtils().getDecomposition(this.props.jsonGraph[selectedTab].decomposition, version).getCytoscapeData()};
    }

    _getRelationshipTypes(selectedTab: string) {
        return this.props.relationshipTypes[selectedTab] || this.props.relationships;
    }

    _undoMove(moveOperation: any) {
        this.props.undoMove({selectedTab: this._getSelectedTab(), moveOperation: moveOperation});
    }

    _addMove(sourceNode: any, currPartitionNode: any, newPartitionNode: any, diffNode?: any) {
        this.props.addMove({selectedTab: this._getSelectedTab(), sourceNode: sourceNode, currPartitionNode: currPartitionNode, newPartitionNode: newPartitionNode, diffNode: diffNode});
    }

    _resetAllMoves() {
        this.props.resetAllMoves({selectedTab: this._getSelectedTab()});
    }

}

const mapStateToProps = (state: any) => getSelectors(state);

const mapDispatchToProps = {
    saveCytoscapeGraph: saveCytoscapeGraphAction.getReduxAction(),
    resetCytoscapeGraph: resetCytoscapeGraphAction.getReduxAction(),
    selectElementsChangeHistory: selectElementsAction.getReduxAction(),
    addMove: addNewMoveAction.getReduxAction(),
    undoMove: undoMoveAction.getReduxAction(),
    resetAllMoves: resetChangeHistoryAction.getReduxAction(),
    setSelectedDecompostions: setSelectedDecompositionsAction.getReduxAction()
}

type TActionTypes = typeof mapDispatchToProps;

export const DiffView = withStyles(styles)(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(DiffViewBase)
);