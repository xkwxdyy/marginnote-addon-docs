// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://mn-docs.museday.top',
	integrations: [
		starlight({
			title: 'MarginNote 插件开发文档',
			customCss: ['/src/styles/starlight-overrides.css'],
			components: {
				Search: './src/components/Search.astro',
				Footer: './src/components/Footer.astro',
			},
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Temsys-Shen/marginnote-addon-docs' }],
			sidebar: [
				{
					label: '入门',
					items: [
						{ label: '快速开始', slug: 'guides/getting-started' },
					],
				},
				{
					label: '教程与 Cookbook',
					items: [
						{ label: '生命周期与窗口', slug: 'guides/lifecycle-and-window' },
						{ label: '笔记与数据库', slug: 'guides/notes-and-database' },
						{ label: '脑图与选区', slug: 'guides/mindmap-and-selection' },
						{ label: '工具栏与命令', slug: 'guides/toolbar-and-commands' },
						{ label: '快捷键', slug: 'guides/shortcut-keys' },
						{ label: '原生 UI', slug: 'guides/native-ui' },
						{ label: '存储与文件', slug: 'guides/storage-and-files' },
						{ label: '网络请求', slug: 'guides/network-requests' },
						{
							label: 'Cookbook 配方',
							items: [
								{ label: '批量修改笔记标题', slug: 'guides/cookbook/batch-rename-notes' },
								{ label: '调用远程 API', slug: 'guides/cookbook/network-api-call' },
								{ label: '导出当前笔记本', slug: 'guides/cookbook/export-notebook' },
								{ label: '在脑图中高亮指定笔记', slug: 'guides/cookbook/focus-note-in-mindmap' },
								{ label: '将选区追加为评论', slug: 'guides/cookbook/append-selection-as-comment' },
								{ label: '插件设置页', slug: 'guides/cookbook/addon-settings' },
								{ label: '在插件中嵌入 WebView 面板', slug: 'guides/cookbook/embed-webview-panel' },
								{ label: 'WebView 内 JS 与插件 JS 双向通信', slug: 'guides/cookbook/webview-bidirectional-js' },
							],
						},
					],
				},
				{
					label: 'API 参考',
					items: [
						{
							label: '全局与入口',
							items: [
								{ label: '全局入口对象', slug: 'reference/global/global-variables' },
								{ label: 'JSB', slug: 'reference/global/jsb' },
								{ label: 'Application', slug: 'reference/global/application' },
								{ label: 'SearchManager', slug: 'reference/global/search-manager' },
								{ label: 'Database', slug: 'reference/global/database' },
								{ label: 'Note', slug: 'reference/global/note' },
								{ label: 'PopupMenu', slug: 'reference/global/popup-menu' },
								{ label: 'PopupMenuItem', slug: 'reference/global/popup-menu-item' },
								{ label: 'self', slug: 'reference/global/self' },
							],
						},
						{
							label: 'MarginNote 核心',
							items: [
								{ label: 'JSExtension', slug: 'reference/marginnote/jsextension' },
								{ label: 'StudyController', slug: 'reference/marginnote/study-controller' },
								{ label: 'NotebookController', slug: 'reference/marginnote/notebook-controller' },
								{ label: 'ReaderController', slug: 'reference/marginnote/reader-controller' },
								{ label: 'DocumentController', slug: 'reference/marginnote/document-controller' },
								{ label: 'MindMapView', slug: 'reference/marginnote/mindmap-view' },
								{ label: 'OutlineView', slug: 'reference/marginnote/outline-view' },
								{ label: 'MindMapNode', slug: 'reference/marginnote/mindmap-node' },
								{ label: 'MbBookNote', slug: 'reference/marginnote/mb-book-note' },
								{ label: 'NoteComment', slug: 'reference/marginnote/note-comment' },
								{ label: 'MbTopic', slug: 'reference/marginnote/mb-topic' },
								{ label: 'MbBook', slug: 'reference/marginnote/mb-book' },
								{ label: 'MbModelTool', slug: 'reference/marginnote/mb-model-tool' },
							],
						},
						{
							label: 'Foundation',
							autogenerate: { directory: 'reference/foundation' },
						},
						{
							label: 'UIKit',
							autogenerate: { directory: 'reference/uikit' },
						},
						{
							label: 'QuartzCore',
							autogenerate: { directory: 'reference/quartzcore' },
						},
						{
							label: 'Utility',
							autogenerate: { directory: 'reference/utility' },
						},
						{
							label: '运行时边界',
							items: [
								{ label: 'JavaScript 原生环境', slug: 'reference/js-runtime' },
								{ label: '隐藏的边界（The Black Box）', slug: 'reference/black-box' },
							],
						},
						{
							label: '附录',
							items: [
								{ label: '内建command清单', slug: 'reference/global/builtin-commands' },
							],
						},
					],
				},
				{
					label: '关于',
					items: [
						{ label: '贡献指南', slug: 'guides/contributing' },
					],
				},
			],

		}),
	],
});
