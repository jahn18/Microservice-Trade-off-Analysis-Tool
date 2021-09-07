import React from "react";
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import 'react-pro-sidebar/dist/css/styles.css';
import Decompositions from '../Components/Views/Decomposition';
import TradeOffGraph from '../Components/Views/TradeOff';
import TradeOffSelectionTable from "../Components/SelectionTables/TradeOffTable";
import WeightedRelationshipSelectionTable from "../Components/SelectionTables/WeightedRelationshipTable";
import SelectionTabs from "../Components/Tabs";
import Utils from "../Components/Utils";


var SERVER_ADDRESS = "http://127.0.0.1:5000/";

export default class DiffTool extends React.Component {
    constructor(props) {
        super(props);

        let json_graph_data = this.props.location.state.data; 

        let relationshipWeights = {};
        for(let relationshipType in json_graph_data) {
            relationshipWeights[relationshipType] = 0;
        }

        this.state = {
            selectedTab: 'static',
            graphData: json_graph_data,
            // Fields for the Trade-off view
            selectedDecompositionsCompare: false,
            selectedDecompositions: [],
            numDecompositionsSelected: 0,
            // Fields for the Weighted relationship view 
            fetchedWeightedRelationshipDecomposition: false,
            relationshipWeights: relationshipWeights,
            weightedGraphElements: [],
            weightedGraphPartitionNum: 0,
            clickedCluster: false
        }
    }

    setSelectedTab = (tab) => {
        this.setState({selectedTab: tab})
    }

    updateSelectedDecompositions = (value, decomposition, index) => {
        let {
            numDecompositionsSelected,
            selectedDecompositions
        } = this.state;

        let selectedDecompositionCopy = selectedDecompositions.map((x) => x);

        if(value) {
            selectedDecompositionCopy.push([decomposition, index]);
        } else {
            const i = selectedDecompositions.map(x => {return x[0]}).indexOf(decomposition);
            selectedDecompositionCopy.splice(i, 1);
        }

        this.setState(
            {
                numDecompositionsSelected: (value) ? numDecompositionsSelected + 1 : numDecompositionsSelected - 1,
                selectedDecompositions: selectedDecompositionCopy
            }
        )
    }

    setTradeOffActive = () => {
        this.setState({selectedDecompositionsCompare: true});
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
                weightedGraphElements: [],
                weightedGraphPartitionNum: 0,
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
        const {
            relationshipWeights
        } = this.state;

        let json_graph_string = JSON.stringify(this.props.location.state.data);
        let xhr = new XMLHttpRequest();

        // When the xhr finishes and obtains the json graph. 
        xhr.onreadystatechange = () => {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                let status = xhr.status;
                if (status !== 400) {
                    let decomposition = JSON.parse(xhr.responseText);
                    let elements = [];
                    let index = 0;
                    for(let partition in decomposition) {
                        elements.push({
                            data: {
                                id: partition,
                                label: `P${index + 1}`,
                                background_color: 'white',
                                colored: false, 
                                element_type: 'partition',
                                width: 0,
                                height: 0,
                                showMinusSign: false 
                            }
                        });
                        let element_list = decomposition[partition].map(ele => {return {id: ele}});
                        elements = elements.concat(Utils.formCytoscapeElements(element_list, index));
                        index++; 
                    }
                    this.setState(
                        {
                            weightedGraphElements: elements,
                            weightedGraphPartitionNum: index,
                            fetchedWeightedRelationshipDecomposition: true
                        }
                    );
                } else {
                    console.log('ERROR: could not retrieve graph for weighted-relationship view');
                }
            }
        }

        // Accept the server address and the relationship-weights through props. 
        const PROJECT_NAME = "PartsUnlimitedMRP";
        const address = SERVER_ADDRESS + "/" + PROJECT_NAME + "/" + relationshipWeights['static'] + "/" + relationshipWeights['dynamic'] + "/" + relationshipWeights['class-names'] + "/" + relationshipWeights['class-terms'] + "/" + relationshipWeights['commits'] + "/" + relationshipWeights['contributors'];
        xhr.open("POST", address);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(json_graph_string);
    }

    setClickCluster = () => {
        this.setState({clickedCluster: true})
    }

    render() {
        const {
            graphData,
            selectedTab,
            selectedDecompositionsCompare,
            numDecompositionsSelected,
            selectedDecompositions,
            fetchedWeightedRelationshipDecomposition,
            relationshipWeights,
            weightedGraphElements,
            weightedGraphPartitionNum,
            clickedCluster
        } = this.state;

        let colors = {
            relationship_type_colors: ['#61a14a', '#4987c0', '#eb8227', '#F4145B', '#dfb63d', '#824f7d'],
            relationships: {
                'static': '#61a14a', 
                'dynamic': '#4987c0', 
                'class-names': '#eb8227', 
                'class-terms': '#F4145B', 
                'commits': '#dfb63d', 
                'contributors': '#824f7d', 
                'trade-off': 'grey',
                'weighted-relationship': 'grey'
            }
        }

        let elements;
        let num_of_partitions;
        if (selectedTab !== "trade-off" && selectedTab !== 'weighted-relationship') {
            let parsedGraph = Utils.parseDecompositionFromJSON(selectedTab, graphData);
            elements = parsedGraph.decomposition;
            num_of_partitions = parsedGraph.num_of_partitions; 
        } else if (fetchedWeightedRelationshipDecomposition && selectedTab === 'weighted-relationship') {
            elements = weightedGraphElements;
            num_of_partitions = weightedGraphPartitionNum; 
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
                    (selectedTab !== "trade-off" && selectedTab !== 'weighted-relationship') && 
                    <Decompositions 
                        elements={elements}
                        num_of_partitions={num_of_partitions}
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
                            updateSelectedDecompositions={this.updateSelectedDecompositions}
                            graphData={graphData}
                            updateGraphStatus={this.setTradeOffActive}
                            numDecompositionsSelected={numDecompositionsSelected}
                        /> :
                        <TradeOffGraph
                            graphData={graphData} 
                            colors={colors} 
                            selectedTab={selectedTab} 
                            selectedDecompositions={selectedDecompositions}
                            onChange={this.resetTradeOffConfiguration}
                        /> 
                    )
                }
                {
                    (selectedTab === "weighted-relationship" && 
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
                        <Decompositions 
                            elements={weightedGraphElements}
                            num_of_partitions={weightedGraphPartitionNum}
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
