import React, {useState} from 'react';
import {useQuery, gql} from '@apollo/client';
import LinearProgress from '@mui/material/LinearProgress';
import {MythicModifyStringDialog} from "../../MythicComponents/MythicDialog";
import { meState } from '../../../cache';
import {toLocalTime} from "../../utilities/Time";

const getParametersQuery = gql`
query getParametersQuery ($task_id: Int!) {
  task_by_pk(id: $task_id) {
    display_params
    original_params
    mythic_parsed_params
    params
    tasking_location
    parameter_group_name
    command_name
    id
    timestamp
    status_timestamp_preprocessing
    status_timestamp_processing
    status_timestamp_processed
    command {
      cmd
      id
      payloadtype {
        name
        id
      }
    }
  }
}
`;

export function TaskViewParametersDialog(props) {
    const [comment, setComment] = useState("");
    const { loading, error } = useQuery(getParametersQuery, {
        variables: {task_id: props.task_id},
        onCompleted: data => {
            let workingComment = "原始参数:\n" + data.task_by_pk.original_params;
            workingComment += "\n\nMythic解析后的参数: \n\t用于事件处理 (create_task->action_data->params_dictionary) 和脚本编写 (mythic.issue_task->parameters)\n"
            workingComment += data.task_by_pk.mythic_parsed_params;
            workingComment += "\n\n代理参数:\n" + data.task_by_pk.params;
            workingComment += "\n\n显示参数:\n" + data.task_by_pk.display_params;
            workingComment += "\n\n任务发起位置:\n" + data.task_by_pk.tasking_location;
            workingComment += "\n\n参数组:\n" + data.task_by_pk.parameter_group_name;
            if(data.task_by_pk.command){
              if(data.task_by_pk.command.cmd !== data.task_by_pk.command_name){
                workingComment += "\n\n原始命令: " + data.task_by_pk.command.cmd;
                workingComment += "\n已发起命令: " + data.task_by_pk.command_name;
              }
              workingComment += "\n\n载荷类型:\n" + data.task_by_pk.command.payloadtype.name;
            }
            workingComment += "\n\n--------重要时间戳--------\n\n";
            workingComment += "操作员提交任务时间    : " + toLocalTime(data.task_by_pk.status_timestamp_preprocessing, meState()?.user?.view_utc_time) + "\n";
            workingComment += "代理接收任务时间      : " + toLocalTime(data.task_by_pk.status_timestamp_processing, meState()?.user?.view_utc_time) + "\n";
            workingComment += "任务首次消息时间      : " + toLocalTime(data.task_by_pk.status_timestamp_processed, meState()?.user?.view_utc_time) + "\n";
            workingComment += "任务最后消息时间      : " + toLocalTime(data.task_by_pk.timestamp, meState()?.user?.view_utc_time) + "\n";
            setComment(workingComment);
        },
        fetchPolicy: "network-only"
    });
    if (loading) {
     return <LinearProgress />;
    }
    if (error) {
     console.error(error);
     return <div>错误!</div>;
    }
  return (
    <React.Fragment>
        <MythicModifyStringDialog title={`查看任务参数和时间戳`}
                                  onClose={props.onClose}
                                  maxRows={40}
                                  wrap={true}
                                  value={comment} />
  </React.Fragment>
  );
}