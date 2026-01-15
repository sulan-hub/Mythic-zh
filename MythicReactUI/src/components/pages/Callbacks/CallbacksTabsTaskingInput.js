import { IconButton, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import React from 'react';
import {TextField} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {CallbacksTabsTaskingFilterDialog} from './CallbacksTabsTaskingFilterDialog';
import {CallbacksTabsTaskingInputTokenSelect} from './CallbacksTabsTaskingInputTokenSelect';
import { gql, useSubscription, useMutation } from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import {meState, operatorSettingDefaults} from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import { validate as uuidValidate } from 'uuid';
import {MythicSelectFromListDialog} from "../../MythicComponents/MythicSelectFromListDialog";
import { Backdrop } from '@mui/material';
import {CircularProgress} from '@mui/material';
import {getDynamicQueryParams} from "./TaskParametersDialogRow";
import {MythicAgentSVGIcon} from "../../MythicComponents/MythicAgentSVGIcon";
import {GetMythicSetting} from "../../MythicComponents/MythicSavedUserSetting";
import {getSkewedNow} from "../../utilities/Time";
import { useTheme } from '@mui/material/styles';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";

const GetLoadedCommandsSubscription = gql`
subscription GetLoadedCommandsSubscription($callback_id: Int!){
    loadedcommands(where: {callback_id: {_eq: $callback_id}}){
        id
        command {
            cmd
            id
            attributes
            payloadtype {
                name
                id
            }
            commandparameters {
                id
                parameter_type: type 
                choices
                dynamic_query_function
                required
                name
                ui_position
                parameter_group_name
                cli_name
                display_name
            }
        }
    }
}
`;
export const subscriptionCallbackTokens = gql`
subscription subscriptionCallbackTokens ($callback_id: Int!){
  callbacktoken(where: {deleted: {_eq: false}, callback_id: {_eq: $callback_id}}) {
    token {
      token_id
      id
      user
      description
    }
    id
  }
}
`;
const subscriptionTask = gql`
subscription tasksSubscription($callback_id: Int!){
    task_stream(batch_size: 100, cursor: {initial_value: {timestamp: "1970-01-01"}}, where: {callback_id: {_eq: $callback_id}, parent_task_id: {_is_null: true}}){
        id
        original_params
        display_params
        command_name
        comment
        tasking_location
        parameter_group_name
        status
        operator{
            username
        }
        command {
            cmd
            commandparameters {
                id
                type
                name
            }
            payloadtype {
                name
                use_display_params_for_cli_history
            }
        }
    }
}
`;
const contextSubscription = gql`
subscription CallbackMetadataForTasking($callback_id: Int!){
    callback_stream(batch_size: 1, cursor: {initial_value: {timestamp: "1970-01-01"}}, where: {id: {_eq: $callback_id} }){
        cwd
        impersonation_context
        extra_info
        host
        pid
        process_short_name
        user
        ip
        color
        integrity_level
        architecture
    }
}
`;
const GetUpDownArrowName = (task, useDisplayParamsForCLIHistoryUserSetting) => {
    if(task.command){
        if(task?.command?.payloadtype?.use_display_params_for_cli_history){
            if(useDisplayParamsForCLIHistoryUserSetting){
                return task.command.cmd + " " + task.display_params;
            }
            return task.command.cmd + " " + task.original_params;
        }
        return task.command.cmd + " " + task.original_params;
    } else {
        return task.command_name + " " + task.original_params;
    }
}
const GetCommandName = (task) => {
    if(task.command){
        return task.command.cmd;
    } else {
        return task.command_name;
    }
}
const GetDefaultValueForType = (parameter_type) => {
    switch(parameter_type){
        case "string":
            return "";
        case "typedArray":
        case "array":
            return [];
        case "number":
            return 0;
        case "boolean":
            return true;
        default:
            return undefined;
    }
}
const IsCLIPossibleParameterType = (parameter_type) => {
    switch(parameter_type){
        case "ChooseOne":
        case "ChooseOneCustom":
        case "Number":
        case "Boolean":
        case "Array":
        case "TypedArray":
        case "ChooseMultiple":
        case "String":
            return true;
        default:
            return false;
    }
}
const IsRepeatableCLIParameterType = (parameter_type) => {
    switch(parameter_type){
        case "Array":
        case "TypedArray":
        case "FileMultiple":
        case "ChooseMultiple":
            return true;
        default:
            return false;
    }
}

export function CallbacksTabsTaskingInputPreMemo(props){
    const toastId = "tasking-toast-message";
    const theme = useTheme();
    const inputRef = React.useRef(null);
    const snackMessageStyles = {position:"bottom-left", autoClose: 1000, toastId: toastId, style: {marginBottom: "30px"}};
    const snackReverseSearchMessageStyles = {position:"bottom-left", autoClose: 1000,  toastId: toastId, style: {marginBottom: "70px"}};
    const [commandPayloadType, setCommandPayloadType] = React.useState("");
    const [callbackContext, setCallbackContext] = React.useState({
        cwd: "",
        impersonation_context: "",
        extra_info: "",
        ip: "",
        host: "",
        user: "",
        pid: "",
        process_short_name: "",
        color: "",
        integrity_level: 2,
        architecture: "",
    });
    const [message, setMessage] = React.useState("");
    const loadedOptions = React.useRef([]);
    const taskOptions = React.useRef([]);
    const taskOptionsIndex = React.useRef(-1);
    const [filteredTaskOptions, setFilteredTaskOptions] = React.useState([]);
    const [backdropOpen, setBackdropOpen] = React.useState(false);
    const tabOptions = React.useRef([]);
    const tabOptionsIndex = React.useRef(-1);
    const tabOptionsType = React.useRef("param_name");
    const lastValueTypedBeforeDynamicParamsRef = React.useRef("");
    const [getDynamicParams] = useMutation(getDynamicQueryParams, {
        onCompleted: (data) => {
            if(data.dynamic_query_function.status === "success"){
                try{
                    if(data.dynamic_query_function.choices && data.dynamic_query_function.choices.length > 0){
                        const choices = data.dynamic_query_function.choices.filter( c => {
                            if(c.toLowerCase().includes(lastValueTypedBeforeDynamicParamsRef.current.toLowerCase())){
                                return c;
                            }
                        })
                        if ( choices.length === 0){
                            tabOptions.current = [];
                            tabOptionsType.current = "param_name";
                            if (lastValueTypedBeforeDynamicParamsRef.current === ""){
                                snackActions.info("没有可用选项", snackMessageStyles);
                            } else {
                                snackActions.info("没有可用选项匹配提供的数据", snackMessageStyles);
                            }
                            setBackdropOpen(false);
                            return;
                        }
                        tabOptions.current = choices;
                        tabOptionsIndex.current = 0;
                        let newChoice = choices[0].includes(" ") ? "\"" + choices[0] + "\"" : choices[0];
                        let newMsg = message.substring(0, message.length - lastValueTypedBeforeDynamicParamsRef.current.length) + newChoice;
                        setMessage(newMsg);
                        tabOptionsType.current = "param_value";
                    } else {
                        snackActions.warning("没有可用选项", snackMessageStyles);
                    }
                }catch(error){
                    console.log(error);
                    setBackdropOpen(false);
                    snackActions.warning("解析动态参数结果失败", snackMessageStyles);
                    tabOptions.current = [];
                    tabOptionsType.current = "param_name";
                }

            }else{
                snackActions.warning(data.dynamic_query_function.error, snackMessageStyles);
            }
            setBackdropOpen(false);
        },
        onError: (data) => {
            snackActions.warning("查询有效载荷类型容器选项失败", snackMessageStyles);
            console.log(data);
            setBackdropOpen(false);
        }
    });
    const [openFilterOptionsDialog, setOpenFilterOptionsDialog] = React.useState(false);
    const tokenOptions = React.useRef([]);
    const [activeFiltering, setActiveFiltering] = React.useState(false);
    const [unmodifiedHistoryValue, setUnmodifiedHistoryValue] = React.useState("parsed_cli");
    const [reverseSearching, setReverseSearching] = React.useState(false);
    const [reverseSearchString, setReverseSearchString] = React.useState('');
    const reverseSearchOptions = React.useRef([]);
    const reverseSearchIndex = React.useRef(-1);
    const mountedRef = React.useRef(true);
    const commandOptions = React.useRef([]);
    const commandOptionsForcePopup = React.useRef(false);
    const [openSelectCommandDialog, setOpenSelectCommandDialog] = React.useState(false);
    const me = useReactiveVar(meState);
    const useDisplayParamsForCLIHistoryUserSetting = React.useRef(GetMythicSetting({setting_name: "useDisplayParamsForCLIHistory", default_value: operatorSettingDefaults.useDisplayParamsForCLIHistory}));
    const hideTaskingContext = React.useRef(GetMythicSetting({setting_name: "hideTaskingContext", default_value: operatorSettingDefaults.hideTaskingContext}));
    hideTaskingContext.current = props.hide_context | hideTaskingContext.current;
    const taskingContextFields = React.useRef(GetMythicSetting({setting_name: "taskingContextFields", default_value: operatorSettingDefaults.taskingContextFields}));
    const forwardOrBackwardTabIndex = (event, currentIndex, options) => {
        if(event.shiftKey){
            let newIndex = currentIndex - 1;
            if (newIndex < 0 ){
                newIndex = options.length - 1;
            }
            return newIndex;
        } else {
            return (currentIndex + 1) % options.length;
        }
    }
    useSubscription(subscriptionCallbackTokens, {
        variables: {callback_id: props.callback_id}, fetchPolicy: "network-only",
        shouldResubscribe: true,
        onData: ({data}) => {
            if(!mountedRef.current || !props.parentMountedRef.current){
                return;
            }
            tokenOptions.current = data.data.callbacktoken;
            if(tokenOptions.current.length === 0) {
                props.changeSelectedToken("默认令牌");
            }
        }
      });
    useSubscription(contextSubscription, {
        variables: {callback_id: props.callback_id}, fetchPolicy: "network-only",
        shouldResubscribe: true,
        onData: ({data}) => {
            if(!mountedRef.current || !props.parentMountedRef.current){
                return;
            }
            let newContext = data.data.callback_stream[0];
            try{
                let ips = JSON.parse(newContext.ip);
                newContext.ip = ips[0];
            }catch(error){
                newContext.ip = "";
            }
            setCallbackContext(newContext);
        }
    });
    useSubscription(subscriptionTask, {
        variables: {callback_id: props.callback_id}, fetchPolicy: "network-only",
        shouldResubscribe: true,
        onData: ({data}) => {
            if(!mountedRef.current || !props.parentMountedRef.current){
                return;
            }
            const newTasks = data.data.task_stream.reduce( (prev, cur) => {
                let prevIndex = prev.findIndex(t => t.id === cur.id);
                if(prevIndex >= 0){
                    prev[prevIndex] = {...cur};
                    return [...prev];
                } else {
                    return [...prev, {...cur}];
                }
            }, [...taskOptions.current]);
            newTasks.sort((a,b) => a.id > b.id ? -1 : 1);
            taskOptions.current= newTasks;
            const filteredOptions = newTasks.filter( c => applyFilteringToTasks(c));
            setFilteredTaskOptions(filteredOptions);
        }
    });
    useSubscription(GetLoadedCommandsSubscription, {
        variables: {callback_id: props.callback_id}, fetchPolicy: "network-only",
        shouldResubscribe: true,
        onData: ({data}) => {
            if(!mountedRef.current || !props.parentMountedRef.current){
                return;
            }
            const cmds = data.data.loadedcommands.map( c => {
                let cmdData = {...c.command};
                cmdData.commandparameters.sort( (a,b) => a.ui_position > b.ui_position ? 1 : -1);
                return cmdData;
            })
            cmds.push({cmd: "help", description: "获取命令帮助或已加载命令信息", commandparameters: [], attributes: {supported_os: []}});
            cmds.push({cmd: "clear", description: "清除代理将获取的'已提交'作业", commandparameters: [], attributes: {supported_os: []}});
            cmds.sort((a,b) => a.cmd > b.cmd ? 1 : -1);
            loadedOptions.current = cmds;
        }
    });
    React.useEffect( () => {
        //console.log("过滤器已更新")
        const filteredOptions = taskOptions.current.filter( c => applyFilteringToTasks(c));
        setFilteredTaskOptions(filteredOptions);
        let active = false;
        if(props.filterOptions?.commandsList?.length > 0){
            active = true;
        } else if(props.filterOptions?.commentsFlag){
            active = true;
        } else if(props.filterOptions?.everythingButList?.length > 0){
            active = true;
        } else if(props.filterOptions?.hideErrors){
            active = true;
        } else if(props.filterOptions?.operatorsList?.length > 0){
            active = true;
        } else if(props.filterOptions?.parameterString !== ""){
            active = true;
        }
        setActiveFiltering(active);
    }, [props.filterOptions])
    React.useEffect( () => {
        return() => {
            mountedRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const applyFilteringToTasks = (task) => {
        if(!props.filterTasks){return false}
        if(task.display_params.includes("help") && task.operator.username !== me.user.username){
            return false;
          }
          if(props.filterOptions === undefined){
            return true;
          }
          if(props.filterOptions["operatorsList"]?.length > 0){
            if(!props.filterOptions["operatorsList"]?.includes(task.operator.username)){
              return false;
            }
          }
          if(props.filterOptions["commentsFlag"]){
            if(task.comment === ""){
              return false;
            }
          }
          if(props.filterOptions["commandsList"]?.length > 0){
            // 只显示这些命令
            if(!props.filterOptions["commandsList"]?.includes(GetCommandName(task))){
              return false;
            }
          }
          if(props.filterOptions["everythingButList"]?.length > 0){
            if(task.command !== null){
              if(props.filterOptions["everythingButList"]?.includes(GetCommandName(task))){
                return false;
              }
            }
          }
          if(props.filterOptions["parameterString"] !== ""){
            let regex = new RegExp(props.filterOptions["parameterString"]);
            if(!regex.test(task.display_params)){
              return false;
            }
          }
          return true;
    }
    const handleInputChange = (event) => {
        tabOptions.current = [];
        tabOptionsType.current = "param_name";
        tabOptionsIndex.current = 0;
        setMessage(event.target.value);
        if(event.target.value.length <= 1){
            setUnmodifiedHistoryValue("parsed_cli");
        }
    }
    const onKeyDown = (event) => {
        if(event.key === "Enter" && (event.ctrlKey || event.metaKey)){
            setMessage(message + "\n");
            return;
        }
        if(event.key === "r" && event.ctrlKey){
            // 这意味着他们输入了 ctrl+r，所以他们想要反向搜索命令
            setReverseSearching(true);
            setMessage("");
            setReverseSearchString("");
            setUnmodifiedHistoryValue("parsed_cli");
            setCommandPayloadType("");
            event.stopPropagation();
            event.preventDefault();
            return;
        }
        if(event.key === "Tab" || (event.key === " " && event.shiftKey )){
            // 如果我们仍在输入命令，我们希望这能循环遍历可能的匹配命令
            // 如果我们有一个命令，这应该循环遍历必需的参数名称
            event.stopPropagation();
            event.preventDefault();
            setUnmodifiedHistoryValue("parsed_cli");
            if(message.includes(" ")){
                // 这意味着我们不是在尝试帮助初始命令，因为用户输入中已经有一个空格
                // 首先找到相关命令
                let cmd = loadedOptions.current.filter( l => l.cmd === message.split(" ")[0]);
                if(!cmd || cmd.length === 0){
                    setCommandPayloadType("");
                    snackActions.warning("未知命令", snackMessageStyles);
                    return
                }
                if(commandPayloadType === ""){
                    // 默认情况下，尽可能使用与回调相同的有效载荷类型名称
                    let cmdOpts = cmd.find(c => c?.payloadtype?.name === props.payloadtype_name)
                    if(cmdOpts){
                        setCommandPayloadType(props.payloadtype_name);
                        cmd = cmdOpts;
                    } else {
                        setCommandPayloadType(cmd[0]?.payloadtype?.name || "");
                        cmd = cmd[0];
                    }

                } else {
                    cmd = cmd.find(c => c?.payloadtype?.name === commandPayloadType);
                    if(!cmd){
                        setCommandPayloadType("");
                        snackActions.warning("未知命令", snackMessageStyles);
                        return
                    }
                }
                //commandPayloadTypeRef.current = cmd.payloadtype.name;
                if(cmd.cmd === "help"){
                    // 有人在空白消息或部分单词上按了 tab
                    let helpCmd = message.split(" ");
                    if (helpCmd.length > 1) {
                        helpCmd = helpCmd[1];
                    } else {
                        helpCmd = "";
                    }
                    if(tabOptions.current.length === 0){
                        let opts = loadedOptions.current.filter( l => l.cmd.toLowerCase().startsWith(helpCmd.toLocaleLowerCase()) && (l.attributes.supported_os.length === 0 || l.attributes.supported_os.includes(props.callback_os)));
                        tabOptions.current = opts;
                        tabOptionsType.current = "param_name";
                        tabOptionsIndex.current = 0;
                        if(opts.length > 0){
                            setMessage("help " + opts[0].cmd);
                        }
                    }else{
                        let newIndex = forwardOrBackwardTabIndex(event, tabOptionsIndex.current, tabOptions.current);
                        tabOptionsIndex.current = newIndex;
                        setMessage("help " + tabOptions.current[newIndex].cmd);
                    }
                    return;
                }
                console.log(cmd.commandparameters);
                if(cmd.commandparameters.length > 0){
                    if(message[message.length -1] === " "){
                        // 有人在参数名称或参数值后按了 tab
                        const parsed = parseCommandLine(message, cmd);
                        if(parsed === undefined){
                            return;
                        }
                        const cmdGroupNames = determineCommandGroupName(cmd, parsed);
                        if(cmdGroupNames === undefined){
                            snackActions.warning("指定的两个或多个参数不能一起使用", snackMessageStyles);
                            return;
                        }
                        const [lastSuppliedParameter, lastSuppliedParameterHasValue] = getLastSuppliedArgument(cmd, message, parsed);
                        console.log("lastSuppliedParameter", lastSuppliedParameter, "has_value", lastSuppliedParameterHasValue);
                        lastValueTypedBeforeDynamicParamsRef.current = lastSuppliedParameterHasValue;
                        if (lastSuppliedParameter !== undefined && parsed[lastSuppliedParameter.cli_name] !== undefined && lastSuppliedParameterHasValue === ""){
                            if (lastSuppliedParameter.choices.length > 0){
                                const choices = lastSuppliedParameter.choices.filter( c => {
                                    if(c.toLowerCase().includes(lastValueTypedBeforeDynamicParamsRef.current.toLowerCase())){
                                        return c;
                                    }
                                })
                                tabOptions.current = choices;
                                tabOptionsIndex.current = 0;
                                tabOptionsType.current = "param_value";
                                let newChoice = choices[0].includes(" ") ? "\"" + choices[0] + "\"" : choices[0];
                                let newMsg = message.substring(0, message.length - lastValueTypedBeforeDynamicParamsRef.current.length) + newChoice;
                                setMessage(newMsg);
                                return;
                            } else if(lastSuppliedParameter.dynamic_query_function !== ""){
                                setBackdropOpen(true);
                                //snackActions.info("正在查询有效载荷类型容器以获取选项...", snackMessageStyles);
                                getDynamicParams({variables:{
                                        callback: props.callback_id,
                                        parameter_name: lastSuppliedParameter.name,
                                        command: cmd.cmd,
                                        payload_type: cmd.payloadtype.name
                                    }});
                                return;
                            }
                        }
                        console.log("tab 中的 cmdGroupNames", cmdGroupNames);
                        for(let i = 0; i < cmd.commandparameters.length; i++){
                            if(cmd.commandparameters[i]["required"] &&
                                (!(cmd.commandparameters[i]["cli_name"] in parsed) || (IsRepeatableCLIParameterType(cmd.commandparameters[i]["parameter_type"])) ) &&
                                IsCLIPossibleParameterType(cmd.commandparameters[i]["parameter_type"]) &&
                                (cmdGroupNames.includes(cmd.commandparameters[i]["parameter_group_name"]) || cmdGroupNames.length === 0)){
                                const newMsg = message.trim() + " -" + cmd.commandparameters[i]["cli_name"];
                                setMessage(newMsg);
                                return;
                            }
                        }
                        for(let i = 0; i < cmd.commandparameters.length; i++){
                            if(!cmd.commandparameters[i]["required"] &&
                                (!(cmd.commandparameters[i]["cli_name"] in parsed) || (IsRepeatableCLIParameterType(cmd.commandparameters[i]["parameter_type"])) ) &&
                                IsCLIPossibleParameterType(cmd.commandparameters[i]["parameter_type"]) &&
                                (cmdGroupNames.includes(cmd.commandparameters[i]["parameter_group_name"]) || cmdGroupNames.length === 0)){
                                const newMsg = message.trim() + " -" + cmd.commandparameters[i]["cli_name"];
                                setMessage(newMsg);
                                return;
                            }
                        }
                    }else{
                        // 有人在查看类似 `shell dj` 或 `shell -command` 的内容时按了 tab
                        // 所以，我们应该检查最后一个单词是否是 -CommandParameterName，如果是，确定其他参数来替换它
                        // 如果我们正在查看第一个选项，什么也不做，直到他们按空格
                        if(tabOptions.current.length > 0){
                            let newIndex = forwardOrBackwardTabIndex(event, tabOptionsIndex.current, tabOptions.current);
                            if(tabOptionsType.current === "param_name"){
                                tabOptionsIndex.current = newIndex;
                                let newMessage = message.split(" ").slice(0, -1).join(" ") + " -" + tabOptions.current[newIndex];
                                setMessage(newMessage);
                            }else if(tabOptionsType.current === "param_value"){
                                let oldChoice = tabOptions.current[tabOptionsIndex.current].includes(" ") ? "\"" + tabOptions.current[tabOptionsIndex.current] + "\"" : tabOptions.current[tabOptionsIndex.current];
                                let newChoice =tabOptions.current[newIndex].includes(" ") ? "\"" + tabOptions.current[newIndex] + "\"" : tabOptions.current[newIndex];
                                let newMessage = message.substring(0, message.length - oldChoice.length);
                                tabOptionsIndex.current = newIndex;
                                newMessage += newChoice;
                                setMessage(newMessage);
                            }
                            return;
                        }
                        const pieces = message.split(" ");
                        const lastFlag = pieces.slice(-1)[0];
                        // 判断我们看到的最后一项是否为标志
                        if(lastFlag.startsWith("-")){
                            // 我们看到的最后一项以 - 开头且末尾没有空格，因此将其视为可 tab 补全的命令参数
                            // 所以我们需要移除它并查看我们目前处理的是哪个组
                            const parsed = parseCommandLine(pieces.slice(0, -1).join(" "), cmd);
                            const cmdGroupNames = determineCommandGroupName(cmd, parsed);
                            if(cmdGroupNames === undefined){
                                snackActions.warning("指定的两个或多个参数不能一起使用", snackMessageStyles);
                                return;
                            }
                            // 判断我们是在 lastFlag 中查看一个有效的标志名称，还是仅仅是一个标志的开始
                            //console.log("交换参数名称，组选项：", cmdGroupNames);
                            let exactMatch = cmd.commandparameters.find(cur => 
                                cmdGroupNames.includes(cur.parameter_group_name) && 
                                cur.cli_name === lastFlag.slice(1) &&
                                IsCLIPossibleParameterType(cur.parameter_type) &&
                                (!(cur.cli_name in parsed) || (IsRepeatableCLIParameterType(cur.parameter_type)) )
                            );
                            let paramOptions = [];
                            if(exactMatch){
                                // 用户输入的内容或我们填写的内容与参数名称完全匹配
                                // 选项应该是该组中的所有参数，除了已解析中已提供的参数
                                paramOptions = cmd.commandparameters.reduce( (prev, cur) => {
                                    if(cmdGroupNames.includes(cur.parameter_group_name) && 
                                        cur.cli_name !== lastFlag.slice(1) &&
                                        IsCLIPossibleParameterType(cur.parameter_type) &&
                                        (!(cur.cli_name in parsed) || (IsRepeatableCLIParameterType(cur.parameter_type)) ) ){
                                        return [...prev, cur.cli_name];
                                    }else{
                                        return [...prev];
                                    }
                                }, []);
                                paramOptions.push(lastFlag.slice(1));
                            }else{
                                // 用户输入的内容不完全匹配，因此查找以他们尝试输入的内容开头的内容
                                paramOptions = cmd.commandparameters.reduce( (prev, cur) => {
                                    if(cmdGroupNames.includes(cur.parameter_group_name) && 
                                        cur.cli_name.toLowerCase().includes(lastFlag.slice(1).toLocaleLowerCase()) &&
                                        IsCLIPossibleParameterType(cur.parameter_type) &&
                                        (!(cur.cli_name in parsed) || (IsRepeatableCLIParameterType(cur.parameter_type)) ) ){
                                        return [...prev, cur.cli_name];
                                    }else{
                                        return [...prev];
                                    }
                                }, []);
                            }
                            paramOptions = paramOptions.reduce( (prev, cur) => {
                                if(prev.includes(cur)){
                                    return [...prev];
                                }else{
                                    return [...prev, cur];
                                }
                            }, [])
                            if(paramOptions.length > 0){
                                if(paramOptions.length === 1){
                                    tabOptions.current = [];
                                    tabOptionsType.current = "param_name";
                                    tabOptionsIndex.current = 0;
                                    let newMsg = pieces.slice(0,-1).join(" ") + " -" + paramOptions[0];
                                    setMessage(newMsg);
                                }else{
                                    tabOptions.current = paramOptions;
                                    tabOptionsType.current = "param_name";
                                    tabOptionsIndex.current = 0;
                                    let newMsg = pieces.slice(0,-1).join(" ") + " -" + paramOptions[0];
                                    setMessage(newMsg);
                                }
                                return;
                            }else{
                                snackActions.warning("未知参数名称", snackMessageStyles);
                                return;
                            }
                        }else{
                            // 最后一项不是以 - 开头，所以我们现在只是在查看文本，暂时什么也不做
                            const parsed = parseCommandLine(message, cmd);
                            if(parsed === undefined){
                                return;
                            }
                            const cmdGroupNames = determineCommandGroupName(cmd, parsed);
                            if(cmdGroupNames === undefined){
                                snackActions.warning("指定的两个或多个参数不能一起使用", snackMessageStyles);
                                return;
                            }
                            const [lastSuppliedParameter, lastSuppliedParameterHasValue] = getLastSuppliedArgument(cmd, message, parsed);
                            console.log("lastSuppliedParameter", lastSuppliedParameter)
                            lastValueTypedBeforeDynamicParamsRef.current = lastSuppliedParameterHasValue;
                            if (lastSuppliedParameter !== undefined && parsed[lastSuppliedParameter.cli_name] !== undefined){
                                if (lastSuppliedParameter.choices.length > 0){
                                    const choices = lastSuppliedParameter.choices.filter( c => {
                                        if(c.toLowerCase().includes(lastValueTypedBeforeDynamicParamsRef.current.toLowerCase())){
                                            return c;
                                        }
                                    })
                                    tabOptions.current = choices;
                                    tabOptionsIndex.current = 0;
                                    tabOptionsType.current = "param_value";
                                    let newChoice = choices[0].includes(" ") ? "\"" + choices[0] + "\"" : choices[0];
                                    let newMsg = message.substring(0, message.length - lastValueTypedBeforeDynamicParamsRef.current.length) + newChoice;
                                    setMessage(newMsg);
                                    return;
                                } else if(lastSuppliedParameter.dynamic_query_function !== ""){
                                    setBackdropOpen(true);
                                    //snackActions.info("正在查询有效载荷类型容器以获取选项...", snackMessageStyles);
                                    getDynamicParams({variables:{
                                            callback: props.callback_id,
                                            parameter_name: lastSuppliedParameter.name,
                                            command: cmd.cmd,
                                            payload_type: cmd.payloadtype.name
                                        }});
                                    return;
                                }
                            }
                            return;
                        }
                        
                    }
                    
                    snackActions.info("命令没有更多参数", snackMessageStyles);
                }else{
                    snackActions.info("命令没有参数", snackMessageStyles);
                }
                
            }else{
                // 有人在空白消息或部分单词上按了 tab
                if(tabOptions.current.length === 0){
                    let opts = loadedOptions.current.filter( l => l.cmd.toLowerCase().includes(message.toLocaleLowerCase()) && (l.attributes.supported_os.length === 0 || l.attributes.supported_os.includes(props.callback_os)));
                    tabOptionsType.current = "param_name";
                    tabOptionsIndex.current = 0;
                    let startsWithOpts = opts.filter(s => s.cmd.startsWith(message.toLocaleLowerCase()));
                    let includesOpts = opts.filter(s => {
                        for(let i = 0; i < startsWithOpts.length; i++){
                            if(startsWithOpts[i].cmd === s.cmd){
                                return false;
                            }
                        }
                        return true;
                    })
                    opts = [...startsWithOpts, ...includesOpts];
                    tabOptions.current = opts;
                    if(opts.length > 0){
                        setMessage(opts[0].cmd);
                        setCommandPayloadType(opts[0]?.payloadtype?.name || "");
                    }
                }else{
                    let newIndex = forwardOrBackwardTabIndex(event, tabOptionsIndex.current, tabOptions.current);
                    tabOptionsIndex.current = newIndex;
                    setMessage(tabOptions.current[newIndex].cmd);
                    setCommandPayloadType(tabOptions.current[newIndex]?.payloadtype?.name || "");
                }
            }
        }else if(event.key === "Enter"){
            if(event.shiftKey){
                onSubmitCommandLine(event, true);
            }else{
                onSubmitCommandLine(event, false);
            }
            
        }else if(event.key === "ArrowUp"){
            event.preventDefault();
            event.stopPropagation();
            if(filteredTaskOptions.length === 0){
                snackActions.warning("没有之前的任务", snackMessageStyles);
                return;
            }else{
                
                let newIndex = (taskOptionsIndex.current + 1);
                if(newIndex > filteredTaskOptions.length -1){
                    newIndex = filteredTaskOptions.length -1;
                }
                taskOptionsIndex.current = newIndex;
                setMessage(GetUpDownArrowName(filteredTaskOptions[newIndex], useDisplayParamsForCLIHistoryUserSetting.current));
                setUnmodifiedHistoryValue(filteredTaskOptions[newIndex].tasking_location);
                setCommandPayloadType(filteredTaskOptions[newIndex]?.command?.payloadtype?.name || "");
            }
        }else if(event.key === "ArrowDown"){
            if(filteredTaskOptions.length === 0){
                snackActions.warning("没有之前的任务", snackMessageStyles);
                return;
            }else{
                let newIndex = (taskOptionsIndex.current - 1);
                if(newIndex < 0){
                    newIndex = 0;
                }
                taskOptionsIndex.current = newIndex;
                setMessage(GetUpDownArrowName(filteredTaskOptions[newIndex], useDisplayParamsForCLIHistoryUserSetting.current));
                setUnmodifiedHistoryValue(filteredTaskOptions[newIndex].tasking_location);
                setCommandPayloadType(filteredTaskOptions[newIndex]?.command?.payloadtype?.name || "");
            }
        }else if(!event.shiftKey){
            tabOptions.current = [];
            tabOptionsType.current = "param_name";
            tabOptionsIndex.current = 0;
            if(taskOptionsIndex.current !== -1){
                taskOptionsIndex.current = -1;
            }
        }
        if(message === "" && tabOptions.current.length === 0){
            setCommandPayloadType("");
        }
    }
    const parseToArgv = (str) => {
        const res = [];

        if(!str || typeof str !== 'string') return res;

        let sQuoted = false;
        let dQuoted = false;
        let backslash = false;
        let buffer = '';

        str.split('').forEach((value, i, s) => {
            // 遍历字符串中的每个值
            //console.log(value);
            if( (sQuoted || dQuoted) && value === "\\"){
                if(!backslash){
                    backslash = true;
                    return;
                } else {
                    backslash = false;
                    buffer += "\\"
                    return;
                }
                
            }
            if(!sQuoted && !dQuoted){
                //console.log("未在单引号内且未在双引号内");
                if(value === `'`){
                    if(backslash){
                        backslash = false;
                        buffer += "'";
                        return;
                    }
                    sQuoted = true;
                    buffer += value;
                    return;
                }
                else if(value === '"'){
                    if(backslash){
                        backslash = false;
                        buffer += '"';
                        return;
                    }
                    dQuoted = true;
                    //console.log("现在在双引号内，跳过字符：", value);
                    buffer += value;
                    return;
                }
                else if(value === " "){
                    if(backslash){
                        backslash = false;
                        //buffer += " ";
                        buffer += "\\";
                        //return;
                    }
                    if(buffer.length > 0){
                        if(buffer[buffer.length-1] === buffer[0] && [`'`, `"`].includes(buffer[0])){
                            //console.log("为 buffer 剥离周围的 ' 或 \"", buffer)
                            res.push(buffer.slice(1, -1))
                        }else{
                            //console.log("不为 buffer 剥离", buffer);
                            res.push(buffer);
                        }
                        //console.log("推送到 buffer：", buffer);
                    }
                    buffer = '';
                    return;
                }
            }
            if(sQuoted && value === `'`){
                // 如果我们在显式单引号内并看到另一个单引号，那么我们就不再被引用了
                if(backslash){
                    buffer += "'";
                    backslash = false;
                    return;
                }
                sQuoted = false;
                if(buffer.length > 0 ){
                    buffer += value;
                }else{
                    buffer += value + value;
                }
                return;
            }
            if(dQuoted && value === `"`){
                if(backslash){
                    buffer += '"';
                    backslash = false;
                    return;
                }
                dQuoted = false;
                if(buffer.length > 0){
                    buffer += value;
                }else{
                    buffer += value + value;
                }
                return;
            }
            //console.log("添加到 buffer：", value);
            if(backslash){
                buffer += `\\${value}`;
                backslash = false;
            }else{
                buffer += value;
            }
            
        });
        if(backslash){
            buffer += "\\"; // 尝试处理末尾的 \
        }
        if(buffer.length > 0){
            //console.log("推送结束 buffer：", buffer);
            if(buffer[buffer.length-1] === buffer[0] && [`'`, `"`].includes(buffer[0])){
                //console.log("为 buffer 剥离周围的 ' 或 \"", buffer)
                res.push(buffer.slice(1, -1))
            }else{
                //console.log("不为 buffer 剥离", buffer);
                res.push(buffer);
            }
        }
        if(dQuoted) throw new SyntaxError('在查找匹配的双引号时出现意外的字符串结尾');
        if(sQuoted) throw new SyntaxError('在查找匹配的单引号时出现意外的字符串结尾');
        return res;
    }
    const parseArgvToDict = (argv, cmd) => {
        let stringArgs = [];
        let booleanArgs = [];
        let arrayArgs = [];
        let typedArrayArgs = [];
        let numberArgs = [];
        let fileArgs = [];
        let complexArgs = [];
        let allCLINames = [];
        for(let i = 0; i < cmd.commandparameters.length; i++){
            allCLINames.push("-" + cmd.commandparameters[i].cli_name);
            switch(cmd.commandparameters[i].parameter_type){
                case "ChooseOne":
                case "ChooseOneCustom":
                case "String":
                    stringArgs.push("-" + cmd.commandparameters[i].cli_name);
                    break;
                case "Number":
                    numberArgs.push("-" + cmd.commandparameters[i].cli_name);
                    break;
                case "Boolean":
                    booleanArgs.push("-" + cmd.commandparameters[i].cli_name);
                    break;
                case "Array":
                case "ChooseMultiple":
                    arrayArgs.push("-" + cmd.commandparameters[i].cli_name);
                    break;
                case "TypedArray":
                    typedArrayArgs.push("-" + cmd.commandparameters[i].cli_name);
                    break;
                case "File":
                    fileArgs.push("-" + cmd.commandparameters[i].cli_name);
                    break;
                default:
                    complexArgs.push("-" + cmd.commandparameters[i].cli_name);
            }
        }
        let result = {"_": []};
        let current_argument = "";
        let current_argument_type = "";
        for(let i = 0; i < argv.length; i++){
            let value = argv[i];
            if(current_argument === ""){
                // 当前没有在处理参数的值
                // 检查这是新参数的开始还是位置参数
                if(stringArgs.includes(value)){
                    current_argument_type = "string";
                    current_argument = value;
                    if(i === argv.length-1){
                        // 特殊情况，有人在命令末尾输入了 -flag
                        result[value.slice(1)] = GetDefaultValueForType(current_argument_type);
                    }
                }else if(booleanArgs.includes(value)){
                    current_argument_type = "boolean";
                    if(i === argv.length-1){
                        // 特殊情况，有人在命令末尾输入了 -flag
                        result[value.slice(1)] =  GetDefaultValueForType(current_argument_type);
                    }
                    current_argument = value;
                }else if(arrayArgs.includes(value)) {
                    current_argument_type = "array";
                    current_argument = value;
                    if(i === argv.length-1){
                        // 特殊情况，有人在命令末尾输入了 -flag
                        result[value.slice(1)] =  GetDefaultValueForType(current_argument_type);
                    }
                } else if(typedArrayArgs.includes(value)){
                    current_argument_type = "typedArray";
                    current_argument = value;
                    if(i === argv.length-1){
                        // 特殊情况，有人在命令末尾输入了 -flag
                        result[value.slice(1)] =  GetDefaultValueForType(current_argument_type);
                    }
                }else if(numberArgs.includes(value)) {
                    current_argument_type = "number";
                    current_argument = value;
                    if (i === argv.length - 1) {
                        // 特殊情况，有人在命令末尾输入了 -flag
                        result[value.slice(1)] =  GetDefaultValueForType(current_argument_type);
                    }
                }else if(fileArgs.includes(value)) {
                    current_argument_type = "file";
                    current_argument = value;
                    if (i === argv.length - 1) {
                        // 特殊情况，有人在命令末尾输入了 -flag
                        result[value.slice(1)] =  GetDefaultValueForType(current_argument_type);
                    }
                }else if(complexArgs.includes(value)){
                    current_argument_type = "complex";
                    current_argument = value;
                    if (i === argv.length - 1) {
                        // 特殊情况，有人在命令末尾输入了 -flag
                        result[value.slice(1)] =  GetDefaultValueForType(current_argument_type);
                    }
                } else {
                    // 我们没有将其作为命名参数，因此将其作为位置参数处理
                    result["_"].push(value);
                    current_argument = "";
                    current_argument_type = "";
                }
            } else {
                // 我们刚刚看到一个命名参数，因此将其解释为该参数的值
                if(allCLINames.includes(value)){
                    if(result[current_argument.slice(1)] === undefined) {
                        result[current_argument.slice(1)] = GetDefaultValueForType(current_argument_type);
                    }
                    current_argument = "";
                    current_argument_type = "";
                    i -= 1;
                    continue;
                }
                switch(current_argument_type){
                    case "string":
                        result[current_argument.slice(1)] = value;
                        current_argument = "";
                        current_argument_type = "";
                        break;
                    case "file":
                        if(uuidValidate(value)){
                            result[current_argument.slice(1)] = value;
                            current_argument = "";
                            current_argument_type = "";
                            break;
                        }
                        snackActions.warning("文件类型值必须是上传文件的UUID：" + value, snackMessageStyles);
                        return undefined;
                    case "boolean":
                        if(["false", "true"].includes(value.toLowerCase())){
                            if(value.toLowerCase() === "false"){
                                result[current_argument.slice(1)] = false;
                            } else {
                                result[current_argument.slice(1)] = true;
                            }
                        }else{
                            // 我们看到类似 `-flag bob` 的内容，因此将其解释为 `-flag true bob`
                            result[current_argument.slice(1)] = true;
                        }
                        current_argument = "";
                        current_argument_type = "";
                        break;
                    case "number":
                        try{
                            let num = Number(value);
                            if(isNaN(num)){
                                snackActions.warning("解析数字失败：" + value, snackMessageStyles);
                                return undefined;
                            }
                            result[current_argument.slice(1)] = num;
                        }catch(error){
                            snackActions.warning("解析数字失败：" + error, snackMessageStyles);
                            return undefined;
                        }
                        current_argument = "";
                        current_argument_type = "";
                        break;
                    case "typedArray":
                        // 在这种情况下，不仅仅是解析单个值那么简单
                        // 这将进行贪婪匹配，直到值匹配另一个命名参数
                        if(stringArgs.includes(value)){
                            current_argument_type = "string";
                            current_argument = value;
                        }else if(booleanArgs.includes(value)){
                            current_argument_type = "boolean";
                            current_argument = value;
                        }else if(arrayArgs.includes(value)){
                            current_argument_type = "typedArray";
                            current_argument = value;
                        }else if(numberArgs.includes(value)){
                            current_argument_type = "number";
                            current_argument = value;
                        } else {
                            if(result[current_argument.slice(1)] === undefined){
                                result[current_argument.slice(1)] = [["",value]];
                            } else {
                                result[current_argument.slice(1)].push( ["", value]);
                            }
                        }
                        break;
                    case "array":
                        // 在这种情况下，不仅仅是解析单个值那么简单
                        // 这将进行贪婪匹配，直到值匹配另一个命名参数
                        if(stringArgs.includes(value)){
                            current_argument_type = "string";
                            current_argument = value;
                        }else if(booleanArgs.includes(value)){
                            current_argument_type = "boolean";
                            current_argument = value;
                        }else if(arrayArgs.includes(value)){
                            current_argument_type = "array";
                            current_argument = value;
                        }else if(numberArgs.includes(value)){
                            current_argument_type = "number";
                            current_argument = value;
                        } else {
                            if(result[current_argument.slice(1)] === undefined){
                                result[current_argument.slice(1)] = [value]
                            } else {
                                result[current_argument.slice(1)].push(value);
                            }
                        }
                        break;
                    case "complex":
                        try{
                            result[current_argument.slice(1)] = JSON.parse(value);
                        }catch(error){
                            result[current_argument.slice(1)] = value;
                        }
                        current_argument = "";
                        current_argument_type = "";
                        break;
                    default:
                        break;
                }
            }
        };
        return result;
    }
    const getLastSuppliedArgument = (cmd, command_line, yargs) => {
        let new_command_line = command_line;
        let last_command_parameter = undefined;
        const argv = parseToArgv(new_command_line);
        let has_value = false;
        for(let i = argv.length-1; i >= 0; i --){
            for(let j = 0; j < cmd.commandparameters.length; j++){
                if(`-${cmd.commandparameters[j].cli_name}` === argv[i]){
                    last_command_parameter = cmd.commandparameters[j];
                    has_value = i !== argv.length -1;
                    return [last_command_parameter, has_value ? argv[argv.length-1] : ""];
                }
            }
        }
        return [last_command_parameter, has_value ? argv[argv.length-1] : ""];
    }
    const parseCommandLine = (command_line, cmd) => {
        // 给定一个命令行和关联的命令
        
        if(command_line.length > 0 && command_line[0] === "{"){
            try{
                let json_arguments = JSON.parse(command_line);
                json_arguments["_"] = [];
                return json_arguments;
            }catch(error){
                // 看起来像 JSON，但无法像 JSON 那样解析
                snackActions.warning("解析自定义 JSON 命令行失败：" + error, snackMessageStyles);
                return undefined;
            }
        }
        
        try{
            let new_command_line = command_line;//.replaceAll("\\", "\\\\");
            //console.log("new_command_line", new_command_line);
            const argv = parseToArgv(new_command_line);
            console.log("argv", argv, "command_line", new_command_line);
            const yargs_parsed = parseArgvToDict(argv, cmd);
            console.log("yargs_parsed", yargs_parsed);
            return yargs_parsed;
        }catch(error){
            snackActions.warning("解析命令行失败：" + error, snackMessageStyles);
            return undefined;
        }
    }
    const simplifyGroupNameChoices = (groupNames, cmd, parsed) => {
        // 对于 groupNames 中的每个选项，检查是否满足所有必需参数
        // 如果有 2 个以上的选项满足所有要求，那么我们不知道选择哪个
        // 如果有 1 个选项满足所有要求，而 1 个以上仍然需要更多，则选择第一个
        let finalGroupNames = [];
        for(let i = 0; i < groupNames.length; i++){
            let currentGroupName = groupNames[i];
            let foundAllRequired = true;
            for(let j = 0; j < cmd.commandparameters.length; j++){
                if(cmd.commandparameters[j]["parameter_group_name"] === currentGroupName){
                    if(cmd.commandparameters[j].required && (parsed[cmd.commandparameters[j].cli_name] === undefined &&
                    parsed[cmd.commandparameters[j].name] === undefined)){
                        foundAllRequired = false;
                    }
                }
            }
            if(foundAllRequired){
                finalGroupNames.push(currentGroupName);
            }
        }
        console.log(finalGroupNames)
        if(finalGroupNames.length === 0){
            return "";
        } else if(finalGroupNames.length === 1){
            return finalGroupNames[0];
        } else {
            return "";
        }
    }
    const determineCommandGroupName = (cmd, parsed) => {
        if(cmd.commandparameters.length === 0){
            return [];
        }
        if(!parsed){
            return [];
        }
        let cmdGroupOptions = cmd.commandparameters.reduce( (prev, cur) => {
            if(prev.includes(cur.parameter_group_name)){
                return [...prev];
            }
            return [...prev, cur.parameter_group_name];
        }, []);
        for(const key of Object.keys(parsed)){
            // 对于到目前为止解析出的所有内容，确定它们的参数组
            if( key !== "_"){
                // 目前我们暂时不关心位置参数
                let paramGroups = [];
                let foundParamGroup = false;
                for(let i = 0; i < cmd.commandparameters.length; i++){
                    //console.log(cmd.commandparameters[i], key)
                    if(cmd.commandparameters[i]["cli_name"] === key || cmd.commandparameters[i]["display_name"] === key || cmd.commandparameters[i]["name"] === key){
                        foundParamGroup = true;
                        paramGroups.push(cmd.commandparameters[i]["parameter_group_name"])
                    }
                }
                // 现在 paramGroups 包含与 `key` 关联的所有组名
                // 我们有一些可能的选项，因此需要找到 paramGroups 和 cmdGroupOptions 的交集
                //console.log(cmdGroupOptions, paramGroups)
                let intersection = cmdGroupOptions.reduce( (prev, cur) => {
                    if(paramGroups.includes(cur)){
                        return [...prev, cur];
                    }
                    return [...prev];
                }, [])
                if(intersection.length === 0){
                    // 这是一件坏事，我们进行了交集运算，但没有相似的参数组，但已经提供了参数
                    // 考虑到我们基本上提供了“额外”参数的情况 - 额外的参数不计入其中
                    if(foundParamGroup){
                        return undefined;
                    }
                } else {
                    cmdGroupOptions = [...intersection];
                }

            }
        }
        // 现在 cmdGroupOptions 是我们在命令行参数中指定的所有匹配的 parameter_group_names 的列表
        console.log("cmdGroupOptions", cmdGroupOptions)
        return cmdGroupOptions;
    }
    const fillOutPositionalArguments = (cmd, parsed, groupNames) => {
        let parsedCopy = {...parsed};
        parsedCopy["_"].shift(); // 从参数列表中移除命令名称。
        if(cmd.commandparameters.length === 0){
            return parsedCopy;
        }
        if(groupNames.length === 0){
            return parsedCopy;
        }
        let usedGroupName = groupNames[0];
        if(groupNames.includes("Default")){
            usedGroupName = "Default";
        }
        // 弄清楚如何处理位置参数
        const groupParameters = cmd.commandparameters.filter(c => c.parameter_group_name === usedGroupName);
        groupParameters.sort((a,b) => a.ui_position < b.ui_position ? -1 : 1);
        // 现在我们有了所有参数，并且它们按照 `ui_position` 排序
        console.log("groupParameters", groupParameters);
        let unSatisfiedArguments = [];
        for(let i = 0; i < groupParameters.length; i++){
            if( !(groupParameters[i]["cli_name"] in parsedCopy)){
                // 此参数尚未提供，进行跟踪
                unSatisfiedArguments.push(groupParameters[i]); 
            }
        }
        // 现在遍历不满足的参数并添加位置参数
        //console.log("unsatisfiedParameters", unSatisfiedArguments)
        for(let i = 0; i < unSatisfiedArguments.length; i++){
            // 我们提前一个中断，以便最后一个 unSatisifedArgument 可以对提供的其余部分进行贪婪匹配
            // 此参数尚未提供，检查 parsedCopy["_"] 中是否有任何位置参数
            if(parsedCopy["_"].length > 0){
                let temp = parsedCopy["_"].shift();
                switch(unSatisfiedArguments[i]["parameter_type"]){
                    case "ChooseOne":
                    case "ChooseOneCustom":
                    case "String":
                        parsedCopy[unSatisfiedArguments[i]["cli_name"]] = temp;
                        break;
                    case "Number":
                        try{
                            temp = Number(temp);
                            if(isNaN(temp)){
                                snackActions.warning("解析数字失败：" + temp, snackMessageStyles);
                                return undefined;
                            }
                            parsedCopy[unSatisfiedArguments[i]["cli_name"]] = temp;
                        }catch(error){
                            snackActions.warning("解析数字失败：" + error, snackMessageStyles);
                            return undefined;
                        }
                        break;
                    case "Boolean":
                        if(temp.toLowerCase() === "false"){
                            parsedCopy[unSatisfiedArguments[i]["cli_name"]] = false;
                        } else if(temp.toLowerCase() === "true"){
                            parsedCopy[unSatisfiedArguments[i]["cli_name"]] = true;
                        } else {
                            snackActions.warning("解析布尔值失败：" + temp, snackMessageStyles);
                            return undefined;
                        }
                        break;
                    case "Array":
                    case "TypedArray":
                    case "FileMultiple":
                    case "ChooseMultiple":
                        if(parsedCopy[unSatisfiedArguments[i]["cli_name"]]){
                            parsedCopy[unSatisfiedArguments[i]["cli_name"]].push(temp);
                        } else {
                            parsedCopy[unSatisfiedArguments[i]["cli_name"]] = [temp];
                        }
                        i -= 1;
                        break;
                    default:
                        parsedCopy[unSatisfiedArguments[i]["cli_name"]] = temp;
                        break;
                }
            } else {
                break;
            }
        }
        //console.log("已填充不满足参数，但仍有参数", JSON.parse(JSON.stringify(parsedCopy)))
        if(unSatisfiedArguments.length > 0 && parsedCopy["_"].length > 0){
            //parsedCopy["_"] = parsedCopy["_"].map( c => typeof(c) === "string" && c.includes(" ") ? "\"" + c + "\"" : c);
            let temp = ""; //parsedCopy["_"].join(" ");
            // 我们需要在重新连接时保留内部引号（如果它们存在）
            let negativeIndex = message.length;
            for(let pci = parsedCopy["_"].length -1; pci >= 0; pci--){
                let startIndex = message.lastIndexOf(parsedCopy["_"][pci], negativeIndex);
                // 现在检查 startIndex -1 是否为 ' 或 "，以及 startIndex + parsedCopy["_"][pci].length + 1 是否为 ' 或 "
                negativeIndex = startIndex - 1; // 更新 negativeIndex 以进一步移动
                if(message[startIndex-1] === "'"){
                    if(startIndex + parsedCopy["_"][pci].length + 1 < message.length){
                        if(message[startIndex + parsedCopy["_"][pci].length + 1] === "'"){
                            temp = "'" + parsedCopy["_"][pci] + "' " + temp;
                        }
                    }else{
                        console.log("引号不匹配？", message[startIndex-1], message[startIndex + parsedCopy["_"][pci].length + 1])
                    }
                }else if(message[startIndex -1] === '"'){
                    if(startIndex + parsedCopy["_"][pci].length  < message.length){
                        if(message[startIndex + parsedCopy["_"][pci].length ] === '"'){
                            temp = '"' + parsedCopy["_"][pci] + '" ' + temp;
                        }
                    }else{
                        console.log("引号不匹配？", message[startIndex-1], message[startIndex + parsedCopy["_"][pci].length ])
                    }
                }else{
                    temp = parsedCopy["_"][pci] + " " + temp;
                }
                temp = temp.trim();
            }
            switch(unSatisfiedArguments[unSatisfiedArguments.length -1]["parameter_type"]){
                case "ChooseOne":
                case "ChooseOneCustom":
                case "String":
                    parsedCopy[unSatisfiedArguments[unSatisfiedArguments.length -1]["cli_name"]] += " " + temp;
                    break;
                case "Number":
                    try{
                        temp = Number(temp);
                        if(isNaN(temp)){
                            snackActions.warning("解析数字失败：" + temp, snackMessageStyles);
                            return undefined;
                        }
                        parsedCopy[unSatisfiedArguments[unSatisfiedArguments.length -1]["cli_name"]] = temp;
                    }catch(error){
                        snackActions.warning("解析数字失败：" + error, snackMessageStyles);
                        return undefined;
                    }
                    break;
                case "Boolean":
                    if(temp.toLowerCase() === "false"){
                        parsedCopy[unSatisfiedArguments[unSatisfiedArguments.length -1]["cli_name"]] = false;
                    } else if(temp.toLowerCase() === "true"){
                        parsedCopy[unSatisfiedArguments[unSatisfiedArguments.length -1]["cli_name"]] = true;
                    } else {
                        snackActions.warning("解析布尔值失败：" + temp, snackMessageStyles);
                        return undefined;
                    }
                    break;
                case "Array":
                case "TypedArray":
                case "FileMultiple":
                case "ChooseMultiple":
                    parsedCopy[unSatisfiedArguments[unSatisfiedArguments.length -1]["cli_name"]] =
                        [parsedCopy[unSatisfiedArguments[unSatisfiedArguments.length -1]["cli_name"]], ...parsedCopy["_"]];
                    break;
                default:
                    parsedCopy[unSatisfiedArguments[unSatisfiedArguments.length -1]["cli_name"]] = temp;
                    break;
            }
            parsedCopy["_"] = [];
        }
        
        return parsedCopy;

    }
    const processCommandAndCommandLine = (cmd) => {
        if(commandOptionsForcePopup.current && cmd.commandparameters.length === 0){
            snackActions.info(cmd?.cmd + "（" + cmd?.payloadtype?.name + "）没有定义参数，因此没有可用模态框", snackMessageStyles);
            return;
        }
        let splitMessage = message.trim().split(" ");
        let cmdGroupName = ["Default"];
        let parsedWithPositionalParameters = {};
        let params = splitMessage.slice(1).join(" ");
        let failed_json_parse = true;
        try{
            parsedWithPositionalParameters = JSON.parse(params);
            if(['string', 'number', 'boolean', null].includes(typeof parsedWithPositionalParameters)){
                throw("解析 json 失败");
            }
            cmdGroupName = determineCommandGroupName(cmd, parsedWithPositionalParameters);
            if(cmdGroupName !== undefined){
                cmdGroupName.sort()
            } else {
                snackActions.warning("指定的两个或多个参数不能一起使用", snackMessageStyles);
                return;
            }
            failed_json_parse = false;

        }catch(error){
            failed_json_parse = true;
        }
        if(failed_json_parse){
            let parsed = parseCommandLine(params, cmd);
            //console.log("parseCommandLine 的结果", parsed, !parsed)
            if(parsed === undefined){
                return;
            }
            parsed = {...parsed};
            //console.log(message, parsed);
            cmdGroupName = determineCommandGroupName(cmd, parsed);
            if(cmdGroupName !== undefined){
                cmdGroupName.sort();
            } else {
                snackActions.warning("指定的两个或多个参数不能一起使用", snackMessageStyles);
                return;
            }

            if(cmd.commandparameters.length > 0){
                parsed["_"].unshift(cmd);
                parsedWithPositionalParameters = fillOutPositionalArguments(cmd, parsed, cmdGroupName);
                console.log("剩下什么", parsedWithPositionalParameters);
                if(parsedWithPositionalParameters === undefined){
                    return;
                }
                if(parsedWithPositionalParameters["_"].length > 0){
                    snackActions.warning("提供了太多的位置参数。你是想引用其中一些吗？", snackMessageStyles);
                    return;
                }
            }else{
                parsedWithPositionalParameters = parsed;
            }
        }
        if(cmdGroupName === undefined){
            snackActions.warning("指定的两个或多个参数不能一起使用", snackMessageStyles);
            return;
        }else if(cmdGroupName.length > 1){
            if(Boolean(commandOptionsForcePopup.current)){
                props.onSubmitCommandLine(message, cmd, parsedWithPositionalParameters, Boolean(commandOptionsForcePopup.current), cmdGroupName, unmodifiedHistoryValue);
            }else{
                if(cmdGroupName.includes("Default")){
                    props.onSubmitCommandLine(message, cmd, parsedWithPositionalParameters, Boolean(commandOptionsForcePopup.current), ["Default"], unmodifiedHistoryValue);
                }else{
                    let simplifiedGroupName = simplifyGroupNameChoices(cmdGroupName, cmd, parsedWithPositionalParameters)
                    if(simplifiedGroupName === "" ){
                        props.onSubmitCommandLine(message, cmd, parsedWithPositionalParameters, true, cmdGroupName, unmodifiedHistoryValue)
                    } else {
                        props.onSubmitCommandLine(message, cmd, parsedWithPositionalParameters, Boolean(commandOptionsForcePopup.current), [simplifiedGroupName], unmodifiedHistoryValue);
                    }
                }
            }
            setMessage("");
            setCommandPayloadType("");
            taskOptionsIndex.current = -1;
            reverseSearchIndex.current = -1;
            setReverseSearching(false);
            setUnmodifiedHistoryValue("parsed_cli");
            return;
        }
        console.log("已添加位置参数：", parsedWithPositionalParameters);
        console.log("即将调用 onSubmitCommandLine", cmd);
        console.log("commandOptionsForcePopup", Boolean(commandOptionsForcePopup.current), "组名", cmdGroupName)
        props.onSubmitCommandLine(message, cmd, parsedWithPositionalParameters, Boolean(commandOptionsForcePopup.current), cmdGroupName, unmodifiedHistoryValue);
        setMessage("");
        setCommandPayloadType("");
        taskOptionsIndex.current = -1;
        reverseSearchIndex.current = -1;
        setReverseSearching(false);
        setUnmodifiedHistoryValue("parsed_cli");
    }
    const onSubmitCommandLine = (evt, force_parsed_popup) => {
        evt.preventDefault();
        evt.stopPropagation();
        //console.log("onSubmitCommandLine", evt, message);
        let splitMessage = message.trim().split(" ");
        let cmd = loadedOptions.current.filter( l => l.cmd === splitMessage[0]);
        if(cmd === undefined || cmd.length === 0){
            snackActions.warning("未知（或未加载）命令", snackMessageStyles);
            return;
        }
        commandOptionsForcePopup.current = force_parsed_popup;
        if(cmd.length === 1){
            processCommandAndCommandLine(cmd[0], force_parsed_popup)
            return;
        }
        if(commandPayloadType !== ""){
            cmd = cmd.find(c => c.payloadtype.name === commandPayloadType);
            if(cmd === undefined){
                snackActions.warning("未知（或未加载）命令", snackMessageStyles);
                return;
            }
            processCommandAndCommandLine(cmd, force_parsed_popup)
            return;
        }
        // 两个或多个命令共享相同的名称，我们需要在它们之间消除歧义
        cmd = cmd.map( c => {return {...c, display: `${c.cmd} (${c.payloadtype.name})`}});
        commandOptions.current = cmd;
        setOpenSelectCommandDialog(true);
    }
    const onClickFilter = () => {
        setOpenFilterOptionsDialog(true);
    }
    const handleReverseSearchInputChange = (event) => {
        setReverseSearchString(event.target.value);
        if(event.target.value.length === 0){
            setMessage("");
            setCommandPayloadType("");
            reverseSearchOptions.current = [];
            reverseSearchIndex.current = 0;
            return;
        }
        // 需要在 taskOptions 中进行反向 i 搜索
        const lowerCaseTextSearch = event.target.value.toLowerCase();
        const matchingOptions = taskOptions.current.filter( x => (GetCommandName(x) + x.original_params).toLowerCase().includes(lowerCaseTextSearch));
        const filteredMatches = matchingOptions.filter( x => applyFilteringToTasks(x))
        reverseSearchOptions.current = filteredMatches;
        if(filteredMatches.length > 0){
            setMessage(GetCommandName(filteredMatches[0]) + " " + filteredMatches[0].original_params);
            setCommandPayloadType(filteredMatches[0]?.command?.payloadtype?.name || "");
        }
    }
    const onReverseSearchKeyDown = (event) => {
        if(event.key === "Escape"){
            setReverseSearching(false);
            reverseSearchIndex.current = 0;
            reverseSearchOptions.current=[];
        }else if(event.key === "Tab"){
            setReverseSearching(false);
            reverseSearchIndex.current = 0;
            reverseSearchOptions.current=[];
        }else if(event.key === "Enter"){
            setReverseSearching(false);
            reverseSearchIndex.current = 0;
            reverseSearchOptions.current=[];
            onSubmitCommandLine(event);
        }else if(event.key === "ArrowUp"){
            // 通过递增 reverseSearchIndex 在 reverseSearchOptions 中向上移动
            // 将 Message 设置为该值
            if(reverseSearchOptions.current.length === 0){
                snackActions.warning("没有匹配的选项", snackReverseSearchMessageStyles);
                return;
            }else{
                let newIndex = (reverseSearchIndex.current + 1);
                if(newIndex > reverseSearchOptions.current.length -1){
                    newIndex = reverseSearchOptions.current.length -1;
                }
                reverseSearchIndex.current = newIndex;
                setMessage(GetUpDownArrowName(reverseSearchOptions.current[newIndex], useDisplayParamsForCLIHistoryUserSetting.current));
                setUnmodifiedHistoryValue(reverseSearchOptions.current[newIndex].tasking_location);
                setCommandPayloadType(reverseSearchOptions.current[newIndex]?.command?.payloadtype?.name || "");
            }
        }else if(event.key === "ArrowDown"){
            // 通过递减 reverseSearchIndex 在 reverseSearchOptions 中向下移动
            // 将 Message 设置为该值
            if(reverseSearchOptions.current.length === 0){
                snackActions.warning("没有匹配的选项", snackReverseSearchMessageStyles);
                return;
            }else{
                let newIndex = (reverseSearchIndex.current - 1);
                if(newIndex < 0){
                    newIndex = 0;
                }
                reverseSearchIndex.current = newIndex;
                setMessage(GetUpDownArrowName(reverseSearchOptions.current[newIndex], useDisplayParamsForCLIHistoryUserSetting.current));
                setUnmodifiedHistoryValue(reverseSearchOptions.current[newIndex].tasking_location);
                setCommandPayloadType(reverseSearchOptions.current[newIndex]?.command?.payloadtype?.name || "");
            }
        }else if(event.key === "r" && event.ctrlKey){
            // 这意味着他们输入了 ctrl+r，所以他们想要反向搜索命令
            setReverseSearching(false);
            event.stopPropagation();
            event.preventDefault();
        }
    }
    React.useEffect( () => {
        if(inputRef.current){
            inputRef.current.focus();
        }
    }, [props.focus])
    return (
        <div style={{position: "relative"}}>
            {backdropOpen && <Backdrop open={backdropOpen} style={{zIndex: 2, position: "absolute"}} invisible={false}>
                <CircularProgress color="inherit" size={30}/>
            </Backdrop>
            }
            {reverseSearching &&
                <TextField
                    placeholder={"搜索之前的命令"}
                    onKeyDown={onReverseSearchKeyDown}
                    onChange={handleReverseSearchInputChange}
                    size="small"
                    color={"secondary"}
                    autoFocus={true}
                    variant="outlined"
                    value={reverseSearchString}
                    fullWidth={true}
                    InputProps={{
                        type: 'search',
                        startAdornment: <React.Fragment><Typography
                            style={{width: "10%"}}>反向-i-搜索：</Typography></React.Fragment>
                    }}
                />
            }
            {callbackContext?.impersonation_context !== "" && !hideTaskingContext.current && taskingContextFields.current.includes("impersonation_context") &&
                <MythicStyledTooltip title={"模拟上下文"}>
                    <span className={"rounded-tab"} style={{
                        backgroundColor: theme.taskContextImpersonationColor,
                        borderColor: callbackContext.color === "" ? "" : callbackContext.color
                    }}>
                        <b>{"用户："}</b>{callbackContext.impersonation_context}
                    </span>
                </MythicStyledTooltip>

            }
            {callbackContext?.user !== "" && !hideTaskingContext.current && taskingContextFields.current.includes("user") &&
                <MythicStyledTooltip title={"用户上下文" + (callbackContext.integrity_level > 2 ? "（高完整性）" : "")}>
                    <span className={"rounded-tab"} style={{
                        backgroundColor: theme.taskContextColor,
                        borderColor: callbackContext.color === "" ? "" : callbackContext.color
                    }}>
                        <b>{"用户："}</b>{callbackContext.user}{callbackContext.integrity_level > 2 ? "*" : ""}
                    </span>
                </MythicStyledTooltip>
            }
            {callbackContext?.cwd !== "" && !hideTaskingContext.current && taskingContextFields.current.includes("cwd") &&
                <MythicStyledTooltip title={"当前工作目录"}>
                    <span className={"rounded-tab"} style={{
                        backgroundColor: theme.taskContextColor,
                        borderColor: callbackContext.color === "" ? "" : callbackContext.color
                    }}>
                        <b>{"目录："}</b>{callbackContext.cwd}
                    </span>
                </MythicStyledTooltip>
            }
            {callbackContext?.host !== "" && !hideTaskingContext.current && taskingContextFields.current.includes("host") &&
                <MythicStyledTooltip title={"主机名"}>
                    <span className={"rounded-tab"} style={{
                        backgroundColor: theme.taskContextColor,
                        borderColor: callbackContext.color === "" ? "" : callbackContext.color
                    }}>
                        <b>{"主机："}</b>{callbackContext.host}
                    </span>
                </MythicStyledTooltip>
            }
            {callbackContext?.ip !== "" && !hideTaskingContext.current && taskingContextFields.current.includes("ip") &&
                <MythicStyledTooltip title={"第一个 IP 地址"}>
                    <span className={"rounded-tab"} style={{
                        backgroundColor: theme.taskContextColor,
                        borderColor: callbackContext.color === "" ? "" : callbackContext.color
                    }}>
                        <b>{"IP："}</b>{callbackContext.ip}
                    </span>
                </MythicStyledTooltip>
            }
            {callbackContext?.pid !== "" && !hideTaskingContext.current && taskingContextFields.current.includes("pid") &&
                <MythicStyledTooltip title={"进程 ID"}>
                    <span className={"rounded-tab"} style={{
                        backgroundColor: theme.taskContextColor,
                        borderColor: callbackContext.color === "" ? "" : callbackContext.color
                    }}>
                        <b>{"PID："}</b>{callbackContext.pid}
                    </span>
                </MythicStyledTooltip>
            }
            {callbackContext?.architecture !== "" && !hideTaskingContext.current && taskingContextFields.current.includes("architecture") &&
                <MythicStyledTooltip title={"进程架构"}>
                    <span className={"rounded-tab"} style={{
                        backgroundColor: theme.taskContextColor,
                        borderColor: callbackContext.color === "" ? "" : callbackContext.color
                    }}>
                        <b>{"架构："}</b>{callbackContext.architecture}
                    </span>
                </MythicStyledTooltip>
            }
            {callbackContext?.process_short_name !== "" && !hideTaskingContext.current && taskingContextFields.current.includes("process_short_name") &&
                <MythicStyledTooltip title={"进程名称"}>
                    <span className={"rounded-tab"} style={{
                        backgroundColor: theme.taskContextColor,
                        borderColor: callbackContext.color === "" ? "" : callbackContext.color
                    }}>
                        <b>{"进程："}</b>{callbackContext.process_short_name}
                    </span>
                </MythicStyledTooltip>
            }
            {callbackContext?.extra_info !== "" && !hideTaskingContext.current && taskingContextFields.current.includes("extra_info") &&
                <MythicStyledTooltip title={"额外回调上下文"}>
                    <span className={"rounded-tab"} style={{
                        backgroundColor: theme.taskContextExtraColor,
                        borderColor: callbackContext.color === "" ? "" : callbackContext.color
                    }}>
                        {callbackContext.extra_info}
                    </span>
                </MythicStyledTooltip>
            }
            <TextField
                placeholder={"向代理下达任务..."}
                onKeyDown={onKeyDown}
                onChange={handleInputChange}
                size="small"
                color={"secondary"}
                variant="outlined"
                multiline={true}
                maxRows={15}
                disabled={reverseSearching}
                value={message}
                autoFocus={true}
                fullWidth={true}
                inputRef={inputRef}
                style={{marginBottom: "0px", marginTop: "0px", paddingTop: "0px"}}
                InputProps={{
                    type: 'search',
                    spellCheck: false,
                    autoFocus: true,
                    style: {paddingTop: "0px", paddingBottom: "0px", paddingRight: "5px"},
                    endAdornment:
                        <React.Fragment>
                            <IconButton
                                color="info"
                                variant="contained"
                                disableRipple={true}
                                disableFocusRipple={true}
                                onClick={onSubmitCommandLine}
                                size="large"><SendIcon/>
                            </IconButton>
                            {props.filterTasks &&
                                <IconButton
                                    color={activeFiltering ? "warning" : "secondary"}
                                    variant="contained"
                                    onClick={onClickFilter}
                                    style={{paddingLeft: 0}}
                                    disableRipple={true}
                                    disableFocusRipple={true}
                                    size="large"><TuneIcon/></IconButton>
                            }
                            {commandPayloadType !== "" &&
                                <MythicAgentSVGIcon payload_type={commandPayloadType}
                                                    style={{width: "35px", height: "35px"}}/>
                            }
                        </React.Fragment>
                    ,
                    startAdornment: <React.Fragment>
                        {tokenOptions.current.length > 0 ? (
                            <CallbacksTabsTaskingInputTokenSelect options={tokenOptions.current}
                                                                  changeSelectedToken={props.changeSelectedToken}/>
                        ) : null}

                    </React.Fragment>

                }}
            />
            {openFilterOptionsDialog &&
                <MythicDialog fullWidth={true} maxWidth="md" open={openFilterOptionsDialog}
                              onClose={() => {
                                  setOpenFilterOptionsDialog(false);
                              }}
                              innerDialog={<CallbacksTabsTaskingFilterDialog
                                  filterCommandOptions={loadedOptions.current} onSubmit={props.onSubmitFilter}
                                  filterOptions={props.filterOptions} onClose={() => {
                                  setOpenFilterOptionsDialog(false);
                              }}/>}
                />
            }
            {openSelectCommandDialog &&
                <MythicDialog fullWidth={true} maxWidth="md" open={openSelectCommandDialog}
                              onClose={() => {
                                  setOpenSelectCommandDialog(false)
                              }}
                              innerDialog={<MythicSelectFromListDialog onClose={() => {
                                  setOpenSelectCommandDialog(false);
                              }}
                           onSubmit={processCommandAndCommandLine}
                           options={commandOptions.current}
                           title={"选择命令"}
                           action={"select"} identifier={"id"}
                           display={"display"}/>}
                />
            }
        </div>
    );
}

export const CallbacksTabsTaskingInput = React.memo(CallbacksTabsTaskingInputPreMemo);