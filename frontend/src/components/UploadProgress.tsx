// @flow
import { CircularProgress, Fade, makeStyles, Theme } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import * as React from 'react';

const useStyles = makeStyles((theme: Theme) => ({
    progressContainer: {
        position: 'relative'
    },
    progressBackground: {
        color: grey["300"]
    },
    progress: {
        position: 'absolute',
        left: 0
    }
}))

interface UploadProgressProps {
    size: number;
};
const UploadProgress:React.FC<UploadProgressProps> = (props) => {
    const {size} = props
    const classes = useStyles()
    return (
        <Fade in={true} timeout={{ enter: 100, exit: 2000 }}>
            <div className={classes.progressContainer}>
                <CircularProgress variant="static" className={classes.progressBackground} value={100} size={size}/>
                <CircularProgress variant="static" className={classes.progress} value={50} size={size}/>
            </div>
        </Fade>
    );
};

export default UploadProgress;
