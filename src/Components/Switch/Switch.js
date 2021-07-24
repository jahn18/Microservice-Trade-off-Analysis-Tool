import {makeStyles} from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import React from 'react';

const AntSwitch = (props) => {

    const useStyles = makeStyles({
        root: {
            width: 28,
            height: 16,
            padding: 0,
            display: 'flex',
        },
        switchBase: {
            padding: 2,
            color: '#a9a9a9',
            '&$checked': {
                transform: 'translateX(12px)',
                color: 'white',
                '& + $track': {
                    opacity: 1,
                    backgroundColor: props.color, 
                    borderColor: props.color, 
                },
            },
        },
        thumb: {
            width: 12,
            height: 12,
            boxShadow: 'none',
        },
        track: {
            border: `1px solid ${'#c4c4c4'}`,
            borderRadius: 16 / 2,
            opacity: 1,
            backgroundColor: 'white',
        },
        checked: {},
    });

    const classes = useStyles();

    return (
        <Switch 
            className={classes.root} onChange={props.onChange} classes={classes}>
        </Switch>
    );
};


export default AntSwitch;