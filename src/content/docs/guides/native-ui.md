---
title: 原生 UI
description: 使用 UIView、UILabel、UIButton、UIAlertView 等构建简单界面。
---

插件可以使用 MarginNote 暴露的 UIKit 接口创建原生界面，例如浮窗、按钮、标签和弹窗。将视图添加到 `Application.sharedInstance().studyController(self.window).view` 即可显示在主学习界面上。

## 创建并添加一个视图

```javascript
var frame = { x: 0, y: 0, width: 100, height: 50 };
var myView = new UIView(frame);
myView.backgroundColor = UIColor.colorWithHexString("#FF0000"); // 红色，若支持 hex

Application.sharedInstance().studyController(self.window).view.addSubview(myView);
```

若没有 `colorWithHexString`，可用 `UIColor.colorWithRedGreenBlueAlpha(1, 0, 0, 1)`。

## 添加标签（UILabel）

```javascript
var label = new UILabel({ x: 10, y: 10, width: 80, height: 30 });
label.text = "Hello!";
label.textColor = UIColor.whiteColor();
myView.addSubview(label);
```

## 添加按钮并响应点击

按钮的点击必须通过 **addTargetActionForControlEvents** 绑定到 **JSB.defineClass 的实例方法**，且该方法名**必须以冒号结尾**（如 `myButtonTapped:`）。

```javascript
var btn = UIButton.buttonWithType(0);
btn.frame = { x: 10, y: 60, width: 80, height: 40 };
btn.setTitleForState("Click Me", 0);
btn.addTargetActionForControlEvents(self, "myButtonTapped:", 1 << 6); // 1<<6 = TouchUpInside
myView.addSubview(btn);

// 在实例方法中定义：
// myButtonTapped: function (sender) {
//   Application.sharedInstance().alert("Button was tapped!");
// }
```

## 弹窗（UIAlertView）

带回调的确认框可这样写：

```javascript
UIAlertView.showWithTitleMessageStyleCancelButtonTitleOtherButtonTitlesTapBlock(
  "确认",
  "是否执行该操作？",
  0,
  "取消",
  ["确定"],
  function (alert, buttonIndex) {
    if (buttonIndex === 0) {
      console.log("用户点击了确定");
    } else {
      console.log("用户取消");
    }
  }
);
```

`buttonIndex` 为 0 表示第一个「其他」按钮，-1 表示取消。

## 使用 WebView

在插件中嵌入网页或本地 HTML 可使用 [UIWebView](/reference/uikit/uiwebview/)。创建 WebView、设置 frame 与 delegate，在承载它的 ViewController 的**实例成员**中实现 UIWebViewDelegate 回调（webViewDidStartLoad、webViewDidFinishLoad、webViewDidFailLoadWithError、webViewShouldStartLoadWithRequestNavigationType）。

### 创建并加载远程 URL

```javascript
var webFrame = { x: 0, y: 40, width: self.view.bounds.width, height: self.view.bounds.height - 40 };
self.webView = new UIWebView(webFrame);
self.webView.backgroundColor = UIColor.whiteColor();
self.webView.scalesPageToFit = true;
self.webView.autoresizingMask = (1 << 1 | 1 << 4 | 1 << 5);
self.webView.delegate = self;
self.view.addSubview(self.webView);
self.webView.loadRequest(NSURLRequest.requestWithURL(NSURL.URLWithString("http://www.apple.com/")));
// 若需设置 User-Agent 等，可用 NSMutableURLRequest 构建请求，再 loadRequest(req)
```

### 加载本地 HTML 字符串

```javascript
var html = "<html><body><h1>Hello</h1></body></html>";
self.webView.loadHTMLStringBaseURL(html, null);  // 以示例为准，JS 中方法名为 loadHTMLStringBaseURL(string, baseURL)；若环境不同则可能为 loadHTMLString
```

### Delegate 回调（实例成员）

建议在 **viewWillAppear** 中设置 `self.webView.delegate = self`（确保每次显示时 delegate 有效），在 **viewWillDisappear** 中调用 `self.webView.stopLoading()` 并设置 `self.webView.delegate = null`，避免视图消失后仍收到回调。

在 `JSB.defineClass` 的第二个参数中定义：

```javascript
webViewDidStartLoad: function (webView) {
  // 开始加载，可显示 loading
},
webViewDidFinishLoad: function (webView) {
  // 加载完成
},
webViewDidFailLoadWithError: function (webView, error) {
  // 加载失败；可用 error.localizedDescription 获取错误信息，拼接 HTML 后用 loadHTMLStringBaseURL 显示错误页
},
webViewShouldStartLoadWithRequestNavigationType: function (webView, request, type) {
  return true;  // 若拦截自定义 URL Scheme 则解析后 return false
}
```

### 插件向页面注入 JS

加载完成后可用 `evaluateJavaScript` 在页面上下文中执行脚本：

```javascript
self.webView.evaluateJavaScript("document.title", function (result) {
  console.log("页面标题: %@", result);
});
```

WebView 内 JS 与插件 JS 的双向通信（自定义 URL Scheme 拦截 + evaluateJavaScript）见 [Cookbook：WebView 内 JS 与插件 JS 双向通信](/guides/cookbook/webview-bidirectional-js/)。

## 布局与圆角

- 通过设置 `view.frame` 控制位置和大小；在 `controllerWillLayoutSubviews` 中根据 `studyController.view.bounds` 重新计算 frame，可适配窗口变化。
- 使用 `view.layer.cornerRadius`、`view.layer.borderWidth`、`view.layer.borderColor` 设置圆角与边框。

## 相关

- [UIView](/reference/uikit/uiview/)、[UIButton](/reference/uikit/uibutton/)、[UIAlertView](/reference/uikit/uialertview/)、[UIWebView](/reference/uikit/uiwebview/)、[UIColor](/reference/uikit/uicolor/)
- [工具栏与命令](/guides/toolbar-and-commands/) — 将面板与工具栏按钮联动
- [Cookbook：WebView 内 JS 与插件 JS 双向通信](/guides/cookbook/webview-bidirectional-js/)
