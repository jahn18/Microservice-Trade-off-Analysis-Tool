import React from 'react';
import {
  BrowserRouter as Router,
  Route,
} from "react-router-dom";
import {connect} from 'react-redux';
//Pages
import FilePage from "./Pages";
import DiffTool from "./Pages/DiffTool";

class App extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return(
      <div>
        <Router>
          <Route exact path="/" component={FilePage}/>
          <Route exact path="/tool" component={DiffTool} />
        </Router>
      </div>
    )
  }
}

export default App;
