import * as React from 'react';
import { TextField, Button} from '@mui/material';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';


export const ClusterTable = (props) => {    
    const [stopWords, setStopWords] = React.useState([""])
    const [text, setText] = React.useState("")

    return (
        <div style={{marginTop: "5px"}}>
            <TextField 
                id="outlined-basic" 
                label="Stop word" 
                variant="outlined" 
                size="small" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        setStopWords([...stopWords, e.target.value]);
                        setText("");
                    }
                }}
            />
            <TableContainer sx={{maxHeight: 269}}>
                <Table size="small">
                    {stopWords.map((word) => 
                        <TableRow>
                            <TableCell>
                                <Checkbox />
                                {word}
                            </TableCell>
                        </TableRow>
                    )}
                </Table>
            </TableContainer>
            <Button 
                variant="outlined" 
                style={{color: 'black', borderColor: "grey", width: "100%"}}
                onClick={() => {
                    props.fetchGraph();
                    props.clusterGraph();
                }}
            > 
                Cluster 
            </Button>
        </div>
    )
}