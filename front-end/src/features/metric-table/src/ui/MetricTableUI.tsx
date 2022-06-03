import React from "react";
import withStyles, { WithStylesProps } from "react-jss";
import { getSelectors } from './MetricTableUISelectors';

import { styles } from './MetricTableStyles';
import { connect } from "react-redux";
import { IMetricTableUIState } from '../MetricTableTypes';
import { MetricTable } from '../../../../components/Tables/general/MetricsTable/MetricsTable';

export interface MetricTableProps extends WithStylesProps<typeof styles>, IMetricTableUIState, TActionTypes {
    relationshipTypes: any,
    headers: (string[])[],
    title: string
    rows: any[]
}

class MetricTableBase extends React.PureComponent<MetricTableProps> {
    render() {
        return (
            <MetricTable 
                headers={this.props.headers}
                title={this.props.title}
                rows={this.props.rows}
            />
        );
    }
}

const mapStateToProps = (state: any) => getSelectors(state)
const mapDispatchToProps = {
}

type TActionTypes = typeof mapDispatchToProps;

export const Metrics = withStyles(styles)(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(MetricTableBase)
);
