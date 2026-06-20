import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:\\Users\\Yhx06\\Documents\\Obsidian Vault';
const FOOD_DIR = path.join(VAULT_ROOT, '03_生活簿（生活区）', '食味录（美食与探店）');

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

// Regex matching the gallery section robustly
const galleryRegex = /(^|\r?\n)(#{2,3}\s+(?:🖼️\s*|📸\s*)?(?:图集|现场|图录|探店)(?:手札|图集|照片)?)\s*\r?\n([\s\S]*?)(?=\r?\n#{2,3}\s|\r?\n---|\r?\n$|$)/;

let processedCount = 0;

console.log('开始处理食味录笔记排版调优...');

walkDir(FOOD_DIR, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(FOOD_DIR, filePath);
  
  const match = content.match(galleryRegex);
  if (!match) {
    console.log(`[跳过] 未找到图集部分: ${relativePath}`);
    return;
  }
  
  const fullGalleryMatch = match[0];
  const galleryContent = match[3];
  
  // Extract all standard markdown images from the gallery content
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(galleryContent)) !== null) {
    images.push(imgMatch[0]);
  }
  
  if (images.length === 0) {
    console.log(`[跳过] 无图片内容: ${relativePath}`);
    return;
  }
  
  // Remove the old gallery section from the note
  const contentWithoutGallery = content.replace(fullGalleryMatch, '');
  
  // Split lines to find insertion point
  const lines = contentWithoutGallery.split('\n');
  let insertLineIdx = -1;
  
  // Look for Hamaxiang's whisper first
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('呱呱！') || line.includes('蛤蟆仙君') || line.includes('蛤蟆祥') || line.startsWith('（蛤蟆')) {
      // Find the end of this paragraph block
      let j = i;
      while (j < lines.length && lines[j].trim() !== '' && !lines[j].trim().startsWith('#') && lines[j].trim() !== '---') {
        j++;
      }
      insertLineIdx = j;
      break;
    }
  }
  
  // Fallback 1: after raw data section
  if (insertLineIdx === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('原始资料') || line.includes('原始卷轴')) {
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('#') && lines[j].trim() !== '---') {
          j++;
        }
        insertLineIdx = j;
        break;
      }
    }
  }
  
  // Fallback 2: right after H1 title
  if (insertLineIdx === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('# ')) {
        insertLineIdx = i + 1;
        break;
      }
    }
  }
  
  if (insertLineIdx === -1) {
    insertLineIdx = lines.length; // append to end if all else fails
  }
  
  // Build new gallery block with images inside HTML comments
  const galleryLines = [
    '## 🖼️ 图集手札',
    '',
    '<!--',
    ...images,
    '-->'
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
  
  // Write back to file (preserving original line endings by matching what was read)
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`[成功] 已调整布局并隐藏图片: ${relativePath}`);
  processedCount++;
});

console.log(`\n处理完毕！共处理了 ${processedCount} 篇笔记。`);
