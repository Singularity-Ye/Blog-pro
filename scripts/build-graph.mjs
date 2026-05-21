/**
 * build-graph.mjs
 * 扫描 Obsidian vault，生成 graph.json + notes/ 到 public/
 *
 * 用法: node scripts/build-graph.mjs
 */

import fs from 'fs';
import path from 'path';

// ── 配置 ──────────────────────────────────────────────────────
const VAULT_PATH = String.raw`C:\Users\Yhx06\OneDrive\文档\Obsidian Vault`;
const PUBLIC_DIR = path.resolve('public');
const GRAPH_OUT = path.join(PUBLIC_DIR, 'graph.json');
const NOTES_OUT = path.join(PUBLIC_DIR, 'notes');

// 排除的目录
const EXCLUDE_DIRS = ['.obsidian', '.git', 'node_modules', 'templates'];

// ── 工具函数 ──────────────────────────────────────────────────

/** 递归获取所有 .md 文件 */
function walkMd(dir, base = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.includes(entry.name)) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMd(full, rel));
    } else if (entry.name.endsWith('.md')) {
      results.push({ full, rel });
    }
  }
  return results;
}

/** 从文件名生成 slug（去掉 .md） */
function toSlug(relPath) {
  return relPath.replace(/\.md$/, '');
}

/** 从文件内容提取标题（优先 frontmatter title，其次一级标题，最后文件名） */
function extractTitle(content, fileName) {
  // frontmatter title
  const fmMatch = content.match(/^---[\s\S]*?^title:\s*["']?(.+?)["']?\s*$/m);
  if (fmMatch) return fmMatch[1].trim();

  // 第一个 # 标题
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  // 文件名
  return fileName.replace(/\.md$/, '');
}

/** 从文件内容提取 tags */
function extractTags(content) {
  const tags = [];
  // frontmatter tags
  const fmTags = content.match(/^tags:\s*\[([^\]]*)\]/m);
  if (fmTags) {
    tags.push(...fmTags[1].split(',').map(t => t.trim().replace(/['"]/g, '')));
  }
  // inline tags #tag
  const inlineTags = content.match(/(?:^|\s)#([\w一-鿿/-]+)/g);
  if (inlineTags) {
    tags.push(...inlineTags.map(t => t.trim().slice(1)));
  }
  return [...new Set(tags)];
}

/** 提取 [[wikilinks]]，返回链接目标列表 */
function extractWikilinks(content) {
  const links = [];
  // 匹配 [[target]] 或 [[target|alias]] 或 [[target#heading]]
  const regex = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const target = match[1].trim();
    if (target) links.push(target);
  }
  return links;
}

// ── 主逻辑 ────────────────────────────────────────────────────

console.log(`📂 扫描 Obsidian vault: ${VAULT_PATH}`);

if (!fs.existsSync(VAULT_PATH)) {
  console.error(`❌ Vault 路径不存在: ${VAULT_PATH}`);
  process.exit(1);
}

// 清理旧输出
if (fs.existsSync(NOTES_OUT)) {
  fs.rmSync(NOTES_OUT, { recursive: true });
}
fs.mkdirSync(NOTES_OUT, { recursive: true });

// 扫描所有 .md 文件
const files = walkMd(VAULT_PATH);
console.log(`📄 找到 ${files.length} 个 markdown 文件`);

// 第一遍：建立 slug → title 映射 + 收集节点
const slugTitleMap = new Map(); // slug → title
const titleSlugMap = new Map(); // 小写 title → slug（用于 wikilink 解析）
const nodes = [];

for (const { full, rel } of files) {
  const content = fs.readFileSync(full, 'utf-8');
  const slug = toSlug(rel);
  const fileName = path.basename(rel);
  const title = extractTitle(content, fileName);
  const tags = extractTags(content);

  slugTitleMap.set(slug, title);
  titleSlugMap.set(title.toLowerCase(), slug);
  // 也用文件名（不含扩展名）做映射，因为 wikilink 通常用文件名
  titleSlugMap.set(fileName.replace(/\.md$/, '').toLowerCase(), slug);

  nodes.push({ id: slug, title, tags, slug });
}

// 第二遍：提取链接，建立边
const links = [];
const linkSet = new Set(); // 去重

for (const { full, rel } of files) {
  const content = fs.readFileSync(full, 'utf-8');
  const sourceSlug = toSlug(rel);
  const wikilinks = extractWikilinks(content);

  for (const target of wikilinks) {
    const targetSlug = titleSlugMap.get(target.toLowerCase());
    if (targetSlug && targetSlug !== sourceSlug) {
      const key = `${sourceSlug}→${targetSlug}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
        links.push({ source: sourceSlug, target: targetSlug });
      }
    }
  }
}

// 写入 graph.json
const graph = { nodes, links };
fs.writeFileSync(GRAPH_OUT, JSON.stringify(graph, null, 2), 'utf-8');
console.log(`✅ graph.json: ${nodes.length} 节点, ${links.length} 条边`);

// 拷贝 .md 文件到 public/notes/
let copied = 0;
for (const { full, rel } of files) {
  const slug = toSlug(rel);
  const destDir = path.join(NOTES_OUT, path.dirname(slug));
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(full, path.join(NOTES_OUT, slug + '.md'));
  copied++;
}
console.log(`✅ 拷贝 ${copied} 个笔记到 public/notes/`);
console.log(`🎉 构建完成！`);
