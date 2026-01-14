import React, { useCallback } from 'react';
import { classes } from './styles';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { Dropdown, DropdownMenuItem, DropdownNestedMenuItem } from "../MythicNestedMenus";

const CellPreMemo = ({ style, rowIndex, columnIndex, data }) => {
    const [openContextMenu, setOpenContextMenu] = React.useState(false);
    const rowClassName = data.gridUUID + "row" + rowIndex;
    const rowHighlight = rowIndex % 2 === 1 ? 'MythicResizableGridRowHighlight' : '';
    const [contextMenuOptions, setContextMenuOptions] = React.useState(data?.rowContextMenuOptions || []);
    const dropdownAnchorRef = React.useRef(null);
    const item = data.items[rowIndex][columnIndex];
    const cellStyle = item?.props?.cellData?.cellStyle || {};
    const rowStyle = data.items[rowIndex][columnIndex]?.props?.rowData?.rowStyle || {};
    const contextMenuLocationRef = React.useRef({ x: 0, y: 0 });

    // 双击行事件
    const handleDoubleClick = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            // rowIndex - 1：减去表头行
            data.onDoubleClickRow(
                e,
                rowIndex - 1,
                data.items[rowIndex][columnIndex]?.props?.rowData
            );
        },
        [data, rowIndex]
    );

    // 单击行事件
    const handleClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (data.onRowClick) {
            data.onRowClick({
                event,
                rowDataStatic: data.items[rowIndex][columnIndex]?.props?.rowData
            });
        }
    };

    const selectedClass =
        data.items[rowIndex][columnIndex]?.props?.rowData?.selected
            ? "selectedCallback"
            : "";

    // 鼠标移入，高亮整行
    const onMouseEnter = () => {
        const cells = document.getElementsByClassName(rowClassName);
        if (cells.length > 0) {
            for (const cell of cells) {
                cell.classList.add(classes.hoveredRow);
            }
        }
    };

    // 鼠标移出，取消整行高亮
    const onMouseLeave = () => {
        const cells = document.getElementsByClassName(rowClassName);
        if (cells.length > 0) {
            for (const cell of cells) {
                cell.classList.remove(classes.hoveredRow);
            }
        }
    };

    // 右键菜单项点击
    const handleMenuItemClick = (event, clickOption) => {
        event.preventDefault();
        event.stopPropagation();
        clickOption({
            event,
            columnIndex,
            rowIndex,
            data: data.items[rowIndex][columnIndex]?.props?.rowData || {}
        });
        setOpenContextMenu(false);
    };

    React.useEffect(() => {
        if (!openContextMenu) {
            onMouseLeave();
        }
    }, [openContextMenu]);

    // 右键点击单元格
    const handleContextClick = useCallback(
        (event) => {
            event.preventDefault();
            event.stopPropagation();

            // 禁用右键菜单
            if (item?.disableFilterMenu) {
                return;
            }

            // 记录鼠标位置
            contextMenuLocationRef.current.x = event.clientX;
            contextMenuLocationRef.current.y = event.clientY;

            // 外部动态生成菜单
            if (data.onRowContextMenuClick) {
                const newMenuItems = data.onRowContextMenuClick({
                    rowDataStatic: data.items[rowIndex][columnIndex]?.props?.rowData
                });
                Promise.resolve(newMenuItems).then(function (value) {
                    if (value.length > 0) {
                        setContextMenuOptions(value);
                        setOpenContextMenu(true);
                    }
                });
            } else {
                // 使用已有菜单
                if (contextMenuOptions && contextMenuOptions.length > 0) {
                    setOpenContextMenu(true);
                }
            }
        },
        [contextMenuOptions, data.onRowContextMenuClick] // eslint-disable-line react-hooks/exhaustive-deps
    );

    return (
        <div
            style={{ ...style, ...cellStyle, ...rowStyle }}
            className={`${classes.cell} ${rowClassName} ${rowHighlight} ${selectedClass}`}
            onDoubleClick={handleDoubleClick}
            onClick={handleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onContextMenu={handleContextClick}
            ref={dropdownAnchorRef}
        >
            <div className={classes.cellInner} style={{ height: style.height }}>
                {item}
            </div>

            <ContextMenu
                dropdownAnchorRef={dropdownAnchorRef}
                contextMenuOptions={contextMenuOptions}
                disableFilterMenu={item?.disableFilterMenu}
                openContextMenu={openContextMenu}
                contextMenuLocationRef={contextMenuLocationRef}
                setOpenContextMenu={setOpenContextMenu}
                handleMenuItemClick={handleMenuItemClick}
            />
        </div>
    );
};

export const ContextMenu = ({
    openContextMenu,
    dropdownAnchorRef,
    contextMenuOptions,
    setOpenContextMenu,
    handleMenuItemClick,
    contextMenuLocationRef
}) => {
    // 点击外部关闭菜单
    const handleClose = () => {
        setOpenContextMenu(false);
    };

    return (
        openContextMenu && (
            <ClickAwayListener onClickAway={handleClose} mouseEvent={"onMouseDown"}>
                <Dropdown
                    isOpen={dropdownAnchorRef.current}
                    onOpen={setOpenContextMenu}
                    externallyOpen={openContextMenu}
                    absoluteX={contextMenuLocationRef.current.x}
                    absoluteY={contextMenuLocationRef.current.y}
                    anchorReference={"anchorPosition"}
                    menu={[
                        contextMenuOptions.map((option) =>
                            option.type === 'item' ? (
                                <DropdownMenuItem
                                    key={option.name}
                                    disabled={option.disabled}
                                    onClick={(event) =>
                                        handleMenuItemClick(event, option.click)
                                    }
                                >
                                    {option.icon}
                                    {option.name}
                                </DropdownMenuItem>
                            ) : option.type === 'menu' ? (
                                <DropdownNestedMenuItem
                                    key={option.name}
                                    label={option.name}
                                    disabled={option.disabled}
                                    menu={option.menuItems.map((menuOption) => (
                                        <DropdownMenuItem
                                            key={menuOption.name}
                                            disabled={menuOption.disabled}
                                            onClick={(event) =>
                                                handleMenuItemClick(event, menuOption.click)
                                            }
                                        >
                                            {menuOption.icon}
                                            {menuOption.name}
                                        </DropdownMenuItem>
                                    ))}
                                />
                            ) : null
                        ),
                    ]}
                />
            </ClickAwayListener>
        )
    );
};

const Cell = React.memo(CellPreMemo);
export default Cell;

/*
以下为旧实现（已弃用），使用 MUI Popper + Menu 实现右键菜单

<Popper
    open={openContextMenu}
    anchorEl={dropdownAnchorRef.current}
    role={undefined}
    transition
    disablePortal
    style={{ zIndex: 4 }}
>
    {({ TransitionProps, placement }) => (
        <Grow
            {...TransitionProps}
            style={{
                transformOrigin:
                    placement === 'bottom' ? 'center top' : 'center bottom',
            }}
        >
            <Paper
                variant="outlined"
                style={{
                    backgroundColor:
                        theme.palette.mode === 'dark'
                            ? theme.palette.primary.dark
                            : theme.palette.primary.light,
                    color: 'white',
                }}
            >
                <ClickAwayListener
                    onClickAway={handleClose}
                    mouseEvent={'onMouseDown'}
                >
                    <MenuList id="split-button-menu">
                        {contextMenuOptions.map((option, index) => (
                            <MenuItem
                                key={option.name + index}
                                onClick={(event) =>
                                    handleMenuItemClick(event, index)
                                }
                            >
                                {option.name}
                            </MenuItem>
                        ))}
                    </MenuList>
                </ClickAwayListener>
            </Paper>
        </Grow>
    )}
</Popper>
*/
