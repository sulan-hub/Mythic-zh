import React, {useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {TaskParametersDialogRow} from './TaskParametersDialogRow';
import {gql, useLazyQuery, useMutation, useQuery} from '@apollo/client';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Input from '@mui/material/Input';
import {UploadTaskFile} from '../../MythicComponents/MythicFileUpload';
import {Backdrop, CircularProgress} from '@mui/material';
import Divider from '@mui/material/Divider';
import {b64DecodeUnicode} from './ResponseDisplay';
import {snackActions} from "../../utilities/Snackbar";

// 如果需要获取回调的所有已加载命令并进行筛选，使用此查询
const GetLoadedCommandsQuery = gql`
query GetLoadedCommandsQuery($callback_id: Int!) {
  loadedcommands(where: {callback_id: {_eq: $callback_id}}) {
    id
    command {
      cmd
      attributes
      id
    }
  }
}
`;
// 如果需要获取特定载荷类型的所有可能命令并进行筛选，使用此查询
const getAllCommandsQuery = gql`
query getAllCommandsQuery($payload_type_id: Int!){
    command(where: {payload_type_id: {_eq: $payload_type_id}, deleted: {_eq: false}}) {
        attributes
        cmd
        id
    }
}
`;
// 如果需要获取回调的所有可能边，使用此查询
const getAllEdgesQuery = gql`
query getAllEdgesQuery($callback_id: Int!){
    callbackgraphedge(where: {_or: [{source_id:{_eq: $callback_id}}, {destination_id: {_eq: $callback_id}}]}) {
        id
        c2profile {
          id
          name
        }
        destination{
            agent_callback_id
            host
            id
            display_id
            payload {
              id
              uuid
            }
            c2profileparametersinstances {
              enc_key_base64
              dec_key_base64
              value
              id
              c2_profile_id
              c2profileparameter {
                crypto_type
                name
                id
              }
            }
        }
        source{
            agent_callback_id
            host
            id
            display_id
            payload {
              uuid
              id
            }
            c2profileparametersinstances {
              enc_key_base64
              dec_key_base64
              c2_profile_id
              value
              id
              c2profileparameter {
                crypto_type
                name
                id
              }
            }
        }
        end_timestamp
      }
    }
`;
// 获取所有载荷的查询
const getAllPayloadsQuery = gql`
query getAllPayloadsQuery($operation_id: Int!){
    payload(where: {deleted: {_eq: false}, build_phase: {_eq: "success"}, operation_id: {_eq: $operation_id}}, order_by: {id: desc}) {
    id
    description
    uuid
    payloadc2profiles {
      id
      c2profile {
        name
        id
        is_p2p
      }
    }
    payloadtype{
        id
        name
    }
    filemetum {
        id
        filename_text
        timestamp
    }
    buildparameterinstances {
      value
      id
      buildparameter {
        name
        parameter_type
        id
      }
    }
  }
}
`;
// 获取主机上所有载荷的查询
const getAllPayloadsOnHostsQuery = gql`
query getAllPayloadsOnHostsQuery($operation_id: Int!){
    payloadonhost(where: {deleted: {_eq: false}, operation_id: {_eq: $operation_id}, payload: {c2profileparametersinstances: {c2profile: {is_p2p: {_eq: true}}}}}, order_by: {id: desc}) {
        host
        id
        payload {
            auto_generated
            id
            operation_id
            description
            filemetum {
                filename_text
                id
            }
            uuid
            c2profileparametersinstances(where: {c2profile: {is_p2p: {_eq: true}}}) {
                c2profile {
                    name
                    id
                }
                c2profileparameter {
                    crypto_type
                    name
                    id
                }
                value
                enc_key_base64
                dec_key_base64
                id
            }
        }
    }
    callback(where: {active: {_eq: true}, operation_id: {_eq: $operation_id}, c2profileparametersinstances: {c2profile: {is_p2p: {_eq: true}}}}){
        agent_callback_id
        host
        id
        display_id
        description
        crypto_type
        payload {
            auto_generated
            id
            description
            filemetum {
                filename_text
                id
            }
            uuid
        }
        c2profileparametersinstances(where: {c2profile: {is_p2p: {_eq: true}}}) {
            c2profile {
                name
                id
            }
            c2profileparameter {
                crypto_type
                name
                id
            }
            value
            enc_key_base64
            dec_key_base64
            id
        }
    }
}
`;
// 用于在主机上添加载荷的变更
const addPayloadOnHostMutation = gql`
    mutation addPayloadOnHostMutation($host: String!, $payload_id: Int!){
        insert_payloadonhost_one(object: {host: $host, payload_id: $payload_id}) {
            id
          }
    }
`;
// 用于从主机移除载荷的变更
const removePayloadOnHostMutation = gql`
    mutation removePayloadOnHostMutation($payload_id: Int!, $host: String!, $operation_id: Int!){
        update_payloadonhost(where: {host: {_eq: $host}, payload_id: {_eq: $payload_id}, operation_id: {_eq: $operation_id}}, _set: {deleted: true}) {
            affected_rows
          }
    }
`;
// 用于获取要执行的命令的所有参数和信息的查询
const getCommandQuery = gql`
query getCommandQuery($id: Int!){
  command_by_pk(id: $id) {
    attributes
    author
    cmd
    description
    help_cmd
    id
    needs_admin
    version
    payloadtype{
        name
    }
    commandparameters {
      choice_filter_by_command_attributes
      choices
      choices_are_all_commands
      choices_are_loaded_commands
      limit_credentials_by_type
      default_value
      description
      id
      name
      required
      supported_agent_build_parameters
      supported_agents
      type
      dynamic_query_function
      ui_position
      parameter_group_name
      display_name
      cli_name
      verifier_regex
    }
  }
}
`;
// 用于获取要执行的命令的所有凭据的查询
const getCredentialsQuery = gql`
query getCredentialsQuery($operation_id: Int!){
    credential(where: {deleted: {_eq: false}, operation_id: {_eq: $operation_id}}, order_by: {id: desc}){
        account
        comment
        credential_text
        id
        realm
        type
    }
}
`;

export const commandInParsedParameters = (cmd, parsedParameters) =>{
    if(cmd.name in parsedParameters){
        return cmd.name
    }
    if(cmd.cli_name in parsedParameters){
        return cmd.cli_name
    }
    if(cmd.display_name in parsedParameters){
        return cmd.display_name
    }
    return undefined
}
export function TaskParametersDialog(props) {
    const [backdropOpen, setBackdropOpen] = React.useState(false);
    const [commandInfo, setCommandInfo] = useState({});
    const [parameterGroups, setParameterGroups] = useState([]);
    const [selectedParameterGroup, setSelectedParameterGroup] = useState('Default');
    const [parameters, setParameters] = useState([]);
    const [rawParameters, setRawParameters] = useState(false);
    const [requiredPieces, setRequiredPieces] = useState({all: false, loaded: false, edges: false, credentials: false});
    // 获取我们命令的所有可能数据
    const [getAllCommands, { data: allCommandsLoading}] = useLazyQuery(getAllCommandsQuery, {
        fetchPolicy: "no-cache"
    });
    const [getLoadedCommands, { data: loadedCommandsLoading}] = useLazyQuery(GetLoadedCommandsQuery, {
        fetchPolicy: "no-cache"
    });
    const [getAllEdges, { data: loadedAllEdgesLoading}] = useLazyQuery(getAllEdgesQuery, {
        fetchPolicy: "no-cache"
    });
    const [getAllPayloads, { data: loadedAllPayloadsLoading}] = useLazyQuery(getAllPayloadsQuery, {
        fetchPolicy: "no-cache"
    });
    const [getAllPayloadsOnHosts, { data: loadedAllPayloadsOnHostsLoading}] = useLazyQuery(getAllPayloadsOnHostsQuery, {
        fetchPolicy: "no-cache"
    });
    const [getAllCredentials, { data: loadedCredentialsLoading}] = useLazyQuery(getCredentialsQuery, {
        fetchPolicy: "no-cache"
    });
    const [addPayloadOnHost] = useMutation(addPayloadOnHostMutation, {
        onCompleted: data => {
            if(data.insert_payloadonhost_one.id){
                snackActions.success("成功跟踪主机上的载荷");
            }
            getAllPayloadsOnHosts({variables: {operation_id: props.operation_id}});
        },
        onError: data => {
            console.log("添加主机载荷失败", data);
            snackActions.error("添加主机载荷失败: " + data.message);
        }
    });
    const [RemovePayloadOnHost] = useMutation(removePayloadOnHostMutation, {
        onCompleted: data => {
            getAllPayloadsOnHosts({variables: {operation_id: props.operation_id}})
        },
        onError: data => {
            console.log("从主机移除载荷失败", data);
            snackActions.error("从主机移除载荷失败: " + data.message);
        }
    });
    const [submenuOpenPreventTask, setSubmenuOpenPreventTask] = React.useState(false);
    useQuery(getCommandQuery, {
        variables: {id: props.command.id},
        fetchPolicy: "no-cache",
        onCompleted: data => {
            // 进行初始检查以查看需要哪些其他查询
            let requiredPiecesInitial = {all: false, loaded: false, edges: false, credentials: false};
            let groupNames = [];
            data.command_by_pk.commandparameters.forEach( (cmd) => {
                if(!groupNames.includes(cmd.parameter_group_name)){
                    groupNames.push(cmd.parameter_group_name);
                }
                if(cmd.type === "LinkInfo"){
                    requiredPiecesInitial["edges"] = true;
                }else if(cmd.choices_are_all_commands){
                    requiredPiecesInitial["all"] = true;
                }else if(cmd.choices_are_loaded_commands){
                    requiredPiecesInitial["loaded"] = true;
                }else if(cmd.type === "AgentConnect"){
                    requiredPiecesInitial["connect"] = true;
                    // 如果需要，用户可能希望向主机添加载荷
                    requiredPiecesInitial["payloads"] = true;
                }else if(cmd.type === "PayloadList"){
                    requiredPiecesInitial["payloads"] = true;
                }else if(cmd.type.includes("Credential")){
                    requiredPiecesInitial["credentials"] = true;
                }
            });
            groupNames.sort();
            setParameterGroups(groupNames);
            if(props.command.groupName && groupNames.includes(props.command.groupName)){
                setSelectedParameterGroup(props.command.groupName);
            } else if(!groupNames.includes("Default")){
                setSelectedParameterGroup(groupNames[0]);
            }
            setCommandInfo({...data.command_by_pk});
            if(requiredPiecesInitial["edges"]){getAllEdges({variables: {callback_id: props.callback_id} });}
            if(requiredPiecesInitial["all"]){getAllCommands({variables: {payload_type_id: props.payloadtype_id}});}
            if(requiredPiecesInitial["loaded"]){getLoadedCommands({variables: {callback_id: props.callback_id} });}
            if(requiredPiecesInitial["payloads"]){getAllPayloads({variables: {operation_id: props.operation_id} });}
            if(requiredPiecesInitial["connect"]){getAllPayloadsOnHosts({variables: {operation_id: props.operation_id} });}
            if(requiredPiecesInitial["credentials"]){getAllCredentials({variables: {operation_id: props.operation_id}});}
            setRequiredPieces(requiredPiecesInitial);
            setRawParameters({...data});
        }
    });
    const addedCredential = (credential) => {
        getAllCredentials({variables: {operation_id: props.operation_id}});
    }
    const removedCredential = (credential) => {
        getAllCredentials({variables: {operation_id: props.operation_id}});
    }
    const setSubmenuOpenPreventTasking = (open) => {
        setSubmenuOpenPreventTask(open);
    }
    useEffect( () => {
        //console.log("use effect triggered")
        if(!props.command.parsedParameters){
            props.command.parsedParameters = {};
        }
        const getLinkInfoFromAgentConnect = (choices) => {
            if(choices.length > 0){
                const c2profileparameters = choices[0]["payloads"][0]["c2info"][0].parameters.reduce( (prev, opt) => {
                    return {...prev, [opt.name]: opt.value}
                }, {});
                let agentConnectValue = {host: choices[0]["host"], agent_uuid: choices[0]["payloads"][0].uuid,
                c2_profile: {name: choices[0]["payloads"][0]["c2info"][0].name, parameters: c2profileparameters}};
                if(choices[0]["payloads"][0].type === "callback"){
                    agentConnectValue["callback_uuid"] = props.choices[0]["payloads"][0]["agent_callback_id"];
                }
                return agentConnectValue;
            }else{
                return {};
            }
        };
        const getLinkInfoValue = (choices) => {
            let choice;
            if(choices.length > 0){
                if(choices[0]["source"]["id"] === props.callback_id){
                    choice = choices[0]["destination"];
                }else{
                    choice = choices[0]["source"];
                }
                const c2profileparameters = choice["c2profileparametersinstances"].reduce( (prev, opt) => {
                    if(opt.c2_profile_id === choices[0]["c2profile"]["id"]){
                        return {...prev, [opt.c2profileparameter.name]: !opt.c2profileparameter.crypto_type ? opt.value : {crypto_type: opt.c2profileparameter.crypto_type, enc_key: opt.enc_key_base64, dec_key: opt.dec_key_base64} }
                    }else{
                        return {...prev};
                    }
                }, {});
                return {
                    host: choice.host,
                    agent_uuid: choice.payload.uuid,
                    callback_uuid: choice.agent_callback_id,
                    c2_profile: {name: choices[0]["c2profile"]["name"], parameters: c2profileparameters}
                };
            }else{
                return {};
            }
        }
        if(rawParameters && (!requiredPieces["loaded"] || loadedCommandsLoading) &&
                       (!requiredPieces["all"] || allCommandsLoading) &&
                       (!requiredPieces["edges"] || loadedAllEdgesLoading) &&
                       (!requiredPieces["payloads"] || loadedAllPayloadsLoading) && 
                       (!requiredPieces["connect"] || loadedAllPayloadsOnHostsLoading) &&
                       (!requiredPieces["credentials"] || loadedCredentialsLoading) ){
            // 只有在获取了所有必需部分后才处理参数
            const params = rawParameters.command_by_pk.commandparameters.reduce( (prev, cmd) => {
                if(cmd.parameter_group_name !== selectedParameterGroup){
                    return [...prev];
                }
                //console.log(props.command);
                let parsedParameterName = commandInParsedParameters(cmd, props.command.parsedParameters);
                switch(cmd.type){
                    case "Boolean":

                        if(parsedParameterName){
                            return [...prev, {...cmd, value: props.command.parsedParameters[parsedParameterName]}];
                        }
                        else if(cmd.default_value){
                            return [...prev, {...cmd, value: cmd.default_value.toLowerCase() === "true"}];
                        }else{
                            return [...prev, {...cmd, value: false}];
                        }
                    case "String":
                        if(parsedParameterName){
                            return [...prev, {...cmd, value: props.command.parsedParameters[parsedParameterName]}];
                        }else{
                            return [...prev, {...cmd, value: cmd.default_value}];
                        }                      
                    case "Number":
                        if(parsedParameterName){
                            return [...prev, {...cmd, value: props.command.parsedParameters[parsedParameterName]}];
                        }else{
                            return [...prev, {...cmd, value: cmd.default_value === "" ? 0 : parseInt(cmd.default_value)}];
                        }
                    case "Array":
                        if(parsedParameterName){
                            return [...prev, {...cmd, value: props.command.parsedParameters[parsedParameterName]}];
                        }else if(cmd.default_value.length > 0){
                            return [...prev, {...cmd, value: JSON.parse(cmd.default_value)}];
                        }else{
                            return [...prev, {...cmd, value: []}];
                        }
                    case "TypedArray":
                        if(parsedParameterName){
                            return [...prev, {...cmd, value: props.command.parsedParameters[parsedParameterName]}];
                        }else if(cmd.default_value.length > 0){
                            try {
                                return [...prev, {...cmd, value: JSON.parse(cmd.default_value)}];
                            }catch(error){
                                return [...prev, {...cmd, value: [[cmd.default_value, ""]] }];
                            }

                        }else{
                            return [...prev, {...cmd, value: []}];
                        }
                    case "ChooseOne":
                    case "ChooseOneCustom":
                    case "ChooseMultiple":
                        let choices = cmd.choices;
                        let defaultV = cmd.default_value;
                        if(cmd.type === "ChooseMultiple"){
                            if(cmd.default_value !== ""){
                                defaultV = JSON.parse(cmd.default_value);
                            }else{
                                defaultV = [];
                            }
                        }else{
                            if(choices.length > 0){
                                defaultV = cmd.default_value === "" ? choices[0] : cmd.default_value;
                            }
                        }
                        let filter = cmd.choice_filter_by_command_attributes;
                        if(cmd.choices_are_all_commands){
                            // 获取所有最新的命令
                            choices = [...allCommandsLoading.command];
                            choices = choices.reduce( (prevn, c) => {
                                let match = true;
                                let cmd_attributes = c.attributes;
                                for(const [key, value] of Object.entries(filter)){
                                    if(cmd_attributes[key] === undefined){continue}
                                    if(Array.isArray(cmd_attributes[key])){
                                        if(key === 'supported_os' && cmd_attributes[key].length === 0){
                                            continue;
                                        }
                                        if(!cmd_attributes[key].includes(value)){
                                            match = false;
                                        }
                                    } else {
                                        if(cmd_attributes[key] !== value){
                                            match = false;
                                        }
                                    }
                                }
                                if(match){
                                    return [...prevn, c.cmd];
                                }else{
                                    return [...prevn];
                                }
                            }, []);
                            choices.sort();
                            if(choices.length > 0){
                                if(cmd.type === "ChooseMultiple"){defaultV = []}
                                else{defaultV = choices[0];}
                            }
                        }else if(cmd.choices_are_loaded_commands){
                            // 获取所有已加载的命令
                            choices = [...loadedCommandsLoading.loadedcommands];
                            choices = choices.reduce( (prevn, c) => {
                                let match = true;
                                let cmd_attributes = c.command.attributes;
                                for(const [key, value] of Object.entries(filter)){
                                    if(cmd_attributes[key] === undefined){continue}
                                    if(Array.isArray(cmd_attributes[key])){
                                        if(key === 'supported_os' && cmd_attributes[key].length === 0){
                                            continue;
                                        }
                                        if(!cmd_attributes[key].includes(value)){
                                            match = false;
                                        }
                                    } else {
                                        if(cmd_attributes[key] !== value){
                                            match = false;
                                        }
                                    }
                                }
                                if(match){
                                    return [...prevn, c.command.cmd];
                                }else{
                                    return [...prevn];
                                }
                            }, []);
                            if(choices.length > 0){
                                if(cmd.type === "ChooseMultiple"){defaultV = []}
                                else{defaultV = choices[0];}
                            }
                        }
                        if(parsedParameterName){
                            return [...prev, {...cmd, choices: choices, value: props.command.parsedParameters[parsedParameterName], default_value: defaultV}];
                        }else{
                            return [...prev, {...cmd, choices: choices, default_value: defaultV, value: defaultV}];
                        }
                    case "File":
                        return [...prev, {...cmd, value: {} }];
                    case "FileMultiple":
                        return [...prev, {...cmd, value: []}];
                    case "CredentialJson":
                        let credentialChoices = loadedCredentialsLoading.credential;
                        if(credentialChoices === undefined || credentialChoices === null){
                            credentialChoices = [];
                        }
                        if(cmd.limit_credentials_by_type?.length > 0){
                            credentialChoices = credentialChoices.reduce( (existingCreds, curCred) => {
                                if(cmd.limit_credentials_by_type.includes(curCred.type)){
                                    return [...existingCreds, curCred];
                                }
                                return [...existingCreds];
                            }, []);
                        }
                        if (credentialChoices.length > 0){
                            if(parsedParameterName){
                                cmd.value = props.command.parsedParameters[parsedParameterName];
                            }
                            else if(cmd.value === "" || (typeof(cmd.value) === Object && Object.keys(cmd.value).length === 0) || cmd.value === undefined){
                                cmd.value = credentialChoices[0];
                            }
                            return [...prev, {...cmd, choices: credentialChoices}];
                        }else{
                            return [...prev, {...cmd, value: {}, choices: []}];
                        }
                    case "AgentConnect":
                        const agentConnectNewPayloads = loadedAllPayloadsLoading.payload.reduce( (prevn, payload) => {
                            let foundP2P = false;
                            const profiles = payload.payloadc2profiles.reduce( (prevn, profile) => {
                                if(profile.c2profile.is_p2p){foundP2P = true;}
                                return [...prevn, profile.c2profile.name];
                            }, []).join(",");
                            if(foundP2P){
                                return [...prevn, {...payload, display: b64DecodeUnicode(payload.filemetum.filename_text) + " - " + profiles + " - " + payload.description,
                                filemetum: {filename_text: b64DecodeUnicode(payload.filemetum.filename_text)}}];
                            }else{
                                return [...prevn];
                            }
                            
                        }, []).sort((a,b) => {
                            return a.id < b.id ? 1 : -1;
                        });

                        const callbacksOrganized = loadedAllPayloadsOnHostsLoading.callback.reduce( (prevn, entry) => {
                            let found = false;
                            const updates = prevn.map( (host) => {
                                if(host.host === entry.host){
                                    found = true;
                                    const c2info = entry.c2profileparametersinstances.reduce( (prevn, cur) => {
                                    const val = !cur.c2profileparameter.crypto_type ? cur.value : {crypto_type: cur.value, enc_key: cur.enc_key_base64, dec_key: cur.dec_key_base64};
                                        if(cur.c2profile.name in prevn){
                                            // 我们只想向 c2profile.name 列表添加一个新条目
                                            
                                            return {...prevn, [cur.c2profile.name]: [...prevn[cur.c2profile.name], { name: cur.c2profileparameter.name, value:  val } ] }
                                    }else{
                                        return {...prevn, [cur.c2profile.name]: [ { name: cur.c2profileparameter.name, value: val } ] }
                                        }
                                    }, {});
                                    let c2array = [];
                                    for( const [key, value] of Object.entries(c2info)){
                                        c2array.push({name: key, parameters: value});
                                    }
                                    const payloadInfo = {...entry.registered_payload, c2info: c2array, display: "回调 " + entry.display_id + " - " + entry.description, ...entry, type: "callback", payloadOnHostID:null};
                                    return {...host, payloads: [...host.payloads, payloadInfo]}
                                }else{
                                    return host;
                                }
                            });
                            if(!found){
                                const c2info = entry.c2profileparametersinstances.reduce( (prevn, cur) => {
                                const val = !cur.c2profileparameter.crypto_type ? cur.value : {crypto_type: cur.value, enc_key: cur.enc_key_base64, dec_key: cur.dec_key_base64};
                                    if(cur.c2profile.name in prevn){
                                        // 我们只想向 c2profile.name 列表添加一个新条目
                                            
                                        return {...prevn, [cur.c2profile.name]: [...prevn[cur.c2profile.name], { name: cur.c2profileparameter.name, value:  val } ] }
                                    }else{
                                        return {...prevn, [cur.c2profile.name]: [ { name: cur.c2profileparameter.name, value: val } ] }
                                    }
                                }, {});
                                let c2array = [];
                                for( const [key, value] of Object.entries(c2info)){
                                    c2array.push({name: key, parameters: value});
                                }
                                const payloadInfo = {...entry.registered_payload, c2info: c2array, display: "回调 " + entry.display_id + " - " + entry.description, ...entry, type: "callback", payloadOnHostID:null};
                                return [...prevn, {host: entry.host, payloads: [payloadInfo] } ]
                            }else{
                                return updates;
                            }
                        }, []);
                        const organized = loadedAllPayloadsOnHostsLoading.payloadonhost.reduce( (prevn, entry) => {
                            let found = false;
                            const updates = prevn.map( (host) => {
                                if(host.host === entry.host){
                                    found = true;
                                    // 需要检查存在于 host.payload 中但不在 loadedAllPayloadsOnHostsLoading.payloadonhost 中的条目
                                        // 这意味着载荷已被删除
                                    // 现在我们需要将此条目与主机的当前载荷/回调合并
                                    let duplicated_payload = false;
                                    host.payloads.forEach( (p) => {
                                        if(p.id === entry.payload.id){duplicated_payload = true}
                                    });
                                    if(duplicated_payload){return host}
                                    // 获取的内容不存在于当前列表中
                                    const c2info = entry.payload.c2profileparametersinstances.reduce( (prevn, cur) => {
                                        const val = !cur.c2profileparameter.crypto_type ? cur.value : {crypto_type: cur.value, enc_key: cur.enc_key_base64, dec_key: cur.dec_key_base64};
                                            if(cur.c2profile.name in prevn){
                                                // 我们只想向 c2profile.name 列表添加一个新条目

                                                return {...prevn, [cur.c2profile.name]: [...prevn[cur.c2profile.name], { name: cur.c2profileparameter.name, value:  val } ] }
                                        }else{
                                            return {...prevn, [cur.c2profile.name]: [ { name: cur.c2profileparameter.name, value: val } ] }
                                            }
                                        }, {});
                                    let c2array = [];
                                    for( const [key, value] of Object.entries(c2info)){
                                        c2array.push({name: key, parameters: value});
                                    }
                                    const payloadInfo = {...entry.payload, c2info: c2array,
                                        display: b64DecodeUnicode(entry.payload.filemetum.filename_text) + " - " + entry.payload.description,
                                        type: "payload", payloadOnHostID:entry.id, filemetum: {filename_text: b64DecodeUnicode(entry.payload.filemetum.filename_text)}
                                    };
                                    return {...host, payloads: [...host.payloads, payloadInfo].sort((a,b) => {
                                            if(a.filemetum.filename_text === b.filemetum.filename_text){
                                                return a.id < b.id ? 1 : -1
                                            }else{
                                                return a.filemetum.filename_text < b.filemetum.filename_text ? 1 : -1
                                            }
                                        })}
                                }else{
                                    // 这与我们的主机不匹配，所以不修改
                                    return host; 
                                }
                            });
                            if(!found){
                                // 甚至没有找到主机，所以添加新的主机条目
                                const c2info = entry.payload.c2profileparametersinstances.reduce( (prevn, cur) => {
                                    const val = !cur.c2profileparameter.crypto_type ? cur.value : {crypto_type: cur.value, enc_key: cur.enc_key_base64, dec_key: cur.dec_key_base64};
                                    if(cur.c2profile.name in prevn){
                                        // 我们只想向 c2profile.name 列表添加一个新条目
                                        
                                        return {...prevn, [cur.c2profile.name]: [...prevn[cur.c2profile.name], { name: cur.c2profileparameter.name, value:  val } ] }
                                    }else{
                                        return {...prevn, [cur.c2profile.name]: [ { name: cur.c2profileparameter.name, value: val } ] }
                                    }
                                }, {});
                                let c2array = [];
                                for( const [key, value] of Object.entries(c2info)){
                                    c2array.push({name: key, parameters: value});
                                }
                                const payloadInfo = {...entry.payload, c2info: c2array,
                                    display: b64DecodeUnicode(entry.payload.filemetum.filename_text) + " - " + entry.payload.description,
                                    type: "payload", payloadOnHostID:entry.id,
                                    filemetum: {filename_text: b64DecodeUnicode(entry.payload.filemetum.filename_text)}};
                                return [...prevn, {host: entry.host, payloads: [payloadInfo] } ]
                            }else{
                                return updates;
                            }
                        }, []);
                        // callbacksOrganized 包含所有可链接的活跃回调信息
                        // organized 包含所有可链接的主机上载荷信息
                        // 需要合并两者
                        const allOrganized = callbacksOrganized.reduce( (prevn, cur) => {
                            let hostIndex = prevn.findIndex(o => o.host === cur.host);
                            if(hostIndex > -1){
                                // 需要将 cur.payloads 添加到 prev[hostIndex].payloads 列表中
                                prevn[hostIndex].payloads = [...prevn[hostIndex].payloads, ...cur.payloads];
                                return [...prevn];
                            }else{
                                return [...prevn, {...cur}];
                            }
                        }, [...organized]);
                        //console.log("updating choices and payload choices", allOrganized, agentConnectNewPayloads)
                        return [...prev, {...cmd, choices: allOrganized, payload_choices: agentConnectNewPayloads, value: getLinkInfoFromAgentConnect(organized)}];
                    case "PayloadList":
                        let supported_agents = cmd.supported_agents;
                        if(supported_agents.indexOf("") !== -1){supported_agents.splice(supported_agents.indexOf(""))}
                        const build_requirements = cmd.supported_agent_build_parameters;
                        const payloads = loadedAllPayloadsLoading.payload.reduce( (prevn, payload) => {
                            const profiles = payload.payloadc2profiles.reduce( (prevn, profile) => {
                                return [...prevn, profile.c2profile.name];
                            }, []).join(",");
                            if(supported_agents.length > 0 && !supported_agents.includes(payload.payloadtype.name)){return prevn};
                            let matched = true;
                            if(payload.payloadtype.name in build_requirements){
                                // 这意味着我们的载荷有一个过滤条件
                                for(const [key, value] of Object.entries(build_requirements[payload.payloadtype.name])){
                                    payload.buildparameterinstances.forEach( (build_param) => {
                                        if(build_param.buildparameter.name === key){
                                            if(build_param.value !== value){matched = false}
                                        }
                                    });
                                }
                            }
                            if(matched){
                                return [...prevn, {...payload,
                                    display: b64DecodeUnicode(payload.filemetum.filename_text) + " - " + profiles + " - " + payload.description,
                                    filemetum: {filename_text: b64DecodeUnicode(payload.filemetum.filename_text)}
                                }]
                            }else{
                                return prevn;
                            }
                            
                        }, []);
                        payloads.sort((a,b) => {
                            let aTimestamp = new Date(a.filemetum.timestamp);
                            let bTimestamp = new Date(b.filemetum.timestamp);
                            return aTimestamp < bTimestamp ? 1 : -1;
                        });
                        // 现在根据 supported_agents 和 supported_agent_build_parameters 筛选载荷
                        if(payloads.length > 0){
                            return [...prev, {...cmd, choices: payloads, default_value: payloads[0].uuid, value: payloads[0].uuid}];
                        }else{
                            return [...prev, {...cmd, choices: payloads, value: null}];
                        }
                    case "LinkInfo":
                        const edge_active_choices = loadedAllEdgesLoading.callbackgraphedge.reduce( (prevn, edge) => {
                            if(edge.source.id === edge.destination.id) {return prevn}
                            if(edge.end_timestamp === null){
                                return [...prevn, {...edge, display: "回调 " + edge.source.display_id + " --" + edge.c2profile.name + "--> 回调 " + edge.destination.display_id + (edge.end_timestamp === null? "(活跃)" : "(已失效于 " + edge.end_timestamp + ")")}];
                            }
                            return prevn;
                        }, []);
                        const edge_dead_choices = loadedAllEdgesLoading.callbackgraphedge.reduce( (prevn, edge) => {
                            if(edge.source.id === edge.destination.id) {return prevn}
                            if(edge.end_timestamp !== null){
                                return [...prevn, {...edge, display: "回调 " + edge.source.display_id + " --" + edge.c2profile.name + "--> 回调 " + edge.destination.display_id + (edge.end_timestamp === null? "(活跃)" : "(已失效于 " + edge.end_timestamp + ")")}];
                            }
                            return prevn;
                        }, []);
                        let edge_choices = [...edge_active_choices, ...edge_dead_choices];
                        if(edge_choices.length > 0){
                            return [...prev, {...cmd, choices: edge_choices, value: getLinkInfoValue(edge_choices)}];
                        }else{
                            return [...prev, {...cmd, choices: edge_choices, value: {}}];
                        }
                    default:
                        return [...prev, {...cmd}];
                }
            }, [] );
            const sorted = params.sort((a, b) => (a.ui_position > b.ui_position) ? 1 : -1)
            if(sorted.length > 0){
                sorted[0]["autoFocus"] = true;
            }
            // 遍历以设置新旧值之间的匹配
            for(let i = 0; i < sorted.length; i++){
                for(let j = 0; j < parameters.length; j++){
                    if(sorted[i].name === parameters[j].name){
                        sorted[i].value = parameters[j].value
                    }
                }
            }
            //console.log("updated params in useEffect of taskparametersdialog", sorted)
            setParameters(sorted);
        }
    }, [selectedParameterGroup, rawParameters, loadedCommandsLoading, allCommandsLoading, loadedAllEdgesLoading, requiredPieces, loadedAllPayloadsLoading, loadedCredentialsLoading, loadedAllPayloadsOnHostsLoading, props.callback_id, props.choices]);
    const onSubmit = async () => {
        let newFileUUIDs = [];
        let collapsedParameters = {};
        for(const param of parameters){
            switch(param.type){
                case "String":
                case "Boolean":
                case "Number":
                case "ChooseOne":
                case "ChooseOneCustom":
                case "ChooseMultiple":
                case "PayloadList":
                case "Array":
                case "TypedArray":
                case "LinkInfo":
                    //console.log("submit param", param)
                    collapsedParameters[param.name] = param.value;
                    break;
                case "AgentConnect":
                    if (Object.keys(param.value).length === 0){
                        snackActions.warning("未指定连接信息")
                        return
                    }
                    collapsedParameters[param.name] = param.value;
                    break
                case "File":
                    const newUUID = await UploadTaskFile(param.value, "作为任务的一部分上传");
                    if(newUUID){
                        if(newUUID !== "Missing file in form"){
                            newFileUUIDs.push(newUUID);
                            collapsedParameters[param.name] = newUUID;
                        }
                    }else{
                        return;
                    }
                    break;
                case "FileMultiple":
                    let fileIDs = [];
                    for(let i = 0; i < param.value.length; i++){
                        if(typeof param.value[i] === "string"){
                            fileIDs.push(param.value[i]);
                            continue
                        }
                        const newUUID = await UploadTaskFile(param.value[i], "作为任务的一部分上传");
                        if(newUUID){
                            if(newUUID !== "Missing file in form"){
                                newFileUUIDs.push(newUUID);
                                fileIDs.push(newUUID);
                            } else {
                                snackActions.warning("文件上传失败");
                            }
                        } else {
                            snackActions.warning("文件上传失败");
                        }
                    }
                    collapsedParameters[param.name] = fileIDs;
                    break;
                case "CredentialJson":
                    collapsedParameters[param.name] = {
                        account: param.value["account"],
                        comment: param.value["comment"],
                        credential: param.value["credential_text"],
                        realm: param.value["realm"],
                        type: param.value["type"]
                    };
                    break;
                default:
                    console.log("未知参数类型");
            }
        }
        setBackdropOpen(false);
        props.onSubmit(commandInfo.cmd, JSON.stringify(collapsedParameters), newFileUUIDs, selectedParameterGroup, commandInfo?.payloadtype?.name);
        
    }
    const onAgentConnectAddNewPayloadOnHost = (host, payload) => {
        addPayloadOnHost({variables: {host: host, payload_id: payload} })
    }
    const onAgentConnectRemovePayloadOnHost = ({payload, host}) => {
        RemovePayloadOnHost({variables: {host: host, payload_id: payload.id, operation_id: payload.operation_id}})
    }
    const onChange = (name, value, error) => {
        //console.log("called props.onChange to update a value for submission, have these parameters: ", [...parameters]);
        setParameters((previousState, currentProps) => {
            return previousState.map( (param) => {
                if(param.name === name){
                    return {...param, value: value};
                }else{
                    return {...param};
                }
            })
        });
        //console.log("just set new params from props.onChange with a new value: ", [...params])
    }
    const onChangeParameterGroup = (event) => {
        setSelectedParameterGroup(event.target.value);
    }
    const getOtherParameters = () => {
        let collapsedParameters = {};
        for(const param of parameters){
            switch(param.type){
                case "String":
                case "Boolean":
                case "Number":
                case "ChooseOne":
                case "ChooseOneCustom":
                case "ChooseMultiple":
                case "PayloadList":
                case "Array":
                case "TypedArray":
                case "LinkInfo":
                    //console.log("submit param", param)
                    collapsedParameters[param.name] = param.value;
                    break;
                case "AgentConnect":
                    if (Object.keys(param.value).length === 0){
                        snackActions.warning("未指定连接信息")
                        return
                    }
                    collapsedParameters[param.name] = param.value;
                    break
                case "File":

                case "FileMultiple":
                    break
                case "CredentialJson":
                    collapsedParameters[param.name] = {
                        account: param.value["account"],
                        comment: param.value["comment"],
                        credential: param.value["credential_text"],
                        realm: param.value["realm"],
                        type: param.value["type"]
                    };
                    break;
                default:
                    console.log("未知参数类型");
            }
        }
        return collapsedParameters;
    }
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">{commandInfo.cmd} 的参数</DialogTitle>
        <DialogContent dividers={true}>
            <Backdrop open={backdropOpen} style={{zIndex: 2, position: "absolute"}}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <Typography component="div" >
                <b>注释</b> <pre style={{margin:0, wordBreak: "break-word", overflow: "word-wrap", whiteSpace: "pre-wrap"}}>{commandInfo.description}</pre><br/>
                <Divider />
                <b>是否需要管理员权限？</b><pre style={{margin:0}}>{commandInfo.needs_admin ? "是": "否"}</pre><br/>
                <Divider />
                {parameterGroups.length > 1 &&
                    <FormControl style={{width: "100%", marginTop: "7px"}} >
                        <TextField
                            select
                            label="参数分组"
                            value={selectedParameterGroup}
                            onChange={onChangeParameterGroup}
                            
                            input={<Input />}
                        >
                        {
                            parameterGroups.map((opt, i) => (
                                <MenuItem key={"paramgroup" + i} value={opt} >{opt}</MenuItem>
                            ))
                        }
                        </TextField>
                    </FormControl>
                    
                }
            </Typography>
            <TableContainer>
                <Table size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{width: "30%"}}>参数</TableCell>
                            <TableCell>内容</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {parameters.map( (op) => (
                            <TaskParametersDialogRow onSubmit={onSubmit} key={"taskparameterrow" + op.id}
                                onChange={onChange} commandInfo={commandInfo} {...op}
                                parameterGroupName={selectedParameterGroup}
                                callback_id={props.callback_id}
                                onAgentConnectAddNewPayloadOnHost={onAgentConnectAddNewPayloadOnHost}
                                onAgentConnectRemovePayloadOnHost={onAgentConnectRemovePayloadOnHost}
                                addedCredential={addedCredential} removedCredential={removedCredential}
                                setSubmenuOpenPreventTasking={setSubmenuOpenPreventTasking}
                                                     getOtherParameters={getOtherParameters}
                                />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            关闭
          </Button>
          <Button onClick={onSubmit} disabled={submenuOpenPreventTask} variant="contained" color="warning">
            任务
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}