import React, {useEffect} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import {useQuery, gql } from '@apollo/client';
import {useMutation} from '@apollo/client';
import {hideCallbacksMutation} from './CallbackMutations';
import {snackActions} from "../../utilities/Snackbar";
import {CallbacksTableLastCheckinCell, CallbacksTablePayloadTypeCell, CallbacksTableIPCell} from "./CallbacksTableRow";
import { DataGrid } from '@mui/x-data-grid';


const callbacksAndFeaturesQuery = gql`
query callbacksAndFeatures{
  callback(where: {active: {_eq: true}}, order_by: {id: asc}) {
    id
    display_id
    host
    ip
    user
    process_name
    pid
    description
    last_checkin
    dead
    payload {
        payloadtype {
            name
            id
            agent_type
        }
    }
    mythictree_groups_string
  }
}`;

const columns = [
    { field: 'display_id', headerName: 'ID', width: 70, type: 'number', },
    {
        field: 'host',
        headerName: '主机',
        flex: 0.5,
    },
    {
        field: 'user',
        headerName: '用户',
        flex: 0.5,
    },
    {
        field: 'pid',
        headerName: '进程ID',
        type: 'number',
        width: 70,
    },
    {
        field: 'description',
        headerName: '描述',
        flex: 1,
    },
    {
      field: 'ip',
      headerName: 'IP地址',
      width: 100,
      renderCell: (params) => <CallbacksTableIPCell rowData={params.row} cellData={params.row.ip} />,
        sortable: false,
      valueGetter: (value, row) => {
          try{
              return JSON.parse(row.ip)[0];
          }catch(error){
              return row.ip;
          }
      }
    },
    {
        field: "last_checkin",
        headerName: "最后签到",
        width: 100,
        valueGetter: (value, row) => new Date(row.last_checkin),
        renderCell: (params) =>
            <CallbacksTableLastCheckinCell rowData={params.row} />,
    },
    {
        field: "payload.payloadtype.name",
        headerName: "代理类型",
        flex: 0.5,
        valueGetter: (value, row) => row.payload.payloadtype.name,
        renderCell: (params) => <CallbacksTablePayloadTypeCell rowData={params.row} />
    },
    {
        field: "mythictree_groups_string",
        headerName: "分组",
        flex: 0.5,
    }
];
const CustomSelectTable = ({initialData, selectedData, sortModel}) => {
    const [data, setData] = React.useState([]);
    const [rowSelectionModel, setRowSelectionModel] = React.useState({
        type: 'include',
        ids: new Set([]),
    });
    React.useEffect( () => {
        selectedData.current = data.reduce( (prev, cur) => {
            if(rowSelectionModel.ids.has(cur.id)){return [...prev, cur]}
            return [...prev];
        }, []);
    }, [data, rowSelectionModel]);
    React.useEffect( () => {
        setData(initialData.map(c => {
            return {...c};
        }));
    }, [initialData]);
    return (
        <div style={{height: "calc(80vh)"}}>
            <DataGrid
                rows={data}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: {
                        },
                    },
                    sorting: {
                        sortModel: [sortModel],
                    },
                }}
                autoPageSize
                checkboxSelection
                onRowSelectionModelChange={(newRowSelectionModel) => {
                    setRowSelectionModel(newRowSelectionModel);
                }}
                rowSelectionModel={rowSelectionModel}
                density={"紧凑"}
            />
        </div>

    )
}
export function CallbacksTabsHideMultipleDialog({onClose}) {

    const selectedData = React.useRef([]);
    const [initialData, setInitialData] = React.useState([]);
    const [hideCallback] = useMutation(hideCallbacksMutation, {
        onCompleted: data => {
            snackActions.success("成功隐藏回调！")
            onClose();
        },
        onError: data => {
            console.log(data);
            snackActions.error(data.message);
            onClose();
        }
    });
    useQuery(callbacksAndFeaturesQuery,{
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
        const callbackData = data.callback.map( c => {
          // 为每个回调获取唯一的支持功能集合
          const display = `${c.display_id} - ${c.user}@${c.host} (${c.pid}) - ${c.description}`;
          return {...c, display};
        });
          setInitialData(callbackData);
      }
    });
    const submitTasking = () => {
      if(selectedData.current.length === 0){
        onClose();
        return;
      }
      let callbackIDs = selectedData.current.map(c => c.display_id);
      snackActions.info("正在隐藏回调...");
      hideCallback({variables: {callback_display_ids: callbackIDs}});
    }


  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">批量隐藏多个回调</DialogTitle>
            <CustomSelectTable 
                initialData={initialData}
                selectedData={selectedData}
                sortModel={{ field: 'last_checkin', sort: 'asc' }}
            />
        <DialogActions>
          <Button onClick={onClose} variant="contained" color="primary">
            关闭
          </Button>
          <Button onClick={submitTasking} variant="contained" color="warning">
            隐藏
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}
export function CallbacksTabsSelectMultipleDialog({onClose, onSubmit}) {

    const selectedData = React.useRef([]);
    const [initialData, setInitialData] = React.useState([]);
    useQuery(callbacksAndFeaturesQuery,{
        fetchPolicy: "no-cache",
        onCompleted: (data) => {
            const callbackData = data.callback.map( c => {
                // 为每个回调获取唯一的支持功能集合
                const display = `${c.display_id} - ${c.user}@${c.host} (${c.pid}) - ${c.description}`;
                return {...c, display};
            });
            setInitialData(callbackData);
        }
    });
    const submitTasking = () => {
        if(selectedData.current.length === 0){
            onClose();
            return;
        }
        onSubmit(selectedData.current);
    }


    return (
        <React.Fragment>
            <DialogTitle id="form-dialog-title">选择多个回调</DialogTitle>
            <CustomSelectTable 
                initialData={initialData}
                selectedData={selectedData}
                sortModel={{ field: 'display_id', sort: 'desc' }}
            />
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    关闭
                </Button>
                <Button onClick={submitTasking} variant="contained" color="warning">
                    使用选择
                </Button>
            </DialogActions>
        </React.Fragment>
    );
}