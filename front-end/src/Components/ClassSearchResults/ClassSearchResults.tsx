import * as React from 'react';
import Box from '@mui/material/Box'
import Button from '@mui/material/Button';



export interface IClassSearchResultsProps {
    changeClickedClass: Function
    searchResults : any
}

export const ClassSearchResults: React.FC<IClassSearchResultsProps> = ({changeClickedClass, searchResults}) => {
    function makeButton(element: any) {
        return (
            <Button
              onClick={() => changeClickedClass(element.id())}
            >
              {element.data("label")}
            </Button>
        );
    }
  
    return (
    <Box>
      <div>
          {searchResults.map(makeButton)}
      </div>
    </Box>

    
  );
}