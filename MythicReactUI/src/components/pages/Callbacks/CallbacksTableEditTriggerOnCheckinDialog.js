import React, {useEffect} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import AceEditor from 'react-ace';
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-searchbox";
import {useTheme} from '@mui/material/styles';
import {HexColorInput, HexColorPicker} from 'react-colorful';
import Typography from '@mui/material/Typography';
import MythicTextField from "../../MythicComponents/MythicTextField";

export function CallbacksTableEditTriggerOnCheckinDialog(props) {
    const [comment, setComment] = React.useState(0);
    
    // 处理输入变化
    const onChange = (name, value, error) => {
        setComment(parseInt(value));
    }
    
    // 初始化触发器阈值
    useEffect( () => {
        setComment(props.trigger_on_checkin_after_time);
    }, [props.trigger_on_checkin_after_time]);
    
    const onSubmit = () => {
        props.onSubmit(comment);
    }
    
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">{"调整此回调的触发阈值"}</DialogTitle>
        <DialogContent dividers={true} style={{height: "100%"}}>
            <Typography>
                {"此设置调整此回调在多长时间（分钟）内未签到后，最终签到时触发事件工作流（触发器为 callback_checkin）。值为0表示永不触发。"}
            </Typography>
            <MythicTextField 
                autoFocus={true} 
                onChange={onChange} 
                type={"number"} 
                value={comment} 
                onEnter={onSubmit} 
                name={"触发阈值（分钟）"} 
                showLabel={false} 
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            关闭
          </Button>
            {props.onSubmit &&
                <Button onClick={onSubmit} variant="contained" color="success">
                    提交
                </Button>
            }
        </DialogActions>
    </React.Fragment>
  );
}