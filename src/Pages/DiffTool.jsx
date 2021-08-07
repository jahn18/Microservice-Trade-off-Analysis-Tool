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


export default class DiffTool extends React.Component {
    constructor(props) {
        super(props);

        let json_graph_data = this.props.location.state.data; 

        this.state = {
            selectedRelationshipType: 'static',
            graphData: json_graph_data,
        }
    }

    handleUpdateGraph = (graph) => {
        this.props.updateDiffGraph(graph);
    }

    render() {
        const {
            graphData,
            selectedRelationshipType
        } = this.state;

        let colors = {
            decomposition_colors: ['#F4145B', '#495CBE'],
            relationship_type_colors: ['#ff7f50', '#b19cd9', '#77dd77', '#F9E79F', '#67E3FF', '#c4c4c4']
        }
        // Sets all the colors for the metrics table, toggles, and nodes in the Custom View. 
        const styles = theme => ({
            indicator: {
              backgroundColor: 'white',
            },
        })

        return (
            <div>
                <Paper square>
                    <Tabs
                        value={selectedRelationshipType}
                        textColor="primary"
                        indicatorColor="primary"
                        onChange={(event, newValue) => {
                            this.setState({selectedRelationshipType: newValue});
                        }}
                    >
                        <Tab 
                            label="V1 (by Static)" 
                            value="static"
                        />
                        <Tab 
                            label="V2 (by Class name)" 
                            value="class name"
                        />
                        <Tab style={{color: 'grey'}} 
                            label="custom" 
                            value="custom"
                        />
                    </Tabs>
                </Paper>
                {
                    (selectedRelationshipType !== 'custom') && <Decompositions graphData={graphData} colors={colors} relationshipType={selectedRelationshipType}/>
                }
                {
                    (selectedRelationshipType === 'custom') && <CustomGraph graphData={graphData} colors={colors}/>
                }
            </div>
        );
    }
};


// export default connect(null, { updateDiffGraph })(DiffTool);
