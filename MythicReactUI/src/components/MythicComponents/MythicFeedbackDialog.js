import React from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import { Divider, Input, MenuItem, Select } from '@mui/material';
import MythicTextField from './MythicTextField';
import { gql } from '@apollo/client';
import { snackActions } from '../utilities/Snackbar';
import { useMutation } from '@apollo/client';

const submitFeedbackMutation = gql`
  mutation submitFeedback($webhookType: String!, $webhookData: jsonb!){
    sendExternalWebhook(webhook_type: $webhookType, webhook_data: $webhookData){
      status
      error
    }
  }
`;

export function MythicFeedbackDialog(props) {
    const [message, setMessage] = React.useState("");
    const [taskID, setTaskID] = React.useState(0);
    const messageTypeOptions = [
        { display: "缺陷", value: "bug" },
        { display: "功能请求", value: "feature_request" },
        { display: "令人困惑的界面", value: "confusing_ui" },
        { display: "检测", value: "detection" },
    ];
    const [messageType, setMessageType] = React.useState("bug");
    const [submitFeedback] = useMutation(submitFeedbackMutation, {
        update: (cache, { data }) => {
            if (data.sendExternalWebhook.status === "success") {
                snackActions.success("已提交反馈！");
            } else {
                snackActions.warning(data.sendExternalWebhook.error);
            }
            props.onClose();
        },
        onError: error => {
            console.log(error)
            snackActions.warning(error.message);
        }
    });
    
    const handleSubmit = () => {
        let webhookData = {};
        if (taskID > 0) {
            webhookData["task_id"] = String(taskID);
        }
        webhookData["message"] = message;
        webhookData["feedback_type"] = messageType;
        submitFeedback({ variables: { webhookType: "new_feedback", webhookData: webhookData } });
    }
    
    const handleMessageTypeChange = (evt) => {
        setMessageType(evt.target.value);
    }
    
    const handleTaskIDChange = (name, value, error) => {
        setTaskID(value);
    }
    
    const handleMessageChange = (name, value, error) => {
        setMessage(value);
    }
    
    const handleOnEnter = (event) => {
        if (event.shiftKey) {
            handleSubmit();
        }
    }

    return (
        <React.Fragment>
            <DialogTitle >{props.title}</DialogTitle>
            <Divider></Divider>
            <DialogContent style={{ padding: "10px" }}>
                将反馈报告发送到当前操作配置的 Slack webhook。
                这提供了一种轻松捕获缺陷、反馈请求或评论的方式，而不会过多打断操作员流程。<br />
                Shift+Enter 将自动提交表单。
                <TableContainer className="mythicElement">
                    <Table size="small" style={{ "maxWidth": "100%", "overflow": "scroll" }}>
                        <TableBody style={{ whiteSpace: "pre" }}>
                            <TableRow hover >
                                <TableCell style={{ width: "5rem" }}>
                                    反馈类型
                                </TableCell>
                                <TableCell>
                                    <Select
                                        labelId="反馈类型选择标签"
                                        id="反馈类型选择"
                                        value={messageType}
                                        onChange={handleMessageTypeChange}
                                        input={<Input style={{ width: "100%" }} />}
                                    >
                                        {messageTypeOptions.map((opt) => (
                                            <MenuItem value={opt.value} key={opt.value}>{opt.display}</MenuItem>
                                        ))}
                                    </Select>
                                </TableCell>
                            </TableRow>
                            <TableRow hover >
                                <TableCell style={{ width: "5rem" }}>
                                    任务（如适用）
                                </TableCell>
                                <TableCell>
                                    <MythicTextField value={taskID} type={"number"}
                                        onChange={handleTaskIDChange} display="inline-block" name={"taskid"} showLabel={false}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow hover>
                                <TableCell>
                                    反馈内容
                                </TableCell>
                                <TableCell>
                                    <MythicTextField value={message} multiline={true} onEnter={handleOnEnter}
                                        onChange={handleMessageChange} display="inline-block" name={"feedback"} showLabel={false}
                                    />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} variant="contained" color="primary">
                    关闭
                </Button>
                <Button onClick={handleSubmit} variant="contained" color="success">
                    提交反馈
                </Button>
            </DialogActions>
        </React.Fragment>
    );
}