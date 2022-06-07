import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  RouteProps,
  RouterProps,
  Switch
} from "react-router-dom";
import { Provider as StyletronProvider } from "styletron-react";
import { Client as Styletron } from "styletron-engine-atomic";
import { BaseProvider, LightTheme } from "baseui";
import { addPlugin } from './store/Plugin';
import { connect } from 'react-redux';
import { Navigation } from './features/navigation/src/Navigation';
import { DashboardView } from './views/dashboard/Dashboard';
import { CustomView } from './features/custom-view/src/CustomView';
import { ChangeHistory } from './features/change-history-table/src/ChangeHistory';
import { DiffView } from './features/diff-view/src/DiffView';
import { FileInputView } from './features/file-input/src/FileInputView';
import { FileInput } from './features/file-input/src/ui/FileInputUI';
import { WeightedView } from './features/weighted-view/src/WeightedView';


const engine = new Styletron();

const NavRoute: React.FC<RouteProps> = ({exact, path, component}) => (
  <Route exact={exact} path={path} render={(props) => (
    <div>
      <DashboardView/>
      {component}
    </div>
  )}/>
);

class App extends React.Component<typeof mapDispatchToProps> {
  constructor(props: typeof mapDispatchToProps){
    super(props);

    this.props.addPlugin(Navigation);
    this.props.addPlugin(CustomView);
    this.props.addPlugin(ChangeHistory);
    this.props.addPlugin(DiffView);
    this.props.addPlugin(FileInputView);
    this.props.addPlugin(WeightedView)
  }

  render() {
    return(
      <div>
        <Router>
          <StyletronProvider value={engine} debugAfterHydration>
            <BaseProvider theme={LightTheme}>
                <Switch>
                  <Route exact path="/" component={FileInput}/>
                  <Route exact path="/tool" component={DashboardView} />
                  {/* <Route exact path="/diff-view" component={DiffViewUI} /> */}
                </Switch>
            </BaseProvider>
          </StyletronProvider>
        </Router>
      </div>
    )
  }
}

const mapDispatchToProps = {
  addPlugin
}

export default connect(null, mapDispatchToProps)(App);
