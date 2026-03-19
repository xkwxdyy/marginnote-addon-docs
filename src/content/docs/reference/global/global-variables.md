---
title: 全局入口对象（Global Variables）
description: MarginNote插件运行时直接注入到JS环境的全局变量清单与用法入口。
---
本页列出MarginNote插件运行时可直接使用的全局变量名。这些全局名对应的对象通常是单例、工厂对象、或系统级入口。

> 说明：本页仅做索引。每个对象的完整属性/方法请进入对应参考页。

## 全局与入口

<table>
  <colgroup>
    <col style="width:28%">
    <col style="width:44%">
    <col style="width:28%">
  </colgroup>
  <thead>
    <tr>
      <th>名称</th>
      <th>用途</th>
      <th>参考</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>JSB</code></td>
      <td>Bridge入口</td>
      <td><a href="/reference/global/jsb/">JSB</a></td>
    </tr>
    <tr>
      <td><code>self</code></td>
      <td>当前实例上下文</td>
      <td><a href="/reference/global/self/">self</a></td>
    </tr>
    <tr>
      <td><code>Application</code></td>
      <td>App入口</td>
      <td><a href="/reference/global/application/">Application</a></td>
    </tr>
    <tr>
      <td><code>Database</code></td>
      <td>数据库访问</td>
      <td><a href="/reference/global/database/">Database</a></td>
    </tr>
    <tr>
      <td><code>Note</code></td>
      <td>创建笔记</td>
      <td><a href="/reference/global/note/">Note</a></td>
    </tr>
    <tr>
      <td><code>PopupMenu</code></td>
      <td>弹出菜单</td>
      <td><a href="/reference/global/popup-menu/">PopupMenu</a></td>
    </tr>
    <tr>
      <td><code>PopupMenuItem</code></td>
      <td>菜单项</td>
      <td><a href="/reference/global/popup-menu-item/">PopupMenuItem</a></td>
    </tr>
    <tr>
      <td><code>SearchManager</code></td>
      <td>搜索与索引（<code>Application.sharedInstance().searchManager</code>）</td>
      <td><a href="/reference/global/search-manager/">SearchManager</a></td>
    </tr>
  </tbody>
</table>

## MarginNote核心

下表覆盖 `/reference/marginnote/`目录下的全部参考页，用于快速定位对象定义与用法入口。

<table>
  <colgroup>
    <col style="width:28%">
    <col style="width:44%">
    <col style="width:28%">
  </colgroup>
  <thead>
    <tr>
      <th>名称</th>
      <th>用途</th>
      <th>参考</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>StudyController</code></td>
      <td>学习入口（从<code>Application</code>获取）</td>
      <td><a href="/reference/marginnote/study-controller/">StudyController</a></td>
    </tr>
    <tr>
      <td><code>NotebookController</code></td>
      <td>脑图与大纲（从<code>StudyController</code>获取）</td>
      <td><a href="/reference/marginnote/notebook-controller/">NotebookController</a></td>
    </tr>
    <tr>
      <td><code>ReaderController</code></td>
      <td>阅读区控制（从<code>StudyController</code>获取）</td>
      <td><a href="/reference/marginnote/reader-controller/">ReaderController</a></td>
    </tr>
    <tr>
      <td><code>DocumentController</code></td>
      <td>单文档控制（从<code>ReaderController</code>获取）</td>
      <td><a href="/reference/marginnote/document-controller/">DocumentController</a></td>
    </tr>
    <tr>
      <td><code>MindMapView</code></td>
      <td>脑图视图（从<code>NotebookController</code>获取）</td>
      <td><a href="/reference/marginnote/mindmap-view/">MindMapView</a></td>
    </tr>
    <tr>
      <td><code>OutlineView</code></td>
      <td>大纲视图</td>
      <td><a href="/reference/marginnote/outline-view/">OutlineView</a></td>
    </tr>
    <tr>
      <td><code>MindMapNode</code></td>
      <td>脑图节点（来自<code>MindMapView</code>/选中列表）</td>
      <td><a href="/reference/marginnote/mindmap-node/">MindMapNode</a></td>
    </tr>
    <tr>
      <td><code>MbBookNote</code></td>
      <td>笔记对象</td>
      <td><a href="/reference/marginnote/mb-book-note/">MbBookNote</a></td>
    </tr>
    <tr>
      <td><code>MbTopic</code></td>
      <td>笔记本对象</td>
      <td><a href="/reference/marginnote/mb-topic/">MbTopic</a></td>
    </tr>
    <tr>
      <td><code>MbBook</code></td>
      <td>文档对象</td>
      <td><a href="/reference/marginnote/mb-book/">MbBook</a></td>
    </tr>
    <tr>
      <td><code>NoteComment</code></td>
      <td>评论结构</td>
      <td><a href="/reference/marginnote/note-comment/">NoteComment</a></td>
    </tr>
    <tr>
      <td><code>JSExtension</code></td>
      <td>插件主类</td>
      <td><a href="/reference/marginnote/jsextension/">JSExtension</a></td>
    </tr>
    <tr>
      <td><code>MbModelTool</code></td>
      <td>数据库协议</td>
      <td><a href="/reference/marginnote/mb-model-tool/">MbModelTool</a></td>
    </tr>
  </tbody>
</table>

## Utility

<table>
  <colgroup>
    <col style="width:28%">
    <col style="width:44%">
    <col style="width:28%">
  </colgroup>
  <thead>
    <tr>
      <th>名称</th>
      <th>用途</th>
      <th>参考</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>UndoManager</code></td>
      <td>撤销与刷新</td>
      <td><a href="/reference/utility/undo-manager/">UndoManager</a></td>
    </tr>
    <tr>
      <td><code>SpeechManager</code></td>
      <td>语音朗读</td>
      <td><a href="/reference/utility/speech-manager/">SpeechManager</a></td>
    </tr>
    <tr>
      <td><code>ZipArchive</code></td>
      <td>ZIP压缩解压</td>
      <td><a href="/reference/utility/zip-archive/">ZipArchive</a></td>
    </tr>
    <tr>
      <td><code>MenuController</code></td>
      <td>菜单视图</td>
      <td><a href="/reference/utility/menu-controller/">MenuController</a></td>
    </tr>
    <tr>
      <td><code>SQLiteDatabase</code></td>
      <td>执行SQL</td>
      <td><a href="/reference/utility/sqlite-database/">SQLiteDatabase</a></td>
    </tr>
    <tr>
      <td><code>SQLiteResultSet</code></td>
      <td>读取结果</td>
      <td><a href="/reference/utility/sqlite-result-set/">SQLiteResultSet</a></td>
    </tr>
    <tr>
      <td><code>SQLiteStatement</code></td>
      <td>缓存语句</td>
      <td><a href="/reference/utility/sqlite-statement/">SQLiteStatement</a></td>
    </tr>
  </tbody>
</table>

## 其它对象

本页不再列出Foundation/UIKit/QuartzCore与JavaScript原生环境的全量对象清单；它们的参考条目请在侧边栏对应分组中查阅。下面仅给出常见入口与例子。

### Foundation

多数Foundation类可直接使用（通常以类/单例形式导出）。例：

- [NSFileManager](/reference/foundation/ns-file-manager/)
- [NSData](/reference/foundation/ns-data/)
- [NSTimer](/reference/foundation/ns-timer/)

### UIKit

可用UIKit搭原生UI（视图/控制器/控件等）。例：

- [UIApplication](/reference/uikit/uiapplication/)
- [UIViewController](/reference/uikit/uiview-controller/)
- [UIButton](/reference/uikit/uibutton/)

### QuartzCore

图层/动画相关能力主要来自QuartzCore。例：

- [CALayer](/reference/quartzcore/calayer/)
- [CAShapeLayer](/reference/quartzcore/cashape-layer/)
- [CATransaction](/reference/quartzcore/catransaction/)

### JavaScript原生环境

插件运行在JavaScriptCore中，标准JavaScript内置对象可用但非浏览器环境；详见：[JavaScript原生环境](/reference/js-runtime/)
