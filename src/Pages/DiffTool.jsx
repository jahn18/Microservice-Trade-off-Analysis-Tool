import React, {useRef} from "react";
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import 'react-pro-sidebar/dist/css/styles.css';
import Decompositions from './Decompositions';
import CustomGraph from '../Components/Custom';
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import Button from '@material-ui/core/Button';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';


export default class DiffTool extends React.Component {
    constructor(props) {
        super(props);

        let json_graph_data = this.props.location.state.data; 

        this.state = {
            selectedTab: 'static',
            graphData: json_graph_data,
            selectedDecompositionsCompare: false,
            selectedDecompositions: [],
            numDecompositionsSelected: 0,
        }
    }

    updateSelectedDecompositions = (value, decomposition, index) => {
        let {
            numDecompositionsSelected,
            selectedDecompositions
        } = this.state;

        if(value) {
            selectedDecompositions.push([decomposition, index]);
            this.setState({numDecompositionsSelected: numDecompositionsSelected + 1})
        } else {
            const i = selectedDecompositions.indexOf([decomposition, index]);
            selectedDecompositions.splice(i, 1);
            this.setState({numDecompositionsSelected: numDecompositionsSelected - 1})
        }
    }

    handleUpdateGraph = (graph) => {
        this.props.updateDiffGraph(graph);
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

    render() {
        const {
            graphData,
            selectedTab,
            selectedDecompositionsCompare,
            numDecompositionsSelected,
            selectedDecompositions
        } = this.state;

        let colors = {
            decomposition_colors: ['#F4145B', '#495CBE'],
            relationship_type_colors: ['#ff7f50', '#495CBE', '#77dd77', '#F9E79F', '#9D67FF', '#F4145B']
        }
        // Sets all the colors for the metrics table, toggles, and nodes in the Custom View. 
        const styles = theme => ({
            indicator: {
              backgroundColor: 'white',
            },
        })

        let tabs = [];
        let tradeOffTable = [];
        Object.keys(graphData).map(
            (key, index) => {
                tabs.push(
                    <Tab
                        label={`V${index + 1} (by ${key})`} 
                        value={key}
                    />
                )
                tradeOffTable.push(
                    <TableRow key={key}>
                        <TableCell>
                            <Checkbox
                                onChange={(event, newValue) => this.updateSelectedDecompositions(newValue, key, index)}
                            />
                            {`V${index + 1} (by ${key.charAt(0).toUpperCase() + key.slice(1)})`} 
                        </TableCell>
                    </TableRow>
                )
            }
        );
        tabs.push(
            <Tab style={{color: 'grey'}} 
                label="Trade-Off" 
                value="trade-off"
            />
        );

        return (
            <div>
                <Paper square>
                    <Tabs
                        value={selectedTab}
                        textColor="primary"
                        indicatorColor="primary"
                        onChange={(event, newValue) => {
                            this.setState({selectedTab: newValue});
                        }}
                    >
                        {tabs}
                    </Tabs>
                </Paper>
                {
                    (selectedTab !== "trade-off") && <Decompositions graphData={graphData} colors={colors} selectedTab={selectedTab}/>
                }
                {
                    (selectedTab === "trade-off" && !selectedDecompositionsCompare) && 
                    <TableContainer
                    component={Paper} 
                    style={
                            {
                                width: '50%',
                                border: '1px solid grey',
                                left: '25%',
                                bottom: '15%',
                                position: 'fixed',
                            }
                        } 
                    size="small">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="overline">
                                            {"Select Two Decompositions to Compare"}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tradeOffTable}
                                <Button variant="contained" color="primary"
                                    style={{
                                        width: '100%'
                                    }}
                                    onClick={() => {
                                        if(numDecompositionsSelected == 2) {
                                            this.setState({selectedDecompositionsCompare: true});
                                        } else {
                                            alert('You must choose exactly two decompositions to compare!');
                                        }
                                    }
                                }>
                                    Compare
                                </Button>
                            </TableBody>
                        </Table>
                    </TableContainer>
                }
                {
                    (selectedTab === "trade-off" && selectedDecompositionsCompare) && 
                    <CustomGraph 
                        graphData={graphData} 
                        colors={colors} 
                        selectedTab={selectedTab} 
                        selectedDecompositions={selectedDecompositions}
                        onChange={this.resetTradeOffConfiguration}
                    /> 
                }
            </div>
        );
    }
};


// export default connect(null, { updateDiffGraph })(DiffTool);
