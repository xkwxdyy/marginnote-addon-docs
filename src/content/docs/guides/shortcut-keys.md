---
title: 快捷键
description: 在JSExtension中注册快捷键，并用query/process稳定处理按键。
---

MarginNote插件提供了一套“扩展快捷键”机制：你可以在插件主类（继承`JSExtension`）中实现`additionalShortcutKeys()`返回快捷键声明，然后用`queryShortcutKeyWithKeyFlags(command,keyFlags)`与`processShortcutKeyWithKeyFlags(command,keyFlags)`完成“可用性判断”和“按下处理”。

本页按标准教程结构介绍该机制：接口作用、注册方式、推荐实现范式、参数语义、组合键选择建议与常见坑。

## 概述

扩展快捷键适用于：

- 快速触发插件动作（例如打开/关闭面板、执行一次批处理）。
- 在不方便加按钮的场景提供入口。

边界与限制：

- 当用户正在编辑文本时（firstResponder在输入框/编辑器上），按键可能被输入控件优先消费，插件快捷键不一定触发。这是预期行为。
- 组合键可能与系统或应用内建快捷键冲突，导致命中率不稳定；应优先选择冲突更少的组合键，并允许用户自定义（如你的插件有设置页）。

## 接口一览

在插件主类（`JSExtension`子类）中实现以下方法：

| 方法 | 作用 |
|---|---|
| `additionalShortcutKeys()` | 声明插件提供的快捷键列表。 |
| `queryShortcutKeyWithKeyFlags(command,keyFlags)` | 查询某条快捷键/命令在当前上下文是否可用（disabled）以及是否为勾选态（checked）。 |
| `processShortcutKeyWithKeyFlags(command,keyFlags)` | 处理快捷键按下。真正的业务动作应放在这里。 |

## 注册快捷键：additionalShortcutKeys

`additionalShortcutKeys()`返回一个数组，数组元素为“字典项”（Dictionary）。系统会读取这些字典项并构造对应的键盘命令。

目前已确认字典项的核心字段如下：

| 字段 | 类型 | 说明 |
|---|---|---|
| `input` | `string` | 按键输入，例如`"UIKeyInputLeftArrow"`、`"z"`、`"["`等。 |
| `flags` | `number` | 修饰键位掩码（见下方keyFlags表）。 |
| `title` | `string` | 用于显示的标题。 |

示例（仅演示结构；请按你的插件风格调整）：

```javascript
additionalShortcutKeys: function () {
  return [
    { input: "[", flags: 1179648, title: "MyAddon: Do Something" }, // Command+Shift+[
  ];
},
```

说明：该接口不是直接返回`UIKeyCommand[]`。

## 状态查询vs按下处理：query与process

这两者的职责必须严格区分：

- `queryShortcutKeyWithKeyFlags(...)`用于“查询状态”。系统可能会在可用性判断、快捷键列表重建、焦点变化等场景批量调用它，因此调用次数与传入参数都可能远超你的预期。为了保证性能与行为可控，建议在query中只做轻量判断并返回状态：避免任何IO操作、耗时计算、网络请求、文件读写，以及无差别日志输出；更不要在这里修改笔记/数据库或触发UI。
- `processShortcutKeyWithKeyFlags(...)`用于“处理按下”。真正的业务动作应放在这里；如果会修改笔记/笔记本数据，建议使用`UndoManager.undoGrouping(...)`包裹，保证撤销/重做稳定。

推荐写法：只匹配你关心的组合键，其余保持静默（例如直接`return null`）。

## command与keyFlags

### command

`command`是系统传入的标识。已确认它可能是：

- 内建命令名：例如`NewChildNote`、`ToggleExpand`、`EditAddTitle`等。
- 输入常量/字符：例如`UIKeyInputLeftArrow`、`UIKeyInputUpArrow`，以及`z`这类字符输入。

因此在你的实现里，应以“你在additionalShortcutKeys里声明的输入(input)+修饰键(flags)”为依据进行匹配，而不是假设`command`永远是某一种固定形式。

### keyFlags

以下为常用修饰键位值（Apple平台）：

| 修饰键 | 值 |
|---|---:|
| Shift | `131072` |
| Control | `262144` |
| Option(Alt) | `524288` |
| Command | `1048576` |
| Command+Shift | `1179648` |

修饰键语义可参考UIKit文档：[UIKeyModifierFlags](https://learn.microsoft.com/en-us/dotnet/api/uikit.uikeymodifierflags?view=net-ios-26.2-10.0)。

## 组合键选择建议

- 优先选择不常被系统/应用占用的组合键。
- 避免与“通用编辑快捷键”冲突（例如撤销/重做/复制粘贴等），除非你非常确定不会影响用户习惯。
- 若某个组合键命中率不稳定，通常是冲突或编辑态吞键导致；建议提供替代键位或设置项。

## 注意事项

- 在query里做副作用：导致“未按下也触发动作”、撤销链异常、或出现难以定位的状态错乱。
- 无差别打印日志：query可能被批量调用，导致刷屏，反而遮蔽真正有用的命中日志。
- 忽略编辑态：用户在输入时快捷键不触发属于预期，需要在产品交互上规避或提示。

## 相关

- API参考：[JSExtension](/reference/marginnote/jsextension/)
- 内建命令：[Application](/reference/global/application/)与[内建command清单](/reference/global/builtin-commands/)
- 获取选中与焦点：[脑图与选区](/guides/mindmap-and-selection/)
