import React from "react";
import {Paper} from "@mui/material";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

export interface Tabs {
    [tabKey: string]: string
}

export interface INavBarProps {
    tabs: Tabs,
    colors: any,
    setSelectedTab: Function
}

export const NavBar: React.FC<INavBarProps> = ({tabs, colors, setSelectedTab}) => {
    const [tab, setTab] = React.useState(Object.keys(tabs)[0]);

    return (
        <Paper square>
            <Tabs
                value={tab}
                onChange={(e, value) => {
                    setSelectedTab(value);
                    setTab(value);
                }}
                textColor="primary"
                TabIndicatorProps={{style: {background: colors[tab]}}}
                variant="fullWidth"
                scrollButtons
                allowScrollButtonsMobile
            >
                {Object.keys(tabs).map( (tabKey: string) => <Tab label={tabs[tabKey]} value={tabKey} key={tabKey} style={{color: colors[tabKey]}}/>)}
            </Tabs>
        </Paper>
    );
};