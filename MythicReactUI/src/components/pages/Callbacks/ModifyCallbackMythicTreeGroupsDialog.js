import React from 'react';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import {useQuery, gql, useMutation} from '@apollo/client';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {Button, IconButton} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { snackActions } from '../../utilities/Snackbar';
import MythicStyledTableCell from "../../MythicComponents/MythicTableCell";
import MythicTextField from "../../MythicComponents/MythicTextField";
import MenuItem from '@mui/material/MenuItem';
import {MythicDialog} from "../../MythicComponents/MythicDialog";
import {ViewAllCallbackMythicTreeGroupsDialog} from "./ViewCallbackMythicTreeGroupsDialog";
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import { useTheme } from '@mui/material/styles';
import LayersIcon from '@mui/icons-material/Layers';


const getCallbackMythicTreeGroups = gql`
query getCallbackMythicTreeGroups($callback_id: Int!) {
  callback_by_pk(id: $callback_id){
    display_id
    mythictree_groups
  }
  callback {
    mythictree_groups
  }
}
`;
const setMythicTreeGroups = gql`
mutation setMythicTreeGroups($callback_id: Int!, $mythictree_groups: [String]!){
  update_callback(where: {id: {_eq: $callback_id}}, _set: {mythictree_groups: $mythictree_groups}) {
    affected_rows
  }
}
`;
export function ModifyCallbackMythicTreeGroupsDialog(props){
    const theme = useTheme();
    const [groups, setGroups] = React.useState([]);
    const [otherGroups, setOtherGroups] = React.useState([]);
    const [selectedGroupDropdown, setSelectedGroupDropdown] = React.useState('');
    const [openViewAllCallbacksDialog, setOpenViewAllCallbacksDialog] = React.useState(false);
    const [setCallbackGroups] = useMutation(setMythicTreeGroups, {
      onCompleted: data => {
            if(data.update_callback.affected_rows > 0){
                snackActions.success("成功更新回连分组。\n请关闭并重新打开所有进程浏览器和文件浏览器标签。");
            } else {
                snackActions.error("更新回连分组失败");
            }
      },
      onError: error => {
        snackActions.error(error.message);
      }
    });
    const callbackDisplayID = React.useRef(0);
    const { data } = useQuery(getCallbackMythicTreeGroups, {
        fetchPolicy: "no-cache",
        variables: {callback_id: props.callback_id},
        onCompleted: data => {
            setGroups(data.callback_by_pk.mythictree_groups);
            callbackDisplayID.current = data.callback_by_pk.display_id;
            let otherGroupOptions = new Set([]);
            for(let i = 0; i < data.callback.length; i++){
                if(data.callback[i].mythictree_groups.length > 0){
                    data.callback[i].mythictree_groups.forEach( (e) => otherGroupOptions.add(e) );
                }
            }
            otherGroupOptions.delete("默认")
            let otherGroupArray = Array.from(otherGroupOptions).sort();
            otherGroupArray.unshift("默认");
            setOtherGroups(otherGroupArray);
            if( otherGroupArray.length > 0 ){
                setSelectedGroupDropdown(otherGroupArray[0]);
            }
        }
        });
    const submit = (event) => {
        props.onClose(event);
        setCallbackGroups({variables:{callback_id: props.callback_id, mythictree_groups: groups}});
    }
    const addArrayOption = () => {
        const newArray = [...groups, selectedGroupDropdown];
        setGroups(newArray);
    }
    const addNewArrayValue = () => {
        const newArray = [...groups, ""];
        setGroups(newArray);
    }
    const removeArrayValue = (index) => {
        let removed = [...groups];
        removed.splice(index, 1);
        setGroups(removed);
    }
    const onChangeArrayText = (value, error, index) => {
        let values = [...groups];
        if(value.includes("\n")){
            let new_values = value.split("\n");
            values = [...values, ...new_values.slice(1)];
            values[index] = new_values[0];
        }else{
            values[index] = value;
        }
        setGroups(values);
    }
    return (
        <React.Fragment>
          <DialogTitle id="form-dialog-title" style={{display: "flex", justifyContent: "space-between"}}>
              更新回连 {callbackDisplayID.current} 的分组
              <MythicStyledTooltip title="查看全部分组" >
                  <IconButton size="small" onClick={()=>{setOpenViewAllCallbacksDialog(true);}} style={{color: theme.palette.info.main}} variant="contained"><LayersIcon/></IconButton>
              </MythicStyledTooltip>
          </DialogTitle>
            <div style={{paddingLeft: "30px"}}>
                此回连和其他回连在查看文件浏览器和进程浏览器树时的分组信息。<br/>
                <b>注意：</b>如果<b>没有</b>分组条目，将隐藏此回连在文件浏览器和进程浏览器视图中的所有信息。
            </div>
          <DialogContent dividers={true}>
            <Table size="small" aria-label="details" style={{ "overflowWrap": "break-word"}}>
                <TableHead>
                </TableHead>
                <TableBody>
                    {otherGroups.length > 0 &&
                        <TableRow>
                            <MythicStyledTableCell style={{width: "20%"}}>将现有分组添加到此回连</MythicStyledTableCell>
                            <MythicStyledTableCell>
                                <FormControl >
                                    <Select
                                        value={selectedGroupDropdown}
                                        onChange={evt => setSelectedGroupDropdown(evt.target.value)}
                                    >
                                        {
                                            otherGroups.map((opt) => (
                                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                                <IconButton onClick={addArrayOption} size="large"> <AddCircleIcon color="success"  /> </IconButton>
                            </MythicStyledTableCell>
                        </TableRow>
                    }
                    {groups.map( (a, i) => (
                        <TableRow key={'array' + props.name + i} >
                            <MythicStyledTableCell style={{width: "2rem", paddingLeft:"0"}}>
                                <IconButton onClick={(e) => {removeArrayValue(i)}} size="large"><DeleteIcon color="error" /> </IconButton>
                            </MythicStyledTableCell>
                            <MythicStyledTableCell>
                                <MythicTextField required={props.required} fullWidth={true} placeholder={""} value={a} multiline={true} autoFocus={ i > 0}
                                                 onChange={(n,v,e) => onChangeArrayText(v, e, i)} display="inline-block" maxRows={5}
                                />
                            </MythicStyledTableCell>
                        </TableRow>
                    ))}
                    <TableRow >
                        <MythicStyledTableCell style={{width: "5rem", paddingLeft:"0"}}>
                            <IconButton onClick={addNewArrayValue} size="large"> <AddCircleIcon color="success"  /> </IconButton>
                        </MythicStyledTableCell>
                        <MythicStyledTableCell></MythicStyledTableCell>
                    </TableRow>

                </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={props.onClose} variant="contained" color="primary">
              关闭
            </Button>
          <Button onClick={submit} variant="contained" color={"success"}>
              更新
          </Button>
        </DialogActions>
            {openViewAllCallbacksDialog &&
                <MythicDialog
                    fullWidth={true}
                    maxWidth={"lg"}
                    open={openViewAllCallbacksDialog}
                    onClose={() => {setOpenViewAllCallbacksDialog(false);}}
                    innerDialog={
                        <ViewAllCallbackMythicTreeGroupsDialog onClose={() => {setOpenViewAllCallbacksDialog(false);}} />
                    }
                />
            }
        </React.Fragment>
        )
}