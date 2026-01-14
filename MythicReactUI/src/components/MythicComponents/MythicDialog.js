import React, { useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { toLocalTime } from '../utilities/Time';
import AceEditor from 'react-ace';
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-searchbox";
import { useTheme } from '@mui/material/styles';
import WrapTextIcon from '@mui/icons-material/WrapText';
import { IconButton } from '@mui/material';
import { MythicStyledTooltip } from "./MythicStyledTooltip";

export function MythicDialog(props) {
    const descriptionElementRef = React.useRef(null);
    React.useEffect(() => {
        if (props.open) {
            const { current: descriptionElement } = descriptionElementRef;
            if (descriptionElement !== null) {
                descriptionElement.focus();
            }
        }
    }, [props.open]);
    const dialogOnClick = (e) => {
        e.stopPropagation();
        if (e.target.classList.length > 0 && e.target.classList.contains("MuiDialog-container")) {
            props.onClose();
        }
    }
    const dialogOnContextMenu = (e) => {
        e.stopPropagation();
    }
    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            scroll="paper"
            maxWidth={props.maxWidth}
            fullWidth={props.fullWidth}
            style={props.style}
            aria-labelledby="滚动对话框标题"
            aria-describedby="滚动对话框描述"
            onMouseDown={dialogOnClick}
            onContextMenu={dialogOnContextMenu}
        >
            {props.innerDialog}
        </Dialog>
    );
}

export function MythicModifyStringDialog(props) {
    const [comment, setComment] = React.useState("");
    const [wrap, setWrap] = React.useState(props.wrap ? props.wrap : false);
    const theme = useTheme();
    const onCommitSubmit = () => {
        props.onSubmit(comment);
        if (props.dontCloseOnSubmit) {
            return;
        }
        props.onClose();
    }
    const onChange = (value) => {
        setComment(value);
    }
    useEffect(() => {
        try {
            setComment(JSON.stringify(JSON.parse(props.value), null, 2));
        } catch (error) {
            setComment(props.value);
        }
    }, [props.value]);
    return (
        <React.Fragment>
            {props.title !== "" &&
                <DialogTitle id="表单对话框标题">{props.title}
                    <MythicStyledTooltip title={wrap ? "关闭自动换行" : "开启自动换行"}
                        tooltipStyle={{ float: "right" }}>
                        <IconButton onClick={() => { setWrap(!wrap) }}>
                            <WrapTextIcon color={wrap ? "success" : "secondary"} />
                        </IconButton>
                    </MythicStyledTooltip>
                </DialogTitle>
            }
            <DialogContent dividers={true} style={{ height: "100%", margin: 0, padding: 0 }}>
                <AceEditor
                    mode="json"
                    theme={theme.palette.mode === 'dark' ? 'monokai' : 'github'}
                    width="100%"
                    fontSize={14}
                    showPrintMargin={false}
                    wrapEnabled={wrap}
                    value={comment}
                    focus={true}
                    onChange={onChange}
                    setOptions={{
                        tabSize: 4,
                        useWorker: false,
                        showInvisibles: false,
                    }}
                />
            </DialogContent>
            {(props.onClose || props.onSubmit) &&
                <DialogActions>
                    {props.onClose &&
                        <Button onClick={props.onClose} variant="contained" color="primary">
                            关闭
                        </Button>
                    }
                    {props.onSubmit &&
                        <Button onClick={onCommitSubmit} variant="contained" color="success">
                            {props.onSubmitText ? props.onSubmitText : "提交"}
                        </Button>
                    }
                </DialogActions>
            }
        </React.Fragment>
    );
}

export function MythicViewJSONAsTableDialog(props) {
    const [comment, setComment] = React.useState([]);
    const [tableType, setTableType] = React.useState("字典");
    const [headers, setHeaders] = React.useState([]);
    useEffect(() => {
        let permissions = [];
        try {
            let permissionDict;
            if (props.value.constructor === Object) {
                permissionDict = props.value;
            } else {
                permissionDict = JSON.parse(props.value);
            }

            if (!Array.isArray(permissionDict) && typeof permissionDict !== 'string') {
                for (let key in permissionDict) {
                    if (permissionDict[key] && permissionDict[key].constructor === Object) {
                        // 可能是嵌套字典或要转换为字典的数组，标记它
                        permissions.push({ "name": key, "value": permissionDict[key], new_table: true, is_dictionary: true, headers: ["名称", "值"] });
                    } else if (permissionDict[key] && Array.isArray(permissionDict[key])) {
                        if (permissionDict[key].length === 1) {
                            if (permissionDict[key][0].constructor === Object) {
                                permissions.push({ "name": key, "value": permissionDict[key][0], new_table: true, is_dictionary: true, headers: ["名称", "值"] });
                            } else {
                                permissions.push({ "name": key, "value": JSON.stringify(permissionDict[key], null, 2) });
                            }
                        } else if (permissionDict[key].length > 1) {
                            if (permissionDict[key][0].constructor === Object) {
                                let newHeaders = [];
                                for (let i = 0; i < permissionDict[key].length; i++) {
                                    for (let newKey in permissionDict[key][i]) {
                                        if (!newHeaders.includes(newKey)) { newHeaders.push(newKey) }
                                    }
                                }
                                newHeaders.sort()
                                permissions.push({ "name": key, "value": permissionDict[key], new_table: true, is_array: true, headers: newHeaders });
                            } else {
                                // 这是一个数组，但不是字典数组，所以只进行字符串化
                                permissions.push({ "name": key, "value": JSON.stringify(permissionDict[key], null, 2) });
                            }
                        } else {
                            permissions.push({ "name": key, "value": JSON.stringify(permissionDict[key], null, 2) });
                        }
                    } else if (permissionDict[key] !== undefined && permissionDict[key] !== null) {
                        permissions.push({ "name": key, "value": permissionDict[key] });
                    }
                    setHeaders([props.leftColumn, props.rightColumn]);
                }
            } else {
                setTableType("数组");
                if (permissionDict.length > 0) {
                    setHeaders(Object.keys(permissionDict[0]));
                    permissions = permissionDict;
                } else {
                    setHeaders([]);
                }
            }
        } catch (error) {
            console.log(error);
        }
        setComment(permissions);
    }, [props.value, props.leftColumn, props.rightColumn]);
    return (
        <React.Fragment>
            <DialogTitle id="表单对话框标题" style={{ wordBreak: "break-all", maxWidth: "100%" }}>{props.title}</DialogTitle>

            <TableContainer className="mythicElement" style={{ paddingLeft: "10px" }}>
                <Table size="small" style={{ "tableLayout": "fixed", "maxWidth": "calc(100vw)", "overflow": "scroll" }}>
                    <TableHead>
                        <TableRow>
                            {headers.map((header, index) => (
                                <TableCell key={'header' + index} style={index === 0 ? { width: "15%", wordBreak: "break-all" } : { wordBreak: "break-all" }}>{header}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tableType === "字典" ? (
                            comment.map((element, index) => (
                                <TableRow key={'row' + index} hover>
                                    <TableCell style={{ wordBreak: "break-all" }}>{element.name}</TableCell>
                                    {element.new_table ?
                                        (
                                            <TableContainer className="mythicElement">
                                                <Table size="small" style={{ "tableLayout": "fixed", "maxWidth": "calc(100vw)", "overflow": "scroll" }}>
                                                    <TableHead>
                                                        <TableRow>
                                                            {element.headers.map((header, index) => (
                                                                <TableCell key={'eheader' + header + index} style={index === 0 ? { width: "15%", wordBreak: "break-all" } : { wordBreak: "break-all" }}>{header}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {element.is_dictionary ? (
                                                            Object.keys(element.value).map((key, dictIndex) => (
                                                                <TableRow key={'element' + dictIndex + "dictheader"}>
                                                                    <TableCell style={{ width: "30%", wordBreak: "break-all" }}>{key}</TableCell>
                                                                    <TableCell style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>{convertValueToContextValue(key, element.value[key], props.me)}</TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            element.value.map((e, elementIndex) => (
                                                                <TableRow key={'element' + elementIndex + "header" + element.headers[0]}>
                                                                    {element.headers.map((header, headerIndex) => (
                                                                        <TableCell key={'element' + elementIndex + "header" + headerIndex} style={headerIndex === 0 ? { width: "15%", wordBreak: "break-all" } : { wordBreak: "break-all", whiteSpace: "pre-wrap" }}>{convertValueToContextValue(header, e[header], props.me)}</TableCell>
                                                                    ))}
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )
                                        :
                                        (<TableCell style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>{convertValueToContextValue(element.name, element.value, props.me)}</TableCell>)
                                    }
                                </TableRow>
                            ))
                        ) : (
                            comment.map((row, index) => (
                                <TableRow key={'row' + index} hover>
                                    {Object.keys(row).map((key) => (
                                        <TableCell key={"row" + index + "cell" + key} style={{ wordBreak: "break-all" }}>{convertValueToContextValue(key, row[key], props.me)}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <DialogActions>
                <Button onClick={props.onClose} variant="contained" color="primary">
                    关闭
                </Button>
            </DialogActions>
        </React.Fragment>
    );
}

export function MythicViewObjectPropertiesAsTableDialog(props) {
    const [comment, setComment] = React.useState([]);
    useEffect(() => {
        const permissions = props.keys.reduce((prev, key) => {
            if (props.value[key] !== undefined && props.value[key] !== null && props.value[key] !== "") {
                return [...prev, { "name": key, "value": props.value[key] }]
            }
            else {
                return [...prev];
            }
        }, []);

        setComment(permissions);
    }, [props.value, props.keys]);
    return (
        <React.Fragment>
            <DialogTitle id="表单对话框标题">{props.title}</DialogTitle>
            <DialogContent dividers={true}>
                <Paper elevation={5} style={{ position: "relative" }} variant={"elevation"}>
                    <TableContainer component={Paper} className="mythicElement">
                        <Table size="small" style={{ "tableLayout": "fixed", "maxWidth": "calc(100vw)", "overflow": "scroll" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{props.leftColumn}</TableCell>
                                    <TableCell>{props.rightColumn}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {comment.map((element, index) => (
                                    <TableRow key={'row' + index}>
                                        <TableCell style={{ wordBreak: "break-all" }}>{element.name}</TableCell>
                                        <TableCell style={{ wordBreak: "break-all" }}>{convertValueToContextValue(element.name, element.value)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} variant="contained" color="primary">
                    关闭
                </Button>
            </DialogActions>
        </React.Fragment>
    );
}

const convertValueToContextValue = (key, value, me) => {
    if (key.includes("time")) {
        try {
            return TableRowDateCell({ cellData: value, view_utc_time: me?.user?.view_utc_time })
        } catch (error) {
            console.log("无法将元数据解析为日期", key, value);
            return value;
        }
    } else if (key.includes("size")) {
        try {
            return TableRowSizeCell({ cellData: value })
        } catch (error) {
            console.log("无法将元数据解析为大小", key, value);
            return value;
        }
    } else if (value.constructor === Object) {
        return JSON.stringify(value, null, 2);
    } else if (Array.isArray(value)) {
        return JSON.stringify(value, null, 2);
    } else if (value === true) {
        return "是";
    } else if (value === false) {
        return "否";
    } else {
        return value;
    }
}

export const TableRowDateCell = ({ cellData, rowData, view_utc_time = true }) => {
    try {
        let cellDataInt = parseInt(cellData)
        if (cellData === "" || cellData === undefined || cellDataInt <= 0) {
            return "";
        }
        let view_utc = true;
        if (view_utc_time !== undefined) {
            view_utc = view_utc_time
        }
        // 处理 Unix 时间戳
        if (view_utc) {
            let init_date = new Date(cellDataInt);
            return init_date.toDateString() + " " + init_date.toTimeString().substring(0, 8) + " UTC";
        } else {
            let timezoneDate = new Date(cellDataInt);
            timezoneDate.setTime(timezoneDate.getTime() - (timezoneDate.getTimezoneOffset() * 60 * 1000));
            return timezoneDate.toLocaleDateString() + " " + timezoneDate.toLocaleString([], { hour12: true, hour: "2-digit", minute: "2-digit" });
        }
    } catch (error) {
        try {
            let cellDataInt = parseInt(cellData)
            // 处理 Windows FILETIME 值
            const dateData = new Date(((cellDataInt / 10000000) - 11644473600) * 1000).toISOString();
            return toLocalTime(dateData.slice(0, 10) + " " + dateData.slice(11, -1), view_utc_time);
        } catch (error2) {
            console.log("时间戳错误：", cellData);
            return String(cellData);
        }
    }
};

export const TableRowSizeCell = ({ cellData, rowData }) => {
    const getStringSize = () => {
        try {
            // 从字节获取人类可读字符串的处理方法：https://stackoverflow.com/a/18650828
            let bytes = parseInt(cellData);
            if (cellData === '' || cellData === undefined) return '';
            if (bytes === 0) return '0 B';
            const decimals = 2;
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        } catch (error) {
            return cellData;
        }
    };
    return getStringSize(cellData);
};