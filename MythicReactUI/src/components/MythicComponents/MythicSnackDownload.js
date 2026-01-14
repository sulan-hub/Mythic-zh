import React from 'react';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Link } from '@mui/material';

const PREFIX = 'MythicSnack下载';

const classes = {
    root: `${PREFIX}-root`,
    typography: `${PREFIX}-typography`,
    actionRoot: `${PREFIX}-actionRoot`,
    icons: `${PREFIX}-icons`,
    expand: `${PREFIX}-expand`,
    expandOpen: `${PREFIX}-expandOpen`,
    collapse: `${PREFIX}-collapse`,
    checkIcon: `${PREFIX}-checkIcon`,
    button: `${PREFIX}-button`
};

const Root = styled('div')((
    {
        theme
    }
) => ({
    [`& .${classes.root}`]: {
        [theme.breakpoints.up('sm')]: {
            minWidth: '344px !important',
        },
    },

    [`& .${classes.typography}`]: {
        fontWeight: 'bold',
    },

    [`& .${classes.actionRoot}`]: {
        padding: '8px 8px 8px 16px',
    },

    [`& .${classes.icons}`]: {
        marginLeft: 'auto',
        float: "right"
    },

    [`& .${classes.expand}`]: {
        padding: '8px 8px',
        transform: 'rotate(0deg)',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        }),
    },

    [`& .${classes.expandOpen}`]: {
        transform: 'rotate(180deg)',
    },

    [`& .${classes.collapse}`]: {
        padding: 16,
    },

    [`& .${classes.checkIcon}`]: {
        fontSize: 20,
        color: '#b3b3b3',
        paddingRight: 4,
    },

    [`& .${classes.button}`]: {
        padding: 0,
        textTransform: 'none',
    }
}));

export const MythicSnackDownload = (props) => {
    return (
        <Root>
            <Typography variant="subtitle2" className={classes.typography}>
                {props.title}
            </Typography>
                <React.Fragment>
                    <Typography gutterBottom>文件已准备下载</Typography>
                    <Link color="textPrimary" download={true} href={"/direct/download/" + props.file_id} target="_blank">
                        点击此处下载
                    </Link>
                </React.Fragment>
        </Root>
    );
};