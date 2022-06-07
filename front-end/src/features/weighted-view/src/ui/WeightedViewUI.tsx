import React from "react";
import withStyles, { WithStylesProps } from "react-jss";
import { styles } from './WeightedViewStyles';
import { connect } from "react-redux";
import { IWeightedViewUIState } from "../WeightedViewTypes";
import { getSelectors } from "./WeightedViewUISelectors";
import { JSONGraphParserUtils } from "../../../../utils/JSONGraphParserUtils";
import { fetchWeightedDecompositionAction, setWeightsAction } from "../WeightedViewActions";
import { Tabs, Slider, Paper, Button, Grid, Box} from "@mui/material";
import { Metrics } from "../../../metric-table/src/ui/MetricTableUI";
import Utils from "../../../../utils";
import { addNewMoveAction, selectElementsAction, undoMoveAction, resetChangeHistoryAction } from "../../../change-history-table/src/ChangeHistoryActions";
import { ChangeHistory } from "../../../change-history-table/src/ui/ChangeHistoryUI";
import { ChangeHistoryService } from "../../../change-history-table/service/ChangeHistoryService";
import { CustomDecomposition } from "../../../../views/custom-view/CustomDecomposition";
import { resetCytoscapeGraphAction, saveCytoscapeGraphAction, updateRelationshipTypeAction } from "../../../custom-view/src/CustomViewActions";
import WeightedRelationshipSelectionTable from "../../../../components/Tables/weighted-view/WeightedRelationshipTable";
import { SearchBar } from "../../../../components/SearchBar/SearchBar";
import { styled } from '@mui/system';
import Container from '@mui/material/Container';
import TabsUnstyled from '@mui/base/TabsUnstyled';
import TabPanelUnstyled from '@mui/base/TabPanelUnstyled';
import TabsListUnstyled from '@mui/base/TabsListUnstyled';
import { buttonUnstyledClasses } from '@mui/base/ButtonUnstyled';
import TabUnstyled, { tabUnstyledClasses } from '@mui/base/TabUnstyled';
import { ClassSearchResults } from "../../../../components/ClassSearchResults/ClassSearchResults";


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

export interface WeightedViewProps extends WithStylesProps<typeof styles>, IWeightedViewUIState, TActionTypes {
    relationships: any,
    colors: any
}

interface WeightedViewState {
    mouseOverRow: any,
    reset: boolean,
    newWeights: boolean
    searchedClassName: string
    searchResults: any,
    clickedClassName: string
}

class WeightedViewBase extends React.PureComponent<WeightedViewProps> {
    readonly state: WeightedViewState = {
        mouseOverRow: [],
        reset: false,
        newWeights: false,
        searchedClassName: "",
        clickedClassName: "",
        searchResults: []
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
                    <div style={{height: "100%"}}>
                        <Grid container direction={'row'} style={{height: "100%", width: "100%", overflow: "auto"}}>
                            <Grid item xs={9.5}>
                                <Box style={{width: "100%", height: "100%", border: '1px solid grey'}}>
                                    <CustomDecomposition 
                                        decomposition={this._getCytoscapeGraph(this._getSelectedTab())}
                                        selectedTab={this._getSelectedTab()}
                                        relationshipTypes={this._getRelationshipTypes(this._getSelectedTab())}
                                        saveGraph={this._saveCytoscapeGraph.bind(this)}
                                        addMove={this._addMove.bind(this)}
                                        undoMove={this._undoMove.bind(this)}
                                        selectedElements={[...this._getSelectedElementsChangeHistory(), ...this.state.mouseOverRow]}
                                        updateSearchResults={this._updateSearchResults.bind(this)}
                                        clickedClassName={this.state.clickedClassName}
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
                                                marginLeft: 10,
                                                position: "fixed"
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
                                </Box>
                            </Grid>
                            <Grid item xs={2.5}>
                                <Grid container direction="row"/>
                                <Grid item>
                                <SearchBar 
                                    changeClassName={(className: string) => this.setState({searchedClassName: className})}
                                />
                                </Grid>
                            <Grid item sx={{whiteSpace: "nowrap", overflow: "auto", width: "90%", m: 2}}>
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
                                        {/* <Tab>Cluster</Tab> */}
                                    </TabsList>
                                        <TabPanel value={0}>
                                            <Box sx={{border: '1px solid grey', borderStyle: 'solid none'}}>
                                                <Metrics 
                                                    title={"Metrics + Edge Filter"}
                                                    headers={[["Coupling & Cohesion"], ["Dependencies", "Values", "Filter"]]}
                                                    rows={
                                                        Object.keys(this._getRelationshipTypes(this._getSelectedTab())).map((key) => {
                                                            return [
                                                                key, 
                                                                Utils.calculateNormalizedTurboMQ(this._getRelationshipTypes(this._getSelectedTab())[key]["cytoscapeEdges"], this._getDecompositionConfig(), key).toFixed(2),
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
                                            </Box>
                                        </TabPanel>
                                        {/* <TabPanel value={1}>
                                            <Box sx={{border: '1px solid grey', borderStyle: 'solid none'}}>
                                                <ClusterTable 
                                                    fetchGraph={this._fetchGraph.bind(this)}
                                                    clusterGraph={() => this.setState({clusterGraph: true})}
                                                />
                                            </Box>
                                        </TabPanel> */}
                                </TabsUnstyled>
                            </Grid>
                            <Grid item>
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
                                    maxHeight={"38vh"}
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
                    if (ele.data.element_type === "common" || ele.data.element_type === "common+") {
                        partition.push(ele.data.label);
                    } 
                }
            })
            if(partition.length !== 0) {
                decomposition.push(partition);
            }
        }

        let partition: any[] = []; 
        elements.forEach((ele: any) => {
            if (ele.data.partition === 'unobserved') {
                if (ele.data.element_type === "common" || ele.data.element_type === "common+") {
                    partition.push(ele.data.label);
                } 
            }
        })
        if(partition.length !== 0) {
            decomposition.push(partition);
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
        return this.props.cytoscapeGraphs[selectedTab] || {elements: {nodes: new JSONGraphParserUtils().getDecomposition(this.props.jsonGraph[selectedTab].decomposition).getCytoscapeData()}};
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
    
    _updateSearchResults(cytoscapeNodes : any) {
        this.setState({searchResults: cytoscapeNodes});
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
