---
title: Application
description: MarginNote 应用主对象，通过单例访问窗口、路径与 UI 能力。
---

`Application` 代表 MarginNote 应用本身，通过 `Application.sharedInstance()` 获取单例。用于获取当前窗口、学习控制器、路径以及弹窗/ HUD 等 UI。

## 类成员 (Class members)

### `sharedInstance`

获取全局唯一的应用实例。

```javascript
static sharedInstance(): Application
```

**Return Value:**

- `Application`: 全局应用实例。

## 实例成员 (Instance members)

### 属性（只读）

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `focusWindow` | `UIWindow` | 当前活动窗口（文档中有时写作 `window`，getter 为 window）。 |
| `currentTheme` | `string` | 当前主题，如 `"dark"` / `"light"`。 |
| `dbPath` | `string` | 主数据库文件路径。 |
| `documentPath` | `string` | 文稿目录路径。 |
| `cachePath` | `string` | 缓存目录路径。 |
| `tempPath` | `string` | 临时目录路径。 |
| `osType` | `number` | 系统类型：0 iPadOS，1 iPhoneOS，2 macOS。 |
| `appVersion` | `string` | 应用版本号。 |
| `build` | `string` | 构建号。 |
| `defaultTintColor` | `UIColor` | 默认强调色。 |
| `defaultTintColorForDarkBackground` | `UIColor` | 深色背景下的默认强调色。 |
| `defaultTintColorForSelected` | `UIColor` | 选中态默认强调色。 |
| `defaultBookPageColor` | `UIColor` | 默认书本页色。 |
| `defaultNotebookColor` | `UIColor` | 默认笔记本色。 |
| `defaultTextColor` | `UIColor` | 默认文本色。 |
| `defaultDisableColor` | `UIColor` | 默认禁用色。 |
| `defaultHighlightBlendColor` | `UIColor` | 默认高亮混合色。 |
| `searchManager` | `SearchManager` | 搜索管理器（全文检索/相似搜索等）。 |

### 方法

### `studyController`

获取指定窗口的学习控制器。

```javascript
studyController(window: UIWindow): StudyController
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `window` | `UIWindow` | 目标窗口（通常传 `self.window`）。 |

**Return Value:**

- `StudyController`: 该窗口对应的学习控制器。

### `showHUD`

在指定视图上显示短暂 HUD。

```javascript
showHUD(message: string, view: UIView, duration: number): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `message` | `string` | 要显示的消息文本。 |
| `view` | `UIView` | HUD 的父视图。 |
| `duration` | `number` | 显示时长（秒）。 |

### `waitHUDOnView`

在指定视图上显示等待态 HUD（转圈）。

```javascript
waitHUDOnView(message: string, view: UIView): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `message` | `string` | 提示消息文本。 |
| `view` | `UIView` | HUD 的父视图。 |

### `stopWaitHUDOnView`

停止并移除指定视图上的等待 HUD。

```javascript
stopWaitHUDOnView(view: UIView): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `view` | `UIView` | HUD 所在的父视图。 |

### `alert`

显示系统警告框（阻塞）。

```javascript
alert(message: string): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `message` | `string` | 警告框内容。 |

### `openURL`

打开 URL（网页或 App URL Scheme）。

```javascript
openURL(url: NSURL): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `url` | `NSURL` | 要打开的地址。 |

### `refreshAfterDBChanged`

数据库变更后刷新指定笔记本的界面。

```javascript
refreshAfterDBChanged(topicid: string): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `topicid` | `string` | 笔记本 ID。 |

### `queryCommandWithKeyFlagsInWindow`

查询命令状态（通常用于内部命令系统）。

```javascript
queryCommandWithKeyFlagsInWindow(command: string, keyFlags: any, window: UIWindow): NSDictionary
```

该接口用于查询某个内建command在“当前窗口+修饰键(keyFlags)”上下文里是否可用，以及是否处于勾选态。你可以用它来：

- 判断某个command当前是否能执行（例如编辑态/无焦点时可能禁用）。
- 在调用`processCommandWithKeyFlagsInWindow(...)`之前做保护性判断。

已确认返回值至少包含：

- `disabled:boolean`：是否禁用。
- `checked:boolean`：是否勾选态。

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `command` | `string` | 命令标识。 |
| `keyFlags` | `number` | 按键标记。 |
| `window` | `UIWindow` | 目标窗口。 |

**Return Value:**

- `NSDictionary`: 命令状态信息。

### `processCommandWithKeyFlagsInWindow`

执行命令（通常用于内部命令系统）。

```javascript
processCommandWithKeyFlagsInWindow(command: string, keyFlags: any, window: UIWindow): void
```

该接口用于执行内建command。只要command字符串是系统可识别的命令标识，就可以直接调用执行（例如已确认`ZoomToFit`可执行）。

可用的command列表没有单一集中枚举，建议参考内建command清单页，并在运行时用`queryCommandWithKeyFlagsInWindow`确认`disabled:false`后再执行：

- `/reference/global/builtin-commands/`

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `command` | `string` | 命令标识。 |
| `keyFlags` | `number` | 按键标记。 |
| `window` | `UIWindow` | 目标窗口。 |

### `saveFileWithUti`

保存文件。

```javascript
saveFileWithUti(mfile: string, uti: string): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `mfile` | `string` | 文件路径。 |
| `uti` | `string` | 统一类型标识符 (Uniform Type Identifier)。 |

### `checkNotifySenderInWindow`

检查通知发送者对象是否在指定窗口中。

```javascript
checkNotifySenderInWindow(obj: any, window: UIWindow): boolean
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `obj` | `any` | 通知发送者对象。 |
| `window` | `UIWindow` | 目标窗口。 |

**Return Value:**

- `boolean`: 是否在窗口中。

### `openFileWithUTIs`

按 UTI 打开文件（调用系统文件选择器）。

```javascript
openFileWithUTIs(types: NSArray, controller: UIViewController, block: JSValue): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `types` | `NSArray` | 允许的 UTI 类型数组（字符串）。 |
| `controller` | `UIViewController` | 呈现选择器的父控制器。 |
| `block` | `JSValue` | 选择后的回调函数。 |

### `regsiterHtmlCommentEditor`

注册 HTML 评论编辑器。

```javascript
regsiterHtmlCommentEditor(commentEditor: any, htmlEditor: any, htmlRender: any, commentTag: string): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `commentEditor` | `any` | 评论编辑器配置/对象。 |
| `htmlEditor` | `any` | HTML 编辑器配置/对象。 |
| `htmlRender` | `any` | HTML 渲染器配置/对象。 |
| `commentTag` | `string` | 评论标签标识。 |

### `unregsiterHtmlCommentEditor`

注销 HTML 评论编辑器。

```javascript
unregsiterHtmlCommentEditor(commentTag: string): void
```

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `commentTag` | `string` | 评论标签标识。 |

### `importDocument`

导入文档（由运行时实现决定入库位置与返回值含义）。

```javascript
importDocument(fileUrl: string): string
```

## 相关

- [StudyController](/reference/marginnote/study-controller/) — 由 `studyController(window)` 返回
- [SearchManager](/reference/global/search-manager/) — `searchManager`
- [快速开始](/guides/getting-started/) — 使用 `showHUD` 的示例
