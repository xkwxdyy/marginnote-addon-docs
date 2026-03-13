import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { env, pipeline } from '@huggingface/transformers';
import { Agent, ProxyAgent, setGlobalDispatcher } from 'undici';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ROOT = path.resolve(__dirname, '..');

function resolveRootDir() {
	const envRoot = (process.env.MN_DOCS_ROOT || '').trim();
	if (envRoot && fsSyncExists(path.join(envRoot, 'src', 'content', 'docs'))) return envRoot;
	const cwd = process.cwd();
	const docsFromCwd = path.join(cwd, 'src', 'content', 'docs');
	try {
		if (fsSyncExists(docsFromCwd)) return cwd;
	} catch {}
	return DEFAULT_ROOT;
}

function fsSyncExists(p) {
	try {
		return fsSync.statSync(p).isDirectory();
	} catch {
		return false;
	}
}

const ROOT_DIR = resolveRootDir();
const DOCS_DIR = path.join(ROOT_DIR, 'src', 'content', 'docs');
const MCP_DIR = path.join(ROOT_DIR, '.mcp');
const INDEX_PATH = path.join(MCP_DIR, 'index.json');

const MODEL_ID = 'Xenova/bge-small-zh-v1.5';
const MODEL_DIM = 512;
let extractorPromise;
let proxyInitialized = false;
const MAX_EXTRACTOR_RETRIES = 3;
const IS_STDIO = process.env.MCP_STDIO === '1';
const IS_SILENT = process.env.MCP_SILENT === '1';
const NO_COLOR = process.env.MCP_NO_COLOR === '1';
let lastDownloadProgress = -1;

function logInfo(message) {
	if (IS_SILENT) return;
	if (IS_STDIO) {
		process.stderr.write(`${message}\n`);
	} else {
		console.log(message);
	}
}

function color(text, code) {
	if (NO_COLOR) return text;
	return `\x1b[${code}m${text}\x1b[0m`;
}

function formatBytes(bytes) {
	if (!Number.isFinite(bytes)) return '';
	const units = ['B', 'KB', 'MB', 'GB'];
	let idx = 0;
	let value = bytes;
	while (value >= 1024 && idx < units.length - 1) {
		value /= 1024;
		idx += 1;
	}
	return `${value.toFixed(1)}${units[idx]}`;
}

function logDownloadProgress(info) {
	if (IS_SILENT) return;
	if (info?.status === 'download') {
		// 清除当前行（如果之前有内容）
		if (IS_STDIO) {
			process.stderr.write('\r\x1b[K'); // 清除整行
			process.stderr.write(color('开始下载模型...', '38;5;45') + '\n');
		} else {
			process.stdout.write('\r\x1b[K'); // 清除整行
			console.log(color('开始下载模型...', '38;5;45'));
		}
		lastDownloadProgress = -1;
		return;
	}
	if (info?.status === 'progress' && typeof info.progress === 'number') {
		const pct = Math.max(0, Math.min(100, Math.round(info.progress)));
		if (pct === lastDownloadProgress) return;
		lastDownloadProgress = pct;
		const loaded = formatBytes(info.loaded);
		const total = formatBytes(info.total);
		const suffix = loaded && total ? ` ${loaded}/${total}` : '';
		const line = `${color('模型下载进度', '38;5;45')}: ${pct}%${suffix}`;
		if (IS_STDIO) {
			process.stderr.write(`\r\x1b[K${line}`); // \x1b[K 清除从光标到行尾的内容
			if (pct === 100) process.stderr.write('\n');
		} else {
			process.stdout.write(`\r\x1b[K${line}`);
			if (pct === 100) process.stdout.write('\n');
		}
	}
}

function loadEnv() {
	dotenv.config({ path: path.join(ROOT_DIR, '.env') });
}

function setupProxy() {
	if (proxyInitialized) return;
	proxyInitialized = true;
	const proxyUrl = (process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || '').trim();
	if (!proxyUrl) return;
	try {
		const dispatcher = new ProxyAgent(proxyUrl);
		setGlobalDispatcher(dispatcher);
	} catch {
		setGlobalDispatcher(new Agent());
	}
}

function normalizeRemoteHost(raw) {
	const value = String(raw || '').trim();
	if (!value) return '';
	try {
		const normalized = new URL(value);
		if (!normalized.pathname.endsWith('/')) {
			normalized.pathname += '/';
		}
		return normalized.toString();
	} catch {
		return value.endsWith('/') ? value : `${value}/`;
	}
}

async function getExtractor() {
	if (extractorPromise) return extractorPromise;
	loadEnv();
	setupProxy();
	
	// 抑制 Hugging Face Transformers 的警告输出
	env.cacheDir = path.join(MCP_DIR, 'models');
	env.allowRemoteModels = true;
	env.disableProgressBars = true; // 禁用库自带的进度条
	env.disableSymlinksWarning = true; // 禁用符号链接警告
	
	// 设置日志级别为 error，避免 info/warning 级别日志干扰
	if (!process.env.LOG_LEVEL) {
		process.env.LOG_LEVEL = 'error';
	}
	
	const remoteHost = normalizeRemoteHost(process.env.HF_ENDPOINT);
	if (remoteHost) {
		env.remoteHost = remoteHost;
	}

	const modelDir = path.join(env.cacheDir, 'Xenova', 'bge-small-zh-v1.5');
	const create = async () =>
		pipeline('feature-extraction', MODEL_ID, {
			progress_callback: logDownloadProgress,
		});

	extractorPromise = (async () => {
		for (let attempt = 1; attempt <= MAX_EXTRACTOR_RETRIES; attempt += 1) {
			try {
				return await create();
			} catch (error) {
				const message = error?.message || String(error);
				const shouldRetry =
					message.includes('Protobuf parsing failed') ||
					message.includes('Load model') ||
					message.includes('fetch failed') ||
					message.includes('ConnectTimeoutError');

				if (!shouldRetry || attempt === MAX_EXTRACTOR_RETRIES) {
					throw error;
				}

				// 清除上次的进度状态，为重试做准备
				lastDownloadProgress = -1;
				logInfo(`模型下载失败，准备重试(${attempt}/${MAX_EXTRACTOR_RETRIES})...`);
				await fs.rm(modelDir, { recursive: true, force: true });
			}
		}
		throw new Error('模型加载失败');
	})();

	return extractorPromise;
}

export function getPaths() {
	return { ROOT_DIR, DOCS_DIR, MCP_DIR, INDEX_PATH };
}

export function normalizeWhitespace(text) {
	return text.replace(/\s+/g, ' ').trim();
}

export function stripMarkdown(raw) {
	let text = raw;
	text = text.replace(/```[\s\S]*?```/g, ' ');
	text = text.replace(/`[^`]*`/g, ' ');
	text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
	text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
	text = text.replace(/<[^>]+>/g, ' ');
	text = text.replace(/[*_~]+/g, ' ');
	return normalizeWhitespace(text);
}

function slugToUrl(slug) {
	let cleaned = slug.replace(/\\/g, '/');
	if (cleaned.endsWith('/index')) cleaned = cleaned.slice(0, -'/index'.length);
	if (cleaned === 'index') cleaned = '';
	return '/' + cleaned;
}

function splitByHeadingAndParagraph(content) {
	const lines = content.split(/\r?\n/);
	let currentHeading = '';
	let currentParagraph = [];
	const chunks = [];
	const flush = () => {
		const text = normalizeWhitespace(currentParagraph.join(' '));
		if (text) {
			chunks.push({ heading: currentHeading, text });
		}
		currentParagraph = [];
	};

	for (const line of lines) {
		const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch) {
			flush();
			currentHeading = headingMatch[2].trim();
			continue;
		}
		if (line.trim() === '') {
			flush();
			continue;
		}
		currentParagraph.push(line.trim());
	}
	flush();
	return chunks;
}

async function walkFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const results = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...(await walkFiles(full)));
		} else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
			results.push(full);
		}
	}
	return results;
}

function makeId(slug, index) {
	return `${slug}::${index}`;
}

async function collectDocTasks() {
	const { DOCS_DIR } = getPaths();
	const files = await walkFiles(DOCS_DIR);
	const tasks = [];
	let counter = 0;

	for (const file of files) {
		const rel = path.relative(DOCS_DIR, file).replace(/\\/g, '/');
		const slug = rel.replace(/\.(md|mdx)$/i, '');
		const raw = await fs.readFile(file, 'utf-8');
		const parsed = matter(raw);
		const frontmatterTitle = typeof parsed.data?.title === 'string' ? parsed.data.title.trim() : '';
		const frontmatterSlug = typeof parsed.data?.slug === 'string' ? parsed.data.slug.trim() : '';
		const content = stripMarkdown(parsed.content);
		const chunks = splitByHeadingAndParagraph(content);
		const pageTitle = frontmatterTitle || (chunks[0]?.heading || slug.split('/').pop() || slug);
		const url = slugToUrl(frontmatterSlug || slug);

		for (const chunk of chunks) {
			tasks.push({
				id: makeId(slug, counter++),
				url,
				title: pageTitle,
				section: chunk.heading,
				text: chunk.text,
			});
		}
	}

	return tasks;
}

async function embedText(text) {
	const extractor = await getExtractor();
	const output = await extractor(text, { pooling: 'mean', normalize: true });
	const list = typeof output.tolist === 'function' ? output.tolist() : output;
	if (Array.isArray(list) && Array.isArray(list[0])) return list[0];
	if (Array.isArray(list)) return list;
	throw new Error('向量生成失败，输出格式不正确');
}

export async function buildIndex() {
	const { DOCS_DIR, MCP_DIR, INDEX_PATH } = getPaths();
	await fs.mkdir(MCP_DIR, { recursive: true });
	const docs = [];
	const tasks = await collectDocTasks();

	const total = tasks.length;
	let done = 0;
	let lastRender = 0;
	const renderProgress = (force = false) => {
		if (IS_SILENT) return;
		const stream = IS_STDIO ? process.stderr : process.stdout;
		if (!stream.isTTY) return;
		const now = Date.now();
		if (!force && now - lastRender < 120) return;
		lastRender = now;
		stream.write(`\r索引构建中：${done}/${total}`);
	};
	renderProgress(true);

	for (const task of tasks) {
		const embedding = await embedText(task.text);
		docs.push({ ...task, embedding });
		done += 1;
		renderProgress(false);
		// 让出事件循环，避免长时间阻塞MCP握手/请求处理
		if (done % 10 === 0) {
			await new Promise((resolve) => setImmediate(resolve));
		}
	}
	if (IS_STDIO ? process.stderr.isTTY : process.stdout.isTTY) {
		const stream = IS_STDIO ? process.stderr : process.stdout;
		stream.write(`\r索引构建完成：${done}/${total}\n`);
	} else {
		logInfo(`索引构建完成：${done}/${total}`);
	}

	const payload = {
		version: 1,
		generatedAt: new Date().toISOString(),
		source: {
			root: 'src/content/docs',
			split: 'heading+paragraph',
			model: MODEL_ID,
			dim: MODEL_DIM,
		},
		docs,
	};
	await fs.writeFile(INDEX_PATH, JSON.stringify(payload, null, 2));
	return { count: docs.length, path: INDEX_PATH };
}

export async function buildKeywordIndex() {
	const { MCP_DIR, INDEX_PATH } = getPaths();
	await fs.mkdir(MCP_DIR, { recursive: true });
	const docs = await collectDocTasks();
	const payload = {
		version: 1,
		generatedAt: new Date().toISOString(),
		source: {
			root: 'src/content/docs',
			split: 'heading+paragraph',
			model: 'keyword-fallback',
			dim: 0,
		},
		docs,
	};
	await fs.writeFile(INDEX_PATH, JSON.stringify(payload, null, 2));
	return { count: docs.length, path: INDEX_PATH, mode: 'keyword' };
}

export async function loadIndex() {
	const { INDEX_PATH } = getPaths();
	const raw = await fs.readFile(INDEX_PATH, 'utf-8');
	const data = JSON.parse(raw);
	if (!Array.isArray(data?.docs)) {
		throw new Error('索引文件格式错误，未找到docs数组');
	}
	return data;
}

async function getDocsLatestMtime() {
	const { DOCS_DIR } = getPaths();
	const files = await walkFiles(DOCS_DIR);
	let latest = 0;
	for (const file of files) {
		const stat = await fs.stat(file);
		if (stat.mtimeMs > latest) latest = stat.mtimeMs;
	}
	return latest;
}

export async function isIndexStale() {
	const index = await loadIndex();
	const generatedAt = Date.parse(index?.generatedAt || '');
	if (!Number.isFinite(generatedAt)) return true;
	const latestDocMtime = await getDocsLatestMtime();
	return latestDocMtime > generatedAt;
}

function cosineSimilarity(a, b) {
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function tokenize(text) {
	return normalizeWhitespace(String(text || '').toLowerCase()).match(/[\p{L}\p{N}_-]+/gu) || [];
}

function buildSearchTerms(query) {
	const normalized = normalizeWhitespace(String(query || '').toLowerCase());
	const terms = new Set(tokenize(normalized));
	const compact = normalized.replace(/\s+/g, '');
	if (compact) terms.add(compact);

	const cjkRuns = compact.match(/[\p{Script=Han}]{2,}/gu) || [];
	for (const run of cjkRuns) {
		terms.add(run);
		for (let i = 0; i < run.length - 1; i += 1) {
			terms.add(run.slice(i, i + 2));
		}
	}

	return [...terms].filter(Boolean);
}

function countOccurrences(haystack, needle) {
	if (!needle || !haystack.includes(needle)) return 0;
	let count = 0;
	let index = 0;
	while ((index = haystack.indexOf(needle, index)) !== -1) {
		count += 1;
		index += needle.length || 1;
	}
	return count;
}

function lexicalScore(query, doc) {
	const queryTerms = buildSearchTerms(query);
	if (!queryTerms.length) return 0;
	const title = String(doc.title || '').toLowerCase();
	const section = String(doc.section || '').toLowerCase();
	const text = String(doc.text || '').toLowerCase();
	const haystack = `${title} ${section} ${text}`;
	let score = 0;

	for (const token of queryTerms) {
		const occurrences = countOccurrences(haystack, token);
		if (occurrences <= 0) continue;
		score += occurrences;
		score += countOccurrences(title, token) * 6;
		score += countOccurrences(section, token) * 4;
		score += Math.min(occurrences, 3);
	}

	return score;
}

function rankLexically(query, docs, topK) {
	const scored = docs
		.map((doc) => ({
			text: doc.text,
			score: lexicalScore(query, doc),
		}))
		.filter((item) => item.score > 0);

	if (!scored.length) {
		return docs.slice(0, topK).map((doc) => doc.text);
	}

	scored.sort((a, b) => b.score - a.score);
	return scored.slice(0, topK).map((item) => item.text);
}

export async function searchDocs(query, topK = 5) {
	let docs;
	try {
		const index = await loadIndex();
		docs = index.docs;
		if (docs.every((doc) => Array.isArray(doc.embedding) && doc.embedding.length)) {
			const queryEmbedding = await embedText(query);
			const scored = docs.map((doc) => ({
				text: doc.text,
				score: cosineSimilarity(queryEmbedding, doc.embedding),
			}));
			scored.sort((a, b) => b.score - a.score);
			return scored.slice(0, topK).map((item) => item.text);
		}
		return rankLexically(query, docs, topK);
	} catch {
		docs = await collectDocTasks();
		return rankLexically(query, docs, topK);
	}
}
