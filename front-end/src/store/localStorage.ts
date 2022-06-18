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

  // Loads the state of the tool - if it should be in decomposition/diff mode
export const loadToolState = () => {
    try {
      const serializedState = localStorage.getItem('diff-select');
      if (serializedState === null) {
        return false;
      }
      return JSON.parse(serializedState).diffSelect;
    } catch (err) {
      return false;
    }
};

export const saveToolState = (state: any) => {
  try {
      const serializedState = JSON.stringify(state["DiffSelector"]);
      localStorage.setItem('diff-select', serializedState);
  } catch {

  }
}

export const saveInputFile = (state: any) => {
    try {
      const serializedState = JSON.stringify(state["FileInput"]);
      localStorage.setItem('state', serializedState);
    } catch {
      // ignore write errors
    }
  };
