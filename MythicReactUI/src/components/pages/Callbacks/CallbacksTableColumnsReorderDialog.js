import React from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import {reorder} from "../../MythicComponents/MythicDraggableList";
import {
    Draggable,
    DragDropContext,
    Droppable,
} from "@hello-pangea/dnd";
import { List, ListItem, ListItemText, Paper } from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';

export function CallbacksTableColumnsReorderDialog({initialItems, onSubmit, onClose, onReset, visible, hidden}) {
    const [items, setItems] = React.useState(initialItems);
    const theme = useTheme();
    
    // 处理拖拽结束事件
    const onDragEnd = ({ destination, source }) => {
        // 如果拖拽到列表外则返回
        if (!destination) return;
        const newItems = reorder(items, source.index, destination.index);
        setItems(newItems);
    };
    
    React.useEffect( () => {
        // 根据可见性设置更新项目状态
        const newItems = items.map( c => {
            if(visible.includes(c.name)){
                return {...c, visible: true};
            }
            return {...c, visible: false};
        })
        setItems(newItems);
    }, [visible, hidden]);
    
    // 切换列的可见性
    const onToggleVisibility = (i) => {
        const newItems = items.map( (c, index) => {
            if(index === i){
                return {...c, visible: !c.visible};
            }
            return {...c};
        });
        setItems(newItems);
    }
    
    const onFinish = () => {
        onSubmit(items);
    }

  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">拖拽调整顺序并切换列可见性</DialogTitle>
        <DialogContent 
            dividers={true} 
            style={{
                height: "100%", 
                margin: 0, 
                padding: 0, 
                background: theme.palette.background.main
            }}
        >
            <DraggableList 
                items={items} 
                onToggleVisibility={onToggleVisibility} 
                onDragEnd={onDragEnd} 
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained" color="primary">
            关闭
          </Button>
            <Button onClick={onReset} variant="contained" color="warning">
                重置
            </Button>
          <Button onClick={onFinish} variant="contained" color="success">
            提交
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

// 可拖拽列表组件
export const DraggableList = ({ items, onDragEnd, onToggleVisibility }) => {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="callback-table-column-list">
                {(provided) => (
                    <List 
                        style={{border: 0, padding: 0}} 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                    >
                        {items.map((item, index) => (
                            <DraggableListItem 
                                onToggleVisibility={onToggleVisibility} 
                                item={item} 
                                index={index} 
                                key={item.key} 
                            />
                        ))}
                        {provided.placeholder}
                    </List>
                )}
            </Droppable>
        </DragDropContext>
    );
};

// 可拖拽列表项组件
export const DraggableListItem = ({ item, index, onToggleVisibility }) => {
    const theme = useTheme();
    return (
        <Draggable draggableId={item.key} index={index}>
            {(provided, snapshot) => (
                <ListItem
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    component={Paper}
                    disabled={!item.visible}
                    sx={snapshot.isDragging ? { 
                        background: theme.palette.secondary.main 
                    } : {}}
                >
                    <DragHandleIcon style={{marginRight: "10px"}}/>
                    <ListItemText primary={item.name} />
                    <IconButton 
                        onClick={() => onToggleVisibility(index)} 
                        style={{float: "right", margin: 0, padding: 0}}
                    >
                        {item.visible ? (
                            <VisibilityIcon color={"success"} />
                        ) : (
                            <VisibilityOffIcon color={"error"} />
                        )}
                    </IconButton>
                </ListItem>
            )}
        </Draggable>
    );
};