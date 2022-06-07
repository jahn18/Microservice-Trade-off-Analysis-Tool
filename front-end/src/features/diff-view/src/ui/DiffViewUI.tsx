import React from "react";
import withStyles, { WithStylesProps } from "react-jss";
import { styles } from './DiffViewStyles';
import { connect } from "react-redux";
import { IDiffViewUIState } from "../DiffViewTypes";
import { getSelectors } from "./DiffViewUISelectors";
import { resetCytoscapeGraphAction, saveCytoscapeGraphAction} from "../../../custom-view/src/CustomViewActions";
import { JSONGraphParserUtils } from "../../../../utils/JSONGraphParserUtils";
import { Table, TableContainer, TableBody, TableRow, Slider, Paper, Typography, Button, Grid, Box} from "@mui/material";
import { Metrics } from "../../../metric-table/src/ui/MetricTableUI";
import Utils from "../../../../utils";
import { addNewMoveAction, resetChangeHistoryAction, selectElementsAction, undoMoveAction } from "../../../change-history-table/src/ChangeHistoryActions";
import { ChangeHistory } from "../../../change-history-table/src/ui/ChangeHistoryUI";
import { ChangeHistoryService } from "../../../change-history-table/service/ChangeHistoryService";
import { DiffDecomposition } from "../../../../views/diff-view/DiffView";
import SimilarityTable from "../../../../components/Tables/diff-view/SimilarityTable/SimilarityTable";
import { DiffGraphUtils } from "../../../../utils/DiffGraphUtils";
import { fetchWeightedDiffDecompositionAction, setDiffWeightsAction, setSelectedDecompositionsAction } from "../DiffViewAction";
import { SearchBar } from "../../../../components/SearchBar/SearchBar";
import { ClassSearchResults } from "../../../../components/ClassSearchResults/ClassSearchResults"
import { styled } from '@mui/system';
import TabsUnstyled from '@mui/base/TabsUnstyled';
import TabPanelUnstyled from '@mui/base/TabPanelUnstyled';
import TabsListUnstyled from '@mui/base/TabsListUnstyled';
import { buttonUnstyledClasses } from '@mui/base/ButtonUnstyled';
import TabUnstyled, { tabUnstyledClasses } from '@mui/base/TabUnstyled';
import WeightedDiffRelationshipSelectionTable from "../../../../components/Tables/diff-view/WeightsTable/WeightedDiffRelationshipTable";
import Container from '@mui/material/Container';


const Tab = styled(TabUnstyled)`
    font-family: IBM Plex Sans, sans-serif;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: bold;
    background-color: transparent;
    width: 100%;
    padding: 1px 3px;
    margin: 2px 2px;
    border: none;
    border-radius: 2px;
    display: flex;
    justify-content: center;

    &:hover {
        background-color: grey;
    }

&.${buttonUnstyledClasses.focusVisible} {
    color: #fff;
    outline: none;
    background-color: #585858;
}

&.${tabUnstyledClasses.selected} {
    background-color: white;
    color: #404040;
}

&.${buttonUnstyledClasses.disabled} {
    opacity: 0.25;
    cursor: not-allowed;
}
`;

const TabPanel = styled(TabPanelUnstyled)`
  width: 100%;
  font-family: IBM Plex Sans, sans-serif;
  font-size: 0.9rem;
`;

const TabsList = styled(TabsListUnstyled)`
    background-color: #585858;
    width: 50%;
    margin-left: 30px;
    // border-radius: 3px;
    margin-bottom: 0px;
    display: flex;
    align-items: center;
    justify-content: center;
    align-content: space-between;
`;


export interface DiffViewProps extends WithStylesProps<typeof styles>, IDiffViewUIState, TActionTypes {
    relationships: any,
    colors: any,
}

interface DiffViewState {
    mouseOverRow: any,
    reset: boolean,
    searchedClassName: string,
    searchResults: any,
    clicked: boolean,
    clickedClassName: string
}

class DiffViewBase extends React.PureComponent<DiffViewProps> {
    readonly state: DiffViewState = {
        mouseOverRow: [],
        searchResults: [],
        reset: false,
        clickedClassName: "",
        searchedClassName: "",
        clicked: false
    }

    render() {
        if (this.props.selectedDecompositions.length === 0) {
            delete this.props.cytoscapeGraphs["diff-view"];
            delete this.props.cytoscapeGraphs["weighted-diff-view"];
        }
        
        return (
            <>
                {
                    (this.props.selectedDecompositions.length === 0) ?
                        <div style={{position: 'absolute', top: '50%', left: '50%', msTransform: "translateX(-50%) translateY(-50%)", WebkitTransform: "translate(-50%,-50%)", transform: 'translate(-50%,-50%)', maxHeight: '75%'}}>
                            <SimilarityTable
                                updateSelectedDecompositions={this._setSelectedDecompostions.bind(this)}
                                // ** UNCOMMENT IF YOU WANT TO INCLUDE WEIGHTED VIEW IN THE DIFF VIEW **
                                // decompositions={[...new Set([...Object.keys(this.props.jsonGraph), ...Object.keys(this.props.cytoscapeGraphs)])].reduce((decompositions, key, index) => {return decompositions = {...decompositions, [key]: this._getCytoscapeGraph(key)}}, {})}
                                // keys={[...new Set([...Object.keys(this.props.jsonGraph), ...Object.keys(this.props.cytoscapeGraphs)])]} 
                                decompositions={[...new Set([...Object.keys(this.props.jsonGraph)])].reduce((decompositions, key, index) => {return decompositions = {...decompositions, [key]: this._getCytoscapeGraph(key)}}, {})}
                                keys={[...new Set([...Object.keys(this.props.jsonGraph)])]}
                            /> 
                        </div> 
                    :
                        <div style={{height: "100%"}}>
                       
                        <Grid container direction={'row'} style={{height: "100%", width: "100%", overflow: "auto"}}>
                            <Grid item xs={9.5}>
                                <Box style={{width: "100%", height: "100%", border: '1px solid grey'}}>
                                    <DiffDecomposition
                                        graphData={this.props.jsonGraph} 
                                        selectedDecompositions={this.props.selectedDecompositions}
                                        selectedTab={this._getSelectedTab()}
                                        relationshipTypes={this._getRelationshipTypes(this._getSelectedTab())} 
                                        colors={this.props.colors} 
                                        weightedViewDecomposition={undefined} 
                                        decomposition={this._getDiffGraph()}
                                        weightedDiffMoves={this._getWeightedDiffGraph()}
                                        saveGraph={this._saveCytoscapeGraph.bind(this)}
                                        addMove={this._addMove.bind(this)}
                                        undoMove={this._undoMove.bind(this)}
                                        selectedElements={[...this._getSelectedElementsChangeHistory(), ...this.state.mouseOverRow]}
                                        mouseOverChangeHistory={this.state.mouseOverRow.length !== 0}
                                        clickedClassName={this.state.clickedClassName}
                                        updateSearchResults={this._updateSearchResults.bind(this)}
                                        resetMoves={this.state.reset}
                                        clearChangeHistoryTable={() => {
                                            this.setState({reset: false});
                                        }}
                                        searchedClassName={this.state.searchedClassName}
                                    /> 
                                    <Typography style={{marginTop: 10, marginLeft: 10, display: 'flex', alignSelf: "flex-start", position: "fixed"}} variant="h5"> 
                                        <div style={{marginLeft: '5px', marginRight: '8px', color: this.props.colors[this.props.selectedDecompositions[0][0]]}}>
                                            {`V${this.props.selectedDecompositions[0][1] + 1}`}
                                        </div>
                                        <div style={{marginRight: "3px"}}>
                                            {'vs.'}
                                        </div>
                                        <div style={{color: this.props.colors[this.props.selectedDecompositions[1][0]]}}>
                                            {`V${this.props.selectedDecompositions[1][1] + 1}`}
                                        </div>
                                        <Button variant="outlined" color="primary"
                                                style={{
                                                    marginLeft: 15
                                                }}
                                                onClick={() => {
                                                    this._resetAllMoves();
                                                    this._setSelectedDecompostions([]);
                                                    this._updateSearchResults([]);
                                                }
                                            }>
                                            Compare new
                                        </Button>
                                    </Typography>
                                </Box>
                                {/* {!this.props.cytoscapeGraphs["weighted-diff-view"] ?
                                    <DiffDecomposition
                                        graphData={this.props.jsonGraph} 
                                        selectedDecompositions={this.props.selectedDecompositions}
                                        selectedTab={this._getSelectedTab()}
                                        relationshipTypes={this._getRelationshipTypes(this._getSelectedTab())} 
                                        colors={this.props.colors} 
                                        weightedViewDecomposition={undefined} 
                                        decomposition={this._getDiffGraph()}
                                        weightedDiffMoves={this._getWeightedDiffGraph()}
                                        weightedDiffMoves={undefined}
                                        saveGraph={this._saveCytoscapeGraph.bind(this)}
                                        addMove={this._addMove.bind(this)}
                                        undoMove={this._undoMove.bind(this)}
                                        selectedElements={[...this._getSelectedElementsChangeHistory(), ...this.state.mouseOverRow]}
                                        mouseOverChangeHistory={this.state.mouseOverRow.length !== 0}
                                        clickedClassName={this.state.clickedClassName}
                                        updateSearchResults={this._updateSearchResults.bind(this)}
                                        resetMoves={this.state.reset}
                                        clearChangeHistoryTable={() => {
                                            this.setState({reset: false});
                                        }}
                                        searchedClassName={this.state.searchedClassName}
                                    /> :
                                    <DiffDecomposition
                                        graphData={this.props.jsonGraph} 
                                        selectedDecompositions={this.props.selectedDecompositions}
                                        selectedTab={this._getSelectedTab()}
                                        relationshipTypes={this._getRelationshipTypes(this._getSelectedTab())} 
                                        colors={this.props.colors} 
                                        decomposition={this._getDiffGraph()}
                                        saveGraph={this._saveCytoscapeGraph.bind(this)}
                                        addMove={this._addMove.bind(this)}
                                        undoMove={this._undoMove.bind(this)}
                                        selectedElements={[...this._getSelectedElementsChangeHistory(), ...this.state.mouseOverRow]}
                                        clickedClassName={this.state.clickedClassName}
                                        updateSearchResults={this._updateSearchResults.bind(this)}
                                        mouseOverChangeHistory={this.state.mouseOverRow.length !== 0}
                                        resetMoves={this.state.reset}
                                        clearChangeHistoryTable={() => {
                                            this.setState({reset: false});
                                        }}
                                        searchedClassName={this.state.searchedClassName}
                                    /> 
                                } */}
                            </Grid>
                            <Grid item xs={2.5}>
                                <Grid container direction="row" />
                                    <Grid item>
                                        <SearchBar 
                                            changeClassName={(className: string) => this.setState({searchedClassName: className})}
                                        />
                                    </Grid>
                                    <Grid item sx={{whiteSpace: "nowrap", overflow: "auto", width: "95%", m: 2}}>
                                        <ClassSearchResults
                                            changeClickedClass={(className: string) => this.setState({clickedClassName: className})}
                                            searchResults={this.state.searchResults}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <TabsUnstyled defaultValue={0}>
                                            <TabsList onChange={(tab: any) => this.setState({selectedTab: tab})}>
                                                <Tab>Metrics</Tab>
                                                {/* <Tab disabled={this.props.selectedTab !== "class-names"}>Cluster</Tab> */}
                                                {/* <Tab>Automerge</Tab> */}
                                            </TabsList>
                                            <TabPanel value={0}>
                                                <Box sx={{border: '1px solid grey', borderStyle: 'solid none'}}>
                                                    <Metrics 
                                                        title={"Metrics"}
                                                        headers={[["Coupling & Cohesion"], ["Dependencies", `V${this.props.selectedDecompositions[0][1] + 1}`, `V${this.props.selectedDecompositions[1][1] + 1}`]]}
                                                        rows={
                                                            Object.keys(this._getRelationshipTypes(this._getSelectedTab())).map((key) => {
                                                                return [
                                                                    key, 
                                                                    Utils.calculateNormalizedTurboMQ(this._getRelationshipTypes(this._getSelectedTab())[key]["cytoscapeEdges"], this._getDecompositionConfig(1), key).toFixed(2),
                                                                    Utils.calculateNormalizedTurboMQ(this._getRelationshipTypes(this._getSelectedTab())[key]["cytoscapeEdges"], this._getDecompositionConfig(2), key).toFixed(2),
                                                                ];
                                                            })
                                                        }
                                                    />
                                                </Box>
                                            </TabPanel>
                                            <TabPanel value={1}>
                                                <WeightedDiffRelationshipSelectionTable 
                                                    graphData={[this.props.selectedDecompositions[0][0], this.props.selectedDecompositions[1][0]]}
                                                    graphVersions={[this.props.selectedDecompositions[0][1], this.props.selectedDecompositions[1][1]]}
                                                    diffGraph={this._getDiffGraph()}
                                                    relationships={this.props.relationships}
                                                    fetchWeightedDecomposition={this._fetchWeightedDiffGraph.bind(this)}
                                                    setNewWeights={() => this.setState({newWeights: false})}
                                                    clustering={false}
                                                    setWeights={this._setWeights.bind(this)}
                                                    // weights={(Object.keys(this.props.weights).length === 0) ? undefined : this.props.weights}
                                                    weights={undefined}
                                                />
                                            </TabPanel>
                                        </TabsUnstyled>
                                    </Grid>
                                    <Grid item>
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
                                            maxHeight={"46vh"}
                                        />
                                    </Grid>
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

    _fetchWeightedDiffGraph(jsonGraph: any) {
        this.props.fetchWeightedDiffGraph({jsonGraph: jsonGraph});
    }

    _selectDecompositionsToCompare(decompositionA: any, decompositionB: any) {
        this.setState(
            {
                selectedDecompositions: [decompositionA, decompositionB]
            }
        )
    }

    _getDecompositionConfig(decompositionVersion: number) {
        let cytoscapeGraph: any = this._getDiffGraph();

        let elements = cytoscapeGraph.elements.nodes;

        const numOfPartitions = this._getTotalNumOfPartitions(elements);

        let decompositionVersions: number[] = [];
        for(let i = 1; i <= 2; i++) {
            if(i !== decompositionVersion) {
                decompositionVersions.push(i);
            }
        }

        let movedElements = elements.filter((ele: any) => ele.data.element_type === "common+").map((ele: any) => ele.data.label); 

        let decomposition = [];

        for(let i = 0; i < numOfPartitions; i++) {
            let partition: any = []; 
            elements.forEach((ele: any) => {
                if(ele.data.partition === `partition${i}`) {
                    if(ele.data.element_type === "common" || ele.data.element_type === "common+") {
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

    _getWeightedDiffGraph() {
        return this.props.cytoscapeGraphs["weighted-diff-view"];
    }

    _getDiffGraph() {
        if (this.props.cytoscapeGraphs["diff-view"]) {
            return {saved: true, ...this.props.cytoscapeGraphs["diff-view"]} 
        } else {
            return {elements: {nodes: new DiffGraphUtils().getDiffDecomposition(
                this._getCytoscapeGraph(this.props.selectedDecompositions[0][0]),
                this._getCytoscapeGraph(this.props.selectedDecompositions[1][0]),
                this.props.colors[this.props.selectedDecompositions[0][0]],
                this.props.colors[this.props.selectedDecompositions[1][0]],
                this.props.selectedDecompositions[0][1] + 1,
                this.props.selectedDecompositions[1][1] + 1
            ).getCytoscapeData()}, saved: false};
        }
    }

    _getCytoscapeGraph(selectedTab: string) {
        if (this.props.cytoscapeGraphs[selectedTab]) {
            return {...this.props.cytoscapeGraphs[selectedTab], saved: true};  
        } else {
            return {elements: {nodes: new JSONGraphParserUtils().getDecomposition(this.props.jsonGraph[selectedTab].decomposition).getCytoscapeData()}, saved: false};
        }
    }

    _getRelationshipTypes(selectedTab: string) {
        return this.props.relationshipTypes[selectedTab] || this.props.relationships;
    }

    _undoMove(moveOperation: any) {
        this.props.undoMove({selectedTab: this._getSelectedTab(), moveOperation: moveOperation});
    }

    _updateSearchResults(cytoscapeNodes : any) {
        this.setState({searchResults: cytoscapeNodes});
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
    setSelectedDecompostions: setSelectedDecompositionsAction.getReduxAction(),
    fetchWeightedDiffGraph: fetchWeightedDiffDecompositionAction.getReduxAction(),
    setWeights: setDiffWeightsAction.getReduxAction()
}

type TActionTypes = typeof mapDispatchToProps;

export const DiffView = withStyles(styles)(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(DiffViewBase)
);