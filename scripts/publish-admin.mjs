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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

function normalizeRelPath(value) {
  return value.split(path.sep).join('/');
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
  return new RegExp(`^${source}$`);
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
    const rel = base ? `${base}/${entry.name}` : entry.name;

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
      if (body.length > 8 * 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function send(res, status, payload, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
  });
  res.end(type.startsWith('application/json') ? JSON.stringify(payload) : payload);
}

function runSync() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BUILD_SCRIPT], {
      cwd: ROOT,
      shell: false,
      windowsHide: true,
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('close', (code) => {
      resolve({ ok: code === 0, code, output });
    });
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

const html = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>松果屋发布控制台</title>
  <style>
    :root {
      --ink: #fff7df;
      --muted: rgba(255, 247, 223, .68);
      --paper: rgba(255, 247, 223, .9);
      --wood: rgba(30, 18, 10, .72);
      --line: rgba(231, 199, 126, .22);
      --gold: #e7c77e;
      --amber: #b98234;
      --pine: #5aa38f;
      --bg: #071410;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      font-family: "Microsoft YaHei", "PingFang SC", Inter, system-ui, sans-serif;
      background:
        radial-gradient(circle at 20% 18%, rgba(231, 199, 126, .2), transparent 28%),
        radial-gradient(circle at 78% 74%, rgba(90, 163, 143, .16), transparent 32%),
        linear-gradient(135deg, #0b1712, #1d120b 52%, #071410);
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: .25;
      background:
        linear-gradient(rgba(231,199,126,.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(231,199,126,.035) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(circle at center, black, transparent 82%);
    }
    button, input, textarea { font: inherit; }
    button {
      min-height: 38px;
      border: 1px solid rgba(231, 199, 126, .32);
      border-radius: 6px;
      background: rgba(255, 247, 223, .1);
      color: var(--ink);
      cursor: pointer;
      transition: transform .16s ease, background .16s ease, border-color .16s ease;
    }
    button:hover { transform: translateY(-1px); background: rgba(255, 247, 223, .16); border-color: rgba(231, 199, 126, .62); }
    button.primary { background: linear-gradient(135deg, #b98234, #7b4a18); border-color: rgba(255, 247, 223, .24); }
    button.pine { background: rgba(90, 163, 143, .24); }
    .app {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 290px minmax(0, 1fr) 360px;
      gap: 18px;
      width: min(1500px, calc(100% - 32px));
      margin: 0 auto;
      padding: 28px 0;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(255,247,223,.08), rgba(8,18,15,.76)), var(--wood);
      box-shadow: 0 24px 70px rgba(0,0,0,.22);
      backdrop-filter: blur(10px);
    }
    .rail { padding: 18px; position: sticky; top: 24px; align-self: start; }
    .brand { margin-bottom: 18px; }
    .brand small { color: var(--gold); font-weight: 900; letter-spacing: .18em; text-transform: uppercase; }
    .brand h1 { margin: 8px 0 0; font-size: 1.6rem; }
    .collection {
      width: 100%;
      display: grid;
      grid-template-columns: 12px 1fr auto;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
      padding: 12px;
      text-align: left;
    }
    .dot { width: 9px; height: 9px; border-radius: 99px; background: var(--pine); box-shadow: 0 0 16px var(--pine); }
    .collection.active { background: rgba(255,247,223,.14); }
    .collection.disabled { opacity: .44; }
    .main { padding: 20px; }
    .header { display: flex; align-items: start; justify-content: space-between; gap: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
    .header h2 { margin: 0; font-size: clamp(2rem, 5vw, 4.4rem); font-weight: 300; line-height: 1; }
    .header p { margin: 10px 0 0; color: var(--muted); line-height: 1.7; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .form { display: grid; gap: 14px; margin-top: 18px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    label { display: grid; gap: 7px; color: rgba(255,247,223,.58); font-size: .78rem; }
    input, textarea {
      width: 100%;
      border: 1px solid rgba(231,199,126,.2);
      border-radius: 7px;
      background: rgba(4,12,10,.42);
      color: var(--ink);
      padding: 10px 11px;
      outline: none;
    }
    textarea { min-height: 116px; resize: vertical; line-height: 1.55; }
    input:focus, textarea:focus { border-color: rgba(231,199,126,.58); }
    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
      color: var(--ink);
      font-size: .9rem;
    }
    .toggle input { width: auto; }
    .side { display: grid; gap: 14px; align-self: start; }
    .card { padding: 16px; }
    .card h3 { margin: 0 0 10px; color: var(--gold); font-size: .95rem; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .stat { padding: 12px; border-radius: 8px; background: rgba(255,247,223,.08); }
    .stat strong { display: block; font-size: 1.3rem; }
    .stat span { color: var(--muted); font-size: .75rem; }
    .files { max-height: 420px; overflow: auto; display: grid; gap: 6px; padding-right: 4px; }
    .file {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      width: 100%;
      min-height: 42px;
      padding: 8px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: rgba(255,247,223,.055);
      color: var(--muted);
      font-size: .78rem;
      text-align: left;
    }
    .file:hover { background: rgba(255,247,223,.1); }
    .file.on { color: var(--ink); border-color: rgba(185, 130, 52, .28); }
    .file input {
      width: 16px;
      height: 16px;
      accent-color: var(--amber);
    }
    .file span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    pre {
      max-height: 240px;
      overflow: auto;
      margin: 0;
      padding: 12px;
      border-radius: 8px;
      background: rgba(0,0,0,.34);
      color: rgba(255,247,223,.82);
      white-space: pre-wrap;
    }
    .hint { color: rgba(255,247,223,.52); font-size: .78rem; line-height: 1.65; }
    @media (max-width: 1100px) {
      .app { grid-template-columns: 1fr; }
      .rail { position: static; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="panel rail">
      <div class="brand">
        <small>Pinecone Archive</small>
        <h1>发布控制台</h1>
      </div>
      <div id="collections"></div>
    </aside>

    <main class="panel main">
      <div class="header">
        <div>
          <h2 id="title">发布清单</h2>
          <p>控制哪些 Obsidian 笔记进入博客网站。保存清单后，点击同步即可重新生成 notes、notes-index 和 graph。</p>
        </div>
        <div class="actions">
          <button class="pine" id="saveBtn">保存清单</button>
          <button class="primary" id="syncBtn">同步发布</button>
        </div>
      </div>

      <section class="form">
        <label class="toggle"><input id="enabled" type="checkbox" /> 发布这个分类</label>
        <div class="grid">
          <label>显示名称<input id="label" /></label>
          <label>Vault 目录<input id="root" /></label>
          <label>分类标识<input id="kind" /></label>
        </div>
        <label>包含规则，每行一个 glob<textarea id="include"></textarea></label>
        <label>排除规则，每行一个 glob<textarea id="exclude"></textarea></label>
      </section>
    </main>

    <aside class="side">
      <section class="panel card">
        <h3>当前分类</h3>
        <div class="stats">
          <div class="stat"><strong id="includedCount">0</strong><span>将发布</span></div>
          <div class="stat"><strong id="totalCount">0</strong><span>扫描到</span></div>
        </div>
        <p class="hint">勾选表示会发布到博客。取消勾选会把该笔记加入排除规则；重新勾选会从排除规则里移除。</p>
      </section>
      <section class="panel card">
        <h3>笔记预览</h3>
        <div class="files" id="files"></div>
      </section>
      <section class="panel card">
        <h3>执行日志</h3>
        <pre id="log">等待操作...</pre>
      </section>
    </aside>
  </div>

  <script>
    let manifest = null;
    let active = 0;

    const $ = (id) => document.getElementById(id);
    const lines = (value) => value.split('\n').map((v) => v.trim()).filter(Boolean);
    const unique = (items) => Array.from(new Set(items.filter(Boolean)));

    function setLines(id, values) {
      $(id).value = unique(values).join('\n');
      syncFormToManifest();
    }

    async function api(path, options) {
      const res = await fetch(path, options);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    function syncFormToManifest() {
      const item = manifest.collections[active];
      item.enabled = $('enabled').checked;
      item.label = $('label').value.trim();
      item.root = $('root').value.trim();
      item.kind = $('kind').value.trim();
      item.include = lines($('include').value);
      item.exclude = lines($('exclude').value);
    }

    function renderCollections() {
      $('collections').innerHTML = '';
      manifest.collections.forEach((item, index) => {
        const button = document.createElement('button');
        button.className = 'collection' + (index === active ? ' active' : '') + (item.enabled === false ? ' disabled' : '');
        button.innerHTML = '<span class="dot"></span><span>' + item.label + '</span><small>' + item.kind + '</small>';
        button.onclick = () => {
          syncFormToManifest();
          active = index;
          render();
        };
        $('collections').appendChild(button);
      });
    }

    async function renderFiles() {
      syncFormToManifest();
      const data = await api('/api/files?collection=' + active);
      const files = data.files || [];
      const included = files.filter((file) => file.included);
      $('includedCount').textContent = included.length;
      $('totalCount').textContent = files.length;
      $('files').innerHTML = files.slice(0, 180).map((file) => (
        '<label class="file ' + (file.included ? 'on' : '') + '" data-rel="' + encodeURIComponent(file.rel) + '" data-included="' + file.included + '">' +
          '<input type="checkbox" ' + (file.included ? 'checked' : '') + ' />' +
          '<span>' + file.rel + '</span>' +
        '</label>'
      )).join('');
      document.querySelectorAll('.file').forEach((button) => {
        button.querySelector('input').onchange = async () => {
          const rel = decodeURIComponent(button.dataset.rel);
          const isIncluded = button.dataset.included === 'true';
          await toggleFile(rel, isIncluded);
        };
      });
    }

    async function toggleFile(rel, isIncluded) {
      syncFormToManifest();
      const item = manifest.collections[active];
      let include = unique(item.include || ['**/*.md']);
      let exclude = unique(item.exclude || []);

      if (isIncluded) {
        exclude = unique([...exclude, rel]);
      } else {
        exclude = exclude.filter((pattern) => pattern !== rel);
        const includedByRule = include.some((pattern) => {
          if (pattern === rel) return true;
          if (pattern === '**/*.md') return true;
          return false;
        });
        if (!includedByRule) include = unique([...include, rel]);
      }

      item.include = include;
      item.exclude = exclude;
      renderForm();
      await api('/api/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });
      await renderFiles();
    }

    function renderForm() {
      const item = manifest.collections[active];
      $('title').textContent = item.label || '发布清单';
      $('enabled').checked = item.enabled !== false;
      $('label').value = item.label || '';
      $('root').value = item.root || '';
      $('kind').value = item.kind || '';
      $('include').value = (item.include || ['**/*.md']).join('\n');
      $('exclude').value = (item.exclude || []).join('\n');
    }

    async function render() {
      renderCollections();
      renderForm();
      await renderFiles();
    }

    async function load() {
      manifest = await api('/api/manifest');
      await render();
    }

    $('saveBtn').onclick = async () => {
      syncFormToManifest();
      $('log').textContent = '正在保存清单...';
      await api('/api/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });
      $('log').textContent = '清单已保存。';
      await render();
    };

    $('syncBtn').onclick = async () => {
      syncFormToManifest();
      $('log').textContent = '正在保存清单并同步...';
      await api('/api/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });
      const result = await api('/api/sync', { method: 'POST' });
      $('log').textContent = result.output || '同步完成。';
      await render();
    };

    document.querySelectorAll('input, textarea').forEach((el) => {
      el.addEventListener('change', () => {
        syncFormToManifest();
        renderCollections();
      });
    });

    load().catch((error) => {
      $('log').textContent = error.stack || String(error);
    });
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/') {
      send(res, 200, html, 'text/html; charset=utf-8');
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

    send(res, 404, { error: 'Not found' });
  } catch (error) {
    send(res, 500, { error: error.message, stack: error.stack });
  }
});

server.listen(PORT, () => {
  console.log(`Pinecone publish admin: http://localhost:${PORT}`);
});
