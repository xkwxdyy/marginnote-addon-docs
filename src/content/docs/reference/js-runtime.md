---
title: JavaScript原生环境
description: MarginNote插件运行时的JavaScriptCore能力边界、内置对象与常见误区。
---
MarginNote插件运行在JavaScriptCore中，而不是浏览器环境。这意味着标准JavaScript内置对象可用，但浏览器相关API通常不存在，且宿主会额外注入自己的对象与能力。

## 内置对象一览

下表列出当前运行环境中可见的标准JavaScript内置对象/函数/常量。

| 对象                                                                                                                 | 说明                        |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| [AggregateError](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/AggregateError)             | 多重Promise错误的聚合类型   |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)                               | 数组类型                    |
| [ArrayBuffer](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)                   | 原始二进制缓冲区            |
| [Atomics](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Atomics)                           | 共享内存的原子操作          |
| [BigInt](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/BigInt)                             | 任意精度整数                |
| [BigInt64Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/BigInt64Array)               | 64位有符号BigInt类型化数组  |
| [BigUint64Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/BigUint64Array)             | 64位无符号BigInt类型化数组  |
| [Boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)                           | 布尔包装对象                |
| [DataView](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DataView)                         | ArrayBuffer的通用视图       |
| [Date](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date)                                 | 日期与时间                  |
| [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error)                               | 基础错误类型                |
| [EvalError](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/EvalError)                       | eval相关错误类型            |
| [FinalizationRegistry](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) | 对象回收后的清理回调注册表  |
| [Float16Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float16Array)                 | 16位浮点类型化数组          |
| [Float32Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)                 | 32位浮点类型化数组          |
| [Float64Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float64Array)                 | 64位浮点类型化数组          |
| [Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function)                         | 函数对象                    |
| [Int8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Int8Array)                       | 8位有符号整型数组           |
| [Int16Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Int16Array)                     | 16位有符号整型数组          |
| [Int32Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Int32Array)                     | 32位有符号整型数组          |
| [Intl](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl)                                 | 国际化格式化API             |
| [Iterator](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Iterator)                         | 迭代器基类与协议入口        |
| [JSON](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON)                                 | JSON解析与序列化            |
| [Map](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)                                   | 键值映射集合                |
| [Math](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Math)                                 | 数学常量与函数              |
| [Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)                             | 数字包装对象                |
| [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)                             | 对象基类                    |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)                           | 异步结果表示                |
| [Proxy](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy)                               | 对象拦截与代理              |
| [RangeError](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RangeError)                     | 越界错误类型                |
| [ReferenceError](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError)             | 引用错误类型                |
| [Reflect](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Reflect)                           | 反射API                     |
| [RegExp](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp)                             | 正则表达式                  |
| [Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)                                   | 去重集合                    |
| [String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)                             | 字符串包装对象              |
| [Symbol](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol)                             | 唯一标识符                  |
| [SyntaxError](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError)                   | 语法错误类型                |
| [TypeError](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/TypeError)                       | 类型错误类型                |
| [URIError](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/URIError)                         | URI处理错误类型             |
| [Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)                     | 8位无符号整型数组           |
| [Uint8ClampedArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray)       | 8位无符号整型数组(范围钳制) |
| [Uint16Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array)                   | 16位无符号整型数组          |
| [Uint32Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array)                   | 32位无符号整型数组          |
| [WeakMap](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)                           | 弱引用键值映射              |
| [WeakRef](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)                           | 弱引用对象                  |
| [WeakSet](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)                           | 弱引用集合                  |
| [WebAssembly](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly)                   | WebAssembly接口             |
| [decodeURI](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/decodeURI)                       | 解码完整URI                 |
| [decodeURIComponent](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)     | 解码URI片段                 |
| [encodeURI](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/encodeURI)                       | 编码完整URI                 |
| [encodeURIComponent](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)     | 编码URI片段                 |
| [escape](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/escape)                             | 旧式字符串转义              |
| [eval](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/eval)                                 | 执行字符串代码              |
| [isFinite](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/isFinite)                         | 判断是否为有限数值          |
| [isNaN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/isNaN)                               | 判断是否为NaN               |
| [parseFloat](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/parseFloat)                     | 解析浮点数                  |
| [parseInt](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/parseInt)                         | 解析整数                    |
| [unescape](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/unescape)                         | 旧式字符串反转义            |
| [globalThis](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/globalThis)                     | 全局对象引用                |
| [Infinity](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Infinity)                         | 正无穷常量                  |
| [NaN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/NaN)                                   | 非数值常量                  |
| [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined)                       | 未定义常量                  |

## 环境差异与建议

- 插件环境没有原生fetch。需要网络请求时，请使用已导出的Objective‑C网络类。
- 插件环境没有setTimeout/setInterval。建议使用NSTimer完成延时与轮询。

## 相关

- [NSTimer](/reference/foundation/ns-timer/)
- [网络请求](/guides/network-requests/)
