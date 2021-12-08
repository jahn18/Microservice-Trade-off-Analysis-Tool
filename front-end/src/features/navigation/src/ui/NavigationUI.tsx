import React from "react";
import { changeSelectedTabAction } from "../NavigationActions";
import {getSelectors} from "./NavigationUISelectors";
import withStyles, { WithStylesProps } from "react-jss";
import {styles} from "./NavigationStyles";
import {connect} from "react-redux";
import {NavBar, Tabs} from "../../../../components/Tabs/Tabs";
import { INavigationUIState } from "../NavigationTypes";

export interface NavigationProps extends WithStylesProps<typeof styles>, INavigationUIState, TActionTypes {
    tabs: Tabs,
    colors: any
}

class NavigationBase extends React.PureComponent<NavigationProps> {

    render() {
        return (
            <>
                <NavBar
                    tabs={this.props.tabs}
                    colors={this.props.colors}
                    setSelectedTab={this._setSelectedTab.bind(this)}
                />
            </>
        );
    }

    _setSelectedTab(selectedTab: string) {
        return this.props.changeSelectedTab({selectedTab: selectedTab})
    }
}

const mapStateToProps = (state: any) => getSelectors(state);
const mapDispatchToProps = {
    changeSelectedTab: changeSelectedTabAction.getReduxAction()
}

type TActionTypes = typeof mapDispatchToProps;

export const Navigation = withStyles(styles)(
	connect(
		mapStateToProps,
		mapDispatchToProps
	)(NavigationBase)
);
