#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);

let mode = 'stdio';
let port;
let prebuild = false;
let silent = false;
let root;
let resolvedRoot;

for (let i = 0; i < args.length; i += 1) {
	const arg = args[i];
	if (arg === '--http') {
		mode = 'http';
		continue;
	}
	if (arg === '--stdio') {
		mode = 'stdio';
		continue;
	}
	if (arg === '--prebuild') {
		prebuild = true;
		continue;
	}
	if (arg === '--verbose') {
		silent = false;
		continue;
	}
	if (arg === '--silent') {
		silent = true;
		continue;
	}
	if (arg === '--port' && args[i + 1]) {
		port = args[i + 1];
		i += 1;
		continue;
	}
	if (arg === '--root' && args[i + 1]) {
		root = args[i + 1];
		i += 1;
		continue;
	}
	if (arg?.startsWith('--port=')) {
		port = arg.split('=')[1];
		continue;
	}
	if (arg?.startsWith('--root=')) {
		root = arg.split('=')[1];
		continue;
	}
	if (arg === '--help' || arg === '-h') {
		process.stderr.write(
			[
				'mn-docs-mcp 使用说明:',
				'  --http            启动HTTPStream模式(默认stdio)',
				'  --port <port>     HTTP端口(默认8788)',
				'  --prebuild        启动后后台预构建索引',
				'  --verbose         输出日志(覆盖--silent)',
				'  --silent          关闭开屏与日志',
				'  --root <path>     指定文档仓库根目录',
				'  --stdio           显式使用stdio模式',
			].join('\n') + '\n'
		);
		process.exit(0);
	}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagePath = path.join(__dirname, '../package.json');
let version = '0.0.0';
try {
	const raw = fs.readFileSync(packagePath, 'utf-8');
	version = JSON.parse(raw).version || version;
} catch {}

function hasDocsDir(base) {
	try {
		const docsPath = path.join(base, 'src', 'content', 'docs');
		return fs.existsSync(docsPath);
	} catch {
		return false;
	}
}

if (root) {
	resolvedRoot = root;
} else if (hasDocsDir(process.cwd())) {
	resolvedRoot = process.cwd();
}

if (mode === 'stdio') {
	process.env.MCP_STDIO = '1';
	process.env.MCP_SILENT = silent ? '1' : '0';
	process.env.MN_DOCS_VERSION = version;
	process.env.MN_DOCS_MODE = 'stdio';
	if (resolvedRoot) process.env.MN_DOCS_ROOT = resolvedRoot;
	if (prebuild) process.env.MCP_PREBUILD = '1';
	await import('./server.mjs');
} else {
	if (port) process.env.MCP_HTTP_PORT = String(port);
	process.env.MN_DOCS_VERSION = version;
	process.env.MN_DOCS_MODE = 'http';
	if (port) process.env.MN_DOCS_PORT = String(port);
	if (resolvedRoot) process.env.MN_DOCS_ROOT = resolvedRoot;
	if (prebuild) process.env.MCP_PREBUILD = '1';
	await import('./server-http.mjs');
}
