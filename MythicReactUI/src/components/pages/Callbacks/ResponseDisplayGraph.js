import React from 'react';
import {useTheme} from '@mui/material/styles';
import {DrawBrowserScriptElementsFlowWithProvider} from "./C2PathDialog";
import GroupsIcon from '@mui/icons-material/Groups';
import ComputerIcon from '@mui/icons-material/Computer';
import PersonIcon from '@mui/icons-material/Person';
import LanIcon from '@mui/icons-material/Lan';
import LanguageIcon from '@mui/icons-material/Language';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Inventory2TwoToneIcon from '@mui/icons-material/Inventory2TwoTone';
import {MythicDialog, MythicViewJSONAsTableDialog} from "../../MythicComponents/MythicDialog";
import HelpTwoToneIcon from '@mui/icons-material/HelpTwoTone';
import DiamondIcon from '@mui/icons-material/Diamond';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSkullCrossbones} from '@fortawesome/free-solid-svg-icons';
import {Typography} from '@mui/material';
import { Button } from '@mui/material';

const getIcons = (img, nodeStyle) => {
    if(img === undefined){return null}
    const style = {...nodeStyle, fontSize: 30, height: "50%", width: "50%", margin: "auto"};
    if(img.startsWith("http")){
        return <img alt={img} src={img} className={"circleImageNode"} />
    }
    switch(img){
        case "group":
            return <GroupsIcon sx={style} />
        case "computer":
            return <ComputerIcon sx={style} />
        case "user":
            return <PersonIcon sx={style} />
        case "lan":
            return <LanIcon sx={style} />
        case "language":
            return <LanguageIcon sx={style} />
        case "list":
            return <FormatListBulletedIcon sx={style} />
        case "container":
            return <Inventory2TwoToneIcon sx={style} />
        case "help":
            return <HelpTwoToneIcon sx={style} />
        case "diamond":
            return <DiamondIcon sx={style} />
        case "skull":
            return <FontAwesomeIcon icon={faSkullCrossbones} style={style} />
        default:
            return null
    }
}
export const ResponseDisplayGraph = ({graph, task, expand}) =>{
    const theme = useTheme();
    const [viewAllDataDialog, setViewAllDataDialogOpen] = React.useState(false);
    const dictionaryData = React.useRef(null);
    const [showGraph, setShowGraph] = React.useState(graph.nodes.length < 50);
    const scrollContent = (node, isAppearing) => {
        document.getElementById(`scrolltotaskbottom${task.id}`)?.scrollIntoView({
            block: "end",
            inline: "nearest"
        })
    }
    React.useLayoutEffect( () => {
        scrollContent()
    }, []);
    const finalGraphNodes = graph?.nodes?.map( n => {
        return {...n, img: getIcons(n?.img, n?.style || {}), overlay_img: getIcons(n?.overlay_img, n?.overlay_style)}
    });
    const contextMenu = React.useMemo(() => {return [
        {
            title: '查看所有数据',
            onClick: function(node) {
                dictionaryData.current = node.data;
                setViewAllDataDialogOpen(true);
            }
        },
    ]}, []);
    if(!showGraph){
        return (
            <>
                <div style={{display: "flex", width: "100%", height: "100%", justifyContent: "center", flexDirection: "column", alignItems: "center"}}>
                    <Typography variant={"h4"} >
                        {`由于图形大小，默认隐藏图形: 节点数 (${graph.nodes.length}), 边数 (${graph.edges.length}) `}
                    </Typography>
                    <Button variant={"contained"} color={"error"} onClick={() => {setShowGraph(!showGraph)}}>
                        {"显示图形"}
                    </Button>
                </div>
            </>
        )
    }
    if(graph.nodes.length === 0){
        return (
            <>
                <div style={{display: "flex", width: "100%", height: "100%", justifyContent: "center", flexDirection: "column", alignItems: "center"}}>
                    <Typography variant={"h4"} >
                        {`空图形`}
                    </Typography>
                </div>
            </>
        )
    }
  return (
    <div style={{height: expand ? "100%" : "400px", width: "100%", position: "relative"}}>
        {viewAllDataDialog &&
            <MythicDialog fullWidth={true} maxWidth="lg" open={viewAllDataDialog}
                          onClose={()=>{setViewAllDataDialogOpen(false);}}
                          innerDialog={<MythicViewJSONAsTableDialog title={"查看节点所有数据"}
                                                                    leftColumn={"属性"}
                                                                    rightColumn={"值"}
                                                                    value={dictionaryData.current}
                                                                    onClose={()=>{setViewAllDataDialogOpen(false);}} />}
            />
        }
        <DrawBrowserScriptElementsFlowWithProvider theme={theme} edges={graph.edges} providedNodes={finalGraphNodes}
                                       view_config={{group_by: graph?.group_by || "", rankDir: "LR",}}
                                       contextMenu={contextMenu} task={task}
        />
    </div>
  );   
}