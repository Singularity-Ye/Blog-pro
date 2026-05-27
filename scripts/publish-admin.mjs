import fs from 'fs';
import http from 'http';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(__dirname, 'publish-manifest.json');
const BUILD_SCRIPT = path.join(__dirname, 'build-graph.mjs');
const PORT = Number(process.env.PUBLISH_ADMIN_PORT || 4177);
const AUTH_TOKEN = process.env.PUBLISH_ADMIN_TOKEN || null;
const HOST = process.env.PUBLISH_ADMIN_HOST || '127.0.0.1';

/* ── Utilities ─────────────────────────────────────────────── */

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function normalizeRelPath(value) {
  return value.split(path.sep).join('/');
}

function isPathWithin(base, target) {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(target);
  return resolvedTarget === resolvedBase || resolvedTarget.startsWith(resolvedBase + path.sep);
}

function globToRegExp(pattern) {
  const normalized = normalizeRelPath(pattern);
  let source = normalized.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  source = source
    .replace(/\*\*\//g, '<<GLOBSTAR_SLASH>>')
    .replace(/\*\*/g, '<<GLOBSTAR>>')
    .replace(/\*/g, '[^/]*');
  source = source
    .replace(/<<GLOBSTAR_SLASH>>/g, '(?:.*/)?')
    .replace(/<<GLOBSTAR>>/g, '.*');
  return new RegExp('^' + source + '$');
}

function matchesAny(relPath, patterns = []) {
  if (!patterns.length) return false;
  return patterns.some((pattern) => globToRegExp(pattern).test(relPath));
}

function walkMarkdown(dir, base = '', excludedDirs = new Set()) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || excludedDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = base ? base + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      results.push(...walkMarkdown(full, rel, excludedDirs));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      results.push(normalizeRelPath(rel));
    }
  }
  return results;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 8 * 1024 * 1024) { reject(new Error('Request body too large')); req.destroy(); }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function send(res, status, payload, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(payload) : payload);
}

function checkAuth(req, res) {
  if (!AUTH_TOKEN) return true;
  const header = req.headers.authorization || '';
  const query = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : query;
  if (token !== AUTH_TOKEN) {
    send(res, 401, { error: 'Unauthorized' });
    return false;
  }
  return true;
}

function runSync() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BUILD_SCRIPT], { cwd: ROOT, shell: false, windowsHide: true });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk.toString(); });
    child.stderr.on('data', (chunk) => { output += chunk.toString(); });
    child.on('close', (code) => { resolve({ ok: code === 0, code, output }); });
  });
}

function getVaultFiles(collectionIndex = 0) {
  const manifest = readJson(MANIFEST_PATH);
  const collection = manifest.collections?.[collectionIndex];
  if (!collection) return { collection: null, files: [] };
  const vaultRoot = manifest.vaultPath;
  const excludedDirs = new Set(manifest.excludeDirs || []);
  const root = path.join(vaultRoot, collection.root);
  const allFiles = walkMarkdown(root, '', excludedDirs);
  const include = collection.include?.length ? collection.include : ['**/*.md'];
  const exclude = collection.exclude || [];
  return {
    collection,
    files: allFiles.map((rel) => {
      const included = matchesAny(rel, include) && !matchesAny(rel, exclude);
      return { rel, included };
    }),
  };
}

/* ── New API helpers ───────────────────────────────────────── */

function toggleFileInCollection(collectionIndex, rel, action) {
  const manifest = readJson(MANIFEST_PATH);
  const item = manifest.collections?.[collectionIndex];
  if (!item) return { error: 'Collection not found' };
  let include = [...(item.include || ['**/*.md'])];
  let exclude = [...(item.exclude || [])];

  if (action === 'exclude') {
    if (!exclude.includes(rel)) exclude.push(rel);
    include = include.filter((p) => p !== rel);
  } else {
    exclude = exclude.filter((p) => p !== rel);
    const normalizedRel = normalizeRelPath(rel);
    const coveredByInclude = include.some((p) => {
      try { return globToRegExp(p).test(normalizedRel); }
      catch { return p === rel; }
    });
    if (!coveredByInclude) include.push(rel);
  }

  item.include = include;
  item.exclude = exclude;
  writeJson(MANIFEST_PATH, manifest);
  return getVaultFiles(collectionIndex);
}

function toggleBatch(collectionIndex, files) {
  const manifest = readJson(MANIFEST_PATH);
  const item = manifest.collections?.[collectionIndex];
  if (!item) return { error: 'Collection not found' };
  let include = [...(item.include || ['**/*.md'])];
  let exclude = [...(item.exclude || [])];

  for (const { rel, action } of files) {
    if (action === 'exclude') {
      if (!exclude.includes(rel)) exclude.push(rel);
      include = include.filter((p) => p !== rel);
    } else {
      exclude = exclude.filter((p) => p !== rel);
      const normalizedRel = normalizeRelPath(rel);
      const coveredByInclude = include.some((p) => {
        try { return globToRegExp(p).test(normalizedRel); }
        catch { return p === rel; }
      });
      if (!coveredByInclude) include.push(rel);
    }
  }

  item.include = include;
  item.exclude = exclude;
  writeJson(MANIFEST_PATH, manifest);
  return getVaultFiles(collectionIndex);
}

function readNotePreview(collectionIndex, rel) {
  const manifest = readJson(MANIFEST_PATH);
  const collection = manifest.collections?.[collectionIndex];
  if (!collection) return null;
  const vaultRoot = path.resolve(manifest.vaultPath);
  const full = path.resolve(vaultRoot, collection.root, ...rel.split('/'));
  if (!isPathWithin(vaultRoot, full) || !fs.existsSync(full)) return null;
  const content = fs.readFileSync(full, 'utf-8');
  return content.length > 6000 ? content.slice(0, 6000) + '\n\n... (内容已截断)' : content;
}

function addCollection(data) {
  const manifest = readJson(MANIFEST_PATH);
  manifest.collections.push({
    enabled: true,
    label: data.label || '新分类',
    root: data.root || '',
    kind: data.kind || 'general',
    include: ['**/*.md'],
    exclude: [],
  });
  writeJson(MANIFEST_PATH, manifest);
  return manifest;
}

function removeCollection(index) {
  const manifest = readJson(MANIFEST_PATH);
  if (index < 0 || index >= manifest.collections.length) return manifest;
  manifest.collections.splice(index, 1);
  writeJson(MANIFEST_PATH, manifest);
  return manifest;
}

/* ── HTML SPA ──────────────────────────────────────────────── */

const HTML_PATH = path.join(__dirname, 'publish-admin.html');
const html = fs.readFileSync(HTML_PATH, 'utf-8');

/* ── HTTP Server ── */

const SPA_HTML = (() => {
  if (AUTH_TOKEN) {
    const script = `<script>window.AUTH_TOKEN = ${JSON.stringify(AUTH_TOKEN)};</script>`;
    return html.replace('</body>', script + '</body>');
  }
  return html;
})();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    const isMainPage = req.method === 'GET' && url.pathname === '/';
    if (!isMainPage && !checkAuth(req, res)) {
      return;
    }

    if (isMainPage) {
      send(res, 200, SPA_HTML, 'text/html; charset=utf-8');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/manifest') {
      send(res, 200, readJson(MANIFEST_PATH));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/manifest') {
      const body = await readBody(req);
      writeJson(MANIFEST_PATH, JSON.parse(body));
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/files') {
      const collection = Number(url.searchParams.get('collection') || 0);
      send(res, 200, getVaultFiles(collection));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/sync') {
      send(res, 200, await runSync());
      return;
    }

    /* ── New API endpoints ── */

    if (req.method === 'POST' && url.pathname === '/api/toggle') {
      const body = JSON.parse(await readBody(req));
      const result = toggleFileInCollection(body.collection, body.rel, body.action);
      send(res, 200, result);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/toggle-batch') {
      const body = JSON.parse(await readBody(req));
      const result = toggleBatch(body.collection, body.files);
      send(res, 200, result);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/vault-dirs') {
      const manifest = readJson(MANIFEST_PATH);
      const vpath = manifest.vaultPath;
      const excludeDirs = new Set(manifest.excludeDirs || []);
      let dirs = [];
      if (fs.existsSync(vpath)) {
        const rootDirs = fs.readdirSync(vpath, { withFileTypes: true })
          .filter(e => e.isDirectory() && !e.name.startsWith('.') && !['node_modules', 'templates'].includes(e.name) && !excludeDirs.has(e.name))
          .map(e => e.name);
        
        for (const rdir of rootDirs) {
          if (['系统性知识整理', '路边小项目'].includes(rdir)) {
            const subpath = path.join(vpath, rdir);
            if (fs.existsSync(subpath)) {
              const subdirs = fs.readdirSync(subpath, { withFileTypes: true })
                .filter(e => e.isDirectory() && !e.name.startsWith('.') && !excludeDirs.has(e.name))
                .map(e => `${rdir}/${e.name}`);
              dirs.push(...subdirs);
            }
          } else {
            dirs.push(rdir);
          }
        }
      }
      send(res, 200, { dirs });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/preview') {
      const collIdx = Number(url.searchParams.get('collection') || 0);
      const rel = url.searchParams.get('rel') || '';
      const content = readNotePreview(collIdx, rel);
      send(res, 200, { content: content || '' });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/collection/add') {
      const body = JSON.parse(await readBody(req));
      const manifest = addCollection(body);
      send(res, 200, manifest);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/collection/remove') {
      const body = JSON.parse(await readBody(req));
      const manifest = removeCollection(body.index);
      send(res, 200, manifest);
      return;
    }

    send(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('[publish-admin]', error);
    send(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Pinecone publish admin: http://${HOST}:${PORT}`);
  if (AUTH_TOKEN) console.log(`  (auth enabled — pass token via ?token= or Authorization: Bearer)`);
});
