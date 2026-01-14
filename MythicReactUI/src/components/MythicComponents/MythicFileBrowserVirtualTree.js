import { alpha } from "@mui/material";
import { styled } from '@mui/material/styles';
import React, { useCallback, useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import {faFolderOpen, faFolder} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ComputerIcon from '@mui/icons-material/Computer';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorIcon from '@mui/icons-material/Error';
import { useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';
import { MythicStyledTooltip } from "./MythicStyledTooltip";
import WidgetsIcon from '@mui/icons-material/Widgets';
import { areEqual } from 'react-window';

const PREFIX = '文件浏览器虚拟树';

const classes = {
  rowContainer: `${PREFIX}-行容器`,
  row: `${PREFIX}-行`,
  rowButtonWrapper: `${PREFIX}-行按钮包装器`,
  rowButton: `${PREFIX}-行按钮`,
  rowLabel: `${PREFIX}-行标签`,
  heading: `${PREFIX}-标题`,
  secondaryHeading: `${PREFIX}-副标题`,
  taskAndTimeDisplay: `${PREFIX}-任务和时间显示`,
  secondaryHeadingExpanded: `${PREFIX}-副标题展开`,
  icon: `${PREFIX}-图标`,
  details: `${PREFIX}-详情`,
  column: `${PREFIX}-列`,
  paper: `${PREFIX}-纸张`,
  table: `${PREFIX}-表格`,
  visuallyHidden: `${PREFIX}-视觉隐藏`
};

const StyledAutoSizer = styled(AutoSizer)((
  {
    theme
  }
) => ({
  [`& .${classes.rowContainer}`]: {},

  [`& .${classes.row}`]: {
    display: "flex",
    alignItems: "left",
    marginLeft: (props) => theme.spacing(3 * props.depth),
    userSelect: "none",
    whiteSpace: "nowrap"
  },

  [`& .${classes.rowButtonWrapper}`]: {
    width: theme.spacing(3),
    textAlign: "center",
    "&:hover": {
      cursor: "pointer",
      textDecoration: "underline"
    }
  },

  [`& .${classes.rowButton}`]: {
    width: theme.spacing(3)
  },

  [`& .${classes.rowLabel}`]: {
    marginLeft: theme.spacing(0.5)
  },

  [`& .${classes.heading}`]: {
    fontSize: theme.typography.pxToRem(15),
    whiteSpace: 'pre-line',
},

  [`& .${classes.secondaryHeading}`]: {
      fontSize: theme.typography.pxToRem(15),
      //color: theme.palette.text.secondary,
      overflow: 'hidden',
      display: 'block',
      textOverflow: 'ellipsis',
      maxWidth: 'calc(90vw)',
      whiteSpace: 'nowrap',
  },

  [`& .${classes.taskAndTimeDisplay}`]: {
      fontSize: theme.typography.pxToRem(12),
      color: theme.palette.text.secondary,
      overflow: 'hidden',
      display: 'block',
      textOverflow: 'ellipsis',
      maxWidth: 'calc(90vw)',
      whiteSpace: 'nowrap',
  },

  [`& .${classes.secondaryHeadingExpanded}`]: {
      fontSize: theme.typography.pxToRem(15),
      //color: theme.palette.text.secondary,
      display: 'block',
      overflow: 'auto',
      maxWidth: 'calc(90vw)',
      whiteSpace: 'break-word',
  },

  [`& .${classes.icon}`]: {
      verticalAlign: 'middle',
      height: 20,
      width: 20,
  },

  [`& .${classes.details}`]: {
      alignItems: 'center',
  },

  [`& .${classes.column}`]: {
      padding: '0 5px 0 0',
      display: 'inline-block',
      margin: 0,
      height: 'auto',
  },

  [`& .${classes.paper}`]: {
      width: '100%',
      marginBottom: theme.spacing(2),
  },

  [`& .${classes.table}`]: {
      minWidth: 750,
  },

  [`& .${classes.visuallyHidden}`]: {
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: 1,
      margin: -1,
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      top: 20,
      width: 1,
  }
}));
function itemKey(index, data) {
    // 查找指定索引处的项目
    // 在这里，"data"是作为"itemData"传递给List的数组
    const item = data[index];
    if(item.root){
        return `${item.group};${item.id}`;
    }
    if(item.is_group){
        return item.group;
    }
    return `${item.group};${item.host};${item.full_path_text}`;
}
const VirtualTreeRow = React.memo(({
  onSelectNode,
  onExpandNode,
  onCollapseNode,
  onDoubleClickNode,
  onContextMenu,
  tabInfo,
  selectedFolderData,
  ...ListProps
}) => {
  const itemTreeData = ListProps.data[ListProps.index];
  const item = ListProps.treeRootData[itemTreeData.group]?.[itemTreeData.host]?.[itemTreeData.full_path_text] || itemTreeData;
  const theme = useTheme();
  const handleOnClickButton = (e) => {
    e.stopPropagation();
    if (itemTreeData.isOpen) {
      onCollapseNode(item.id, {...item, group: itemTreeData.group, host: itemTreeData.host});
    } else {
      onExpandNode(item.id,  {...item, group: itemTreeData.group, host: itemTreeData.host});
    }
  };
  const handleOnClickRow = (e) => {
      onSelectNode(item.id,  {...item, group: itemTreeData.group, host: itemTreeData.host});
  };
  const handleContextClick = (e) => {
      onContextMenu({event: e, item, itemTreeData});
  }
  const selectedPath = () => {
      if(itemTreeData.group === selectedFolderData.group && itemTreeData.host === selectedFolderData.host){
          if(itemTreeData.root){
              return "selectedCallbackHierarchy";
          }
          if(selectedFolderData.full_path_text === itemTreeData.full_path_text){
              return "selectedCallback";
          }
      }
      return "";
    }
  return (
    <div className={`hoverme ${selectedPath()}`}
         style={ListProps.style}
         onContextMenu={handleContextClick}
         onClick={handleOnClickRow}>
    <div style={{display: 'flex' , marginBottom: "1px", flexGrow: 1, width: "100%"}}>
        {[...Array(itemTreeData.depth)].map((o, i) => (
            <div
                key={'folder' + itemTreeData.id + 'lines' + i}
                style={{
                    borderLeft: `2px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
                    marginLeft: 7,
                    paddingRight: 7,
                    display: 'inline-block',
                }}></div>
        ))}
        <div
          className={classes.root}
          style={{ backgroundColor: theme.body, color: theme.text, alignItems: 'center', display: 'flex', paddingRight: "10px", textDecoration: itemTreeData.deleted ? 'line-through' : ''  }}

          >

          {itemTreeData.is_group ? (
              <WidgetsIcon style={{
                  width: "15px",
                  height: "15px",
                  marginLeft: "3px",
                  marginRight: "5px" }} />
          ): itemTreeData.root  ? (
              <ComputerIcon style={{
                  width: "15px",
                  height: "15px",
                  marginLeft: '3px',
                  marginRight: '5px' }}  />
          ) : !itemTreeData.can_have_children ? (
              <DescriptionIcon style={{
                  width: "15px",
                  height: "15px",
                  marginLeft: '3px',
                  marginRight: '5px' }} />
          ) : itemTreeData.isOpen ? (
            <FontAwesomeIcon 
              icon={faFolderOpen} 
              style={{
                  width: "15px",
                  height: "15px",
                marginLeft: '3px',
                marginRight: '5px',
                color: item?.has_children || item.success ? theme.folderColor : theme.emptyFolderColor,
              }}
              size={"lg"}
              onClick={handleOnClickButton} />
          ) : (
              <FontAwesomeIcon 
                style={{
                    width: "15px",
                    height: "15px",
                    marginLeft: '3px',
                    marginRight: '5px',
                    color: item?.has_children || item.success ? theme.folderColor : theme.emptyFolderColor, }}
                size={"lg"}
                icon={faFolder} onClick={handleOnClickButton} />
          )}
          <Typography
              style={{
                  color:
                      item?.has_children ||
                      item.success !== null
                          ? theme.palette.text.primary
                          : theme.palette.text.secondary,
              }} component="pre">
              {itemTreeData.name}
          </Typography>

          {item.success === true && itemTreeData.depth > 0 ? (
              <MythicStyledTooltip title='成功列出文件夹内容' style={{display: "inline-flex", marginLeft: "5px"}}>
                  <CheckCircleOutlineIcon fontSize='small' color="success" />
              </MythicStyledTooltip>
          ) : item.success === false && itemTreeData.depth > 0 ? (
              <MythicStyledTooltip title='列出文件夹内容失败' style={{display: "inline-flex", marginLeft: "5px"}}>
                  <ErrorIcon fontSize='small' color="error" />
              </MythicStyledTooltip>
          ) : null}

      </div>
    </div>
    </div>
  );
}, areEqual);
const caseInsensitiveCompare = (a, b) => {
    try{
        return a.localeCompare(b);
    }catch(error){
        console.log("localeCompare 失败，参数：", a, b);
        return a < b;
    }
}
const FileBrowserVirtualTreePreMemo = ({
  treeRootData,
  treeAdjMatrix,
  openNodes,
  onSelectNode,
  onExpandNode,
  onCollapseNode,
  onContextMenu,
  showDeletedFiles,
  selectedFolderData,
  tabInfo,
}) => {
    const gridRef = React.useRef(null);
  const flattenNode = useCallback(
    // node 只是 full_path_text
    (node, group, host, depth = 0) => {
      if(depth === 0){
        return [
          {
            id: treeRootData[group]?.[host]?.[node].id,
            name: treeRootData[group]?.[host]?.[node].name_text,
            full_path_text: treeRootData[group]?.[host]?.[node].full_path_text,
            deleted: treeRootData[group]?.[host]?.[node].deleted,
            depth,
            isLeaf: Object.keys(treeAdjMatrix[group]?.[host]?.[node] || {}).length === 0,
            can_have_children: treeRootData[group]?.[host]?.[node].can_have_children,
            isOpen: true,
            children: (treeAdjMatrix[group][host]?.[node] || {}),
            host,
            group,
            root: true
          },
          ...(Object.keys(treeAdjMatrix[group]?.[host]?.[node] || {})).sort(caseInsensitiveCompare).reduce( (prev, cur) => {
            if(!treeRootData[group][host][cur].can_have_children){return [...prev]}
            return [...prev, flattenNode(cur, group, host, depth+1)];
        }, []).flat()
        ];
      }
      if (openNodes[`${group};${host};${treeRootData[group][host][node].full_path_text}`] === true) {
        return [
          {
            id: treeRootData[group][host][node].id,
            name: treeRootData[group][host][node].name_text,
            full_path_text: treeRootData[group][host][node].full_path_text,
            deleted: treeRootData[group][host][node].deleted,
            depth,
            isLeaf: Object.keys(treeAdjMatrix[group]?.[host]?.[node] || {}).length === 0,
            can_have_children: treeRootData[group][host][node].can_have_children,
            isOpen: true,
            children: (treeAdjMatrix[group]?.[host]?.[node] || {}),
            host,
            group,
            root: false,
          },
          ...(Object.keys(treeAdjMatrix[group]?.[host]?.[node] || {})).sort(caseInsensitiveCompare).reduce( (prev, cur) => {
            if(!treeRootData[group][host][cur].can_have_children){return [...prev]}
            if(!showDeletedFiles && treeRootData[group][host][cur].deleted){return [...prev]}
            return [...prev, flattenNode(cur, group, host, depth+1)];
        }, []).flat()
        ];
      }
      return [
        {
          id: treeRootData[group]?.[host]?.[node].id,
          name: treeRootData[group]?.[host]?.[node].name_text,
          full_path_text: treeRootData[group]?.[host]?.[node].full_path_text,
          deleted: treeRootData[group]?.[host]?.[node].deleted,
          depth,
          isLeaf: Object.keys(treeAdjMatrix[group]?.[host]?.[node] || {}).length === 0,
          can_have_children: treeRootData[group]?.[host]?.[node].can_have_children,
          isOpen: false,
          children: (treeAdjMatrix[group]?.[host]?.[node] || {}),
          host,
          group,
          root: false,
        }
      ];
     
    },
    [openNodes, showDeletedFiles, treeAdjMatrix] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const flattenedNodes = useMemo(() => {
    let finalData = [];
      const groupKeys = Object.keys(treeAdjMatrix).sort(caseInsensitiveCompare);
      for(let i = 0; i < groupKeys.length; i++){
        finalData.push({
            id: groupKeys[i],
            name: groupKeys[i],
            depth: 0,
            isLeaf: false,
            isOpen: true,
            can_have_children: true,
            root: false,
            group: groupKeys[i],
            is_group: true,
            deleted: false,
            success: true,
            children: treeAdjMatrix[groupKeys[i]],
            full_path_text: groupKeys[i],
        });
        const hostKeys = Object.keys(treeAdjMatrix[groupKeys[i]]).sort(caseInsensitiveCompare);
        for(let j = 0; j < hostKeys.length; j++){
            finalData.push({
                id: hostKeys[j],
                name: hostKeys[j],
                depth: 1,
                isLeaf: false,
                isOpen: true,
                can_have_children: true,
                host: hostKeys[j],
                group: groupKeys[i],
                root: true,
                deleted: false,
                children: treeAdjMatrix[groupKeys[i]][hostKeys[j]][""],
                full_path_text: hostKeys[j],
            });
            finalData.push(...Object.keys(treeAdjMatrix[groupKeys[i]][hostKeys[j]][""]).sort(caseInsensitiveCompare).reduce((prev, c) => {
                if(!showDeletedFiles && c.deleted) {
                    return [...prev];
                } else {
                    return [...prev, ...flattenNode(c, groupKeys[i], hostKeys[j], 2)]
                }
            }, []).flat())
        }
    }
    return finalData;
  },[flattenNode, treeRootData, treeAdjMatrix, showDeletedFiles]);
  React.useEffect( () => {
      let rowIndex = flattenedNodes?.findIndex(e =>
          e.full_path_text === selectedFolderData.full_path_text &&
          e.host === selectedFolderData.host &&
          e.group === selectedFolderData.group
      );
      if(rowIndex >= 0){
          if(gridRef.current){
              gridRef.current?.scrollToItem(rowIndex, "smart")
          }
      }
  }, [selectedFolderData, flattenedNodes]);
  return flattenedNodes.length > 0 ? (
    <StyledAutoSizer>
    {(AutoSizerProps) => (
      <List
        itemData={flattenedNodes}
        layout="vertical"
        height={AutoSizerProps.height}
        width={AutoSizerProps.width}
        itemCount={flattenedNodes.length}
        itemKey={itemKey}
        itemSize={24}
        ref={gridRef}
      >
        {(ListProps) => (
          <VirtualTreeRow
            {...ListProps}
            tabInfo={tabInfo}
            selectedFolderData={selectedFolderData}
            treeRootData={treeRootData}
            onSelectNode={onSelectNode}
            onExpandNode={onExpandNode}
            onCollapseNode={onCollapseNode}
            onContextMenu={onContextMenu}
          />
        )}
      </List>
    )}
  </StyledAutoSizer>
  ) : null;
};
export const FileBrowserVirtualTree = React.memo(FileBrowserVirtualTreePreMemo);