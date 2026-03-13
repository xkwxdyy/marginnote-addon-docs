import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { buildIndex, getPaths, isIndexStale, loadIndex, searchDocs } from './lib.mjs';

const TOOL_NAME = 'search_docs';
const PORT = Number(process.env.MCP_HTTP_PORT || 8788);
const IS_SILENT = process.env.MCP_SILENT === '1';
const NO_COLOR = process.env.MCP_NO_COLOR === '1';

function color(text, code) {
	if (NO_COLOR) return text;
	return `\x1b[${code}m${text}\x1b[0m`;
}

function renderSplash() {
	if (IS_SILENT) return;
	const version = process.env.MN_DOCS_VERSION || '0.0.0';
	const mode = process.env.MN_DOCS_MODE || 'http';
	const port = process.env.MN_DOCS_PORT || String(PORT);
	const lines = [
		color('╭──────────────────────────────────────────────────────────────╮', '38;5;45'),
		color('│  mn-docs-mcp', '38;5;45') + color(` v${version}`, '38;5;214') + color('  (Charm风格启动)         │', '38;5;45'),
		color('│                                                              │', '38;5;45'),
		color(`│  模式: ${mode.padEnd(12)}  端口: ${port.padEnd(6)}  状态: 已启动          │`, '38;5;39'),
		color('│                                                              │', '38;5;45'),
		color('╰──────────────────────────────────────────────────────────────╯', '38;5;45'),
	];
	process.stdout.write(lines.join('\n') + '\n');
}

async function ensureIndex() {
	const { INDEX_PATH } = getPaths();
	try {
		await loadIndex();
		const stale = await isIndexStale();
		if (stale) {
			console.error(`检测到文档更新，开始重建索引：${INDEX_PATH}`);
			await buildIndex();
		}
	} catch {
		console.error(`未找到索引，开始重建：${INDEX_PATH}`);
		await buildIndex();
	}
}

let initPromise = null;
function initIndexInBackground() {
	if (!initPromise) {
		initPromise = ensureIndex().catch((error) => {
			console.error('索引初始化失败：', error?.message || error);
		});
	}
	return initPromise;
}

const server = new FastMCP({
	name: 'marginnote-docs-mcp',
	version: '0.1.0',
});

server.addTool({
	name: TOOL_NAME,
	description: '在本地文档索引中检索相关文本片段',
	parameters: z.object({
		query: z.string().describe('检索关键词或问题'),
		top_k: z.number().optional().describe('返回片段数量'),
	}),
	execute: async ({ query, top_k }) => {
		const topK = Number(top_k || 5);
		if (!query.trim()) {
			return { content: [{ type: 'text', text: 'query不能为空' }] };
		}
		if (initPromise) {
			await initPromise;
		} else {
			await initIndexInBackground();
		}
		const results = await searchDocs(query, topK);
		return {
			content: results.map((text) => ({ type: 'text', text })),
		};
	},
});

await server.start({
	transportType: 'httpStream',
	httpStream: {
		port: PORT,
		endpoint: '/mcp',
	},
});

renderSplash();

// 默认自动构建，异步启动避免阻塞握手
setTimeout(() => initIndexInBackground(), 0);
