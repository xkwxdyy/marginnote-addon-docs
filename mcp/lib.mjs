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

function logInfo(message) {
	if (IS_SILENT) return;
	if (IS_STDIO) {
		process.stderr.write(`${message}\n`);
	} else {
		console.log(message);
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

async function getExtractor() {
	if (extractorPromise) return extractorPromise;
	loadEnv();
	setupProxy();
	env.cacheDir = path.join(MCP_DIR, 'models');
	env.allowRemoteModels = true;
	if (process.env.HF_ENDPOINT) {
		env.HF_ENDPOINT = process.env.HF_ENDPOINT;
	}

	const modelDir = path.join(env.cacheDir, 'Xenova', 'bge-small-zh-v1.5');
	const create = async () => pipeline('feature-extraction', MODEL_ID);

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

	const files = await walkFiles(DOCS_DIR);
	const docs = [];
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

export async function searchDocs(query, topK = 5) {
	const index = await loadIndex();
	const queryEmbedding = await embedText(query);

	const scored = index.docs.map((doc) => ({
		text: doc.text,
		score: cosineSimilarity(queryEmbedding, doc.embedding),
	}));

	scored.sort((a, b) => b.score - a.score);
	return scored.slice(0, topK).map((item) => item.text);
}
