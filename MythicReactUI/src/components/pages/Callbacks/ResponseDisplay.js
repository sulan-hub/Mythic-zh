import React, {useEffect} from 'react';
import {gql, useLazyQuery, useSubscription} from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import {ResponseDisplayScreenshot} from './ResponseDisplayScreenshot';
import {ResponseDisplayPlaintext} from './ResponseDisplayPlaintext';
import {ResponseDisplayTable} from './ResponseDisplayTable';
import {ResponseDisplayDownload} from './ResponseDisplayDownload';
import {ResponseDisplaySearch} from './ResponseDisplaySearch';
import MythicTextField from '../../MythicComponents/MythicTextField';
import SearchIcon from '@mui/icons-material/Search';
import {useTheme} from '@mui/material/styles';
import {Backdrop, CircularProgress, IconButton, Typography} from '@mui/material';
import {MythicStyledTooltip} from '../../MythicComponents/MythicStyledTooltip';
import Pagination from '@mui/material/Pagination';
import {ResponseDisplayInteractive} from "./ResponseDisplayInteractive";
import {ResponseDisplayMedia} from "./ResponseDisplayMedia";
import {GetMythicSetting} from "../../MythicComponents/MythicSavedUserSetting";
import {ResponseDisplayGraph} from "./ResponseDisplayGraph";

const subResponsesStream = gql`
subscription subResponsesStream($task_id: Int!){
  response_stream(
    batch_size: 50,
    cursor: {initial_value: {timestamp: "1970-01-01"}},
    where: {task_id: {_eq: $task_id} }
  ){
    id
    response: response_text
    timestamp
  }
}
`;
const getResponsesLazyQuery = gql`
query subResponsesQuery($task_id: Int!, $fetchLimit: Int, $offset: Int!, $search: String!) {
  response(where: {task_id: {_eq: $task_id}, response_escape: {_ilike: $search}}, limit: $fetchLimit, offset: $offset, order_by: {id: asc}) {
    id
    response: response_text
    timestamp
    is_error
  }
  response_aggregate(where: {task_id: {_eq: $task_id}, response_escape: {_ilike: $search}}){
    aggregate{
      count
    }
  }
}`;
const getAllResponsesLazyQuery = gql`
query subResponsesQuery($task_id: Int!, $search: String!) {
  response(where: {task_id: {_eq: $task_id}, response_escape: {_ilike: $search}}, order_by: {id: asc}) {
    id
    response: response_text
    timestamp
    is_error
  }
  response_aggregate(where: {task_id: {_eq: $task_id}, response_escape: {_ilike: $search}}){
    aggregate{
      count
    }
  }
}`;
const taskScript = gql`
query getBrowserScriptsQuery($command_id: Int!){
  browserscript(where: {active: {_eq: true}, command_id: {_eq: $command_id}, for_new_ui: {_eq: true}}) {
    script
    id
  }
}

`;
export function b64DecodeUnicode(str) {
  if(str.length === 0){return ""}
  try{
    const text = window.atob(str);
    const length = text.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = text.charCodeAt(i);
    }
    const decoder = new TextDecoder(); // 默认是utf-8
    return decoder.decode(bytes);
  }catch(error){
    try{
      return decodeURIComponent(window.atob(str));
    }catch(error2){
      try{
        return window.atob(str);
      }catch(error3){
        console.log("base64解码响应失败", error, error2)
        return str;
      }
    }
  }
}
export const ResponseDisplay = (props) =>{
  const interactive = props?.task?.command?.supported_ui_features.includes("task_response:interactive") || false;
  return (
      interactive ? (
          <ResponseDisplayInteractive {...props} />
        ) : (
          <NonInteractiveResponseDisplay {...props} />
        )
  )
}
const NonInteractiveResponseDisplay = (props) => {
  const [output, setOutput] = React.useState("");
  const [rawResponses, setRawResponses] = React.useState([]);
  const seenResponseIDs = React.useRef([]);
  const search = React.useRef("");
  const [totalCount, setTotalCount] = React.useState(0);
  const [openBackdrop, setOpenBackdrop] = React.useState(true);
  const togglingAllOutputToPaginated = React.useRef(false);
  const initialResponseStreamLimit = GetMythicSetting({setting_name: "experiment-responseStreamLimit", default_value: 50});
  const [fetchMoreResponses] = useLazyQuery(getResponsesLazyQuery, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      data.response.forEach( (r) => {
        if(!seenResponseIDs.current.includes(r.id)){
          seenResponseIDs.current.push(r.id);
        }
      })
      // 将原始响应设置为手动获取的内容
      const responseArray = data.response.map( r =>{ return {...r, response: b64DecodeUnicode(r.response)}});
      setRawResponses(responseArray);

      const responses = responseArray.reduce( (prev, cur) => {
        return prev + cur.response;
      }, b64DecodeUnicode(""));
      setOutput(responses);
      // 更新最大ID
      if(!props.selectAllOutput){
        setTotalCount(data.response_aggregate.aggregate.count);
      }
      setOpenBackdrop(false);
    },
    onError: (data) => {
      snackActions.error("获取更多响应失败: " + data)
    }
  });
  const [fetchAllResponses] = useLazyQuery(getAllResponsesLazyQuery, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      const responseArray = data.response.map( r =>{ return {...r, response: b64DecodeUnicode(r.response)}});
      setRawResponses(responseArray);

      const responses = responseArray.reduce( (prev, cur) => {
        return prev + cur.response;
      }, b64DecodeUnicode(""));
      setOutput(responses);

      setTotalCount(1);
      setOpenBackdrop(false);
      togglingAllOutputToPaginated.current = true;
    },
    onError: (data) => {

    }
  });
  React.useEffect( () => {
    //if(props.selectAllOutput !== oldSelectAllOutput.current){
      //oldSelectAllOutput.current = props.selectAllOutput;
      if(props.selectAllOutput){
        setOpenBackdrop(true);
        if(search.current === ""){
          fetchAllResponses({variables: {task_id: props.task.id, search: "%%"}})
        }else{
          fetchAllResponses({variables: {task_id: props.task.id, search: "%" + search.current + "%"}})
        }
      }else if(togglingAllOutputToPaginated.current){
        // 从"选择所有输出"切换到不选择所有输出
        // 首次加载时不获取此数据
        onSubmitPageChange(1);
        togglingAllOutputToPaginated.current = false;
      }
    //}
  }, [props.selectAllOutput, togglingAllOutputToPaginated.current]);
  React.useEffect( () => {
    setOpenBackdrop(true);
    setOutput("");
    setRawResponses([]);
    setTotalCount(0);
    //onSubmitPageChange(1);
  }, [props.task.id]);
  setTimeout(() => {
    // 2秒后关闭遮罩层，以防没有数据要获取
    setOpenBackdrop(false);
  }, 1000);
  const subscriptionDataCallback =  ({data}) => {
    //console.log("fetchLimit", fetchLimit, "totalCount", totalCount);
      if(rawResponses.length >= initialResponseStreamLimit && initialResponseStreamLimit > 0 && !props.selectAllOutput){
        // 我们不会显示它
        console.log("获取到的数据超过当前可见范围", totalCount);
        setOpenBackdrop(false);
        let newTotal = totalCount;
        data.data.response_stream.forEach( (r) => {
          if(!seenResponseIDs.current.includes(r.id)){
            newTotal += 1;
            seenResponseIDs.current.push(r.id);
          }
        })
        setTotalCount(newTotal);
        return;
      }
      // 我们仍然有空间查看更多，但只有 initialResponseStreamLimit - totalFetched.current 的空间
      let newTotal = totalCount;
      const newerResponses = data.data.response_stream.reduce( (prev, cur) => {
        if(!seenResponseIDs.current.includes(cur.id)){
          newTotal += 1;
          seenResponseIDs.current.push(cur.id);
        }
        let prevIndex = prev.findIndex( (v,i,a) => v.id === cur.id);
        if(prevIndex >= 0){
          prev[prevIndex] = {...cur, response: b64DecodeUnicode(cur.response)};
          return prev;
        }
        return [...prev, {...cur, response: b64DecodeUnicode(cur.response)}]
      }, rawResponses);
      // 排序确保顺序正确
      newerResponses.sort( (a,b) => a.id > b.id ? 1 : -1);
      setTotalCount(newTotal);
      // newerResponses 是我们见过的所有内容加上所有新内容
      if(initialResponseStreamLimit > 0 && !props.selectAllOutput){
        // 只取构成流限制的响应
        const finalRawResponses = newerResponses.slice(0, initialResponseStreamLimit);
        const outputResponses = finalRawResponses.reduce( (prev, cur) => {
          return prev + cur.response;
        }, b64DecodeUnicode(""));
        if(finalRawResponses.length !== rawResponses.length){
          setRawResponses(finalRawResponses);
          setOutput(outputResponses);
        }
      } else {
        setRawResponses(newerResponses);
        const outputResponses = newerResponses.reduce( (prev, cur) => {
          return prev + cur.response;
        }, b64DecodeUnicode(""));
        setOutput(outputResponses);
      }
      setOpenBackdrop(false);

  };
  useSubscription(subResponsesStream, {
    variables: {task_id: props.task.id},
    fetchPolicy: "network_only",
    onData: subscriptionDataCallback
  });
  const onSubmitPageChange = (currentPage) => {
    //console.log("onSubmitPageChange")
    if(search.current === undefined || search.current === ""){
        fetchMoreResponses({variables: {task_id: props.task.id,
            fetchLimit: initialResponseStreamLimit === 0 ? undefined : initialResponseStreamLimit,
            offset: initialResponseStreamLimit * (currentPage - 1),
            search: "%_%"
          }})
      }else{
        fetchMoreResponses({variables: {task_id: props.task.id,
            fetchLimit: initialResponseStreamLimit  === 0 ? undefined : initialResponseStreamLimit,
            offset: initialResponseStreamLimit * (currentPage - 1),
            search: "%" +  search.current + "%"
          }})
      }
  }
  const onSubmitSearch = React.useCallback( (newSearch) => {
    search.current = newSearch;
    //console.log("onSubmitSearch")
    //setOpenBackdrop(true);
    if(newSearch === undefined || newSearch === ""){
      if(props.selectAllOutput){
        fetchAllResponses({variables: {task_id: props.task.id, search: "%%"}})
      }else{
        fetchMoreResponses({variables: {task_id: props.task.id,
            fetchLimit: initialResponseStreamLimit  === 0 ? undefined : initialResponseStreamLimit,
            offset: 0,
            search: "%_%"
          }})
      }

    }else{
      if(props.selectAllOutput){
        fetchAllResponses({variables: {task_id: props.task.id, search: "%" + newSearch + "%"}})
      }else{
        fetchMoreResponses({variables: {task_id: props.task.id,
            fetchLimit: initialResponseStreamLimit,
            offset: 0,
            search: "%" + newSearch + "%"
          }})
      }

    }
  }, [search.current]);

  return (
      <React.Fragment>
        <Backdrop open={openBackdrop} onClick={()=>{setOpenBackdrop(false);}} style={{zIndex: 2, position: "absolute"}}>
          <CircularProgress color="inherit" disableShrink  />
        </Backdrop>

        {!openBackdrop &&
            <div style={{display: "flex", flexDirection: "column", height: "100%", width: "100%"}}>
                {props.searchOutput &&
                    <SearchBar onSubmitSearch={onSubmitSearch} />
                }
              <div style={{overflowY: "auto", flexGrow: 1, width: "100%", height: props.expand ? "100%": undefined, display: "flex", flexDirection: "column"}} ref={props.responseRef}>
                <ResponseDisplayComponent rawResponses={rawResponses} viewBrowserScript={props.viewBrowserScript}
                                          output={output} command_id={props.command_id} displayType={"accordion"}
                                          task={props.task} search={search.current} expand={props.expand}/>

              </div>

                  <PaginationBar selectAllOutput={props.selectAllOutput} totalCount={totalCount} pageSize={initialResponseStreamLimit}
                                 onSubmitPageChange={onSubmitPageChange} task={props.task} search={search.current} />

            </div>

        }
      </React.Fragment>
  )
}
export const ResponseDisplayConsole = (props) => {
  const interactive = props?.task?.command?.supported_ui_features.includes("task_response:interactive") || false;
  return (
      interactive ? (
          <ResponseDisplayInteractive {...props} />
      ) : (
          <NonInteractiveResponseDisplayConsole {...props} />
      )
  )
}
export const NonInteractiveResponseDisplayConsole = (props) => {
  const [output, setOutput] = React.useState("");
  const [rawResponses, setRawResponses] = React.useState([]);
  const taskID = React.useRef(props.task.id);
  const subscriptionDataCallback = React.useCallback( ({data}) => {
    //console.log("fetchLimit", fetchLimit, "totalCount", totalCount);
    if(props.task.id !== taskID.current){
      taskID.current = props.task.id;
      const responseArray = data.data.response_stream.map( r =>{ return {...r, response: b64DecodeUnicode(r.response)}});
      const responses = responseArray.reduce( (prev, cur) => {
        return prev + cur.response;
      }, b64DecodeUnicode(""));
      setOutput(responses);
      setRawResponses(responseArray);
    } else {
      // 我们仍然有空间查看更多，但只有 initialResponseStreamLimit - totalFetched.current 的空间
      const newerResponses = data.data.response_stream.reduce( (prev, cur) => {
        let prevIndex = prev.findIndex( (v,i,a) => v.id === cur.id);
        if(prevIndex >= 0){
          prev[prevIndex] = {...cur, response: b64DecodeUnicode(cur.response)};
          return prev;
        }
        return [...prev, {...cur, response: b64DecodeUnicode(cur.response)}]
      }, rawResponses);
      // 排序确保顺序正确
      newerResponses.sort( (a,b) => a.id > b.id ? 1 : -1);
      setRawResponses(newerResponses);
      const outputResponses = newerResponses.reduce( (prev, cur) => {
        return prev + cur.response;
      }, b64DecodeUnicode(""));
      setOutput(outputResponses);
    }
  }, [output, rawResponses, props.task.id]);
  useSubscription(subResponsesStream, {
    variables: {task_id: props.task.id},
    fetchPolicy: "network_only",
    onData: subscriptionDataCallback
  });

  return (
      <React.Fragment>
        <div style={{overflowY: "auto", width: "100%", height: props.expand ? "100%" : undefined}}
             ref={props.responseRef}>
          <ResponseDisplayComponent rawResponses={rawResponses} viewBrowserScript={props.viewBrowserScript}
                                    output={output} command_id={props.command_id} displayType={"console"}
                                    task={props.task} search={""} expand={props.expand}/>
        </div>
        <div id={'scrolltotaskbottom' + props.task.id}></div>
      </React.Fragment>
  )
}

export const PaginationBar = ({selectAllOutput, totalCount, onSubmitPageChange, task, search, pageSize}) => {
  const [localTotalCount, setTotalcount] = React.useState(0);
  const [maxCount, setMaxCount] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const onChangePage =  (event, value) => {
    setCurrentPage(value);
    onSubmitPageChange(value);
  };
  React.useEffect( () => {
    if(maxCount !== task.response_count){
      setMaxCount(task.response_count);
    }
  }, [task.response_count]);
  React.useEffect( () => {
    if(selectAllOutput){
      setTotalcount(1);
      setCurrentPage(1);
    }else if(totalCount === 0) {
      setTotalcount(maxCount);
    }else{
      setTotalcount(totalCount);
    }
  }, [totalCount, maxCount, search, selectAllOutput]);
  const pageCount = Math.max(1, Math.ceil(localTotalCount / pageSize));
  // 如果用户甚至还没有开始分页，不要用分页信息打扰他们
  if(pageCount < 2 || pageCount === Infinity || isNaN(pageCount)){
    return (<div id={'scrolltotaskbottom' + task.id}></div>)
  }
  return (
    <div id={'scrolltotaskbottom' + task.id} style={{background: "transparent", display: "flex", justifyContent: "center", alignItems: "center", paddingBottom: "10px",}} >
        <Pagination count={pageCount} page={currentPage} variant="contained" color="primary" showFirstButton showLastButton
                    boundaryCount={4} onChange={onChangePage} style={{margin: "10px"}} siblingCount={2}
        />
        <Typography style={{paddingLeft: "10px"}}>总结果数: {localTotalCount}</Typography>
    </div>
  )
}

export const SearchBar = ({onSubmitSearch}) => {
  const theme = useTheme();
  const [search, setSearch] = React.useState("");
  const onSubmitLocalSearch = () => {
    onSubmitSearch(search);
  }
  return (
    <div style={{marginTop: "10px"}}>
      <MythicTextField value={search} autoFocus onEnter={onSubmitLocalSearch} onChange={(n,v,e) => setSearch(v)} placeholder="搜索此任务的所有输出" name="搜索..."
        InputProps={{
          endAdornment: 
          <React.Fragment>
              <MythicStyledTooltip title="搜索">
                  <IconButton onClick={onSubmitLocalSearch} size="large"><SearchIcon style={{color: theme.palette.info.main}}/></IconButton>
              </MythicStyledTooltip>
          </React.Fragment>,
          style: {padding: 0}
      }}
      ></MythicTextField>
    </div>
  );
}

const ResponseDisplayComponent = ({rawResponses, viewBrowserScript, output, command_id, task, search, expand, displayType}) => {
  const [localViewBrowserScript, setViewBrowserScript] = React.useState(true);
  const [browserScriptData, setBrowserScriptData] = React.useState({});
  const [loadingBrowserScript, setLoadingBrowserScript] = React.useState(true);
  const script = React.useRef(undefined);
  const filterOutput = (scriptData) => {
    if(search === ""){
      return scriptData;
    }
    let copied = {...scriptData};

    if(scriptData["plaintext"] !== undefined){
      if(!scriptData["plaintext"].includes(search)){
        copied["plaintext"] = "";
      }
    }
    if(scriptData["table"] !== undefined){
      if(scriptData["table"].length > 0){
        copied["table"] = scriptData.table.map(t => {
          const filteredRows = t.rows.filter(r => {
            let foundMatch = false;
            for (const entry of Object.values(r)) {
              if (entry["plaintext"] !== undefined) {
                if (String(entry["plaintext"]).toLowerCase().includes(search)) {
                  foundMatch = true;
                }
              }
              if (entry["button"] !== undefined && entry["button"]["value"] !== undefined) {
                if (JSON.stringify(entry["button"]["value"]).includes(search)) {
                  foundMatch = true;
                }
              }
            }
            return foundMatch;
          });
          return {...t, rows: filteredRows};
        });
      }
    }

    return copied;
  }
  useEffect( () => {
    if(loadingBrowserScript){
      return;
    }
    if(script.current === undefined){
      setViewBrowserScript(false);
      return;
    }
    if(viewBrowserScript){
      try{
        const rawResponseData = rawResponses.map(c => c.response);
        let res = script.current(task, rawResponseData);
        if(Object.keys(res).length === 0){
          // 如果我们运行浏览器脚本但没有数据，只显示纯文本
          setViewBrowserScript(false);
          return;
        }
        setViewBrowserScript(viewBrowserScript);
        setBrowserScriptData(filterOutput(res));
      }catch(error){
        if(rawResponses.length > 0){
          setViewBrowserScript(false);
          setBrowserScriptData({});
          console.log(error);
        }
      }
    } else {
      setViewBrowserScript(false);
    }
  }, [rawResponses, task, loadingBrowserScript, viewBrowserScript]);
  const [fetchScripts] = useLazyQuery(taskScript, {
    fetchPolicy: "no-cache",
    onCompleted: (data) => {
      if(data.browserscript.length > 0){
        try{
          script.current = Function(`"use strict";return(${data.browserscript[0]["script"]})`)();
        }catch(error){
          script.current = undefined;
          console.log(error);
        }
      }else{
        setViewBrowserScript(false);
        setBrowserScriptData({});
      }
      setLoadingBrowserScript(false);
    },
    onError: (data) => {
      console.log("加载脚本错误", data);
    }
  });
  useEffect( () => {
    if(command_id !== undefined){
      setLoadingBrowserScript(true);
      fetchScripts({variables: {command_id: command_id}});
    }
  }, [command_id, task.id]);
  if(loadingBrowserScript){
    return null
  }
  return (
    localViewBrowserScript && Object.keys(browserScriptData).length > 0 ? (
      <React.Fragment>
          {browserScriptData?.screenshot?.map( (scr, index) => (
              <ResponseDisplayScreenshot key={"screenshot" + index + 'fortask' + task.id} task={task} {...scr}
                                         displayType={displayType} expand={expand} />
            ))
          }
          {browserScriptData?.plaintext !== undefined &&
            <ResponseDisplayPlaintext plaintext={browserScriptData["plaintext"]} task={task}
                                      expand={expand} displayType={displayType} />
          }
          {browserScriptData?.table?.map( (table, index) => (

            <ResponseDisplayTable callback_id={task.callback_id} task={task} expand={expand}
                                         table={table} key={"tablefortask" + task.id + "table" + index}
                                         displayType={displayType}
            />
          ))
          }
          {browserScriptData?.download?.map( (dl, index) => (
              <ResponseDisplayDownload download={dl} task={task} displayType={displayType}
                                       key={"download" + index + "fortask" + task.id} />
            ))
          }
          {browserScriptData?.search?.map( (s, index) => (
              <ResponseDisplaySearch search={s} task={task} displayType={displayType}
                                     key={"searchlink" + index + "fortask" + task.id} />
          ))
          }
          {browserScriptData?.media?.map( (s, index) => (
              <ResponseDisplayMedia key={"searchmedia" + index + "fortask" + task.id}
                                    displayType={displayType}
                                    task={task} media={s} expand={expand} />
          ))}
          {browserScriptData?.graph !== undefined &&
            <ResponseDisplayGraph graph={browserScriptData.graph} task={task}
                                  expand={expand} displayType={displayType} />
          }
      </React.Fragment>
    ) : (
      <ResponseDisplayPlaintext plaintext={output} task={task} expand={expand} displayType={displayType}/>
    )
  )
}