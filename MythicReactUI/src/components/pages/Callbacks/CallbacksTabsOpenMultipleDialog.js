import React, {useContext} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import {useQuery, gql } from '@apollo/client';
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
        headerName: '主机名',
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
        headerName: "检入时间",
        width: 100,
        valueGetter: (value, row) => new Date(row.last_checkin),
        renderCell: (params) =>
            <CallbacksTableLastCheckinCell rowData={params.row} />,
    },
    {
        field: "payload.payloadtype.name",
        headerName: "代理",
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
const CustomSelectTable = ({initialData, selectedData, onRowClick}) => {
    const [data, setData] = React.useState([]);
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
                        sortModel: [{ field: 'display_id', sort: 'desc' }],
                    },
                }}
                autoPageSize
                onRowClick={onRowClick}
                density={"compact"}
            />
        </div>

    )
}
export function CallbacksTabsOpenMultipleDialog({onClose, tabType, onOpenTabs}) {
    const selectedData = React.useRef([]);
    const [initialData, setInitialData] = React.useState([]);
    useQuery(callbacksAndFeaturesQuery,{
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
        const callbackData = data.callback.map( c => {
          // 为每个回连获取唯一的支持功能集
          const display = `${c.display_id} - ${c.user}@${c.host} (${c.pid}) - ${c.description}`;
          return {...c, display};
        });
          setInitialData(callbackData);
      }
    });
    const onRowClick = (rowData) => {
      onOpenTabs([rowData.row]);
    }


  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">选择要打开 {tabType} 标签页的回连</DialogTitle>
            <CustomSelectTable initialData={initialData}
                               selectedData={selectedData}
                               onRowClick={onRowClick}
            />
        <DialogActions>
          <Button onClick={onClose} variant="contained" color="primary">
            关闭
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}