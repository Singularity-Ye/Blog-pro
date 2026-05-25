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
  const full = path.join(manifest.vaultPath, collection.root, ...rel.split('/'));
  if (!fs.existsSync(full)) return null;
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

const html = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>松果屋发布控制台</title>
  <style>
    :root {
      --ink: #f5efe3; --muted: rgba(245,239,227,.55); --muted2: rgba(245,239,227,.35);
      --gold: #e7c77e; --amber: #b98234; --pine: #5aa38f; --danger: #c45c5c;
      --bg: #060e0b; --bg2: #0a1813;
      --wood: rgba(14,24,20,.82); --line: rgba(231,199,126,.18);
      --hover: rgba(231,199,126,.07); --active: rgba(231,199,126,.14);
      --r: 8px;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; }
    body {
      min-height: 100vh; color: var(--ink);
      font-family: "Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;
      font-size: 14px; line-height: 1.6;
      background: linear-gradient(135deg, #0b1712, #1d120b 52%, #071410);
    }
    body::before {
      content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .2;
      background:
        linear-gradient(rgba(231,199,126,.04) 1px,transparent 1px),
        linear-gradient(90deg,rgba(231,199,126,.03) 1px,transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(circle at center, black, transparent 85%);
    }
    button, input, textarea, select { font: inherit; color: inherit; }
    a { color: var(--gold); }

    /* ── Layout ── */
    .app {
      position: relative; z-index: 1;
      display: grid; grid-template-columns: 240px minmax(0,1fr);
      min-height: 100vh;
    }

    /* ── Sidebar ── */
    .sidebar {
      border-right: 1px solid var(--line);
      background: rgba(8,16,12,.88);
      display: flex; flex-direction: column;
      padding: 22px 14px;
      position: sticky; top: 0; height: 100vh;
      overflow-y: auto;
      backdrop-filter: blur(12px);
    }
    .brand { margin-bottom: 22px; padding: 0 6px; }
    .brand small {
      color: var(--gold); font-weight: 800; font-size: .65rem;
      letter-spacing: .2em; text-transform: uppercase;
    }
    .brand h1 { font-size: 1.3rem; margin-top: 4px; font-weight: 700; }
    .side-label {
      padding: 0 8px; margin: 18px 0 8px;
      font-size: .7rem; color: var(--muted2); text-transform: uppercase;
      letter-spacing: .12em; font-weight: 700;
    }
    .coll-btn {
      width: 100%; display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border: 1px solid transparent; border-radius: var(--r);
      background: transparent; cursor: pointer; text-align: left;
      transition: background .15s, border-color .15s;
    }
    .coll-btn:hover { background: var(--hover); }
    .coll-btn.active { background: var(--active); border-color: var(--line); }
    .coll-btn.disabled { opacity: .4; }
    .coll-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--pine); box-shadow: 0 0 10px rgba(90,163,143,.5);
      flex-shrink: 0;
    }
    .coll-btn.disabled .coll-dot { background: var(--muted2); box-shadow: none; }
    .coll-info { flex: 1; min-width: 0; }
    .coll-name { display: block; font-size: .85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .coll-kind { font-size: .7rem; color: var(--muted); }
    .side-actions { margin-top: auto; padding-top: 18px; display: grid; gap: 8px; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      height: 36px; padding: 0 14px; border: 1px solid var(--line); border-radius: var(--r);
      background: rgba(245,239,227,.06); cursor: pointer; font-size: .8rem;
      transition: background .15s, border-color .15s, transform .12s;
      white-space: nowrap;
    }
    .btn:hover { background: rgba(245,239,227,.12); border-color: rgba(231,199,126,.4); transform: translateY(-1px); }
    .btn:active { transform: translateY(0); }
    .btn:disabled { opacity: .4; pointer-events: none; }
    .btn-primary { background: linear-gradient(135deg,#b98234,#7b4a18); border-color: rgba(255,247,223,.2); font-weight: 600; }
    .btn-primary:hover { background: linear-gradient(135deg,#c8923e,#8b5520); }
    .btn-pine { background: rgba(90,163,143,.2); border-color: rgba(90,163,143,.3); }
    .btn-danger { background: rgba(196,92,92,.15); border-color: rgba(196,92,92,.3); color: #f0a0a0; }
    .btn-danger:hover { background: rgba(196,92,92,.28); }
    .btn-sm { height: 28px; padding: 0 10px; font-size: .72rem; }
    .btn-ghost { border-color: transparent; background: transparent; }
    .btn-ghost:hover { background: var(--hover); border-color: transparent; }

    /* ── Main area ── */
    .main { padding: 24px 28px; display: flex; flex-direction: column; gap: 18px; min-height: 100vh; }

    /* ── Top bar ── */
    .topbar {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding-bottom: 16px; border-bottom: 1px solid var(--line);
    }
    .topbar h2 { font-size: 1.5rem; font-weight: 700; }
    .topbar-sub { font-size: .78rem; color: var(--muted); margin-top: 2px; }
    .topbar-actions { display: flex; gap: 8px; flex-shrink: 0; }

    /* ── Settings panel ── */
    .settings-panel {
      border: 1px solid var(--line); border-radius: var(--r);
      background: var(--wood); backdrop-filter: blur(8px);
    }
    .settings-panel summary {
      padding: 12px 16px; cursor: pointer; font-weight: 600; font-size: .85rem;
      color: var(--gold); list-style: none; user-select: none;
      display: flex; align-items: center; gap: 8px;
    }
    .settings-panel summary::before { content: "▶"; font-size: .65rem; transition: transform .2s; }
    .settings-panel[open] summary::before { transform: rotate(90deg); }
    .settings-body {
      padding: 0 16px 16px; display: grid; gap: 12px;
    }
    .field-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
    .field label { display: grid; gap: 5px; color: var(--muted); font-size: .72rem; font-weight: 600; }
    .field input, .field textarea {
      width: 100%; border: 1px solid rgba(231,199,126,.15); border-radius: 6px;
      background: rgba(4,12,10,.5); padding: 8px 10px; outline: none;
      transition: border-color .15s;
    }
    .field input:focus, .field textarea:focus { border-color: rgba(231,199,126,.5); }
    .field textarea { min-height: 72px; resize: vertical; line-height: 1.55; font-family: "IBM Plex Mono","Fira Code",monospace; font-size: .78rem; }
    .toggle-label {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: .85rem; cursor: pointer; user-select: none;
    }
    .toggle-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--pine); cursor: pointer; }

    /* ── File Browser ── */
    .browser {
      flex: 1; border: 1px solid var(--line); border-radius: var(--r);
      background: var(--wood); backdrop-filter: blur(8px);
      display: flex; flex-direction: column; min-height: 300px;
    }
    .browser-toolbar {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-bottom: 1px solid var(--line);
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1; min-width: 180px; position: relative;
    }
    .search-box svg {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      width: 14px; height: 14px; stroke: var(--muted); fill: none; pointer-events: none;
    }
    .search-box input {
      width: 100%; height: 32px; padding: 0 10px 0 32px;
      border: 1px solid rgba(231,199,126,.12); border-radius: 6px;
      background: rgba(4,12,10,.4); outline: none; font-size: .8rem;
      transition: border-color .15s;
    }
    .search-box input:focus { border-color: rgba(231,199,126,.45); }
    .browser-stats {
      font-size: .75rem; color: var(--muted); white-space: nowrap;
    }
    .browser-stats strong { color: var(--pine); font-size: .85rem; }
    .batch-btns { display: flex; gap: 4px; }

    .filelist {
      flex: 1; overflow-y: auto; padding: 6px 8px;
      scrollbar-width: thin; scrollbar-color: rgba(231,199,126,.2) transparent;
    }

    /* ── Tree View ── */
    .tree-row {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 8px; border-radius: 5px; cursor: default;
      transition: background .12s;
      min-height: 32px;
    }
    .tree-row:hover { background: var(--hover); }
    .tree-toggle {
      width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; cursor: pointer; padding: 0;
      font-size: .55rem; color: var(--muted); border-radius: 3px;
      transition: background .1s, transform .2s;
      flex-shrink: 0;
    }
    .tree-toggle:hover { background: rgba(231,199,126,.15); }
    .tree-toggle.open { transform: rotate(90deg); }
    .tree-icon { font-size: .85rem; flex-shrink: 0; line-height: 1; }
    .tree-label {
      flex: 1; font-size: .82rem; font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .tree-badge {
      font-size: .65rem; padding: 1px 7px; border-radius: 10px;
      background: rgba(90,163,143,.15); color: var(--pine);
      white-space: nowrap; flex-shrink: 0;
    }
    .tree-badge.all { background: rgba(90,163,143,.25); }
    .tree-badge.none { background: rgba(196,92,92,.15); color: var(--danger); }
    .tree-check {
      width: 15px; height: 15px; accent-color: var(--amber); cursor: pointer; flex-shrink: 0;
    }
    .tree-children { /* indent handled by padding-left */ }

    .tree-file .tree-row { cursor: pointer; }
    .tree-file.excluded { opacity: .5; }
    .tree-file.excluded:hover { opacity: .75; }
    .file-name {
      flex: 1; font-size: .8rem;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      cursor: pointer;
    }
    .file-name:hover { color: var(--gold); }
    .preview-btn {
      opacity: 0; border: none; background: transparent;
      cursor: pointer; font-size: .7rem; color: var(--muted); padding: 2px 6px;
      border-radius: 4px; transition: opacity .15s, background .15s;
    }
    .tree-row:hover .preview-btn { opacity: 1; }
    .preview-btn:hover { background: var(--hover); color: var(--gold); }

    /* ── Search Results (flat list) ── */
    .search-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 10px; border-radius: 5px;
      transition: background .12s; cursor: default;
    }
    .search-item:hover { background: var(--hover); }
    .search-path { flex: 1; font-size: .8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .search-path .folder { color: var(--muted); }
    .search-path .match { color: var(--gold); font-weight: 700; }

    /* ── Bottom panels ── */
    .bottom-section {
      border: 1px solid var(--line); border-radius: var(--r);
      background: var(--wood); backdrop-filter: blur(8px);
      min-height: 160px; display: flex; flex-direction: column;
    }
    .panel-tabs {
      display: flex; border-bottom: 1px solid var(--line); padding: 0 8px;
    }
    .panel-tab {
      padding: 8px 16px; border: none; background: transparent;
      cursor: pointer; font-size: .78rem; color: var(--muted);
      border-bottom: 2px solid transparent; transition: color .15s, border-color .15s;
    }
    .panel-tab:hover { color: var(--ink); }
    .panel-tab.active { color: var(--gold); border-bottom-color: var(--gold); }
    .panel-body {
      flex: 1; padding: 12px 16px; overflow-y: auto; max-height: 280px;
    }
    .panel-body.hidden { display: none; }
    .preview-content {
      font-size: .8rem; line-height: 1.7; color: rgba(245,239,227,.82);
      white-space: pre-wrap; word-break: break-word;
      font-family: "IBM Plex Mono","Fira Code",monospace;
    }
    .preview-placeholder { color: var(--muted); font-size: .82rem; text-align: center; padding: 30px; }
    .log-content {
      font-size: .75rem; line-height: 1.6; color: rgba(245,239,227,.75);
      white-space: pre-wrap; word-break: break-word;
      font-family: "IBM Plex Mono","Fira Code",monospace;
    }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .15s ease;
    }
    .modal-overlay.hidden { display: none; }
    .modal-box {
      width: min(420px, calc(100vw - 40px));
      border: 1px solid var(--line); border-radius: 12px;
      background: linear-gradient(135deg, rgba(14,24,20,.96), rgba(30,18,10,.94));
      box-shadow: 0 24px 80px rgba(0,0,0,.5);
      padding: 24px; animation: scaleIn .2s ease;
    }
    .modal-box h3 { font-size: 1.1rem; margin-bottom: 16px; }
    .modal-form { display: grid; gap: 12px; }
    .modal-form label { display: grid; gap: 4px; font-size: .78rem; color: var(--muted); font-weight: 600; }
    .modal-form input {
      height: 36px; border: 1px solid rgba(231,199,126,.18); border-radius: 6px;
      background: rgba(4,12,10,.5); padding: 0 10px; outline: none;
    }
    .modal-form input:focus { border-color: rgba(231,199,126,.5); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
    .modal-msg { font-size: .85rem; line-height: 1.7; color: var(--ink); }

    /* ── Toast ── */
    .toast-container {
      position: fixed; top: 16px; right: 16px; z-index: 300;
      display: flex; flex-direction: column; gap: 8px;
      pointer-events: none;
    }
    .toast {
      padding: 10px 18px; border-radius: var(--r);
      border: 1px solid var(--line);
      background: rgba(10,24,19,.92); backdrop-filter: blur(12px);
      font-size: .82rem; color: var(--ink);
      animation: slideInRight .25s ease;
      pointer-events: auto;
      box-shadow: 0 8px 30px rgba(0,0,0,.3);
    }
    .toast-success { border-color: rgba(90,163,143,.4); }
    .toast-success::before { content: "✓ "; color: var(--pine); font-weight: 700; }
    .toast-error { border-color: rgba(196,92,92,.4); }
    .toast-error::before { content: "✕ "; color: var(--danger); font-weight: 700; }
    .toast-info::before { content: "● "; color: var(--gold); }
    .toast.fade-out { animation: fadeOut .25s ease forwards; }

    /* ── Spinner ── */
    .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--muted2); border-top-color: var(--gold); border-radius: 50%; animation: spin .6s linear infinite; }

    /* ── Animations ── */
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(.95) } to { opacity: 1; transform: scale(1) } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: translateX(0) } }
    @keyframes spin { to { transform: rotate(360deg) } }

    /* ── Empty state ── */
    .empty-state { text-align: center; padding: 40px 20px; color: var(--muted); }
    .empty-state .icon { font-size: 2rem; margin-bottom: 10px; }

    /* ── Responsive ── */
    @media (max-width: 860px) {
      .app { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; flex-direction: row; flex-wrap: wrap; padding: 14px; gap: 10px; }
      .brand { margin-bottom: 0; }
      .side-label { display: none; }
      .side-actions { margin-top: 0; padding-top: 0; flex-direction: row; }
      .field-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <datalist id="vaultDirs"></datalist>
  <div class="toast-container" id="toasts"></div>

  <div id="modal" class="modal-overlay hidden">
    <div class="modal-box">
      <h3 id="modalTitle"></h3>
      <div id="modalBody"></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modalCancel">取消</button>
        <button class="btn btn-primary" id="modalConfirm">确认</button>
      </div>
    </div>
  </div>

  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <small>Pinecone Archive</small>
        <h1>发布控制台</h1>
      </div>
      <div class="side-label">分类列表</div>
      <div id="colls"></div>
      <div class="side-actions">
        <button class="btn btn-ghost" id="addCollBtn">+ 新增分类</button>
        <button class="btn btn-primary" id="syncBtn">
          <span id="syncLabel">同步发布</span>
        </button>
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <div>
          <h2 id="title">发布清单</h2>
          <div class="topbar-sub" id="subtitle"></div>
        </div>
        <div class="topbar-actions">
          <button class="btn btn-pine" id="saveBtn">保存清单</button>
          <button class="btn btn-danger btn-sm" id="deleteCollBtn">删除分类</button>
        </div>
      </div>

      <details class="settings-panel" id="settingsPanel">
        <summary>分类设置</summary>
        <div class="settings-body">
          <label class="toggle-label"><input id="enabled" type="checkbox" /> 发布这个分类</label>
          <div class="field-grid field">
            <label>显示名称<input id="label" /></label>
            <label>Vault 目录<input id="root" list="vaultDirs" autocomplete="off" /></label>
            <label>分类标识<input id="kind" /></label>
          </div>
          <div class="field">
            <label>包含规则 (每行一个 glob)<textarea id="include"></textarea></label>
          </div>
          <div class="field">
            <label>排除规则 (每行一个 glob)<textarea id="exclude"></textarea></label>
          </div>
        </div>
      </details>

      <section class="browser">
        <div class="browser-toolbar">
          <div class="search-box">
            <svg viewBox="0 0 24 24" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="searchInput" placeholder="搜索笔记文件名或路径..." />
          </div>
          <div class="browser-stats">
            <strong id="statIncluded">0</strong> / <span id="statTotal">0</span> 已发布
          </div>
          <div class="batch-btns">
            <button class="btn btn-sm btn-ghost" id="selectAllBtn">全选</button>
            <button class="btn btn-sm btn-ghost" id="selectNoneBtn">全不选</button>
          </div>
        </div>
        <div class="filelist" id="filelist"></div>
      </section>

      <section class="bottom-section">
        <div class="panel-tabs">
          <button class="panel-tab active" data-tab="preview">预览</button>
          <button class="panel-tab" data-tab="log">执行日志</button>
        </div>
        <div class="panel-body" id="previewPane">
          <div class="preview-placeholder" id="previewPlaceholder">点击文件名可预览笔记内容</div>
          <div class="preview-content" id="previewContent" style="display:none"></div>
        </div>
        <div class="panel-body hidden" id="logPane">
          <div class="log-content" id="logContent">等待操作...</div>
        </div>
      </section>
    </main>
  </div>

  <script>
    /* ── State ── */
    var state = {
      manifest: null,
      active: 0,
      files: [],
      searchQuery: '',
      isBusy: false,
      expandedFolders: {},
      previewRel: null,
      activeTab: 'preview'
    };

    var $ = function(id) { return document.getElementById(id); };

    /* ── API helper ── */
    function api(path, options) {
      return fetch(path, options).then(function(res) {
        if (!res.ok) return res.text().then(function(t) { throw new Error(t); });
        return res.json();
      });
    }

    /* ── Toast ── */
    function showToast(msg, type) {
      var el = document.createElement('div');
      el.className = 'toast toast-' + (type || 'info');
      el.textContent = msg;
      $('toasts').appendChild(el);
      setTimeout(function() {
        el.classList.add('fade-out');
        setTimeout(function() { el.remove(); }, 260);
      }, 3200);
    }

    /* ── Modal ── */
    function showModal(title, bodyHtml, onConfirm) {
      $('modalTitle').textContent = title;
      $('modalBody').innerHTML = bodyHtml;
      $('modal').classList.remove('hidden');
      $('modalConfirm').onclick = function() {
        $('modal').classList.add('hidden');
        if (onConfirm) onConfirm();
      };
      $('modalCancel').onclick = function() { $('modal').classList.add('hidden'); };
    }

    /* ── Busy lock ── */
    function setBusy(busy) {
      state.isBusy = busy;
      document.querySelectorAll('.btn').forEach(function(b) { b.disabled = busy; });
      document.querySelectorAll('.tree-check').forEach(function(c) { c.disabled = busy; });
    }

    /* ── Load manifest ── */
    function loadManifest() {
      return api('/api/manifest').then(function(data) { state.manifest = data; });
    }

    /* ── Render collections sidebar ── */
    function renderCollections() {
      var html = '';
      state.manifest.collections.forEach(function(item, idx) {
        var cls = 'coll-btn' + (idx === state.active ? ' active' : '') + (item.enabled === false ? ' disabled' : '');
        html += '<button class="' + cls + '" data-index="' + idx + '">'
          + '<span class="coll-dot"></span>'
          + '<span class="coll-info"><span class="coll-name">' + esc(item.label) + '</span>'
          + '<span class="coll-kind">' + esc(item.kind || '') + '</span></span>'
          + '</button>';
      });
      $('colls').innerHTML = html;
      document.querySelectorAll('.coll-btn').forEach(function(btn) {
        btn.onclick = function() {
          readFormToManifest();
          state.active = parseInt(btn.dataset.index);
          state.searchQuery = '';
          $('searchInput').value = '';
          state.expandedFolders = {};
          render();
        };
      });
    }

    /* ── Read form fields into manifest ── */
    function readFormToManifest() {
      if (!state.manifest) return;
      var item = state.manifest.collections[state.active];
      if (!item) return;
      item.enabled = $('enabled').checked;
      item.label = $('label').value.trim();
      item.root = $('root').value.trim();
      item.kind = $('kind').value.trim();
      item.include = $('include').value.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
      item.exclude = $('exclude').value.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
    }

    /* ── Write manifest fields to form ── */
    function renderForm() {
      var item = state.manifest.collections[state.active];
      if (!item) return;
      $('title').textContent = item.label || '发布清单';
      $('subtitle').textContent = 'Vault: ' + (item.root || '(未设置)') + '  ·  类型: ' + (item.kind || '-');
      $('enabled').checked = item.enabled !== false;
      $('label').value = item.label || '';
      $('root').value = item.root || '';
      $('kind').value = item.kind || '';
      $('include').value = (item.include || ['**/*.md']).join('\n');
      $('exclude').value = (item.exclude || []).join('\n');
    }

    /* ── Load files from server ── */
    function loadFiles() {
      return api('/api/files?collection=' + state.active).then(function(data) {
        state.files = data.files || [];
        updateStats();
        renderFileList();
      });
    }

    /* ── Update stats ── */
    function updateStats() {
      var included = state.files.filter(function(f) { return f.included; }).length;
      $('statIncluded').textContent = included;
      $('statTotal').textContent = state.files.length;
    }

    /* ── HTML escape ── */
    function esc(s) {
      var d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    /* ── Build tree from flat file list ── */
    function buildTree(files) {
      var root = { name: '', path: '', children: [], fileItems: [] };
      files.forEach(function(file) {
        var parts = file.rel.split('/');
        var current = root;
        for (var i = 0; i < parts.length - 1; i++) {
          var folderPath = parts.slice(0, i + 1).join('/');
          var found = null;
          for (var j = 0; j < current.children.length; j++) {
            if (current.children[j].name === parts[i]) { found = current.children[j]; break; }
          }
          if (!found) {
            found = { name: parts[i], path: folderPath, children: [], fileItems: [] };
            current.children.push(found);
          }
          current = found;
        }
        current.fileItems.push({ name: parts[parts.length - 1], rel: file.rel, included: file.included });
      });
      return root;
    }

    /* ── Count helpers ── */
    function countAll(node) {
      var c = node.fileItems.length;
      node.children.forEach(function(ch) { c += countAll(ch); });
      return c;
    }
    function countIncl(node) {
      var c = node.fileItems.filter(function(f) { return f.included; }).length;
      node.children.forEach(function(ch) { c += countIncl(ch); });
      return c;
    }

    /* ── Collect all rels under a folder node ── */
    function collectRels(node) {
      var rels = node.fileItems.map(function(f) { return f.rel; });
      node.children.forEach(function(ch) { rels = rels.concat(collectRels(ch)); });
      return rels;
    }

    /* ── Render tree node ── */
    function renderTreeNode(node, depth) {
      var html = '';
      /* Sort: folders first, then files, both alphabetically */
      node.children.sort(function(a, b) { return a.name.localeCompare(b.name, 'zh-CN'); });
      node.fileItems.sort(function(a, b) { return a.name.localeCompare(b.name, 'zh-CN'); });

      node.children.forEach(function(child) {
        var total = countAll(child);
        var incl = countIncl(child);
        var isOpen = !!state.expandedFolders[child.path];
        var badgeCls = 'tree-badge' + (incl === total ? ' all' : (incl === 0 ? ' none' : ''));

        html += '<div class="tree-folder">';
        html += '<div class="tree-row" style="padding-left:' + (depth * 20 + 6) + 'px">';
        html += '<button class="tree-toggle' + (isOpen ? ' open' : '') + '" data-path="' + esc(child.path) + '">&#9654;</button>';
        html += '<span class="tree-icon">' + (isOpen ? '📂' : '📁') + '</span>';
        html += '<span class="tree-label">' + esc(child.name) + '</span>';
        html += '<span class="' + badgeCls + '">' + incl + '/' + total + '</span>';
        html += '<input type="checkbox" class="tree-check" data-folder="' + esc(child.path) + '"'
          + (incl === total && total > 0 ? ' checked' : '') + '>';
        html += '</div>';

        if (isOpen) {
          html += '<div class="tree-children">' + renderTreeNode(child, depth + 1) + '</div>';
        }
        html += '</div>';
      });

      node.fileItems.forEach(function(file) {
        var cls = 'tree-file' + (file.included ? ' included' : ' excluded');
        html += '<div class="' + cls + '">';
        html += '<div class="tree-row" style="padding-left:' + (depth * 20 + 6) + 'px">';
        html += '<span style="width:18px"></span>';
        html += '<input type="checkbox" class="tree-check" data-file="' + encodeURIComponent(file.rel) + '"' + (file.included ? ' checked' : '') + '>';
        html += '<span class="file-name" data-preview="' + encodeURIComponent(file.rel) + '">' + esc(file.name.replace(/\.md$/i, '')) + '</span>';
        html += '<button class="preview-btn" data-preview="' + encodeURIComponent(file.rel) + '" title="预览">👁</button>';
        html += '</div>';
        html += '</div>';
      });

      return html;
    }

    /* ── Render search results (flat filtered list) ── */
    function renderSearchResults(query) {
      var q = query.toLowerCase();
      var matches = state.files.filter(function(f) { return f.rel.toLowerCase().indexOf(q) !== -1; });
      if (matches.length === 0) {
        return '<div class="empty-state"><div class="icon">🔍</div><p>没有找到匹配的笔记</p></div>';
      }
      var html = '';
      matches.forEach(function(file) {
        var parts = file.rel.split('/');
        var fileName = parts.pop().replace(/\.md$/i, '');
        var folder = parts.length > 0 ? parts.join('/') + '/' : '';
        var cls = 'search-item' + (file.included ? '' : ' excluded');

        /* Highlight match */
        var displayName = esc(fileName);
        var displayFolder = esc(folder);
        var re = new RegExp('(' + q.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        displayName = displayName.replace(re, '<span class="match">$1</span>');
        displayFolder = displayFolder.replace(re, '<span class="match">$1</span>');

        html += '<div class="' + cls + '">';
        html += '<input type="checkbox" class="tree-check" data-file="' + encodeURIComponent(file.rel) + '"' + (file.included ? ' checked' : '') + '>';
        html += '<span class="search-path file-name" data-preview="' + encodeURIComponent(file.rel) + '"><span class="folder">' + displayFolder + '</span>' + displayName + '</span>';
        html += '<button class="preview-btn" data-preview="' + encodeURIComponent(file.rel) + '" title="预览" style="opacity:1">👁</button>';
        html += '</div>';
      });
      return html;
    }

    /* ── Main render file list ── */
    function renderFileList() {
      var scrollTop = $('filelist').scrollTop;
      var q = state.searchQuery.trim();
      if (q) {
        $('filelist').innerHTML = renderSearchResults(q);
      } else if (state.files.length === 0) {
        $('filelist').innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>这个分类下没有找到任何笔记文件</p></div>';
      } else {
        var tree = buildTree(state.files);
        $('filelist').innerHTML = renderTreeNode(tree, 0);
      }
      /* Restore scroll position if possible */
      $('filelist').scrollTop = scrollTop;
      bindFileEvents();
    }

    /* ── Bind events on file list items ── */
    function bindFileEvents() {
      /* File checkbox toggle */
      document.querySelectorAll('.tree-check[data-file]').forEach(function(cb) {
        cb.onchange = function() {
          if (state.isBusy) { cb.checked = !cb.checked; return; }
          var rel = decodeURIComponent(cb.dataset.file);
          var file = state.files.find(function(f) { return f.rel === rel; });
          if (!file) return;
          toggleFile(rel, file.included);
        };
      });

      /* Folder checkbox toggle (batch all children) */
      document.querySelectorAll('.tree-check[data-folder]').forEach(function(cb) {
        cb.onchange = function() {
          if (state.isBusy) { cb.checked = !cb.checked; return; }
          toggleFolder(cb.dataset.folder, cb.checked);
        };
      });

      /* Folder expand/collapse */
      document.querySelectorAll('.tree-toggle').forEach(function(btn) {
        btn.onclick = function(e) {
          e.stopPropagation();
          var p = btn.dataset.path;
          state.expandedFolders[p] = !state.expandedFolders[p];
          renderFileList();
        };
      });

      /* Preview buttons and file name click */
      document.querySelectorAll('[data-preview]').forEach(function(el) {
        if (el.tagName === 'BUTTON' || el.classList.contains('file-name')) {
          el.onclick = function(e) {
            e.stopPropagation();
            loadPreview(decodeURIComponent(el.dataset.preview));
          };
        }
      });

      /* Set indeterminate state for folder checkboxes */
      document.querySelectorAll('.tree-check[data-folder]').forEach(function(cb) {
        var folderPath = cb.dataset.folder;
        var tree = buildTree(state.files);
        var node = findNode(tree, folderPath);
        if (node) {
          var total = countAll(node);
          var incl = countIncl(node);
          cb.indeterminate = incl > 0 && incl < total;
        }
      });
    }

    /* ── Find a folder node in tree by path ── */
    function findNode(tree, path) {
      if (tree.path === path) return tree;
      for (var i = 0; i < tree.children.length; i++) {
        var found = findNode(tree.children[i], path);
        if (found) return found;
      }
      return null;
    }

    /* ── Toggle single file via server API ── */
    function toggleFile(rel, currentlyIncluded) {
      if (state.isBusy) return;
      readFormToManifest();
      setBusy(true);
      var action = currentlyIncluded ? 'exclude' : 'include';
      return api('/api/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: state.active, rel: rel, action: action })
      }).then(function(data) {
        state.files = data.files || [];
        /* Also update manifest in memory to keep include/exclude in sync */
        if (data.collection) {
          state.manifest.collections[state.active].include = data.collection.include;
          state.manifest.collections[state.active].exclude = data.collection.exclude;
          renderForm();
        }
        updateStats();
        renderFileList();
        setBusy(false);
      }).catch(function(err) {
        showToast('切换失败: ' + err.message, 'error');
        setBusy(false);
      });
    }

    /* ── Toggle all files in a folder ── */
    function toggleFolder(folderPath, shouldInclude) {
      if (state.isBusy) return;
      readFormToManifest();
      var tree = buildTree(state.files);
      var node = findNode(tree, folderPath);
      if (!node) return;

      var rels = collectRels(node);
      var action = shouldInclude ? 'include' : 'exclude';
      /* Only toggle files that need changing */
      var toChange = rels.filter(function(rel) {
        var f = state.files.find(function(ff) { return ff.rel === rel; });
        return f && f.included !== shouldInclude;
      }).map(function(rel) { return { rel: rel, action: action }; });

      if (toChange.length === 0) return;
      setBusy(true);
      api('/api/toggle-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: state.active, files: toChange })
      }).then(function(data) {
        state.files = data.files || [];
        if (data.collection) {
          state.manifest.collections[state.active].include = data.collection.include;
          state.manifest.collections[state.active].exclude = data.collection.exclude;
          renderForm();
        }
        updateStats();
        renderFileList();
        showToast((shouldInclude ? '已发布' : '已排除') + ' ' + toChange.length + ' 个笔记', 'success');
        setBusy(false);
      }).catch(function(err) {
        showToast('批量操作失败: ' + err.message, 'error');
        setBusy(false);
      });
    }

    /* ── Select All / None ── */
    function batchToggle(action) {
      if (state.isBusy) return;
      readFormToManifest();
      var toChange = [];
      var wantIncluded = action === 'include';
      var q = state.searchQuery.trim().toLowerCase();
      var targetFiles = state.files;
      if (q) {
        targetFiles = state.files.filter(function(f) { return f.rel.toLowerCase().indexOf(q) !== -1; });
      }
      targetFiles.forEach(function(f) {
        if (f.included !== wantIncluded) {
          toChange.push({ rel: f.rel, action: action });
        }
      });
      if (toChange.length === 0) { showToast('没有需要更改的文件', 'info'); return; }
      if (toChange.length > 30) {
        showModal(
          '确认批量操作',
          '<p class="modal-msg">即将' + (wantIncluded ? '发布' : '排除') + ' <strong>' + toChange.length + '</strong> 个笔记文件，确定继续吗？</p>',
          function() { executeBatch(toChange, wantIncluded); }
        );
      } else {
        executeBatch(toChange, wantIncluded);
      }
    }

    function executeBatch(toChange, wantIncluded) {
      setBusy(true);
      api('/api/toggle-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: state.active, files: toChange })
      }).then(function(data) {
        state.files = data.files || [];
        if (data.collection) {
          state.manifest.collections[state.active].include = data.collection.include;
          state.manifest.collections[state.active].exclude = data.collection.exclude;
          renderForm();
        }
        updateStats();
        renderFileList();
        showToast('已' + (wantIncluded ? '发布' : '排除') + ' ' + toChange.length + ' 个笔记', 'success');
        setBusy(false);
      }).catch(function(err) {
        showToast('批量操作失败: ' + err.message, 'error');
        setBusy(false);
      });
    }

    /* ── Save manifest ── */
    function saveManifest() {
      if (state.isBusy) return;
      readFormToManifest();
      setBusy(true);
      api('/api/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.manifest)
      }).then(function() {
        showToast('清单已保存', 'success');
        renderCollections();
        return loadFiles();
      }).then(function() {
        setBusy(false);
      }).catch(function(err) {
        showToast('保存失败: ' + err.message, 'error');
        setBusy(false);
      });
    }

    /* ── Sync publish ── */
    function syncPublish() {
      if (state.isBusy) return;
      readFormToManifest();
      setBusy(true);
      $('syncLabel').innerHTML = '<span class="spinner"></span> 同步中...';
      $('logContent').textContent = '正在保存清单并同步...';
      switchTab('log');
      api('/api/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.manifest)
      }).then(function() {
        return api('/api/sync', { method: 'POST' });
      }).then(function(result) {
        $('logContent').textContent = result.output || '同步完成。';
        showToast(result.ok ? '同步发布完成！' : '同步出错，请查看日志', result.ok ? 'success' : 'error');
        $('syncLabel').textContent = '同步发布';
        setBusy(false);
        return loadFiles();
      }).catch(function(err) {
        $('logContent').textContent = '同步失败: ' + err.message;
        $('syncLabel').textContent = '同步发布';
        showToast('同步失败: ' + err.message, 'error');
        setBusy(false);
      });
    }

    /* ── Load preview ── */
    function loadPreview(rel) {
      switchTab('preview');
      $('previewPlaceholder').style.display = 'none';
      $('previewContent').style.display = 'block';
      $('previewContent').textContent = '加载中...';
      state.previewRel = rel;
      api('/api/preview?collection=' + state.active + '&rel=' + encodeURIComponent(rel))
        .then(function(data) {
          if (state.previewRel !== rel) return;
          $('previewContent').textContent = data.content || '(空文件)';
        }).catch(function(err) {
          $('previewContent').textContent = '预览失败: ' + err.message;
        });
    }

    /* ── Tab switching ── */
    function switchTab(tab) {
      state.activeTab = tab;
      document.querySelectorAll('.panel-tab').forEach(function(t) {
        t.classList.toggle('active', t.dataset.tab === tab);
      });
      $('previewPane').classList.toggle('hidden', tab !== 'preview');
      $('logPane').classList.toggle('hidden', tab !== 'log');
    }

    /* ── Add collection ── */
    function addCollectionModal() {
      showModal('新增分类', [
        '<div class="modal-form">',
        '<label>显示名称 <input id="newLabel" placeholder="如：我的旅行日记" /></label>',
        '<label>Vault 目录名 <input id="newRoot" list="vaultDirs" autocomplete="off" placeholder="如：旅行日记" /></label>',
        '<label>分类标识 <input id="newKind" placeholder="如：travel" /></label>',
        '</div>'
      ].join(''), function() {
        var label = document.getElementById('newLabel').value.trim();
        var root = document.getElementById('newRoot').value.trim();
        var kind = document.getElementById('newKind').value.trim();
        if (!label || !root) { showToast('名称和目录不能为空', 'error'); return; }
        api('/api/collection/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: label, root: root, kind: kind })
        }).then(function(data) {
          state.manifest = data;
          state.active = state.manifest.collections.length - 1;
          state.expandedFolders = {};
          render();
          showToast('分类「' + label + '」已创建', 'success');
        }).catch(function(err) { showToast('创建失败: ' + err.message, 'error'); });
      });
    }

    /* ── Remove collection ── */
    function removeCollectionModal() {
      var name = state.manifest.collections[state.active]?.label || '未命名';
      showModal('删除分类', '<p class="modal-msg">确定要删除分类「<strong>' + esc(name) + '</strong>」吗？此操作不可撤销。</p>',
        function() {
          api('/api/collection/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: state.active })
          }).then(function(data) {
            state.manifest = data;
            state.active = Math.min(state.active, state.manifest.collections.length - 1);
            if (state.active < 0) state.active = 0;
            state.expandedFolders = {};
            render();
            showToast('分类已删除', 'success');
          }).catch(function(err) { showToast('删除失败: ' + err.message, 'error'); });
        }
      );
    }

    /* ── Full render ── */
    function render() {
      renderCollections();
      renderForm();
      return loadFiles();
    }

    /* ── Search with debounce ── */
    var searchTimer = null;
    function onSearchInput(e) {
      state.searchQuery = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function() { renderFileList(); }, 180);
    }

    /* ── Bind global events ── */
    function bindGlobalEvents() {
      $('saveBtn').onclick = saveManifest;
      $('syncBtn').onclick = syncPublish;
      $('addCollBtn').onclick = addCollectionModal;
      $('deleteCollBtn').onclick = removeCollectionModal;
      $('searchInput').oninput = onSearchInput;
      $('selectAllBtn').onclick = function() { batchToggle('include'); };
      $('selectNoneBtn').onclick = function() { batchToggle('exclude'); };

      document.querySelectorAll('.panel-tab').forEach(function(tab) {
        tab.onclick = function() { switchTab(tab.dataset.tab); };
      });

      /* Close modal on overlay click */
      $('modal').onclick = function(e) {
        if (e.target === $('modal')) $('modal').classList.add('hidden');
      };

      /* Keyboard: Escape closes modal */
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !$('modal').classList.contains('hidden')) {
          $('modal').classList.add('hidden');
        }
      });
    }

    /* ── Init ── */
    function loadVaultDirs() {
      api('/api/vault-dirs').then(function(data) {
        var html = '';
        (data.dirs || []).forEach(function(d) { html += '<option value="' + esc(d) + '">'; });
        $('vaultDirs').innerHTML = html;
      }).catch(function(err) { console.error('Failed to load vault dirs', err); });
    }

    function init() {
      bindGlobalEvents();
      loadVaultDirs();
      loadManifest().then(function() {
        /* Auto-expand root-level folders */
        return render();
      }).catch(function(err) {
        $('logContent').textContent = 'Error: ' + (err.stack || String(err));
        showToast('加载失败: ' + err.message, 'error');
      });
    }

    init();
  </script>
</body>
</html>`;

/* ── HTTP Server ───────────────────────────────────────────── */

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
      let dirs = [];
      if (fs.existsSync(vpath)) {
        dirs = fs.readdirSync(vpath, { withFileTypes: true })
          .filter(e => e.isDirectory() && !e.name.startsWith('.') && !['node_modules', 'templates'].includes(e.name))
          .map(e => e.name);
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
    send(res, 500, { error: error.message, stack: error.stack });
  }
});

server.listen(PORT, () => {
  console.log(`Pinecone publish admin: http://localhost:${PORT}`);
});
