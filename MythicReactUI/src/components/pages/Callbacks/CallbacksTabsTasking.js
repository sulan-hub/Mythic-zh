import {MythicTabPanel, MythicTabLabel} from '../../MythicComponents/MythicTabPanel';
import React, {useEffect, useRef, useCallback, useLayoutEffect} from 'react';
import { gql, useMutation, useLazyQuery, useSubscription } from '@apollo/client';
import { TaskDisplay } from './TaskDisplay';
import {snackActions} from '../../utilities/Snackbar';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {TaskParametersDialog} from './TaskParametersDialog';
import {CallbacksTabsTaskingInput} from './CallbacksTabsTaskingInput';
import LinearProgress from '@mui/material/LinearProgress';
import { IconButton} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import {MythicModifyStringDialog} from '../../MythicComponents/MythicDialog';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import {taskingDataFragment, createTaskingMutation} from "./CallbackMutations";
import { validate as uuidValidate } from 'uuid';
import {getSkewedNow} from "../../utilities/Time";


export function CallbacksTabsTaskingLabel(props){
    const [description, setDescription] = React.useState(props.tabInfo.payloadDescription !== props.tabInfo.callbackDescription ? props.tabInfo.callbackDescription : "回调: " + props.tabInfo.displayID)
    const [openEditDescriptionDialog, setOpenEditDescriptionDialog] = React.useState(false);
    useEffect( () => {
        if(props.tabInfo.customDescription !== "" && props.tabInfo.customDescription !== undefined){
            setDescription(props.tabInfo.customDescription);
        }else if(props.tabInfo.payloadDescription !== props.tabInfo.callbackDescription){
            setDescription(props.tabInfo.callbackDescription);
        }else{
            setDescription("回调: " + props.tabInfo.displayID);
        }
    }, [props.tabInfo.payloadDescription, props.tabInfo.customDescription]);
    useEffect( () => {
        let savedDescription = localStorage.getItem(`${props.me.user.id}-${props.tabInfo.operation_id}-${props.tabInfo.tabID}`);
        if(savedDescription && savedDescription !== ""){
            setDescription(savedDescription);
        }
    }, []);
    const editDescriptionSubmit = (description) => {
        props.onEditTabDescription(props.tabInfo, description);
        localStorage.setItem(`${props.me.user.id}-${props.tabInfo.operation_id}-${props.tabInfo.tabID}`, description);
    }
    const contextMenuOptions = props.contextMenuOptions.concat([
        {
            name: '设置标签注释', 
            click: ({event}) => {
                setOpenEditDescriptionDialog(true);
            }
        },
    ]);
    return (
        <>
            <MythicTabLabel highlight={props.newDataForTab[props.tabInfo.tabID]} label={description} onDragTab={props.onDragTab} me={props.me} {...props} contextMenuOptions={contextMenuOptions}/>
            {openEditDescriptionDialog &&
                <MythicDialog fullWidth={true} open={openEditDescriptionDialog}  onClose={() => {setOpenEditDescriptionDialog(false);}}
                    innerDialog={
                        <MythicModifyStringDialog title={"编辑标签描述 - 显示为单行"} onClose={() => {setOpenEditDescriptionDialog(false);}} value={description} onSubmit={editDescriptionSubmit} />
                    }
                />
            }
        </>
    )
}

// 监听最新的任务
const fetchLimit = 30;
const getTaskingQuery = gql`
${taskingDataFragment}
subscription getTasking($callback_id: Int!, $fromNow: timestamp!, $limit: Int){
    task(where: {callback_id: {_eq: $callback_id}, parent_task_id: {_is_null: true}, timestamp: {_gt: $fromNow}}, order_by: {id: desc}, limit: $limit) {
        ...taskData
    }
}
 `;
const getNextBatchTaskingQuery = gql`
${taskingDataFragment}
query getBatchTasking($callback_id: Int!, $offset: Int!, $fetchLimit: Int!){
    task(where: {callback_id: {_eq: $callback_id}, parent_task_id: {_is_null: true}}, order_by: {id: desc}, limit: $fetchLimit, offset: $offset) {
        ...taskData
    }
    callback(where: {id: {_eq: $callback_id}}){
        id
        display_id
    }
}
`;
export const CallbacksTabsTaskingPanel = ({tabInfo, index, value, onCloseTab, parentMountedRef, me, collapseTaskRequest, setNewDataForTab}) =>{
    const [taskLimit, setTaskLimit] = React.useState(20);
    const [scrollToBottom, setScrollToBottom] = React.useState(false);
    const [openParametersDialog, setOpenParametersDialog] = React.useState(false);
    const [commandInfo, setCommandInfo] = React.useState({});
    const [taskingData, setTaskingData] = React.useState({task: []});
    const taskingDataRef = React.useRef({task: []});
    const [fromNow, setFromNow] = React.useState(getSkewedNow().toISOString());
    const [selectedToken, setSelectedToken] = React.useState({});
    const [filterOptions, setFilterOptions] = React.useState({
        "operatorsList": [],
        "commentsFlag": false,
        "commandsList": [],
        "parameterString": "",
        "everythingButList": [],
        "hideErrors": false
    });
    const [canScroll, setCanScroll] = React.useState(true);
    const mountedRef = React.useRef(true);
    useEffect( () => {
        taskingDataRef.current = taskingData;
    }, [taskingData]);
    const [fetched, setFetched] = React.useState(false);
    const [fetchedAllTasks, setFetchedAllTasks] = React.useState(false);
    const messagesEndRef = useRef(null);
    const newlyIssuedTasks = useRef([]);
    const [createTask] = useMutation(createTaskingMutation, {
        update: (cache, {data}) => {
            if(data.createTask.status === "error"){
                snackActions.error(data.createTask.error);
            }else{
                newlyIssuedTasks.current.push(data.createTask.id);
                //snackActions.success("任务已创建", {autoClose: 1000});
            }
        },
        onError: data => {
            console.error(data);
        }
    });
    const equalTaskTrees = (oldArray, newArray) => {
        if(oldArray.length !== newArray.length){
            return false;
        }
        for(let i = 0; i < oldArray.length; i++){
            if(oldArray[i].comment !== newArray[i].comment){
                return false;
            }
            if(oldArray[i].commentOperator !== newArray[i].commentOperator){
                return false;
            }
            if(oldArray[i].completed !== newArray[i].completed){
                return false;
            }
            if(oldArray[i].display_params !== newArray[i].display_params){
                return false;
            }
            if(oldArray[i].original_params !== newArray[i].original_params){
                return false;
            }
            if(oldArray[i].status !== newArray[i].status){
                return false;
            }
            if(oldArray[i].timestamp !== newArray[i].timestamp){
                return false;
            }
            if(oldArray[i].opsec_pre_blocked !== newArray[i].opsec_pre_blocked){
                return false;
            }
            if(oldArray[i].opsec_pre_bypassed !== newArray[i].opsec_pre_bypassed){
                return false;
            }
            if(oldArray[i].opsec_post_blocked !== newArray[i].opsec_post_blocked){
                return false;
            }
            if(oldArray[i].opsec_post_bypassed !== newArray[i].opsec_post_bypassed){
                return false;
            }
            if(oldArray[i].tasks.length !== newArray[i].tasks.length){
                return false;
            }
            if(oldArray[i].tags.length !== newArray[i].tags.length){
                return false;
            }
        }
        return true;
    }
    const subscriptionDataCallback =  ({data}) => {
        if((mountedRef && !mountedRef.current) || (parentMountedRef && !parentMountedRef.current)){
            return null;
        }
        if(!fetched){
            setFetched(true);
        }
        if(index !== value && fetched){
            setNewDataForTab((prev) => {return {...prev, [tabInfo.tabID]: true}});
        }
        //console.log("CallbacksTabsTasking 中的新订阅数据", subscriptionData);
        const oldLength = taskingDataRef.current.task.length;
        const mergedData = data.data.task.reduce( (prev, cur) => {
            const index = prev.findIndex(element => element.id === cur.id);
            if(index > -1){
                // 需要更新元素
                const updated = prev.map( (element) => {
                    if(element.id === cur.id){
                        return cur;
                    }else{
                        return element;
                    }
                });
                return updated;
            }else{
                return [...prev, cur];
            }
        }, [...taskingDataRef.current.task]);
        mergedData.sort( (a,b) => a.id < b.id ? -1 : 1);
        if(!equalTaskTrees(taskingDataRef.current.task, mergedData)){
            setTaskingData({task: mergedData});
        }
        if(mergedData.length > oldLength){
            setCanScroll(true);
        }     
        if(mergedData.length > taskLimit){
            setTaskLimit(mergedData.length);
        }
    }
    useSubscription(getTaskingQuery, {
        variables: {callback_id: tabInfo.callbackID, fromNow:fromNow, limit: taskLimit},
        onError: data => {
            console.error(data)
        },
        fetchPolicy: "no-cache",
        onData: subscriptionDataCallback});
    const [getInfiniteScrollTasking, {loading: loadingMore}] = useLazyQuery(getNextBatchTaskingQuery, {
        onError: data => {
            console.error(data);
        },
        onCompleted: (data) => {
            let foundNew = false;
            if(data.callback.length === 0){
                onCloseTab(tabInfo);
                return;
            }
            const mergedData = data.task.reduce( (prev, cur) => {
                const index = prev.findIndex(element => element.id === cur.id);
                if(index > -1){
                    // 需要更新元素
                    const updated = prev.map( (element) => {
                        if(element.id === cur.id){
                            return cur;
                        }else{
                            return element;
                        }
                    });
                    return updated;
                }else{
                    foundNew = true;
                    return [...prev, cur];
                }
            }, [...taskingData.task]);
            mergedData.sort( (a,b) => a.id < b.id ? -1 : 1);
            setTaskingData({task: mergedData});    
            if(!foundNew){
                setFetchedAllTasks(true);
            }else{
                if(data.task.length < fetchLimit){
                    setFetchedAllTasks(true);
                }else{
                    setFetchedAllTasks(false);
                }
            }
            if(!scrollToBottom){setScrollToBottom(true)}
        },
        fetchPolicy: "no-cache"
    });
    useEffect( () => {
        getInfiniteScrollTasking({variables: {callback_id: tabInfo.callbackID, offset: taskingData.task.length, fetchLimit}});
        setCanScroll(true);
        return() => {
            mountedRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    useEffect( () => {
        if(scrollToBottom){
            messagesEndRef.current.scrollIntoView();
        }
    }, [scrollToBottom]);
    const loadMoreTasks = () => {
        getInfiniteScrollTasking({variables: {callback_id: tabInfo.callbackID, offset: taskingData.task.length, fetchLimit}});
    }
    const onSubmitCommandLine = (message, cmd, parsed, force_parsed_popup, cmdGroupNames, previousTaskingLocation) => {
        console.log(message, cmd, parsed);
        let params = message.split(" ");
        delete params[0];
        params = params.join(" ").trim();
        let newTaskingLocation = "parsed_cli";
        if(previousTaskingLocation.includes("modal")){
            newTaskingLocation = "modal_modified"
        }else if(previousTaskingLocation.includes("browserscript")){
            newTaskingLocation = "browserscript_modified";
        }
        if(cmd.commandparameters.length === 0){
            // 如果没有参数，直接发送用户输入的内容
            onCreateTask({callback_id: tabInfo.displayID,
                command: cmd.cmd,
                params: params,
                parameter_group_name: "Default",
                tasking_location: newTaskingLocation,
                payload_type: cmd.payloadtype?.name,
            });
        }else{
            // 检查是否有需要显示的"文件"组件
            const fileParamExists = cmd.commandparameters.find(param => {
                if(param.parameter_type === "File" && cmdGroupNames.includes(param.parameter_group_name)){
                    if(!(param.cli_name in parsed || param.name in parsed || param.display_name in parsed)){
                        return true;
                    }
                    if(param.cli_name in parsed && uuidValidate(parsed[param.cli_name])){
                        return false; // 无需弹出窗口，已指定有效文件
                    } else if(param.name in parsed && uuidValidate(parsed[param.name])){
                        return false;
                    } else if(param.display_name in parsed && uuidValidate(parsed[param.display_name])){
                        return false;
                    }
                }

            });
            //console.log("组缺少文件？", fileParamExists, cmdGroupNames);
            let missingRequiredPrams = false;
            if(cmdGroupNames.length === 1){
                const missingParams = cmd.commandparameters.filter(param => param.required && param.parameter_group_name === cmdGroupNames[0] && !(param.cli_name in parsed || param.name in parsed || param.display_name in parsed));
                if(missingParams.length > 0){
                    missingRequiredPrams = true;
                    console.log("缺少必需参数", missingParams,parsed);
                }
            }else if(cmdGroupNames > 1 && !force_parsed_popup){
                // 需要强制弹出窗口，因为任务不明确
                console.log("命令不明确");
                force_parsed_popup = true;
            }
            if(fileParamExists || force_parsed_popup || missingRequiredPrams){
                //需要弹出窗口
                if(cmdGroupNames.length > 0){
                    setCommandInfo({...cmd, "parsedParameters": parsed, groupName: cmdGroupNames[0]});
                }else{
                    setCommandInfo({...cmd, "parsedParameters": parsed});
                }
                setOpenParametersDialog(true);

            }else{
                delete parsed["_"];
                onCreateTask({callback_id: tabInfo.displayID, 
                    command: cmd.cmd, 
                    params: JSON.stringify(parsed), 
                    tasking_location: newTaskingLocation, 
                    original_params: params, 
                    parameter_group_name: cmdGroupNames[0],
                    payload_type: cmd.payloadtype?.name,
                });
            }            
        }
    }
    const submitParametersDialog = (cmd, parameters, files, selectedParameterGroup, payload_type) => {
        setOpenParametersDialog(false);
        onCreateTask({callback_id: tabInfo.displayID,
            command: cmd,
            params: parameters,
            files: files,
            tasking_location: "modal",
            parameter_group_name: selectedParameterGroup,
            payload_type: payload_type
        });
    }
    const onCreateTask = ({callback_id, command, params, files, tasking_location, original_params, parameter_group_name, payload_type}) => {
        if(selectedToken.token_id !== undefined){
            createTask({variables: {callback_id, command, params, files, token_id: selectedToken.token_id, tasking_location, original_params, parameter_group_name, payload_type}});
        }else{
            createTask({variables: {callback_id, command, params, files, tasking_location, original_params, parameter_group_name, payload_type}});
        }
    }
    const onSubmitFilter = (newFilter) => {
        setFilterOptions(newFilter);
    }
    const changeSelectedToken = (token) => {
        if(token === "Default Token"){
            setSelectedToken("Default Token");
            return;
        }
        if(token.token_id !== selectedToken.token_id){
            setSelectedToken(token);
        }
    }
    const [collapseAllRequest, setCollapseAllRequest] = React.useState(0);
    React.useEffect( () => {
        if(collapseTaskRequest[index] !== undefined){
            setCollapseAllRequest(collapseAllRequest + 1);
        }
    }, [collapseTaskRequest]);
    return (
        <MythicTabPanel index={index} value={value} >
            {!fetched && <LinearProgress color="primary" thickness={2} style={{paddingTop: "5px"}}/>}
            {loadingMore && <LinearProgress color="primary" thickness={2} style={{paddingTop: "5px"}}/>}
            <div style={{overflowY: "auto", flexGrow: 1, width: "100%"}} id={`taskingPanel${tabInfo.callbackID}`}>
                {!fetchedAllTasks &&
                    <MythicStyledTooltip tooltipStyle={{marginLeft: "50%"}} title="获取更早的任务">
                        <IconButton
                            onClick={loadMoreTasks}
                            variant="contained"
                            color="success"
                            size="large"><AutorenewIcon/></IconButton>
                    </MythicStyledTooltip>}
                {
                    taskingData.task.map((task) => (
                        <TaskDisplay key={"taskinteractdisplay" + task.id} me={me} task={task}
                                     command_id={task.command == null ? 0 : task.command.id}
                                     collapseAllRequest={collapseAllRequest}
                                     filterOptions={filterOptions} newlyIssuedTasks={newlyIssuedTasks.current}/>
                    ))
                }
                <div ref={messagesEndRef}/>
            </div>

            <CallbacksTabsTaskingInput filterTasks={true} me={me}
                                       onSubmitFilter={onSubmitFilter}
                                       onSubmitCommandLine={onSubmitCommandLine}
                                       changeSelectedToken={changeSelectedToken}
                                       filterOptions={filterOptions}
                                       focus={index === value}
                                       callback_id={tabInfo.callbackID}
                                       payloadtype_name={tabInfo.payloadtype}
                                       callback_os={tabInfo.os} parentMountedRef={mountedRef} />
        {openParametersDialog && 
            <MythicDialog fullWidth={true} maxWidth="lg" open={openParametersDialog} 
                onClose={()=>{setOpenParametersDialog(false);}} 
                innerDialog={<TaskParametersDialog command={commandInfo} callback_id={tabInfo.callbackID} 
                    payloadtype_id={tabInfo.payloadtype_id} operation_id={tabInfo.operation_id} 
                    onSubmit={submitParametersDialog} onClose={()=>{setOpenParametersDialog(false);}} 
                    />}
            />
        }
            
    </MythicTabPanel>
    );
}