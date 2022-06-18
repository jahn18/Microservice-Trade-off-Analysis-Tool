import React from "react";
import withStyles, { WithStylesProps } from "react-jss";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { CustomView } from "../../features/custom-view/src/ui/CustomViewUI";
import { Navigation } from "../../features/navigation/src/ui/NavigationUI";
import { addPlugin } from "../../store/Plugin";
import { styles } from "./DashboardViewStyles";
import { Container, Grid, Paper } from '@mui/material';
import Box from '@material-ui/core/Box';
import { JSONGraphParserUtils } from "../../utils/JSONGraphParserUtils";
import { getSelectors } from "./DashboardSelectors";
import { DiffView as DiffViewUI } from '../../features/diff-view/src/ui/DiffViewUI';
import { WeightedView as WeightedViewUI } from '../../features/weighted-view/src/ui/WeightedViewUI';

interface IDashboardViewUIState {
    jsonGraph: any
    selectedTab: string
    diffSelect: boolean
}

export interface DashboardViewProps extends WithStylesProps<typeof styles>, IDashboardViewUIState, RouteComponentProps, TActionTypes {
    location: any
}

export class DashboardViewBase extends React.PureComponent<DashboardViewProps> {

    render() {
        return (
            <div style={{position: "absolute", margin: 0, height: "93.5%", width: "100%"}}>
                <Navigation 
                    tabs={(this.props.diffSelect) ?
                        {
                            ...Object.keys(this.props.jsonGraph).reduce((tabs, key, index) => { return tabs = {...tabs, [key]: `  V${index + 1} (${key}) `}}, {}),
                            ...{"diff-view": "Diff-view"}
                        } : {
                            ...Object.keys(this.props.jsonGraph).reduce((tabs, key, index) => { return tabs = {...tabs, [key]: `  V${index + 1} (${key})  `}}, {}),
                            ...{"diff-view": "Diff-view"},
                            ...{"weighted-view" : "Weighted-View"}
                        }
                    } 
                    colors={this._getColors()}
                />
                <>
                    {this.props.selectedTab !== "diff-view" && this.props.selectedTab !== "weighted-view" &&
                        <CustomView 
                            relationships={new JSONGraphParserUtils().getEdges(this.props.jsonGraph, this._getColors())}
                            colors={this._getColors()}
                        />
                    }
                    {this.props.selectedTab === "diff-view" && 
                        <DiffViewUI 
                            relationships={new JSONGraphParserUtils().getEdges(this.props.jsonGraph, this._getColors())}
                            colors={this._getColors()}
                        />
                    }
                    {this.props.selectedTab === "weighted-view" && 
                        <WeightedViewUI
                            relationships={new JSONGraphParserUtils().getEdges(this.props.jsonGraph, this._getColors())}
                            colors={this._getColors()}
                        />
                    }
                </>
        </div>
        )
    }

    _getColors() {
        let selectedColors: string[] =  ['#61a14a', '#4987c0', '#eb8227', '#F4145B', '#dfb63d', '#824f7d'];
        let decompositionColors: string[] = Object.keys(this.props.jsonGraph).map((key, index) => {
            return selectedColors[index % 6]
        });
        return {
            ...Object.keys(this.props.jsonGraph).reduce((relationship, key, index) => { return relationship = {...relationship, [key]: decompositionColors[index]}}, {}), 
            ...{'weighted-view': '#a1665e','trade-off': 'grey'}
        };
    }
}

const mapStateToProps = (state: any) => getSelectors(state);
const mapDispatchToProps = {
    addPlugin
}

type TActionTypes = typeof mapDispatchToProps;

export const DashboardView = withStyles(styles)(
    withRouter(
        connect(
            mapStateToProps, 
            mapDispatchToProps
        )(DashboardViewBase)
    )
)