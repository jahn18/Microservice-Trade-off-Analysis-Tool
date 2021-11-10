import React from "react";
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import 'react-pro-sidebar/dist/css/styles.css';
import IndividualView from '../components/Views/IndividualView';
import DiffView from '../components/Views/DiffView';
import TradeOffSelectionTable from "./../components/SelectionTables/TradeOffTable";
import WeightedRelationshipSelectionTable from "./../components/SelectionTables/WeightedRelationshipTable";
import SelectionTabs from "../components/Tabs";
import { JSONGraphParserUtils } from "../utils/JSONGraphParserUtils";
import { DiffGraphUtils } from "../utils/DiffGraphUtils";
import { Decomposition } from "../models/Decomposition";

//var SERVER_ADDRESS = "http://127.0.0.1:5000/";
var SERVER_ADDRESS = "http://svresessp1.ece.ubc.ca/api/";

export default class DiffTool extends React.Component {
    constructor(props) {
        super(props);

        let json_graph_data = this.props.location.state.data; 

        let relationshipWeights = {};
        for(let relationshipType in json_graph_data) {
            relationshipWeights[relationshipType] = 0;
        }

        let decompositions = {};
        // Store all decompositions from the json file.  
        Object.keys(json_graph_data).forEach((key) => decompositions[key] = new JSONGraphParserUtils().getDecomposition(json_graph_data[key].decomposition));
        decompositions["weighted-view"] = new Decomposition([], []);

        this.state = {
            selectedTab: 'static',
            graphData: json_graph_data,
            decompositions: decompositions,
            colors: { 
                relationship_type_colors: ['#61a14a', '#4987c0', '#eb8227', '#F4145B', '#dfb63d', '#824f7d', '#a1665e'],
                relationships: {
                    'static': '#61a14a', 
                    'dynamic': '#4987c0', 
                    'class-names': '#eb8227', 
                    'class-terms': '#F4145B', 
                    'commits': '#dfb63d', 
                    'contributors': '#824f7d', 
                    'weighted-view': 'grey',
                    'trade-off': 'grey'
                }
            },
            // Fields for the Trade-off view
            selectedDecompositionsCompare: false,
            selectedDecompositions: [],
            numDecompositionsSelected: 0,
            // Fields for the Weighted relationship view 
            fetchedWeightedRelationshipDecomposition: false,
            relationshipWeights: relationshipWeights,
            clickedCluster: false
        }
    }

    setSelectedTab = (tab) => {
        this.setState({selectedTab: tab})
    }

    /**
     * 
     * @param {*} decompositionListA [decomposition relationship type, decomposition version number]
     * @param {*} decompositionListB [decomposition relationship type, decomposition version number]
     */
    selectDecompositions2Diff = (decompositionListA, decompositionListB) => {
        this.setState(
            {
                selectedDecompositionsCompare: true,
                selectedDecompositions: [decompositionListA, decompositionListB]
            }
        )
    }

    resetTradeOffConfiguration = (wasClicked) => {
        if(wasClicked) {
            this.setState({
                selectedDecompositionsCompare: false,
                selectedDecompositions: [],
                numDecompositionsSelected: 0
            });
        }
    }

    resetWeightedRelationshipConfiguration = (wasClicked) => {
        if(wasClicked) {
            const {
                relationshipWeights
            } = this.state;

            let relationshipWeightReset = {...relationshipWeights};
            for(let relationshipType in relationshipWeightReset) {
                relationshipWeightReset[relationshipType] = 0;
            }

            this.setState({
                fetchedWeightedRelationshipDecomposition: false,
                relationshipWeights: relationshipWeightReset,
                clickedCluster: false
            })
        }
    }

    updateRelationshipWeights = (relationshipType, newWeight) => {
        let newRelationshipWeights = { ...this.state.relationshipWeights, [relationshipType]: parseFloat(newWeight)};
        this.setState({relationshipWeights: newRelationshipWeights});
    }

    getTotalRelationshipWeightSum = () => {
        const {
            relationshipWeights
        } = this.state;
        
        let total_sum = 0;
        for(let relationshipType in relationshipWeights) {
            total_sum += relationshipWeights[relationshipType];
        }

        return total_sum;
    }

    getWeightedDecomposition = () => {
        let {
            relationshipWeights,
            decompositions
        } = this.state;

        let json_graph_string = JSON.stringify(this.props.location.state.data);
        let xhr = new XMLHttpRequest();

        // When the xhr finishes and obtains the json graph. 
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                let status = xhr.status;
                if (status !== 400) {
                    let decompositionsCopy = {...decompositions};
                    decompositionsCopy["weighted-view"] = new JSONGraphParserUtils().getDecomposition(JSON.parse(xhr.responseText));
                    this.setState(
                        {
                            decompositions: decompositionsCopy,
                            fetchedWeightedRelationshipDecomposition: true
                        }
                    );
                } else {
                    console.log('ERROR: could not retrieve graph for weighted-view');
                }
            }
        }

        // Accept the server address and the relationship-weights through props. 
        const PROJECT_NAME = "PartsUnlimitedMRP";
        const address = SERVER_ADDRESS + PROJECT_NAME + "/" + relationshipWeights['static'] + "/" + relationshipWeights['dynamic'] + "/" + relationshipWeights['class-names'] + "/" + relationshipWeights['class-terms'] + "/" + relationshipWeights['commits'] + "/" + relationshipWeights['contributors'];
        xhr.open("POST", address);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(json_graph_string);
    }

    setClickCluster = () => {
        this.setState({clickedCluster: true})
    }

    render() {
        let {
            graphData,
            selectedTab,
            selectedDecompositionsCompare,
            selectedDecompositions,
            fetchedWeightedRelationshipDecomposition,
            relationshipWeights,
            clickedCluster,
            decompositions,
            colors
        } = this.state;

        const edges = new JSONGraphParserUtils().getEdges(graphData, colors.relationship_type_colors);

        let decomposition;
        if (selectedTab !== "trade-off") {
            decomposition = decompositions[selectedTab];
        } else if (selectedTab === "trade-off" && selectedDecompositionsCompare) {
            selectedDecompositions = selectedDecompositions.sort((v1, v2) => (v1[1] > v2[1]) ? 1 : -1);
            // TODO: consider the weighted-view decomposition 
            decomposition = new DiffGraphUtils().getDiffDecomposition(
                decompositions[selectedDecompositions[0][0]],
                decompositions[selectedDecompositions[1][0]],
                colors.relationships[selectedDecompositions[0][0]],
                colors.relationships[selectedDecompositions[1][0]]
            )
        }

        return (
            <div>
                <SelectionTabs
                    graphData={graphData}
                    colors={colors}
                    selectedDecompositionsCompare={selectedDecompositionsCompare}
                    resetTradeOffConfiguration={this.resetTradeOffConfiguration}
                    selectedTab={selectedTab}
                    setSelectedTab={this.setSelectedTab}
                />
                {
                    (selectedTab !== "trade-off" && selectedTab !== 'weighted-view') &&
                    <IndividualView 
                        decomposition={decomposition}
                        relationshipTypeEdges={edges}
                        graphData={graphData} 
                        colors={colors} 
                        selectedTab={selectedTab}
                    />
                }
                {
                    (selectedTab === "trade-off") && 
                    (
                        (!selectedDecompositionsCompare) ? 
                        <TradeOffSelectionTable 
                            updateSelectedDecompositions={this.selectDecompositions2Diff}
                            decompositions={decompositions}
                            weightedViewExists={fetchedWeightedRelationshipDecomposition}
                        /> :
                        <DiffView
                            decomposition={decomposition} 
                            colors={colors} 
                            relationshipTypeEdges={edges}
                            selectedDecompositions={selectedDecompositions}
                            onChange={this.resetTradeOffConfiguration}
                        /> 
                    )
                }
                {
                    (selectedTab === "weighted-view" &&
                        ((!fetchedWeightedRelationshipDecomposition) ?
                        <WeightedRelationshipSelectionTable
                            updateRelationshipWeights={this.updateRelationshipWeights}
                            graphData={graphData}
                            setClickCluster={this.setClickCluster}
                            relationshipWeights={relationshipWeights}
                            clickedCluster={clickedCluster}
                            fetchedWeightedRelationshipDecomposition={fetchedWeightedRelationshipDecomposition}
                            getWeightedDecomposition={this.getWeightedDecomposition}
                            getTotalRelationshipWeightSum={this.getTotalRelationshipWeightSum}
                        /> :
                        <IndividualView
                            decomposition={decomposition}
                            graphData={graphData} 
                            colors={colors} 
                            selectedTab={selectedTab}
                            onChange={this.resetWeightedRelationshipConfiguration}
                        /> 
                        )
                    )
                }
            </div>
        );
    }
};
