import {snackActions} from '../utilities/Snackbar';

export const UploadTaskFile = async (file, comment) => {
  let formData = new FormData();
  try{
    formData.append("file", file);
    formData.append("comment", comment);
    snackActions.info("正在上传 " + file.name + " 到 Mythic...", {autoHideDuration: 1000});
  }catch(error){
    console.log(error)
    return null;
  }
  try{
    const upload_response = await fetch('/api/v1.4/task_upload_file_webhook', {
      method: 'POST',
      body: formData,
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        MythicSource: "web",
      }
    });
    try{
      const upload_result = upload_response.json().then(data => {
          return data?.agent_file_id || data?.error || null;
        }).catch(error => {
          snackActions.warning("错误: " + upload_response.statusText + "\n错误代码: " + upload_response.status);
          console.log("尝试获取JSON响应时出错", error.toString());
          return null;
        });
        return upload_result;
    }catch(error){
      snackActions.error(error.toString());
      return null;
    }
  }catch(error){
      snackActions.error(error.toString());
      return null;
  }
}
export const UploadEventFile = async (file, comment) => {
  let formData = new FormData();
  formData.append("file", file);
  formData.append("comment", comment);
  snackActions.info("正在上传 " + file.name + " 到 Mythic...", {autoHideDuration: 1000});
  try{
    const upload_response = await fetch('/api/v1.4/eventing_import_webhook', {
      method: 'POST',
      body: formData,
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    try{
      return upload_response.json().then(data => {
        return data;
      }).catch(error => {
        console.log(upload_response);
        snackActions.warning("错误: " + upload_response.statusText + "\n错误代码: " + upload_response.status);
        console.log("尝试获取JSON响应时出错", error.toString());
        return null;
      });
    }catch(error){
      snackActions.error(error.toString());
      return null;
    }
  }catch(error){
    snackActions.error(error.toString());
    return null;
  }
}
export const UploadEventGroupFile = async (file, eventgroup_id) => {
  let formData = new FormData();
  formData.append("eventgroup_id", eventgroup_id);
  formData.append("file", file);
  snackActions.info("正在上传 " + file.name + " 到 Mythic...", {autoHideDuration: 1000});
  try{
    const upload_response = await fetch('/api/v1.4/eventing_register_file_webhook', {
      method: 'POST',
      body: formData,
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    try{
      return upload_response.json().then(data => {
        return data;
      }).catch(error => {
        console.log(upload_response);
        snackActions.warning("错误: " + upload_response.statusText + "\n错误代码: " + upload_response.status);
        console.log("尝试获取JSON响应时出错", error.toString());
        return null;
      });
    }catch(error){
      snackActions.error(error.toString());
      return null;
    }
  }catch(error){
    snackActions.error(error.toString());
    return null;
  }
}