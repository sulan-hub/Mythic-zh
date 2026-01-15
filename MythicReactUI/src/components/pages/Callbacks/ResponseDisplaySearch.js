import React from 'react';
import {  Link } from '@mui/material';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";


export const ResponseDisplaySearch = (props) =>{
    const scrollContent = (node, isAppearing) => {
        // 仅在你发布任务时自动滚动
        document.getElementById(`scrolltotaskbottom${props.task.id}`)?.scrollIntoView({
            //behavior: "smooth",
            block: "end",
            inline: "nearest"
        })
    }
    React.useLayoutEffect( () => {
        scrollContent()
    }, []);
  return (
    <>
      <pre style={{display: "inline-block", whiteSpace: "pre-wrap"}}>
        {props.search?.plaintext || ""}
      </pre>
      
      <MythicStyledTooltip title={props.search?.hoverText || "在搜索页面查看"} >
        <Link component="a" target="_blank" href={window.location.origin + "/new/search/?" + props.search.search}>
            {props.search?.name || ""}
        </Link>
      </MythicStyledTooltip><br/>
    </>
  );   
}