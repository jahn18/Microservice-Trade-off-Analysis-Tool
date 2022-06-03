import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';


export interface ISearchBarProps {
    changeClassName: Function
}

export const SearchBar: React.FC<ISearchBarProps> = ({changeClassName}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', m: 3}}>
      <SearchIcon sx={{ color: 'action.active', mr: 1, my: 0.75 }} />
      <TextField 
          id="input-with-sx" 
          size="small"
          label="Search" 
          variant="outlined" 
          onChange={(e) => changeClassName(e.target.value)}
          style={{width: "100%"}}
      />
    </Box>
  );
}