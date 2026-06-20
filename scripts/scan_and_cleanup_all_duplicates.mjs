import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:\\Users\\Yhx06\\Documents\\Obsidian Vault';
const FOOD_DIR = path.join(VAULT_ROOT, '03_生活簿（生活区）', '食味录（美食与探店）');

// List of files to delete (relative to FOOD_DIR, lowercase keys for case-insensitive matching)
const deleteList = [
  '杭州市区（其他）/杭州也能吃到台北天使鸡排？！蛤蟆手札揭秘台味秘境.md',
  '钱塘区（下沙）/金华科艺校外外卖大测评：避坑鸭腿饭与吹爆糯米饭.md',
  '钱塘区（下沙）/下沙超大草莓蛋糕探店大揭秘！.md',
  '钱塘区（下沙）/下沙轻食避雷指南：吃货地图上的隐藏美味.md',
  '未分类/百元复刻麦当劳全餐：从鸡腿堡到可乐的硬核复刻指南.md',
  '未分类/必胜客汉堡的“双倍肉酱”秘籍.md',
  '未分类/沪上咖啡九脉图：九家宝藏咖啡馆推荐.md',
  '未分类/相比山姆，我更喜欢盒马的理由.md'
].map(p => path.join(FOOD_DIR, p).toLowerCase());

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.git' && entry.name !== '.obsidian') {
        walkDir(fullPath, callback);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      callback(fullPath);
    }
  }
}

// ── 1. DELETE REDUNDANT AND LOW QUALITY NOTES ──────────────────────
console.log('=== 1. 开始清理冗余与低质量笔记及附件 ===');

walkDir(FOOD_DIR, (filePath) => {
  const normPath = filePath.toLowerCase();
  if (deleteList.includes(normPath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativeNotePath = path.relative(FOOD_DIR, filePath);
    
    // Extract all image links from this note to delete them
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let imgMatch;
    let deletedImagesCount = 0;
    
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      const imgUrl = imgMatch[2];
      // Resolve absolute path of the image relative to the note file
      const absImgPath = path.resolve(path.dirname(filePath), imgUrl);
      if (fs.existsSync(absImgPath)) {
        try {
          fs.unlinkSync(absImgPath);
          deletedImagesCount++;
        } catch (e) {
          console.warn(`[警告] 无法删除图片 ${absImgPath}: ${e.message}`);
        }
      }
    }
    
    // Delete the note file itself
    try {
      fs.unlinkSync(filePath);
      console.log(`[已删除] 笔记: ${relativeNotePath} (包含并清理了 ${deletedImagesCount} 张图片)`);
    } catch (e) {
      console.error(`[错误] 无法删除笔记 ${filePath}: ${e.message}`);
    }
  }
});

// Helper to check if a heading is a gallery heading
function isGalleryHeading(heading) {
  if (!heading) return false;
  // A gallery heading must start with ## or ### (level 2 or 3)
  if (!heading.startsWith('## ') && !heading.startsWith('### ')) return false;
  const norm = heading.toLowerCase();
  return norm.includes('图集') || norm.includes('图鉴') || norm.includes('手札') || norm.includes('照片') || norm.includes('🖼️') || norm.includes('📸');
}

// Helper to classify section content
function checkSectionContent(sectionLines) {
  let hasMermaid = false;
  let hasTable = false;
  let hasList = false;
  let hasTextParagraph = false;
  
  for (const line of sectionLines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (trimmed.startsWith('![')) continue; // standard markdown image
    if (trimmed.startsWith('![[')) continue; // wikilink image
    if (trimmed.startsWith('<div') || trimmed.startsWith('</div')) continue; // div wrapper
    if (trimmed.startsWith('<!--') || trimmed.endsWith('-->')) continue; // html comment
    if (trimmed.startsWith('%%')) continue; // obsidian comment
    if (trimmed.startsWith('>')) {
      // If it's a machine ocr caption, we can treat it as caption (ignored).
      // Otherwise, if it has standard text, keep it.
      const lower = trimmed.toLowerCase();
      if (lower.includes('蛤蟆祥') || lower.includes('描述') || lower.includes('识别文字') || lower.includes('图片无文字') || lower.includes('没有描述')) {
        continue;
      }
    }
    if (trimmed.startsWith('```mermaid') || trimmed.startsWith('```')) {
      hasMermaid = true;
      continue;
    }
    if (trimmed.startsWith('|')) {
      hasTable = true;
      continue;
    }
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      hasList = true;
      continue;
    }
    hasTextParagraph = true;
  }
  
  return { hasMermaid, hasTable, hasList, hasTextParagraph };
}

// ── 2. NORMALIZE IMAGE LAYOUT FOR ALL REMAINING NOTES ──────────────
console.log('\n=== 2. 开始规范化其余美食攻略的图片排版 ===');

let normalizedCount = 0;

walkDir(FOOD_DIR, (filePath) => {
  // Skip if it was deleted
  if (!fs.existsSync(filePath)) return;
  
  const relativePath = path.relative(FOOD_DIR, filePath);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract all markdown images in the note
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    images.push(imgMatch[0]);
  }
  
  if (images.length === 0) {
    return; // No images in this note, skip
  }

  // Deduplicate images based on URL to keep only unique ones
  const seenUrls = new Set();
  const uniqueImages = [];
  for (const imgTag of images) {
    const urlMatch = imgTag.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (urlMatch) {
      const url = urlMatch[2].trim();
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        uniqueImages.push(imgTag);
      }
    }
  }
  
  // Parse note into sections by headings
  const rawLines = content.split(/\r?\n/);
  const sections = [];
  let currentSection = { heading: null, lines: [] };
  
  for (const line of rawLines) {
    if (line.startsWith('#')) {
      if (currentSection.heading !== null || currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { heading: line, lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }
  if (currentSection.heading !== null || currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // Process sections
  const processedSections = [];
  for (const section of sections) {
    if (isGalleryHeading(section.heading)) {
      const status = checkSectionContent(section.lines);
      if (status.hasMermaid || status.hasTable || status.hasList || status.hasTextParagraph) {
        // Keep the section structure but strip images, hidden divs, and OCR blockquotes
        const newLines = [];
        for (const line of section.lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('![')) continue;
          if (trimmed.startsWith('<div') || trimmed.startsWith('</div')) continue;
          if (trimmed.startsWith('>')) {
            const lower = trimmed.toLowerCase();
            if (lower.includes('蛤蟆祥') || lower.includes('描述') || lower.includes('识别文字') || lower.includes('图片无文字') || lower.includes('没有描述')) {
              continue;
            }
          }
          newLines.push(line);
        }
        processedSections.push({ heading: section.heading, lines: newLines });
      } else {
        // Delete the entire gallery-only section
        console.log(`   [清理] 删除了空/纯图片画廊栏目: ${section.heading} 于 ${relativePath}`);
      }
    } else {
      // Keep non-gallery sections, but remove any inline images
      const newLines = [];
      for (const line of section.lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('![')) continue;
        const cleanedLine = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
        newLines.push(cleanedLine);
      }
      processedSections.push({ heading: section.heading, lines: newLines });
    }
  }

  // Reconstruct lines from processed sections
  const lines = [];
  for (const section of processedSections) {
    if (section.heading !== null) {
      lines.push(section.heading);
    }
    lines.push(...section.lines);
  }
  
  // Find the first H2 or H3 heading (starting with ## or ###) to insert the gallery right before it
  let insertLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ') || line.startsWith('### ')) {
      insertLineIdx = i;
      break;
    }
  }
  
  // Fallback: right after H1 title
  if (insertLineIdx === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('# ')) {
        insertLineIdx = i + 1;
        break;
      }
    }
  }
  
  if (insertLineIdx === -1) {
    insertLineIdx = lines.length;
  }
  
  // Build new gallery block wrapped in <div style="display: none;">
  const galleryLines = [
    '## 🖼️ 图集手札',
    '',
    '<div style="display: none;">',
    ...uniqueImages,
    '</div>'
  ];
  
  // Local padding adjustments
  if (insertLineIdx > 0 && lines[insertLineIdx - 1].trim() !== '') {
    galleryLines.unshift('');
  }
  if (insertLineIdx < lines.length && lines[insertLineIdx].trim() !== '') {
    galleryLines.push('');
  }
  
  // Insert at target line
  lines.splice(insertLineIdx, 0, ...galleryLines);
  
  // Final consecutive empty line check
  const finalLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '' && finalLines.length > 0 && finalLines[finalLines.length - 1].trim() === '') {
      continue;
    }
    finalLines.push(lines[i]);
  }
  
  // Write back to file
  const newContent = finalLines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`[已重排] ${relativePath} (整合了 ${uniqueImages.length} 张唯一图片到开头画廊)`);
  normalizedCount++;
});

console.log(`\n排版规范化重构完毕！共规范化了 ${normalizedCount} 篇笔记。`);
