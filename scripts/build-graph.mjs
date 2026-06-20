/**
 * Selectively publish Obsidian notes into the React app.
 *
 * Output:
 * - public/graph.json
 * - public/notes-index.json
 * - public/notes markdown files
 *
 * This is a Quartz-like content pipeline for the current CRA app: selected
 * Obsidian markdown is copied to the public folder, wikilinks are indexed, and
 * a graph payload is generated for the atlas and note pages.
 */

import fs from 'fs';
import path from 'path';
import { normalizeMarkdownMath } from '../src/utils/markdownMath.js';

const VAULT_PATH = process.env.VAULT_PATH || String.raw`C:\Users\Yhx06\Documents\Obsidian Vault`;
const PUBLIC_DIR = path.resolve('public');
const NOTES_OUT = path.join(PUBLIC_DIR, 'notes');
const GRAPH_OUT = path.join(PUBLIC_DIR, 'graph.json');
const INDEX_OUT = path.join(PUBLIC_DIR, 'notes-index.json');
const MANIFEST_PATH = path.resolve('scripts', 'publish-manifest.json');

const SELECTED_ROOTS = [
  {
    label: '杭州旅游攻略',
    root: '杭州旅游攻略',
    kind: 'travel',
  },
  {
    label: '建站流程指南',
    root: '建站流程指南-静态网页',
    kind: 'project',
  },
  {
    label: '博客网站设计思路',
    root: '博客网站',
    kind: 'blog-design',
  },
];

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return {
      vaultPath: VAULT_PATH,
      excludeDirs: [...EXCLUDE_DIRS],
      collections: SELECTED_ROOTS.map((collection) => ({
        enabled: true,
        include: ['**/*.md'],
        exclude: [],
        ...collection,
      })),
      publicFrontmatterFields: [],
    };
  }

  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

const EXCLUDE_DIRS = new Set([
  '.obsidian',
  '.git',
  'node_modules',
  'templates',
  '_规划',
  '_规范',
  '参考内容',
  '参考图片',
  '图片素材',
  '内部场景图',
  '临时素材',
  '废弃方案',
]);

const manifest = loadManifest();
const vaultPath = manifest.vaultPath || VAULT_PATH;
const selectedRoots = (manifest.collections || [])
  .filter((collection) => collection.enabled !== false)
  .map((collection) => ({
    include: ['**/*.md'],
    exclude: [],
    ...collection,
  }));
const excludeDirs = new Set([...(manifest.excludeDirs || []), ...EXCLUDE_DIRS]);

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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  ensureDir(dir);
}

function walkMarkdown(dir, base = '') {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || excludeDirs.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      results.push(...walkMarkdown(full, rel));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      results.push({ full, rel: normalizeRelPath(rel) });
    }
  }

  return results;
}

function toSlug(root, relPath) {
  const withoutExt = relPath.replace(/\.md$/i, '');
  const rawSlug = `${root}/${withoutExt}`;
  const cleanedSlug = rawSlug.replace(/^(系统性知识整理|路边小项目)\//, '');
  return normalizeRelPath(cleanedSlug);
}

function parseFrontmatter(content) {
  const normalized = String(content || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return {};

  const data = {};
  let currentKey = null;

  for (const line of match[1].split(/\r?\n/)) {
    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentKey) {
      data[currentKey] = [
        ...(Array.isArray(data[currentKey]) ? data[currentKey] : []),
        parseScalar(listItem[1]),
      ];
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    currentKey = pair[1];
    data[currentKey] = pair[2] ? parseScalar(pair[2]) : [];
  }

  return data;
}

function parseScalar(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed === '[]') return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => parseScalar(item))
      .filter(Boolean);
  }
  return trimmed.replace(/^["']|["']$/g, '');
}

function extractTitle(content, fileName, frontmatter = parseFrontmatter(content)) {
  if (frontmatter.title) return String(frontmatter.title).trim();

  const h1Title = String(content || '').replace(/\r\n?/g, '\n').match(/^#\s+(.+)$/m);
  if (h1Title) return h1Title[1].trim();

  return fileName.replace(/\.md$/i, '');
}

function extractAliases(frontmatter) {
  const aliases = frontmatter.aliases ?? frontmatter.alias;
  if (!aliases) return [];
  return Array.isArray(aliases) ? aliases.filter(Boolean) : [aliases].filter(Boolean);
}

function extractTags(content, frontmatter = parseFrontmatter(content)) {
  const tags = [];
  const fmTags = frontmatter.tags;

  if (Array.isArray(fmTags)) tags.push(...fmTags);
  else if (fmTags) tags.push(fmTags);

  const fmArray = content.match(/^tags:\s*\[([^\]]*)\]/m);

  if (fmArray) {
    tags.push(...fmArray[1].split(',').map((tag) => tag.trim().replace(/['"]/g, '')));
  }

  const fmList = content.match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (fmList) {
    tags.push(...fmList[1].split('\n').map((line) => line.replace(/^\s+-\s+/, '').trim()));
  }

  const inlineTags = content.match(/(?:^|\s)#([\w\u4e00-\u9fa5/-]+)/g);
  if (inlineTags) {
    tags.push(...inlineTags.map((tag) => tag.trim().slice(1)));
  }

  return [...new Set(tags.filter(Boolean))];
}

function extractWikilinks(content) {
  const links = [];
  // Use lookbehind to avoid matching ![[image.png]]
  const regex = /(?<!\!)\[\[([^\]|#^]+)(?:[|#^][^\]]*)?\]\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const target = match[1].trim();
    if (target) links.push(target);
  }

  return links;
}

function normalizeIndexKey(value) {
  return String(value || '')
    .trim()
    .replace(/\.md$/i, '')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
}

function addIndexEntry(index, key, slug) {
  const normalized = normalizeIndexKey(key);
  if (!normalized) return;
  if (!index[normalized]) index[normalized] = [];
  if (!index[normalized].includes(slug)) index[normalized].push(slug);
}

function makeWikilinkIndex(fileRecords) {
  const index = {
    pathIndex: {},
    basenameIndex: {},
    titleIndex: {},
    aliasIndex: {},
  };

  for (const file of fileRecords) {
    const relNoExt = file.rel.replace(/\.md$/i, '');
    const basename = path.basename(relNoExt);

    addIndexEntry(index.pathIndex, file.slug, file.slug);
    addIndexEntry(index.pathIndex, relNoExt, file.slug);
    addIndexEntry(index.pathIndex, `${file.collection.root}/${relNoExt}`, file.slug);
    addIndexEntry(index.basenameIndex, basename, file.slug);
    addIndexEntry(index.titleIndex, file.title, file.slug);
    for (const alias of file.aliases) addIndexEntry(index.aliasIndex, alias, file.slug);
  }

  return index;
}

function chooseBestCandidate(candidates, sourceFile) {
  const unique = [...new Set(candidates.filter(Boolean))];
  if (unique.length <= 1) return { slug: unique[0] || null, ambiguous: false, candidates: unique };

  const sourceDir = sourceFile.slug.split('/').slice(0, -1).join('/');
  const sameDir = unique.filter((slug) => slug.split('/').slice(0, -1).join('/') === sourceDir);
  if (sameDir.length === 1) return { slug: sameDir[0], ambiguous: false, candidates: unique };

  const sameCollection = unique.filter((slug) => slug.startsWith(`${sourceFile.collection.root}/`));
  if (sameCollection.length === 1) return { slug: sameCollection[0], ambiguous: false, candidates: unique };

  return { slug: null, ambiguous: true, candidates: unique };
}

function resolveWikilink(target, sourceFile, index) {
  const cleanTarget = normalizeIndexKey(target.split('#')[0].split('^')[0]);
  const sourceDir = sourceFile.slug.split('/').slice(0, -1).join('/');
  const pathCandidates = [];

  if (cleanTarget.includes('/')) {
    pathCandidates.push(...(index.pathIndex[cleanTarget] || []));
    pathCandidates.push(...(index.pathIndex[normalizeIndexKey(`${sourceDir}/${cleanTarget}`)] || []));
    pathCandidates.push(...(index.pathIndex[normalizeIndexKey(`${sourceFile.collection.root}/${cleanTarget}`)] || []));
    return chooseBestCandidate(pathCandidates, sourceFile);
  }

  const candidates = [
    ...(index.pathIndex[normalizeIndexKey(`${sourceDir}/${cleanTarget}`)] || []),
    ...(index.aliasIndex[cleanTarget] || []),
    ...(index.titleIndex[cleanTarget] || []),
    ...(index.basenameIndex[cleanTarget] || []),
    ...(index.pathIndex[cleanTarget] || []),
  ];
  return chooseBestCandidate(candidates, sourceFile);
}

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);

function walkImages(dir, base = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.obsidian') continue;

      const full = path.join(dir, entry.name);
      const rel = base ? `${base}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        results.push(...walkImages(full, rel));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (IMAGE_EXTENSIONS.has(ext)) {
          results.push({ full, rel: normalizeRelPath(rel), name: entry.name });
        }
      }
    }
  } catch (e) {
    console.error(`Error walking images in ${dir}:`, e);
  }
  return results;
}

function resolveImage(refPath, sourceFile, imageList) {
  const cleanRef = normalizeRelPath(refPath.split('|')[0].trim()).toLowerCase();
  
  // 1. Try to find an image whose relative path (from vault) ends with cleanRef or is exactly cleanRef
  let candidates = imageList.filter(img => 
    img.rel.toLowerCase() === cleanRef || 
    img.rel.toLowerCase().endsWith('/' + cleanRef)
  );

  // 2. If not found, try to match by filename/basename only
  if (candidates.length === 0 && !cleanRef.includes('/')) {
    candidates = imageList.filter(img => img.name.toLowerCase() === cleanRef);
  }

  // 3. If still not found, try to resolve relative to sourceFile's folder
  if (candidates.length === 0) {
    const noteDir = path.dirname(sourceFile.full);
    const absoluteImgPath = path.resolve(noteDir, refPath.split('|')[0].trim());
    if (fs.existsSync(absoluteImgPath)) {
      const normalizedAbs = path.normalize(absoluteImgPath);
      const relPath = path.relative(vaultPath, normalizedAbs);
      return {
        full: normalizedAbs,
        rel: normalizeRelPath(relPath),
        name: path.basename(normalizedAbs)
      };
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Choose the best candidate (same directory or collection first)
  const sourceCollectionRoot = sourceFile.collection.root.toLowerCase();
  const sameCollection = candidates.filter(img => img.rel.toLowerCase().startsWith(sourceCollectionRoot + '/'));
  if (sameCollection.length > 0) {
    return sameCollection[0];
  }

  return candidates[0];
}

function copyAttachment(srcFull, destRel) {
  const destFull = path.join(PUBLIC_DIR, 'notes', 'attachments', ...destRel.split('/'));
  ensureDir(path.dirname(destFull));
  fs.copyFileSync(srcFull, destFull);
}

function processMarkdownImages(content, fileRecord, imageList) {
  let newContent = content;

  // 1. Process Obsidian-style image links: ![[image.png]] or ![[image.png|width]]
  const obsidianImgRegex = /!\[\[([^\]|#]+)(?:\|([^\]]*))?\]\]/g;
  newContent = newContent.replace(obsidianImgRegex, (match, refPath, widthPart) => {
    const resolved = resolveImage(refPath, fileRecord, imageList);
    if (resolved) {
      copyAttachment(resolved.full, resolved.rel);
      const destUrl = encodeURI(`/notes/attachments/${resolved.rel}`);
      const altText = widthPart ? `${path.basename(refPath)}|${widthPart.trim()}` : path.basename(refPath);
      return `![${altText}](${destUrl})`;
    } else {
      console.warn(`[Image Sync] Cannot resolve Obsidian image: "${refPath}" in "${fileRecord.slug}"`);
      return `![图片未找到: ${refPath}](#)`;
    }
  });

  // 2. Process standard markdown image links: ![alt](url)
  const standardImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  newContent = newContent.replace(standardImgRegex, (match, altText, imgUrl) => {
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('/')) {
      return match;
    }
    const resolved = resolveImage(imgUrl, fileRecord, imageList);
    if (resolved) {
      copyAttachment(resolved.full, resolved.rel);
      const destUrl = encodeURI(`/notes/attachments/${resolved.rel}`);
      return `![${altText}](${destUrl})`;
    } else {
      console.warn(`[Image Sync] Cannot resolve standard image: "${imgUrl}" in "${fileRecord.slug}"`);
      return `![图片未找到: ${imgUrl}](#)`;
    }
  });

  // 3. Process HTML img tags: <img ... src="url" ...>
  const htmlImgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
  newContent = newContent.replace(htmlImgRegex, (match, beforeSrc, imgUrl, afterSrc) => {
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('/')) {
      return match;
    }
    const resolved = resolveImage(imgUrl, fileRecord, imageList);
    if (resolved) {
      copyAttachment(resolved.full, resolved.rel);
      const destUrl = encodeURI(`/notes/attachments/${resolved.rel}`);
      return `<img ${beforeSrc}src="${destUrl}"${afterSrc}>`;
    } else {
      console.warn(`[Image Sync] Cannot resolve HTML image: "${imgUrl}" in "${fileRecord.slug}"`);
      return match;
    }
  });

  return newContent;
}

console.log(`Scanning selected Obsidian roots: ${vaultPath}`);
const allImages = walkImages(vaultPath);
console.log(`Scanned ${allImages.length} image attachments in vault.`);

if (!fs.existsSync(vaultPath)) {
  console.error(`Vault path does not exist: ${vaultPath}`);
  process.exit(1);
}

cleanDir(NOTES_OUT);

const files = [];

for (const collection of selectedRoots) {
  const fullRoot = path.join(vaultPath, collection.root);

  if (!fs.existsSync(fullRoot)) {
    console.warn(`Skip missing root: ${collection.root}`);
    continue;
  }

  for (const file of walkMarkdown(fullRoot)) {
    if (!matchesAny(file.rel, collection.include)) continue;
    if (matchesAny(file.rel, collection.exclude)) continue;

    files.push({
      ...file,
      collection,
      slug: toSlug(collection.root, file.rel),
    });
  }
}

const titleSlugMap = new Map();
const nodes = [];
const notes = [];
const fileRecords = [];

for (const file of files) {
  const stats = fs.statSync(file.full);
  const content = fs.readFileSync(file.full, 'utf-8');
  const frontmatter = parseFrontmatter(content);
  const fileName = path.basename(file.rel);
  const title = extractTitle(content, fileName, frontmatter);
  const tags = extractTags(content, frontmatter);
  const aliases = extractAliases(frontmatter);
  const publicFields = {};

  for (const field of manifest.publicFrontmatterFields || []) {
    if (frontmatter[field] !== undefined) {
      publicFields[field] = frontmatter[field];
    }
  }

  const node = {
    id: file.slug,
    slug: file.slug,
    title,
    tags,
    aliases,
    collection: file.collection.kind,
    collectionLabel: file.collection.label,
    path: file.rel,
    ...publicFields,
    createdAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
  };

  nodes.push(node);
  notes.push(node);

  titleSlugMap.set(title.toLowerCase(), file.slug);
  titleSlugMap.set(fileName.replace(/\.md$/i, '').toLowerCase(), file.slug);
  titleSlugMap.set(file.slug.toLowerCase(), file.slug);
  titleSlugMap.set(`${file.collection.root}/${file.rel.replace(/\.md$/i, '')}`.toLowerCase(), file.slug);
  fileRecords.push({
    ...file,
    content,
    title,
    tags,
    aliases,
  });
}

const wikilinkIndex = makeWikilinkIndex(fileRecords);
const links = [];
const linkSet = new Set();
const unresolvedWikilinks = [];
const ambiguousWikilinks = [];

for (const file of fileRecords) {
  const wikilinks = extractWikilinks(file.content);

  for (const target of wikilinks) {
    const result = resolveWikilink(target, file, wikilinkIndex);

    if (result.ambiguous) {
      ambiguousWikilinks.push({
        source: file.slug,
        target,
        candidates: result.candidates,
      });
      continue;
    }

    const targetSlug = result.slug;
    if (!targetSlug) {
      unresolvedWikilinks.push({ source: file.slug, target });
      continue;
    }

    if (targetSlug === file.slug) continue;

    const key = `${file.slug}->${targetSlug}`;
    if (linkSet.has(key)) continue;

    linkSet.add(key);
    links.push({ source: file.slug, target: targetSlug });
  }
}

for (const file of fileRecords) {
  const processedContent = normalizeMarkdownMath(processMarkdownImages(file.content, file, allImages));
  const targetPath = path.join(NOTES_OUT, ...file.slug.split('/')) + '.md';
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, processedContent, 'utf-8');
}

for (const file of walkMarkdown(NOTES_OUT)) {
  const normalized = normalizeMarkdownMath(fs.readFileSync(file.full, 'utf-8'));
  fs.writeFileSync(file.full, normalized, 'utf-8');
}

const wikilinkReport = {
  unresolvedCount: unresolvedWikilinks.length,
  ambiguousCount: ambiguousWikilinks.length,
  unresolvedExamples: unresolvedWikilinks.slice(0, 20),
  ambiguousExamples: ambiguousWikilinks.slice(0, 20),
};

const graph = { nodes, links, wikilinkIndex, wikilinkReport };
const index = {
  generatedAt: new Date().toISOString(),
  vaultPath,
  manifestPath: MANIFEST_PATH,
  publicFrontmatterFields: manifest.publicFrontmatterFields || [],
  collections: selectedRoots.map((collection) => ({
    ...collection,
    count: nodes.filter((node) => node.collection === collection.kind).length,
  })),
  notes,
  wikilinkIndex,
  wikilinkReport,
};

ensureDir(PUBLIC_DIR);
fs.writeFileSync(GRAPH_OUT, JSON.stringify(graph, null, 2), 'utf-8');
fs.writeFileSync(INDEX_OUT, JSON.stringify(index, null, 2), 'utf-8');

console.log(`Published ${nodes.length} notes and ${links.length} links.`);
console.log(`Wikilinks unresolved: ${wikilinkReport.unresolvedCount}`);
console.log(`Wikilinks ambiguous: ${wikilinkReport.ambiguousCount}`);
if (wikilinkReport.unresolvedExamples.length) {
  console.log('First unresolved wikilinks:');
  for (const item of wikilinkReport.unresolvedExamples) {
    console.log(`- ${item.source} -> ${item.target}`);
  }
}
if (wikilinkReport.ambiguousExamples.length) {
  console.log('First ambiguous wikilinks:');
  for (const item of wikilinkReport.ambiguousExamples) {
    console.log(`- ${item.source} -> ${item.target} (${item.candidates.join(', ')})`);
  }
}
console.log(`Wrote ${GRAPH_OUT}`);
console.log(`Wrote ${INDEX_OUT}`);
