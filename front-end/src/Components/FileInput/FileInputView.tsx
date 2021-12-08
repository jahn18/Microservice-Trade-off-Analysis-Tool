import React from "react";
import { Paper, TableContainer, Table, TableRow, TableCell, Typography, FormControl, InputLabel, MenuItem, Select, Link, Button, ListItemText, ListItem, LinearProgress } from "@mui/material";
import { NavLink } from "react-router-dom";

interface IFileInputViewProps {
    onFileUpload: Function
    jsonGraph: any,
    getDemoGraph: Function
}

interface IFileInputViewState {
    graphData: any
}

export class FileInputView extends React.Component<IFileInputViewProps, IFileInputViewState> {
    readonly state: IFileInputViewState = {
        graphData: {}
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
                                msTransform: "translateX(-50%) translateY(-50%)", 
                                WebkitTransform: "translate(-50%,-50%)", 
                                transform: 'translate(-50%,-50%)', 
                                width: '60%',
                                border: '1px solid grey'
                            }
                        } 
                >
                    <Table>
                        <TableRow>
                            <TableCell>
                                <Typography variant="overline">
                                    {"Input a Custom JSON File"}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <input
                                    type="file"
                                    id="json-file" 
                                    accept=".json" 
                                    onChange={ (e: any) => {
                                        this.props.onFileUpload(e.target.files[0])
                                        this.setState({graphData: JSON.parse(e.target.files[0])});
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Typography variant="overline">
                                    {"Select a DEMO Application"}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <FormControl
                                    style={{
                                        width:'50%',
                                    }}
                                >
                                    <InputLabel id="demo-simple-select-readonly-label">Demo</InputLabel>
                                    <Select 
                                        id="Demo-file-selection"
                                        variant="outlined"
                                        // value={selectedDemoFile}
                                        onChange={(event, projectName: any) => this.props.getDemoGraph(projectName.props.value)}
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem value={"PartsUnlimitedMRP"}>PartsUnlimitedMRP</MenuItem>
                                        <MenuItem value={"MotivatingExample"}>Motivating Example</MenuItem>
                                    </Select>
                                </FormControl>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={2}>
                                <NavLink to={{pathname: `/tool`, state: {graphData: this.state.graphData}}} style={{ textDecoration: 'none', color: 'unset' }} >
                                    <Button
                                        disabled={Object.keys(this.props.jsonGraph).length === 0}
                                        variant="contained" color="primary"
                                        style={{width: '100%'}}   
                                    >
                                        <Typography variant="button">
                                            RUN
                                        </Typography>
                                    </Button> 
                                </NavLink >
                            </TableCell>
                        </TableRow>
                    </Table>
                </TableContainer>
            </>
        );
    }
}