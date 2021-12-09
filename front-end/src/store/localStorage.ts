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

export const saveInputFile = (state: any) => {
    try {
      const serializedState = JSON.stringify(state["FileInput"]);
      localStorage.setItem('state', serializedState);
    } catch {
      // ignore write errors
    }
  };