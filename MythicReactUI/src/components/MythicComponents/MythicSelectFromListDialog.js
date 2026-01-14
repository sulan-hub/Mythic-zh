import React, {useRef, useEffect} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import MythicStyledTableCell from "./MythicTableCell";

export function MythicSelectFromListDialog(props) {
    const [options, setOptions] = React.useState([]);
    const [selected, setSelected] = React.useState('');
    const inputRef = useRef(null); 
    const handleChange = (event) => {
        setSelected(event.target.value);
      };
    const handleSubmit = () => {
        props.onSubmit(selected);
        if(props.dontCloseOnSubmit){
          return;
        }
        props.onClose();
    }
    useEffect( () => {
        //期望options是一个字典数组，其中包含一个"display"字段用于向用户展示
        const opts = [...props.options];
        setOptions(opts);
        if(opts.length > 0){
            setSelected(opts[0]);
        }else{
            setSelected("");
        }
    }, [props.options]);
  return (
    <React.Fragment>
        <DialogTitle >{props.title}</DialogTitle>
        <DialogContent dividers={true}>
            <React.Fragment>
                <FormControl style={{width: "100%"}}>
                  <InputLabel ref={inputRef}>选项</InputLabel>
                  <Select
                    labelId="demo-dialog-select-label"
                    id="demo-dialog-select"
                    value={selected}
                    onChange={handleChange}
                    input={<Input style={{width: "100%"}}/>}
                  >
                    <MenuItem value="">
                      <em>无</em>
                    </MenuItem>
                    {options.map( (opt) => (
                        <MenuItem value={opt} key={opt[props.identifier]}>{opt?.[props.display]}</MenuItem>
                    ) )}
                  </Select>
                </FormControl>
            </React.Fragment>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            关闭
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="success">
            {props.action}
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

export function MythicSelectFromRawListDialog(props) {
  const [options, setOptions] = React.useState([]);
  const handleSubmit = (selected) => {
      props.onSubmit(selected);
      props.onClose();
  }
  useEffect( () => {
      //期望options是一个字典数组，其中包含一个"display"字段用于向用户展示
      const opts = [...props.options];
      setOptions(opts);
  }, [props.options]);
return (
  <React.Fragment>
      <DialogTitle >{props.title}</DialogTitle>
      <div style={{height: "100%", display: "flex"}}>
          <TableContainer component={Paper} className="mythicElement" style={{flexGrow: 1, overflowY: "auto"}}>
              <Table size="small" style={{ "maxWidth": "100%", "overflow": "scroll"}}>
                  <TableBody style={{whiteSpace: "pre"}}>
                      {options.map( (choice, i) => (
                          <TableRow hover key={choice + i}>
                              <MythicStyledTableCell style={{width: "5rem"}}>
                                  <Button onClick={() => handleSubmit(choice)} variant="contained" color="primary">选择</Button>
                              </MythicStyledTableCell>
                              <MythicStyledTableCell>{choice}</MythicStyledTableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </TableContainer>
      </div>
      <DialogActions>
        <Button onClick={props.onClose} variant="contained" color="primary">
          关闭
        </Button>
      </DialogActions>
</React.Fragment>
);
}