---
title: JSExtension
description: 插件主类必须继承的基类，处理生命周期与工具栏命令。
---

你的插件主类必须通过 `JSB.defineClass('MyAddon : JSExtension', ...)` 继承 JSExtension，用于处理窗口/笔记本/文档的生命周期以及工具栏图标状态。

## 实例成员 (Instance members)

### 属性（只读）

| 属性 | 类型 | 说明 |
|------|------|------|
| `window` | `UIWindow` | 当前插件所在窗口。在实例方法内也可用 `self.window`。 |

### 实例方法（生命周期）

| 方法 | 参数 | 说明 |
|------|------|------|
| `sceneWillConnect()` | — | 插件窗口即将创建时调用，可在此做 UI 初始化。 |
| `sceneDidDisconnect()` | — | 插件窗口断开时调用。 |
| `sceneWillResignActive()` | — | 窗口即将失去活跃时调用。 |
| `sceneDidBecomeActive()` | — | 窗口变为活跃时调用。 |
| `notebookWillOpen(topicid)` | `topicid`: string | 某个笔记本即将打开时调用。 |
| `notebookWillClose(topicid)` | `topicid`: string | 某个笔记本即将关闭时调用。 |
| `documentDidOpen(docmd5)` | `docmd5`: string | 某文档已打开时调用。 |
| `documentWillClose(docmd5)` | `docmd5`: string | 某文档即将关闭时调用。 |

### 实例方法（工具栏与扩展）

| 方法 | 返回值/参数 | 说明 |
|------|-------------|------|
| `queryAddonCommandStatus()` | `NSDictionary` \| null | MarginNote 用来决定工具栏图标状态。必须返回包含 `image`、`object`、`selector`、`checked` 的对象；不显示图标可返回 null。 |
| `additionalTitleLinksOfNotebook(topicid)` | `NSArray` | 为指定笔记本提供额外标题链接。 |
| `viewControllerForTitleLink(titleLink)` | `UIViewController` | 根据标题链接返回对应视图控制器。 |
| `controllerWillLayoutSubviews(controller)` | `controller`: UIViewController | 指定控制器即将布局子视图时调用，可在此调整插件面板位置。 |
| `additionalShortcutKeys()` | `NSArray` | 返回插件提供的额外快捷键。 |
| `queryShortcutKeyWithKeyFlags(command, keyFlags)` | `NSDictionary` | 查询某快捷键的状态。 |
| `processShortcutKeyWithKeyFlags(command, keyFlags)` | — | 处理快捷键按下。 |

## 快捷键（additionalShortcutKeys/query/process）

### `additionalShortcutKeys()`返回值结构

`additionalShortcutKeys()`应返回一个数组，数组元素为“字典项”（Dictionary）。系统会读取这些字典项并构造对应的键盘命令。

目前已确认字典项的核心字段如下：

| 字段 | 类型 | 说明 |
|---|---|---|
| `input` | `string` | 按键输入，例如`"UIKeyInputLeftArrow"`、`"z"`、`"["`等。 |
| `flags` | `number` | 修饰键位掩码（见下方keyFlags表）。 |
| `title` | `string` | 用于显示的标题（例如出现在快捷键列表中）。 |

说明：该接口不是直接返回`UIKeyCommand[]`。

### `queryShortcutKeyWithKeyFlags(command,keyFlags)`语义

`queryShortcutKeyWithKeyFlags(command,keyFlags)`用于“查询状态”，系统可能在以下场景批量调用它：

- 判断当前上下文哪些快捷键可用（disabled/checked状态）。
- 重建或刷新键盘命令列表（keyCommands）。
- 某些焦点/编辑态变化引发的状态刷新。

因此你可能“只按了一次Left”，但看到大量不同的`command`与`keyFlags`日志。这是正常现象。

#### command的两类来源

已确认`command`可能来自两条路径：

- 内建命令名：例如`NewChildNote`、`ToggleExpand`、`EditAddTitle`等。
- 输入常量/字符：例如`UIKeyInputLeftArrow`、`UIKeyInputUpArrow`，以及`z`这类字符输入。

建议：在query里只匹配你关心的组合键，其余直接`return null`保持静默；不要在query里做任何数据库/笔记结构修改。

返回值通常包含：

- `disabled:boolean`：是否不可用。
- `checked:boolean`：是否勾选态（用于UI状态展示）。

### `processShortcutKeyWithKeyFlags(command,keyFlags)`语义

`processShortcutKeyWithKeyFlags(command,keyFlags)`用于“处理按下”，真正的业务动作应放在这里（例如outdent/移动层级等）。建议遵循：

- query只返回状态，不产生副作用。
- process里执行操作，并用`UndoManager.undoGrouping(...)`包裹可撤销修改。

### keyFlags常用位值

以下为常用修饰键位值（Apple平台）：

| 修饰键 | 值 |
|---|---:|
| Shift | `131072` |
| Control | `262144` |
| Option(Alt) | `524288` |
| Command | `1048576` |
| Command+Shift | `1179648` |

修饰键语义可参考UIKit文档：[UIKeyModifierFlags](https://learn.microsoft.com/en-us/dotnet/api/uikit.uikeymodifierflags?view=net-ios-26.2-10.0)。

### 已知限制：编辑态会吞键

当用户正在编辑文本（例如评论输入框等）时，当前firstResponder通常会优先消费按键，插件快捷键可能不触发。这是预期行为，建议将快捷键主要用于非编辑态操作。

## 类成员 (Class members)

### 类方法

| 方法 | 说明 |
|------|------|
| `addonDidConnect()` | 插件被 MarginNote 加载后调用。 |
| `addonWillDisconnect()` | 插件即将卸载时调用。 |
| `applicationDidEnterBackground()` | 应用进入后台时调用。 |
| `applicationWillEnterForeground()` | 应用即将进入前台时调用。 |
| `applicationDidReceiveLocalNotification(notify)` | 收到本地通知时调用（仅在部分平台可用，例如非 xrOS 环境）。 |

## 相关

- [JSB](/reference/global/jsb/) — 使用 `defineClass('MyAddon : JSExtension', ...)`
- [快速开始](/guides/getting-started/)、[生命周期与窗口](/guides/lifecycle-and-window/)、[工具栏与命令](/guides/toolbar-and-commands/)
