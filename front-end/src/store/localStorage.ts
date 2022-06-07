export const loadInputFile = () => {
    try {
      const serializedState = localStorage.getItem('state');
      if (serializedState === null) {
        return undefined;
      }
      return JSON.parse(serializedState).jsonGraph;
    } catch (err) {
      return undefined;
    }
  }; 

  // Loads the state of the tool - if it should be in weighted/diff mode
export const loadToolState = () => {
    try {
      const serializedState = localStorage.getItem('state');
      if (serializedState === null) {
        return false;
      }
      return JSON.parse(serializedState).enableWeightedView;
    } catch (err) {
      return false;
    }
};

export const saveInputFile = (state: any) => {
    try {
      const serializedState = JSON.stringify(state["FileInput"]);
      localStorage.setItem('state', serializedState);
    } catch {
      // ignore write errors
    }
  };
