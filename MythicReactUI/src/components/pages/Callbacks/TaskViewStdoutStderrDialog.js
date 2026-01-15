import React, {useState} from 'react';
import {useQuery, gql} from '@apollo/client';
import LinearProgress from '@mui/material/LinearProgress';
import {useTheme} from '@mui/material/styles';
import {MythicModifyStringDialog} from "../../MythicComponents/MythicDialog";

const getParametersQuery = gql`
query getParametersQuery ($task_id: Int!) {
  task_by_pk(id: $task_id) {
    stdout
    stderr
    id
  }
}
`;

export function TaskViewStdoutStderrDialog(props) {
    const [comment, setComment] = useState("");
    const { loading, error } = useQuery(getParametersQuery, {
        variables: {task_id: props.task_id},
        onCompleted: data => {
            setComment("[标准输出]:\n" + data.task_by_pk.stdout + "\n\[标准错误]:\n" + data.task_by_pk.stderr);
        },
        fetchPolicy: "network-only"
    });
    if (loading) {
     return <LinearProgress />;
    }
    if (error) {
     console.error(error);
     return <div>错误！</div>;
    }
  return (
    <React.Fragment>
        <MythicModifyStringDialog title={`查看任务标准输出/标准错误`}
                                  onClose={props.onClose}
                                  maxRows={40}
                                  wrap={true}
                                  value={comment} />
  </React.Fragment>
  );
}