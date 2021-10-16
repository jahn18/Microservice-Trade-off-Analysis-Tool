import React from "react";
import Paper from "@material-ui/core/Paper";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";


export default function SelectionTabs(props) {
    let tabs = [];
    Object.keys(props.graphData).map(
        (key, index) => {
            tabs.push(
                <Tab
                    style={{color: props.colors.relationship_type_colors[index]}}
                    label={`V${index + 1} (by ${key})`} 
                    value={key}
                    // onClick={() => props.resetTradeOffConfiguration(!props.selectedDecompositionsCompare)}
                />
            )
        }
    );
    tabs.push(
        <Tab style={{color: 'grey'}} 
            label="Weighted-view" 
            value="weighted-view"
        />,
        <Tab style={{color: 'grey'}} 
            label="Diff-view" 
            value="trade-off"
        />
    );

    return(
        <Paper square>
            <Tabs
                value={props.selectedTab}
                textColor="primary"
                TabIndicatorProps={{style: {background: props.colors.relationships[props.selectedTab]}}}
                onChange={(event, newValue) => {
                    props.setSelectedTab(newValue)
                }}
                variant="scrollable"
                scrollButtons="auto"
            >
                {tabs}
            </Tabs>
        </Paper>
    )
}