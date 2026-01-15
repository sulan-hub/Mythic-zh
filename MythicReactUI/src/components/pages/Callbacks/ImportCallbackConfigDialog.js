import React from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {gql, useMutation} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';

const import_callback = gql`
 mutation importCallbackConfigMutation($config: jsonb!) {
  importCallbackConfig(config: $config) {
    error
    status
  }
}
 `;

export function ImportCallbackConfigDialog(props) {
  const [fileValue, setFileValue] = React.useState({name: ""});
  const [createCallbackMutation] = useMutation(import_callback, {
        update: (cache, {data}) => {
            if(data.importCallbackConfig.status === "success"){
                snackActions.info("Successfully imported new callback");
            }else{
                snackActions.error(data.importCallbackConfig.error);
            }
        }
    });
    const onCommitSubmit = () => {
        try {
            let jsonConfig = JSON.parse(fileValue.contents);
            createCallbackMutation({variables: {config: jsonConfig}}).catch( (e) => {console.log(e)} );
            props.onClose();
        }catch(error){
            snackActions.error("Failed to parse configuration")
        }
    }
    const onFileChange = (evt) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const contents = e.target.result;
          setFileValue({name: evt.target.files[0].name, contents: contents});
      }
      reader.readAsBinaryString(evt.target.files[0]);
  }
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">从其他Mythic服务器导入回连配置</DialogTitle>

        <DialogContent dividers={true}>
            从另一台 Mythic 服务器导出回连配置，导入到这里，与该服务器的回连进行交互。
            <br/>
          <Button variant="contained" component="label"> 
              { fileValue.name === "" ? "选择文件" : fileValue.name } 
              <input onChange={onFileChange} type="file" hidden /> 
          </Button>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={props.onClose} color="primary">
            取消
          </Button>
          <Button variant="contained" onClick={onCommitSubmit} color="success">
            上传
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

