---
title: 生命周期与窗口
description: 理解 scene/notebook/document 生命周期及何时可安全使用 studyController。
---

插件通过 JSExtension 的生命周期方法感知「窗口」「笔记本」「文档」的创建与销毁。只有在合适的时机才能安全使用 `Application.sharedInstance().studyController(self.window)` 访问脑图与文档。

## 生命周期概览

### 窗口（Scene）

| 方法 | 调用时机 |
|------|----------|
| `sceneWillConnect()` | 插件窗口即将创建，可在此做轻量初始化；此时可能还没有打开笔记本。 |
| `sceneDidDisconnect()` | 插件窗口已断开。 |
| `sceneWillResignActive()` | 窗口即将失去活跃。 |
| `sceneDidBecomeActive()` | 窗口变为活跃。 |

### 笔记本

| 方法 | 调用时机 |
|------|----------|
| `notebookWillOpen(topicid)` | 某个笔记本即将打开；之后该窗口才会有 `studyController` 对应的学习界面。 |
| `notebookWillClose(topicid)` | 某个笔记本即将关闭。 |

### 文档

| 方法 | 调用时机 |
|------|----------|
| `documentDidOpen(docmd5)` | 某文档已打开。 |
| `documentWillClose(docmd5)` | 某文档即将关闭。 |

## 何时可使用 studyController

- `studyController(window)` 返回的是**当前窗口**的学习控制器；只有在该窗口已经打开过笔记本、学习界面已就绪时，返回值才可用。
- 在 `sceneWillConnect` 中通常**还没有**打开笔记本，因此一般不要在这里依赖 `studyController(self.window)` 去访问脑图或文档。
- 在 `notebookWillOpen(topicid)` 被调用后，该窗口即将或已经拥有学习界面；但若需在「打开笔记本」后立刻挂载 UI，建议用 `NSTimer.scheduledTimerWithTimeInterval(0.2, false, function () { ... })` 延迟约 0.2 秒再执行，以确保 studyController 与 view 已就绪。

## 示例：在笔记本打开时打日志并延迟挂载 UI

下面在 `notebookWillOpen` 中打日志，并在 0.2 秒后检查是否要显示之前保存的浮窗（用 NSUserDefaults 记住状态）：

```javascript
notebookWillOpen: function (topicid) {
  console.log("MNLOG Open Notebook: %@", topicid);

  NSTimer.scheduledTimerWithTimeInterval(0.2, false, function () {
    var showPanel = NSUserDefaults.standardUserDefaults().objectForKey("my_addon_show_panel");
    if (showPanel === true) {
      var studyController = Application.sharedInstance().studyController(self.window);
      if (studyController) {
        studyController.view.addSubview(self.myPanelView);
        self.layoutMyPanel();
      }
    }
  });
},
```

## 布局回调：controllerWillLayoutSubviews

若你在学习界面上添加了自定义视图，窗口尺寸或布局变化时可能需要重新计算位置。实现 `controllerWillLayoutSubviews(controller)`，当传入的 controller 是当前窗口的 studyController 时，在其中更新你的面板 frame（例如根据 `controller.view.bounds` 计算）。

```javascript
controllerWillLayoutSubviews: function (controller) {
  if (controller === Application.sharedInstance().studyController(self.window)) {
    self.layoutMyPanel();
  }
},
```

## 相关

- [JSExtension](/reference/marginnote/jsextension/) — 完整生命周期与可选方法
- [StudyController](/reference/marginnote/study-controller/) — 通过 studyController 访问脑图与文档
- [快速开始](/guides/getting-started/)
