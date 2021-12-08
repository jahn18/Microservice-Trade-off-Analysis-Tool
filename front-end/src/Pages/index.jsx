import React, { useState } from 'react';
import {
    BrowserRouter as Router,
    Link,
  } from "react-router-dom";
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

//var SERVER_ADDRESS = "http://127.0.0.1:5000/";
var SERVER_ADDRESS = "http://svresessp1.ece.ubc.ca/api/";

const FilePage = () => {
    let fileReader;
    const [data, setData] = useState(null);
    const [selectedDemoFile, setDemoFile] = useState("");

    const handleFileRead = (e) => {
        const content = fileReader.result;
        let json_data; 
        try {
            json_data = JSON.parse(content);
        }
        catch(err) {
            alert("Not a JSON file!");
        }
        setData(json_data);
    };
   
    const handleFileChosen = (file) => {
        fileReader = new FileReader();
        fileReader.onloadend = handleFileRead;
        fileReader.readAsText(file);
    };

    const getDemoJSONFile = (projectName) => {
        if (projectName !== "") {
            let xhr = new XMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    const status = xhr.status;
                    if (status !== 400) {
                        let json_file = JSON.parse(xhr.responseText);
                        setData(json_file);
                    } else {
                        console.log("Demo json file could not be found...");
                    }
                }
            }

            const address = SERVER_ADDRESS + projectName;
            xhr.open("POST", address);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json"); 
            xhr.send("");
        }
        setDemoFile(projectName);
    }

    return(
        <div className='upload-file'>
            <TableContainer
                component={Paper}
                style={
                        {
                            width: '60%',
                            border: '1px solid grey',
                            left: '20%',
                            bottom: '50%',
                            position: 'fixed',
                        }
                    } 
                size="medium"
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
                                onChange={ e => handleFileChosen(e.target.files[0])}
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
                                    value={selectedDemoFile}
                                    onChange={(event, projectName) => getDemoJSONFile(projectName.props.value)}
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
                            <Link to={{
                                pathname: '/static',
                                state: {data},
                            }}>
                                <Button
                                    variant="contained" color="primary"
                                    style={{width: '100%'}}
                                >
                                    <Typography variant="button">
                                        RUN
                                    </Typography>
                                </Button> 
                            </Link>
                        </TableCell>
                    </TableRow>
                </Table>
            </TableContainer>
        </div>
    );
};

export default FilePage;