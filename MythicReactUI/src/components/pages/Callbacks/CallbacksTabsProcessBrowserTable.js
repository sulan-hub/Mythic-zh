import React, {useCallback, useMemo} from 'react';
import { alpha, IconButton } from "@mui/material";
import {useLazyQuery, gql, useMutation } from '@apollo/client';
import { MythicDialog, MythicViewJSONAsTableDialog, MythicModifyStringDialog } from '../../MythicComponents/MythicDialog';
import {useTheme} from '@mui/material/styles';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ListIcon from '@mui/icons-material/List';
import { snackActions } from '../../utilities/Snackbar';
import 'react-virtualized/styles.css';
import MythicResizableGrid from '../../MythicComponents/MythicResizableGrid';
import {TableFilterDialog} from './TableFilterDialog';
import {MythicTransferListDialog} from '../../MythicComponents/MythicTransferList';
import {TagsDisplay, ViewEditTags} from '../../MythicComponents/MythicTag';
import TerminalIcon from '@mui/icons-material/Terminal';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {Dropdown, DropdownMenuItem, DropdownNestedMenuItem} from "../../MythicComponents/MythicNestedMenus";
import {faSkullCrossbones, faSyringe, faKey,} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {GetComputedFontSize} from "../../MythicComponents/MythicSavedUserSetting";

const getPermissionsDataQuery = gql`
    query getPermissionsQuery($mythictree_id: Int!) {
        mythictree_by_pk(id: $mythictree_id) {
            id
            metadata
        }
    }
`;
const updateFileComment = gql`
    mutation updateCommentMutation($mythictree_id: Int!, $comment: String!) {
        update_mythictree_by_pk(pk_columns: { id: $mythictree_id }, _set: { comment: $comment }) {
            comment
            id
        }
    }
`;

export const CallbacksTabsProcessBrowserTable = ({treeAdjMatrix, treeRootData, me, onRowDoubleClick,
                                                     onTaskRowAction, host, group, showDeletedFiles, tabInfo,
                                                     expandOrCollapseAll, getLoadedCommandForUIFeature}) => {
    //const [allData, setAllData] = React.useState([]);
    //console.log("进程树邻接矩阵在表格中更新", treeAdjMatrix)
    const [sortData, setSortData] = React.useState({"sortKey": null, "sortDirection": null, "sortType": null});
    const [openNodes, setOpenNodes] = React.useState({});
    const [openContextMenu, setOpenContextMenu] = React.useState(false);
    const [filterOptions, setFilterOptions] = React.useState({});
    const selectedColumn = React.useRef({});
    const [columnVisibility, setColumnVisibility] = React.useState({
        "visible": ["信息","进程ID", "父进程ID", "名称",  "架构", "会话", "用户", "命令行"],
        "hidden": [ "注释", "标签" ]
    })
    const [singleTreeData, setSingleTreeData] = React.useState({});
    const [viewSingleTreeData, setViewSingleTreeData] = React.useState(false);
    const [openAdjustColumnsDialog, setOpenAdjustColumnsDialog] = React.useState(false);
    const [updatedTreeAdjMatrix, setUpdatedTreeAdjMatrix] = React.useState(treeAdjMatrix);
    const openAllNodes = (state) => {
        let onodes = {};
        for(const [group, hosts] of Object.entries(updatedTreeAdjMatrix)){
            for(const [host, matrix] of Object.entries(hosts)){
                for(const [key, children] of Object.entries(matrix)){
                    onodes[key] = state;
                }
            }
        }
        setOpenNodes(onodes);
    }
    React.useEffect( () => {
        // 需要更新矩阵，以防存在无法追溯到根的节点
        let adjustedMatrix = {};
        // 检查循环
        let tempMatrix = {...treeAdjMatrix};
        for(const[group, groupMatrix] of Object.entries(tempMatrix)){
            for(const[host, hostMatrix] of Object.entries(tempMatrix[group])){
                for(const[key, val] of Object.entries(tempMatrix[group][host])){
                    for(const[key2, val2] of Object.entries(tempMatrix[group][host])){
                        if(val2[key] !== undefined && val[key2] !== undefined){
                            let tmp = {...val2};
                            delete tmp[key];
                            tempMatrix[group][host][key2] = tmp;
                        }
                    }
                }
            }
        }
        //console.log("进程树邻接矩阵已更新", treeAdjMatrix)
        for(const [group, hosts] of Object.entries(tempMatrix)){
            if(adjustedMatrix[group] === undefined){adjustedMatrix[group] = {}}
            for(const [host, matrix] of Object.entries(hosts)){
                // 遍历主机以调整它们的条目
                if( adjustedMatrix[group][host] === undefined){adjustedMatrix[group][host] = {}}
                for(const [key, children] of Object.entries(matrix)){
                    // 如果 key !== ""，如果 key 出现在其他条目中，保留它。如果它不在任何其他地方，则添加到 "" 中
                    // key 是父进程，children 是所有子进程
                    if(adjustedMatrix[group][host][key] === undefined){adjustedMatrix[group][host][key] = children}
                    if(key === ""){
                        // 自动添加所有子节点
                        for(const [i, v] of Object.entries(children)){
                            adjustedMatrix[group][host][key][i] = v
                        }
                    } else {
                        // 检查 key 是否在任何子节点中出现，如果没有，则添加到 adjustedMatrix[host][""][key] = 1
                        let found = false;
                        for(const [keySearch, childrenSearch] of Object.entries(matrix)){
                            if(childrenSearch.hasOwnProperty(key)){
                                found=true;
                            }
                            //for(const [i, v] of Object.entries(childrenSearch)){
                            //    if(i === key){found=true}
                            //}
                        }
                        if(!found){
                            if(adjustedMatrix[group][host][""] === undefined){adjustedMatrix[group][host][""] = {}}
                            adjustedMatrix[group][host][""][key] = 1;
                        }
                    }
                }
                // 检查调整后的矩阵中是否有循环
                for(const [key, _] of Object.entries(adjustedMatrix[group][host])){
                    // key == 540
                    // 是否有任何节点以 540 为子节点？760 有 - 760 已被访问
                    // 是否有任何节点以 760 为子节点？676 有
                    // 是否有任何节点以 676 为子节点？540 有 - X 检测到循环
                    // let badKey = checkLoop(540, adjustedMatrix[group][host], [540]);
                    let removeKey = checkLoop(adjustedMatrix[group][host], [key]);
                    if(adjustedMatrix[group][host][removeKey]){
                        delete adjustedMatrix[group][host][removeKey][key];
                        adjustedMatrix[group][host][""][key] = 1;
                    }
                }
            }
        }

        console.log("调整后的矩阵", adjustedMatrix, "真实矩阵", treeAdjMatrix)
        setUpdatedTreeAdjMatrix(adjustedMatrix);
    }, [treeAdjMatrix]);
    const checkLoop = (nodes, visited) => {
        let found = false;
        let checkingKey = visited[visited.length-1]; // 我们看到的最后一个节点
        for(const [testKey, testNodes] of Object.entries(nodes)){
            if(testNodes.hasOwnProperty(checkingKey)){
                // 我们找到了一个新节点，它以我们最后看到的节点为子节点
                found = true;
                //console.log("找到", testNodes, "拥有", checkingKey, "已访问", visited, "测试键", testKey)
                if(visited.includes(testKey)){
                    // 我们找到了一个循环
                    //console.log("找到循环", visited, testKey)
                    return true;
                }
                visited.push(testKey);
                if(checkLoop(nodes, visited)){
                    return visited.pop()
                }
            }
        }
        if(!found){
            //console.log("没有在任何边中找到", checkingKey)
        } else {
            //console.log("找到嵌套，但没有循环", checkingKey)
        }
        return false;
    }
    React.useEffect( () => {
        openAllNodes(true);
        setViewSingleTreeData(false);
    }, [host, group])
    const onExpandNode = (nodeId) => {
        setOpenNodes({
          ...openNodes,
          [nodeId]: true
        });
      };
    const onCollapseNode = (nodeId) => {
        setOpenNodes({
          ...openNodes,
          [nodeId]: false
        });
      };
    const handleOnClickButton = (nodeId) => {
        //console.log("handleOnClickButton", "nodeId", nodeId, "openNodes", openNodes)
        //if(openNodes[nodeId] !== undefined){
            if (openNodes[nodeId]) {
                onCollapseNode(nodeId);
            } else {
                onExpandNode(nodeId);
            }
       // }
        
    };
    const columnDefaults = [
        { name: '信息', width: 50, disableAutosize: true, disableSort: true, disableFilterMenu: true },
        { name: '进程ID', type: 'number', key: 'process_id', inMetadata: true, width: 100},
        { name: '父进程ID', type: 'number', key: 'parent_process_id', inMetadata: true, width: 100},
        { name: '名称', type: 'string', disableSort: false, key: 'name_text', fillWidth: true },
        { name: "架构", type: 'string', key: 'architecture', inMetadata: true, width: 70},
        { name: '会话', type: 'number', key: 'session_id', inMetadata: true, width: 100},
        { name: "用户", type: 'string', key: 'user', inMetadata: true, fillWidth: true},
        { name: '标签', type: 'tags', disableSort: true, disableFilterMenu: true, width: 220 },
        { name: '注释', type: 'string', key: 'comment', disableSort: false, width: 200 },
        { name: "命令行", type: "string", key: 'command_line', inMetadata: true, fillWidth: true},
    ];
    const columns = React.useMemo(
        () => 
            columnDefaults.reduce( (prev, cur) => {
                if(columnVisibility.visible.includes(cur.name)){
                    if(filterOptions[cur.key] && String(filterOptions[cur.key]).length > 0){
                        return [...prev, {...cur, filtered: true}];
                    }else{
                        return [...prev, {...cur}];
                    }
                }else{
                    return [...prev];
                }
            }, [])
        , [filterOptions, columnVisibility]
    );
    const flattenNode = useCallback(
        (node, host, group, depth = 0) => {
            let treeToUse = updatedTreeAdjMatrix;
            if(viewSingleTreeData){
                treeToUse = singleTreeData;
            }
          if(depth === 0){
            return [
              {
                id: treeRootData[group][host][node]?.id || node,
                name: treeRootData[group][host][node]?.full_path_text || node,
                full_path_text: treeRootData[group][host][node]?.full_path_text || node,
                name_text: treeRootData[group][host][node]?.name_text || node,
                deleted: treeRootData[group][host][node]?.deleted || true,
                depth,
                isLeaf: Object.keys(treeToUse[group]?.[host]?.[node] || {}).length === 0,
                can_have_children: treeRootData[group][host][node]?.can_have_children || true,
                isOpen: true,
                children: (treeToUse[group]?.[host]?.[node] || {}),
                host,
                group,
                root: true
              },
              ...(Object.keys(treeToUse[group]?.[host]?.[node] || {})).reduce( (prev, cur) => {
                if(!(treeRootData[group][host][cur]?.can_have_children || true)){return [...prev]}
                return [...prev, flattenNode(cur, host, group, depth+1)];
            }, []).flat()
            ];
          }
          //console.log("openNodes", openNodes, "node", node, "nodeid", treeRootData[host][node])
          //if (openNodes[treeRootData[host][node]?.id] === true) {
            if(openNodes[node] === true){
            return [
              {
                id: treeRootData[group][host][node]?.id || node ,
                name: treeRootData[group][host][node]?.full_path_text || node + " - " + treeRootData[group][host][node]?.name_text || "未知",
                full_path_text: treeRootData[group][host][node]?.full_path_text || node,
                name_text: treeRootData[group][host][node]?.name_text || node,
                deleted: treeRootData[group][host][node]?.deleted || true,
                depth,
                isLeaf: Object.keys(treeToUse[group][host]?.[node] || {}).length === 0,
                can_have_children: treeRootData[group][host]?.[node]?.can_have_children || true,
                isOpen: true,
                children: (treeToUse[group][host]?.[node] || {}),
                host,
                group,
                root: false,
              },
              ...(Object.keys(treeToUse[group]?.[host]?.[node] || {})).reduce( (prev, cur) => {
                if(!(treeRootData[group][host][cur]?.can_have_children || true)){return [...prev]}
                return [...prev, flattenNode(cur, host, group, depth+1)];
            }, []).flat()
            ];
          }
          return [
            {
              id: treeRootData[group][host][node]?.id || node,
              name: treeRootData[group][host][node]?.full_path_text || node  + " - " + treeRootData[group][host][node]?.name_text || "未知",
              full_path_text: treeRootData[group][host][node]?.full_path_text || node,
              name_text: treeRootData[group][host][node]?.name_text || node,
              deleted: treeRootData[group][host][node]?.deleted || true,
              depth,
              isLeaf: Object.keys(treeToUse[group]?.[host]?.[node] || {}).length === 0,
              can_have_children: treeRootData[group][host][node]?.can_have_children || true,
              isOpen: false,
              children: (treeToUse[group]?.[host]?.[node] || {}),
              host,
              group,
              root: false,
            }
          ];
         
        },
        [openNodes, updatedTreeAdjMatrix, singleTreeData, viewSingleTreeData] // eslint-disable-line react-hooks/exhaustive-deps
    );
    const allData = useMemo(() => {
        // 需要返回一个数组
        let finalData = [];
        let treeToUse = updatedTreeAdjMatrix;
        if(viewSingleTreeData){
            treeToUse = singleTreeData;
        }
        //console.log("在 useMemo 中", updatedTreeAdjMatrix, "主机", host)
        if(host === "" || treeToUse[group]?.[host] === undefined){return finalData}
        finalData.push({
        id: host,
        name: host,
        depth: 0,
        isLeaf: false,
        isOpen: true,
        can_have_children: true,
        host,
        group,
        root: true,
        deleted: false,
        success: true,
        children: treeToUse[group][host][""],
        full_path_text: host,
        });
        finalData.push(...Object.keys(treeToUse[group][host][""] === undefined ? {} : treeToUse[group][host][""]).map(c => flattenNode(c, host, group, 1)).flat())
        return finalData;
    },[flattenNode, treeRootData, host, group, updatedTreeAdjMatrix, openNodes, singleTreeData, viewSingleTreeData],
    );
    const sortedData = React.useMemo(() => {
        if (sortData.sortKey === null || sortData.sortType === null) {
            return allData;
        }
        let tempData = [...allData];

        if (sortData.sortType === 'number' || sortData.sortType === 'size' || sortData.sortType === 'date') {
            tempData.sort((a, b) => {
                if(a.root){
                    if(b.root){return 0}
                    return 1
                }
                else if(b.root){return -1}
                else if(sortData.inMetadata){
                    let aData = parseInt(treeRootData[group][host][a.full_path_text /*+ uniqueSplitString + a.callback_id*/]?.metadata[sortData.sortKey] || a.full_path_text);
                    let bData = parseInt(treeRootData[group][host][b.full_path_text /*+ uniqueSplitString + b.callback_id*/]?.metadata[sortData.sortKey] || b.full_path_text);
                    return aData > bData ? 1 : bData > aData ? -1 : 0;
                } else {
                    let aData = parseInt(treeRootData[group][host][a.full_path_text /*+ uniqueSplitString + a.callback_id*/][sortData.sortKey]);
                    let bData = parseInt(treeRootData[group][host][b.full_path_text /*+ uniqueSplitString + b.callback_id*/][sortData.sortKey]);
                    return aData > bData ? 1 : bData > aData ? -1 : 0;
                }
                
            });
        } else if (sortData.sortType === 'string') {
            tempData.sort((a, b) => {
                //console.log(treeRootData[host][a.full_path_text], treeRootData[host][b.full_path_text])
                if(treeRootData[group][host][a.full_path_text /*+ uniqueSplitString + a.callback_id*/] === undefined){
                    if(treeRootData[group][host][b.full_path_text /*+ uniqueSplitString + b.callback_id*/] === undefined){
                        return 0;
                    }
                    return -1;
                }
                if(treeRootData[group][host][b.full_path_text /*+ uniqueSplitString + b.callback_id*/] === undefined){
                    return 1
                }
                let aData = treeRootData[group][host][a.full_path_text /*+ uniqueSplitString + a.callback_id*/][sortData.sortKey];
                let bData = treeRootData[group][host][b.full_path_text /*+ uniqueSplitString + b.callback_id*/][sortData.sortKey];
                if(sortData.inMetadata){
                    aData = treeRootData[group][host][a.full_path_text /*+ uniqueSplitString + a.callback_id*/]?.metadata[sortData.sortKey];
                    bData = treeRootData[group][host][b.full_path_text /*+ uniqueSplitString + b.callback_id*/]?.metadata[sortData.sortKey];
                }
                if(aData === undefined){
                    if(bData === undefined){
                        return 0;
                    }
                    return -1
                }
                if(bData === undefined){
                    return 1
                }
                aData = aData.toLowerCase();
                bData = bData.toLowerCase();
                //console.log(aData, bData)
                return aData > bData ? 1 : bData > aData ? -1 : 0
            });
        }
        if (sortData.sortDirection === 'DESC') {
            tempData.reverse();
        }
        return tempData;
    }, [allData, sortData]);
    const onSubmitFilterOptions = (value) => {
        setFilterOptions({...filterOptions, [selectedColumn.current.key]: value });
        if(viewSingleTreeData){
            return
        }
        openAllNodes(true);
    }
    const filterRow = (rowData) => {
        if(rowData.root){return true}
        if(!showDeletedFiles &&
            treeRootData[group][host][rowData.full_path_text] !== undefined &&
            treeRootData[group][host][rowData.full_path_text ].deleted){
            return true;
        }
        let filterOptionInMetadata = {}
        for(const [key, value] of Object.entries(filterOptions)){
            for(let i = 0; i < columnDefaults.length; i++){
                if(columnDefaults[i].key === key){
                    filterOptionInMetadata[key] = columnDefaults[i].inMetadata
                }
            }
        }
        for(const [key,value] of Object.entries(filterOptions)){
            if(treeRootData[group][host][rowData.full_path_text] === undefined){return true}
            if(filterOptionInMetadata[key]){
                if(!String(treeRootData[group][host][rowData.full_path_text ]?.metadata[key]).toLowerCase().includes(value)){
                    return true;
                }
            }else{
                if(!String(treeRootData[group][host][rowData.full_path_text][key]).toLowerCase().includes(value)){
                    return true;
                }
            }
        }
        return false;
    }
    const setSingleTree = (treeElement) => {
        // 找到树元素的所有数据（祖先和子节点）并隐藏所有其余部分
        // 创建一个新的邻接矩阵
        let singleTreeAdjMatrix = {[group]: {[treeElement.host]: {}}};

        // 获取一直到根部的父层次结构
        let parent = treeRootData[group][treeElement.host][treeElement.full_path_text /*+ uniqueSplitString + treeElement.callback_id*/].parent_path_text /*+ uniqueSplitString + treeElement.callback_id*/;
        let current = treeElement.full_path_text /*+ uniqueSplitString + treeElement.callback_id*/;
        //console.log("初始父节点", parent, "邻接", treeAdjMatrix[treeElement.host][parent])
        while(treeAdjMatrix[group][treeElement.host][parent] !== undefined){
            singleTreeAdjMatrix[group][treeElement.host][parent] = {[current]: 1};
            //console.log("父节点的树数据", treeRootData[treeElement.host][parent])
            if(treeRootData[group][treeElement.host][parent] === undefined){
                break;
            }
            current = parent;
            parent = treeRootData[group][treeElement.host][parent].parent_path_text /*+ uniqueSplitString + treeRootData[group][treeElement.host][parent].callback_id*/;
        }
        // 现在获取所选元素的所有后代
        if(treeAdjMatrix[group][treeElement.host][treeElement.full_path_text /*+ uniqueSplitString + treeElement.callback_id*/] !== undefined){
            singleTreeAdjMatrix[group][treeElement.host][treeElement.full_path_text /*+ uniqueSplitString + treeElement.callback_id*/] = treeAdjMatrix[group][treeElement.host][treeElement.full_path_text /*+ uniqueSplitString + treeElement.callback_id*/];
            let leftToProcess = Object.keys(treeAdjMatrix[group][treeElement.host][treeElement.full_path_text /*+ uniqueSplitString + treeElement.callback_id*/]);
            while(leftToProcess.length > 0){
                let nextChild = leftToProcess.shift();
                if(treeAdjMatrix[group][treeElement.host][nextChild] !== undefined){
                    singleTreeAdjMatrix[group][treeElement.host][nextChild] = treeAdjMatrix[group][treeElement.host][nextChild];
                    leftToProcess.push(...Object.keys(treeAdjMatrix[group][treeElement.host][nextChild]));
                }
            }
        }
        for(const [group, hosts] of Object.entries(singleTreeAdjMatrix)){
            if(singleTreeAdjMatrix[group] === undefined){singleTreeAdjMatrix[group] = {}}
            for(const [host, matrix] of Object.entries(hosts)){
                // 遍历主机以调整它们的条目
                if( singleTreeAdjMatrix[group][host] === undefined){singleTreeAdjMatrix[group][host] = {}}
                for(const [key, children] of Object.entries(matrix)){
                    // 如果 key !== ""，如果 key 出现在其他条目中，保留它。如果它不在任何其他地方，则添加到 "" 中
                    // key 是父进程，children 是所有子进程
                    if(singleTreeAdjMatrix[group][host][key] === undefined){singleTreeAdjMatrix[group][host][key] = children}
                    if(key === ""){
                        // 自动添加所有子节点
                        for(const [i, v] of Object.entries(children)){
                            singleTreeAdjMatrix[group][host][key][i] = v
                        }
                    } else {
                        // 检查 key 是否在任何子节点中出现，如果没有，则添加到 adjustedMatrix[host][""][key] = 1
                        let found = false;
                        for(const [keySearch, childrenSearch] of Object.entries(matrix)){
                            for(const [i, v] of Object.entries(childrenSearch)){
                                if(i === key){found=true}
                            }
                        }
                        if(!found){
                            if(singleTreeAdjMatrix[group][host][""] === undefined){singleTreeAdjMatrix[group][host][""] = {}}
                            singleTreeAdjMatrix[group][host][""][key] = 1;
                        }
                    }
                }
            }
        }

        setSingleTreeData(singleTreeAdjMatrix);
        onSubmitFilterOptions({});
    }
    const toggleViewSingleTreeData = () => {
        setViewSingleTreeData(!viewSingleTreeData);
    }
    const gridData = React.useMemo(
        () =>
            sortedData.reduce((prev, row) => { 
                if(filterRow(row)){
                    return [...prev];
                }else{
                    return [...prev, columns.map( c => {
                        switch(c.name){
                            case "信息":
                                return  <FileBrowserTableRowActionCell 
                                            treeRootData={treeRootData[group]}
                                            host={host}
                                            group={group}
                                            rowData={row}
                                            tabInfo={tabInfo}
                                            viewSingleTreeData={viewSingleTreeData}
                                            setSingleTree={setSingleTree}
                                            toggleViewSingleTreeData={toggleViewSingleTreeData}
                                            getLoadedCommandForUIFeature={getLoadedCommandForUIFeature}
                                            onTaskRowAction={onTaskRowAction} />;
                            case "名称":
                                return <FileBrowserTableRowNameCell 
                                            treeRootData={treeRootData[group]}
                                            host={host}
                                            group={group}
                                            children={updatedTreeAdjMatrix[group][host]?.[row.full_path_text ]}
                                            handleOnClickButton={handleOnClickButton}
                                            rowData={row} />;
                            case "用户":
                                return <FileBrowserTableRowStringCell
                                    treeRootData={treeRootData[group]}
                                    host={host}
                                    group={group}
                                    cellData={treeRootData[group][host][row.full_path_text]?.metadata?.user || ''}
                                    rowData={row} />;
                            case "架构":
                                return <FileBrowserTableRowStringCell
                                    treeRootData={treeRootData[group]}
                                    host={host}
                                    group={group}
                                    cellData={treeRootData[group][host][row.full_path_text]?.metadata?.architecture || ''}
                                    rowData={row} />;
                            case "会话":
                                return <FileBrowserTableRowStringCell
                                    treeRootData={treeRootData[group]}
                                    host={host}
                                    group={group}
                                    cellData={treeRootData[group][host][row.full_path_text ]?.metadata?.session_id || ''}
                                    rowData={row} />;
                            case "进程ID":
                                return <FileBrowserTableRowStringCell 
                                            treeRootData={treeRootData[group]}
                                            host={host}
                                            group={group}
                                            rowData={row} 
                                            cellData={row.full_path_text} />;
                            case "父进程ID":
                                return <FileBrowserTableRowStringCell 
                                            treeRootData={treeRootData[group]}
                                            host={host}
                                            group={group}
                                            rowData={row} 
                                            cellData={treeRootData[group][host][row.full_path_text]?.parent_path_text || ""} />;
                            case "标签":
                                return <FileBrowserTagsCell 
                                            rowData={row} 
                                            treeRootData={treeRootData[group]}
                                            host={host}
                                            group={group}
                                            me={me} />
                            case "注释":
                                return <FileBrowserTableRowStringCell 
                                            treeRootData={treeRootData[group]}
                                            host={host} 
                                            rowData={row}
                                            group={group}
                                            cellData={treeRootData[group][host][row.full_path_text]?.comment}
                                />;
                            case "命令行":
                                return <FileBrowserTableRowStringCell
                                    treeRootData={treeRootData[group]}
                                    host={host}
                                    rowData={row}
                                    group={group}
                                    cellData={treeRootData[group][host][row.full_path_text ]?.metadata?.command_line || ""}
                                />;
                            default:
                                console.log("在 switch c.name 中遇到默认情况")
                        }
                    })];
                }
            }, []),
        [sortedData, onTaskRowAction, filterOptions, columnVisibility, showDeletedFiles, treeRootData]
    );
    const onClickHeader = (e, columnIndex) => {
        const column = columns[columnIndex];
        if(column.disableSort){
            return;
        }
        if (!column.key) {
            setSortData({"sortKey": null, "sortType":null, "sortDirection": "ASC", "inMetadata": false});
        }
        if (sortData.sortKey === column.key) {
            if (sortData.sortDirection === 'ASC') {
                setSortData({...sortData, "sortDirection": "DESC"});
            } else {
                setSortData({"sortKey": null, "sortType":null, "sortDirection": "ASC", "inMetadata": false});
            }
        } else {
            setSortData({"sortKey": column.key, "inMetadata": column.inMetadata, "sortType":column.type, "sortDirection": "ASC"});
        }
    };
    const localOnDoubleClick = (e, rowIndex) => {
        const rowData = treeRootData[group][host][sortedData[rowIndex]["full_path_text"]];
        onRowDoubleClick(rowData);
    };
    const contextMenuOptions = [
        {
            name: '筛选列', type: "item", icon: null,
            click: ({event, columnIndex}) => {
                if(event){
                    event.stopPropagation();
                    event.preventDefault();
                }
                if(columns[columnIndex].disableFilterMenu){
                    snackActions.warning("无法筛选该列");
                    return;
                }
                selectedColumn.current = columns[columnIndex];
                setOpenContextMenu(true);
            }
        },
        {
            name: "显示/隐藏列", type: "item", icon: null,
            click: ({event, columnIndex}) => {
                if(event){
                    event.stopPropagation();
                    event.preventDefault();
                }
                if(columns[columnIndex].disableFilterMenu){
                    snackActions.warning("无法筛选该列");
                    return;
                }
                setOpenAdjustColumnsDialog(true);
            }
        }
    ];
    const onSubmitAdjustColumns = ({left, right}) => {
        setColumnVisibility({visible: right, hidden: left});
    }
    const sortColumn = columns.findIndex((column) => column.key === sortData.sortKey);
    React.useEffect( () => {
        if(viewSingleTreeData){
            return;
        }
        if(expandOrCollapseAll){
            openAllNodes(true);
        } else {
            openAllNodes(false);
        }
    }, [expandOrCollapseAll, updatedTreeAdjMatrix]);
    return (
        <div style={{ width: '100%', height: '100%', overflow: "hidden", position: "relative" }}>
            <MythicResizableGrid
                columns={columns}
                sortIndicatorIndex={sortColumn}
                sortDirection={sortData.sortDirection}
                items={gridData}
                rowHeight={GetComputedFontSize() + 7}
                onClickHeader={onClickHeader}
                onDoubleClickRow={localOnDoubleClick}
                contextMenuOptions={contextMenuOptions}
            />
            {openContextMenu &&
                <MythicDialog fullWidth={true} maxWidth="sm" open={openContextMenu}
                              onClose={()=>{setOpenContextMenu(false);}}
                              innerDialog={
                                  <MythicModifyStringDialog
                                      title='筛选列'
                                      onSubmit={onSubmitFilterOptions}
                                      value={filterOptions[selectedColumn.current]}
                                      onClose={() => {
                                          setOpenContextMenu(false);
                                      }}
                                  />
                              }
                />
            }
            {openAdjustColumnsDialog &&
                <MythicDialog fullWidth={true} maxWidth="md" open={openAdjustColumnsDialog} 
                  onClose={()=>{setOpenAdjustColumnsDialog(false);}} 
                  innerDialog={
                    <MythicTransferListDialog onClose={()=>{setOpenAdjustColumnsDialog(false);}} 
                      onSubmit={onSubmitAdjustColumns} right={columnVisibility.visible} rightTitle="显示这些列"
                      leftTitle={"隐藏的列"} left={columnVisibility.hidden} dialogTitle={"编辑显示的列"}/>}
                />
            }       
        </div>
    )
}
const FileBrowserTableRowNameCell = ({ rowData, treeRootData, host, children, handleOnClickButton }) => {
    const theme = useTheme();
    return (
        <div style={{ display: "inline-flex", height: "100%", alignItems: "center", width: "100%", textDecoration: treeRootData[host][rowData["full_path_text"] /*+ uniqueSplitString + rowData["callback_id"]*/]?.deleted ? 'line-through' : '' }}>
            {[...Array(rowData.depth-1)].map((o, i) => (
                i === rowData.depth-2 && children ? (
                    i === 0 ? (<div key={'folder' + rowData.full_path_text + i} style={{marginLeft: 10, paddingRight: 10, height: "100%"}}></div>) : null
                ) : (
                    <div
                    key={'folder' + rowData.full_path_text + 'lines' + i}
                    style={{
                        borderLeft: `2px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
                        marginLeft: i === 0 ? 30 : 10,
                        paddingRight: 8,
                        display: 'inline-block',
                        height: "20px"
                    }}></div>
                )
                
            ))}
            {children === undefined ? (
                <>
                    <div style={{display:"inline-block", height: "100%", width: rowData.depth === 1 ? "1.2rem" : ""}}></div>
                    <TerminalIcon  />
                </>
            ) : rowData.isOpen ? (
                <>
                    <KeyboardArrowDownIcon 
                    style={{
                        
                    }} 
                    onClick={() => {handleOnClickButton(rowData.full_path_text /*+ uniqueSplitString + rowData["callback_id"]*/)}} />
                    <TerminalIcon  />
                  </>
              ) : (
                <>
                <KeyboardArrowRightIcon 
                    style={{  }}
                        onClick={() => {handleOnClickButton(rowData.full_path_text /*+ uniqueSplitString + rowData["callback_id"]*/)}} />
                <TerminalIcon  />
                </>
                  
              )}
            <pre style={{paddingLeft: "2px"}}>
                {treeRootData[host][rowData["full_path_text"] /*+ uniqueSplitString + rowData["callback_id"]*/]?.name_text || "未知 - 缺少数据"}
            </pre>
        </div>
    );
};
const FileBrowserTagsCell = ({rowData, treeRootData, host, me}) => {
    return (
        treeRootData[host][rowData["full_path_text"] /*+ uniqueSplitString + rowData["callback_id"]*/]?.id ? (
            <>
                <ViewEditTags 
                    target_object={"mythictree_id"} 
                    target_object_id={treeRootData[host][rowData["full_path_text"] /*+ uniqueSplitString + rowData["callback_id"]*/]?.id || 0}
                    me={me} />
                <TagsDisplay tags={treeRootData[host][rowData["full_path_text"] /*+ uniqueSplitString + rowData["callback_id"]*/]?.tags || []} />
            </>
        ) : null
    )
}
const FileBrowserTableRowStringCell = ({cellData, treeRootData, host, rowData}) => {
    return (
        <div>{cellData}</div>
    )
}
const FileBrowserTableRowActionCell = ({rowData, onTaskRowAction, treeRootData, host, viewSingleTreeData,
                                           setSingleTree, toggleViewSingleTreeData, tabInfo,
                                           getLoadedCommandForUIFeature}) => {
    const dropdownAnchorRef = React.useRef(null);
    const theme = useTheme();
    const loadingMenuDisplay = {
        name: "正在加载动态菜单项...", icon: null,
        type: "item",
        disabled: true,
        click: ({event}) => {
            event.stopPropagation();
        }
    };
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [viewPermissionsDialogOpen, setViewPermissionsDialogOpen] = React.useState(false);
    const [permissionData, setPermissionData] = React.useState({});
    const [fileCommentDialogOpen, setFileCommentDialogOpen] = React.useState(false);
    const [getPermissions] = useLazyQuery(getPermissionsDataQuery, {
        onCompleted: (data) => {
            setPermissionData({...data.mythictree_by_pk.metadata,
            callback_id: rowData["callback_id"],
            callback_display_id: rowData["callback_display_id"],
            callbacks: rowData['callbacks']});
            setViewPermissionsDialogOpen(true);
        },
        onError: (data) => {
          console.log("获取权限错误", data);
        },
        fetchPolicy: "network-only"
    });
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success('注释已更新');
        },
    });
    const [customMenuOptions, setCustomMenuOptions] = React.useState([loadingMenuDisplay]);
    const onSubmitUpdatedComment = (comment) => {
        updateComment({ variables: { mythictree_id: treeRootData[host][rowData["full_path_text"] /*+ uniqueSplitString + rowData["callback_id"]*/].id, comment: comment } });
    };

    const handleMenuItemClick = (event, click) => {
        click({event});
        setDropdownOpen(false);
    };
    const handleClose = (event) => {
        if (dropdownAnchorRef.current && dropdownAnchorRef.current.contains(event.target)) {
          return;
        }
        setDropdownOpen(false);
        setCustomMenuOptions([loadingMenuDisplay]);
    };
    const optionsA = [
        {
            name: '查看详细数据', icon: <VisibilityIcon style={{paddingRight: "5px"}}/>,
            type: "item", disabled: false,
            click: ({event}) => {
                event.stopPropagation();
                getPermissions({variables: {mythictree_id: rowData.id}});
            }
        },
        {
            name: '编辑注释', type: "item", disabled: false,
            icon: <EditIcon style={{ paddingRight: '5px' }} />,
            click: ({event}) => {
                event.stopPropagation();
                setFileCommentDialogOpen(true);
            },
        },
        {
            name: viewSingleTreeData ? "退出单树视图" : "仅查看此进程树",
            icon: viewSingleTreeData ?
                <VisibilityOffIcon style={{paddingRight: "5px", color: theme.palette.error.main}}/> :
                <AccountTreeIcon style={{paddingRight: "5px", color: theme.palette.success.main}}/>,
            type: "item",
            disabled: false,
            click: ({event}) => {
                setSingleTree(rowData);
                toggleViewSingleTreeData();
            }
        }
    ];
    async function optionsB (callback_id, callback_display_id){
        const injectCommand = await getLoadedCommandForUIFeature(callback_id, "process_browser:inject");
        let injectDisplay = "任务注入（不支持）";
        if(injectCommand !== undefined){
            injectDisplay = `任务注入（${injectCommand.command.cmd}）`
        }
        const tokenListCommand = await getLoadedCommandForUIFeature(callback_id, "process_browser:list_tokens");
        let tokenListDisplay = "任务令牌列表（不支持）";
        if(tokenListCommand !== undefined){
            tokenListDisplay = `任务令牌列表（${tokenListCommand.command.cmd}）`
        }
        const stealTokenCommand = await getLoadedCommandForUIFeature(callback_id, "process_browser:steal_token");
        let stealTokenDisplay = "任务窃取令牌（不支持）";
        if(stealTokenCommand !== undefined){
            stealTokenDisplay = `任务窃取令牌（${stealTokenCommand.command.cmd}）`
        }
        const killProcessCommand = await getLoadedCommandForUIFeature(callback_id, "process_browser:kill");
        let killProcessDisplay = "任务终止进程（不支持）";
        if(killProcessCommand !== undefined){
            killProcessDisplay = `任务终止进程（${killProcessCommand.command.cmd}）`
        }
        return [
            {
                name: injectDisplay, icon: <FontAwesomeIcon icon={faSyringe} style={{paddingRight: "5px", color: theme.palette.warning.main}}/>,
                type: "item",
                disabled: injectCommand === undefined,
                click: ({event}) => {
                    event.stopPropagation();
                    onTaskRowAction({
                        process_id: treeRootData[host][rowData["full_path_text"] ].metadata.process_id,
                        architecture: treeRootData[host][rowData["full_path_text"] ].metadata.architecture,
                        uifeature: "process_browser:inject",
                        callback_id,
                        display_id: callback_display_id
                    });
                }
            },
            {
                name: tokenListDisplay, icon: <ListIcon style={{paddingRight: "5px", color: theme.palette.warning.main}}/>,
                type: "item",
                disabled: tokenListCommand === undefined,
                click: ({event}) => {
                    event.stopPropagation();
                    onTaskRowAction({
                        process_id: treeRootData[host][rowData["full_path_text"] ].metadata.process_id,
                        architecture: treeRootData[host][rowData["full_path_text"] ].metadata.architecture,
                        uifeature: "process_browser:list_tokens",
                        callback_id,
                        display_id: callback_display_id
                    });
                },
                os: ["Windows"]
            },
            {
                name: stealTokenDisplay, icon: <FontAwesomeIcon icon={faKey} style={{paddingRight: "5px", color: theme.palette.error.main}}/>,
                type: "item",
                disabled: stealTokenCommand === undefined,
                click: ({event}) => {
                    event.stopPropagation();
                    onTaskRowAction({
                        process_id: treeRootData[host][rowData["full_path_text"] ].metadata.process_id,
                        architecture: treeRootData[host][rowData["full_path_text"] ].metadata.architecture,
                        uifeature: "process_browser:steal_token",
                        callback_id,
                        display_id: callback_display_id
                    });

                },
                os: ["Windows"]},
            {
                name: killProcessDisplay, icon: <FontAwesomeIcon icon={faSkullCrossbones} style={{paddingRight: "5px", color: theme.palette.error.main}}/>,
                type: "item",
                disabled: killProcessCommand === undefined,
                click: ({event}) => {
                    event.stopPropagation();
                    onTaskRowAction({
                        process_id: treeRootData[host][rowData["full_path_text"] ].metadata.process_id,
                        architecture: treeRootData[host][rowData["full_path_text"] ].metadata.architecture,
                        uifeature: "process_browser:kill",
                        confirm_dialog: true,
                        callback_id,
                        display_id: callback_display_id
                    });
                }
            },
        ];
    }
    async function getMenuOptions() {
        let options = [...optionsA];
        options.push(...(await optionsB(tabInfo["callbackID"], tabInfo["displayID"])));
        if(treeRootData[host][rowData["full_path_text"] ]?.callback?.["id"] !== tabInfo["callbackID"]){
            options.push({
                name: `原始回调：${treeRootData[host][rowData["full_path_text"] ]?.callback?.["id"]}`,
                icon: null, click: () => {}, type: "menu",
                menuItems: [
                    ...(await optionsB(treeRootData[host][rowData["full_path_text"] ]?.callback?.["id"],
                        treeRootData[host][rowData["full_path_text"] ]?.callback?.display_id))
                ]
            })
        }
        return options;
    }
    const handleDropdownToggle = (evt) => {
        evt.stopPropagation();
        setDropdownOpen((prevOpen) => !prevOpen);
        if(!dropdownOpen){
            getMenuOptions().then(r => {
                if(r){
                    setCustomMenuOptions(r);
                }
            });
        } else {
            setCustomMenuOptions([loadingMenuDisplay]);
        }
    };
    return (
        treeRootData[host][rowData["full_path_text"] ]?.id ? (
        <React.Fragment>
            <IconButton
                size="small"
                style={{height: "100%" }}
                aria-controls={dropdownOpen ? 'split-button-menu' : undefined}
                aria-expanded={dropdownOpen ? 'true' : undefined}
                aria-haspopup="menu"
                onClick={handleDropdownToggle}
                color="primary"
                variant="contained"
                ref={dropdownAnchorRef}
            >
                <SettingsIcon />
            </IconButton>
            {dropdownOpen &&
                <ClickAwayListener onClickAway={handleClose} mouseEvent={"onMouseDown"}>
                    <Dropdown
                        isOpen={dropdownAnchorRef.current}
                        onOpen={setDropdownOpen}
                        externallyOpen={dropdownOpen}
                        anchorReference={"anchorEl"}
                        menu={[
                            ...customMenuOptions.map((option, index) => (
                                option.type === 'item' ? (
                                    <DropdownMenuItem
                                        key={option.name}
                                        disabled={option.disabled}
                                        onClick={(event) => handleMenuItemClick(event, option.click)}
                                    >
                                        {option.icon} {option.name}
                                    </DropdownMenuItem>
                                ) : option.type === 'menu'  ? (
                                    <DropdownNestedMenuItem
                                        label={option.name}
                                        disabled={option.disabled}
                                        menu={
                                            option.menuItems.map((menuOption, indx) => (
                                                <DropdownMenuItem
                                                    key={menuOption.name}
                                                    disabled={menuOption.disabled}
                                                    onClick={(event) => handleMenuItemClick(event, menuOption.click)}
                                                >
                                                    {menuOption.icon}{menuOption.name}
                                                </DropdownMenuItem>
                                            ))
                                        }
                                    />
                                ) : null))
                        ]}/>
                </ClickAwayListener>
            }
            {fileCommentDialogOpen && (
                <MythicDialog
                    fullWidth={true}
                    maxWidth='md'
                    open={fileCommentDialogOpen}
                    onClose={() => {
                        setFileCommentDialogOpen(false);
                    }}
                    innerDialog={
                        <MythicModifyStringDialog
                            title='编辑注释'
                            onSubmit={onSubmitUpdatedComment}
                            value={rowData.comment}
                            onClose={() => {
                                setFileCommentDialogOpen(false);
                            }}
                        />
                    }
                />
            )}
            {viewPermissionsDialogOpen &&
                <MythicDialog fullWidth={true} maxWidth="xl" open={viewPermissionsDialogOpen}
                    onClose={()=>{setViewPermissionsDialogOpen(false);}} 
                    innerDialog={<MythicViewJSONAsTableDialog title="查看详细数据" leftColumn="属性" 
                        rightColumn="值" value={permissionData} 
                        onClose={()=>{setViewPermissionsDialogOpen(false);}} 
                        />}
                />
            }
            
        </React.Fragment>
        ) : null
    )
}