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

function stripAnsi(text) {
	return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function stringWidth(text) {
	const plain = stripAnsi(text);
	let width = 0;
	for (const char of plain) {
		const code = char.codePointAt(0);
		if (!code) continue;
		const isWide =
			(code >= 0x1100 && code <= 0x115f) ||
			(code === 0x2329 || code === 0x232a) ||
			(code >= 0x2e80 && code <= 0xa4cf) ||
			(code >= 0xac00 && code <= 0xd7a3) ||
			(code >= 0xf900 && code <= 0xfaff) ||
			(code >= 0xfe10 && code <= 0xfe19) ||
			(code >= 0xfe30 && code <= 0xfe6f) ||
			(code >= 0xff00 && code <= 0xff60) ||
			(code >= 0xffe0 && code <= 0xffe6);
		width += isWide ? 2 : 1;
	}
	return width;
}

function padLine(line, width) {
	const len = stringWidth(line);
	const padding = width - len;
	return line + (padding > 0 ? ' '.repeat(padding) : '');
}

function renderSplash() {
	if (IS_SILENT) return;
	const version = process.env.MN_DOCS_VERSION || '0.0.0';
	const mode = process.env.MN_DOCS_MODE || 'http';
	const port = process.env.MN_DOCS_PORT || String(PORT);
	const contentLines = [
		color(`mn-docs-mcp v${version}`, '38;5;45'),
		color(`模式: ${mode}  端口: ${port}`, '38;5;39'),
	];
	const maxWidth = Math.max(...contentLines.map((line) => stringWidth(line))) + 4;
	const top = color('╭' + '─'.repeat(maxWidth) + '╮', '38;5;45');
	const bottom = color('╰' + '─'.repeat(maxWidth) + '╯', '38;5;45');
	const body = contentLines.map((line) => {
		const padded = padLine(line, maxWidth - 4);
		return color('│', '38;5;45') + '  ' + padded + '  ' + color('│', '38;5;45');
	});
	process.stdout.write([top, ...body, bottom].join('\n') + '\n');
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
