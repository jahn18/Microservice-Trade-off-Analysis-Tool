import React from 'react'
import { Paper, TableContainer, Table, TableRow, TableCell, Radio, Typography, Button} from "@mui/material";
import {NavLink} from 'react-router-dom'

interface IDiffSelectorViewProps {
    diffSelect: boolean,
    onChange: Function
}

interface IDiffSelectorViewState {
    diffSelect: boolean
}

export class DiffSelectorView extends React.Component<IDiffSelectorViewProps, IDiffSelectorViewState> {
    readonly state: IDiffSelectorViewState = {
        diffSelect: false
    }
    render() {
        return (
            <>
                <TableContainer
                    component={Paper}
                    style={
                            {
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                msTransform: 'translateX(-50%) translateY(-50%)',
                                WebkitTransform: 'translate(-50%, -50%)',
                                width: '40%',
                                border: '1px solid grey'
                            }
                        }
                >
                    <Table>
                        <TableRow>
                            <TableCell>
                                <Typography variant="overline">
                                    {"Decomposition View"}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="overline">
                                    <Radio
                                        checked={!this.props.diffSelect}
                                        onChange={() => {
                                            this.setState({diffSelect: false});
                                            this.props.onChange(false);
                                        }}
                                    />
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography variant="overline">
                                    {"Diff View"}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="overline">
                                    <Radio
                                        checked={this.props.diffSelect}
                                        onChange={() => {
                                            this.setState({diffSelect: true});
                                            this.props.onChange(true);
                                        }}
                                    />
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={2} align="center">
                                <NavLink to={{pathname: `/fileInput`, state: {diffSelect: this.state.diffSelect}}} style={{ textDecoration: 'none', color: 'unset' }} >
                                    <Button
                                        variant="contained" color="primary"
                                        style={{width: '100%'}}
                                    >
                                        <Typography variant="button">
                                            NEXT
                                        </Typography>
                                    </Button>
                                </NavLink>
                            </TableCell>
                        </TableRow>
                    </Table>
                </TableContainer>
            </>
        );
    }
}