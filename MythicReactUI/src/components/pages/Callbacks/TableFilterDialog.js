import React, {useState} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MythicTextField from '../../MythicComponents/MythicTextField';


export function TableFilterDialog({filterOptions, onSubmit, onClose, selectedColumn}) {
    const [description, setDescription] = useState("");
    
    const onCommitSubmit = () => {
        onSubmit({...filterOptions, [selectedColumn.key]: description});
        onClose();
    }
    const onChange = (name, value, error) => {
        setDescription(value);
    }
    React.useEffect( () => {
        if(filterOptions[selectedColumn.key]){
          setDescription(filterOptions[selectedColumn.key]);
        }
    }, [selectedColumn]);
  
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">筛选 "{selectedColumn.name}" 条目</DialogTitle>
        <DialogContent style={{paddingBottom: 0}} dividers={true}>
            仅显示包含以下不区分大小写文本的行:
            <MythicTextField autoFocus onChange={onChange} value={description} onEnter={onCommitSubmit}/>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} color="primary">
            关闭
          </Button>
          <Button variant="contained" onClick={onCommitSubmit} color="success">
            筛选
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}