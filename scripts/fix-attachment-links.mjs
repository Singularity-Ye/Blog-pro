import fs from 'fs';
import path from 'path';

const VAULT_PATH = 'C:/Users/Yhx06/Documents/Obsidian Vault';

const TARGET_FOLDERS = [
  path.join(VAULT_PATH, '03_生活簿（生活区）/游艺录（游戏与娱乐）'),
  path.join(VAULT_PATH, '01_藏经阁（知识库）/游艺录（游戏与娱乐）'),
  path.join(VAULT_PATH, '03_生活簿（生活区）/食味录（美食与探店）')
];

function scanAndFix(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanAndFix(fullPath); // Recursive
    } else if (stat.isFile() && item.endsWith('.md')) {
      fixNote(fullPath);
    }
  }
}

function fixNote(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  
  // Calculate correct relative path prefix to vault attachments folder
  const noteDir = path.dirname(filePath);
  const attachmentsDir = path.join(VAULT_PATH, 'attachments');
  
  let relativePath = path.relative(noteDir, attachmentsDir).replace(/\\/g, '/');
  if (!relativePath.endsWith('/')) {
    relativePath += '/';
  }
  
  // Find all matches like `../attachments/` or `../../attachments/` or `/attachments/`
  // We match standard markdown images `![](...)` and HTML `src="..."`
  // Regex matches `../` or `./` repeating, followed by `attachments/`
  const relativeLinkRegex = /(\.{1,2}\/)+attachments\//g;
  
  let matchCount = 0;
  content = content.replace(relativeLinkRegex, (match) => {
    if (match !== relativePath) {
      matchCount++;
      return relativePath;
    }
    return match;
  });
  
  if (matchCount > 0) {
    console.log(`[FIXED] ${path.relative(VAULT_PATH, filePath)}: updated ${matchCount} attachment links to "${relativePath}"`);
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

console.log('============= FIXING ATTACHMENT RELATIVE LINKS =============');
TARGET_FOLDERS.forEach(folder => {
  console.log(`Scanning: ${path.relative(VAULT_PATH, folder)}`);
  scanAndFix(folder);
});
console.log('Attachment links fix completed!');
