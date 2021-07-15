import React, { useState } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    Redirect,
    useHistory,
    useLocation
  } from "react-router-dom";


const FilePage = (props) => {
    let fileReader;
    const [data, setData] = useState(null);

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

    return(
        <div className='upload-file'>
            <h3>Input JSON File</h3>
            <input 
                type="file" 
                id="json-file" 
                accept=".json" 
                onChange={ e => handleFileChosen(e.target.files[0])}
            />
            <Link to={{
                pathname: '/tool',
                state: {data},
            }}> Diff Tool </Link>
        </div>
    );
};

export default FilePage;