# MarginNote 插件开发文档

**本仓库为 MarginNote 官方插件接口文档与教程站点。**

- **在线文档**：[https://mn-docs.museday.top](https://mn-docs.museday.top)
- **仓库**：[https://github.com/Temsys-Shen/marginnote-addon-docs](https://github.com/Temsys-Shen/marginnote-addon-docs)

基于 [Starlight](https://starlight.astro.build) 构建，提供完整的 API 参考、渐进式教程与 Cookbook 配方，供开发者为 MarginNote 编写插件时查阅与学习。

## 文档内容

- **API 参考**：全局与入口（JSB、Application、Database）、MarginNote 核心（JSExtension、控制器、脑图、笔记/笔记本/文档模型）、Foundation / UIKit / Utility 等接口说明。
- **教程**：从快速开始到生命周期、笔记与数据库、脑图与选区、工具栏与命令、原生 UI、存储与文件。
- **Cookbook 配方**：按任务组织的可运行示例（如批量改标题、导出笔记本、高亮笔记、选区追加为评论、插件设置页等）。

## 本地开发与构建

```bash
pnpm install
pnpm dev      # 本地开发，默认 http://localhost:4321
pnpm build    # 构建静态站点到 ./dist/
pnpm preview  # 预览构建结果
```

## 本地MCP搜索

本项目内置一个本地MCPServer，支持stdio与HTTPStream两种方式，返回纯文本片段，适合AI直接调用。

embedding模型使用本地BGE-small-zh-v1.5(ONNX)，首次启动会自动下载到transformers.js默认缓存目录。模型文件约95.8MB，向量维度为512。
模型下载使用镜像https://hf-mirror.com

### 快速开始(npx)

### MCP配置示例(npx)

```json
{
  "mcpServers": {
    "mn-docs": {
      "command": "npx",
      "args": [
        "mn-docs-mcp"
      ]
    }
  }
}
```

### MCP配置示例(本地clone)

```json
{
  "mcpServers": {
    "mn-docs-local": {
      "command": "node",
      "args": [
        "mcp/cli.mjs"
      ],
      "cwd": "/path/to/this/repository"
    }
  }
}
```

## 项目结构

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/          # 文档正文（入门、教程、Cookbook、API 参考）
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

文档页面为 `src/content/docs/` 下的 `.md` / `.mdx` 文件，侧栏在 `astro.config.mjs` 中配置。

## 声明

**本仓库中的插件接口说明与示例基于 MarginNote 官方提供的 Objective-C 头文件与插件能力整理，作为 MarginNote 官方插件开发文档使用。**
