import React, {useRef} from "react";
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import {connect} from 'react-redux';
import {updateDiffGraph} from '../Actions';
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
                        <Tab label="Version 1 (by Static)" value="static"/>
                        <Tab label="Version 2 (by Class name)" value="class name"/>
                        <Tab label="custom" value="custom"/>
                    </Tabs>
                </Paper>
                {
                    (selectedRelationshipType !== 'custom') && <Decompositions graphData={graphData} relationshipType={selectedRelationshipType}/>
                }
                {
                    (selectedRelationshipType === 'custom') && <CustomGraph graphData={graphData} />
                }
            </div>
        );
    }
};


// export default connect(null, { updateDiffGraph })(DiffTool);
