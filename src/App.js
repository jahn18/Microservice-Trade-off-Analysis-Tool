import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Link,
  Redirect
} from "react-router-dom";

//Pages
import FilePage from "./Pages";
import DiffTool from "./Pages/diffTool";

class App extends React.Component {
  constructor(props){
    super(props);
    // this.state = { 
    //   nodes: [],
    //   edges: {
    //     static: [],
    //     classNames: []
    //   },
    //   decomposition_one: {},
    //   decomposition_two: {}  
    // }
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
