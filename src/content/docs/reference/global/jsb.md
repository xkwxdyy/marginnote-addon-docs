---
title: JSB
description: JavaScript 桥接核心，连接插件 JS 与运行时对象的入口对象。
---
JSB（JavaScript Bridge）是插件运行时的桥接核心对象：类定义、插件入口、日志与包内脚本加载都通过它完成。

## 实例成员 (Instance members)

`JSB` 是全局对象，通常不以“实例化”的方式使用。

## 类成员 (Class members)

### 方法

### `defineClass`

定义一个可被运行时识别并回调的类，**所有插件的入口**。

```javascript
defineClass(declaration: string, instanceMembers: object, classMembers?: object): any
```

**Parameters:**

| Name                | Type        | Description                                                                                                                                              |
| :------------------ | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `declaration`     | `string`  | 类声明，例如 `'MyAddon : JSExtension'`。                                                                                                               |
| `instanceMembers` | `object`  | 实例方法与属性的集合。在此对象中定义的方法/属性在**实例**上调用（如 `sceneWillConnect`、`notebookWillOpen`、`queryAddonCommandStatus` 等）。 |
| `classMembers`    | `object?` | 类方法与属性的集合。在此对象中定义的方法在**类**上调用（如 `addonDidConnect`）。                                                                 |

**Return Value:**

- `any`: 类构造器。

### `newAddon`

**插件入口函数**。MarginNote 加载插件时调用，你必须实现并返回插件类。

```javascript
newAddon(mainPath: string): any
```

**Parameters:**

| Name         | Type       | Description        |
| :----------- | :--------- | :----------------- |
| `mainPath` | `string` | 插件包根目录路径。 |

**Return Value:**

- `any`: 必须返回由 `defineClass` 创建的类（构造器）。注意：是类本身，不是实例。

### `log`

向系统控制台输出日志，类似 `console.log`。在MN4已不可用。MN3中使用参考[log,error](https://ohmymn.marginnote.cn/api/marginnote/#log-error)

```javascript
log(format: string, ...args: any[]): void
```

**Parameters:**

| Name        | Type       | Description                                             |
| :---------- | :--------- | :------------------------------------------------------ |
| `format`  | `string` | 格式化字符串，支持 `%@`、`%d` 等 Objective-C 格式。 |
| `...args` | `any[]`  | 对应格式化字符串的参数。                                |

### `require`

加载插件包内其他 JS 文件。

```javascript
require(name: string): void
```

**Parameters:**

| Name     | Type       | Description                   |
| :------- | :--------- | :---------------------------- |
| `name` | `string` | 插件包内 JS 文件路径/文件名。 |

**Note:**
无模块作用域，所有文件共享全局作用域；推荐使用 Webpack 等打包工具。

## 说明

- 插件主类必须通过 `JSB.defineClass('MyAddon : JSExtension', instanceMembers, classMembers)` 定义，并在全局实现 `JSB.newAddon = function(mainPath) { return MyAddon; }`（或等价形式）。
- 参见 [JSExtension](/reference/marginnote/jsextension/) 了解生命周期方法，[快速开始](/guides/getting-started/) 了解完整示例。
