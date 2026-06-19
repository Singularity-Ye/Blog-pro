import fs from 'fs';
import path from 'path';

const VAULT_PATH = 'C:/Users/Yhx06/Documents/Obsidian Vault';
const GAME_LIFE_PATH = path.join(VAULT_PATH, '03_生活簿（生活区）/游艺录（游戏与娱乐）');
const GAME_KNOWLEDGE_PATH = path.join(VAULT_PATH, '01_藏经阁（知识库）/游艺录（游戏与娱乐）');
const FOOD_LIFE_PATH = path.join(VAULT_PATH, '03_生活簿（生活区）/食味录（美食与探店）');
const DIALOGUE_PATH = path.join(VAULT_PATH, '01_藏经阁（知识库）/刀笔集（锐评与观察）/老头宇宙');

const TARGET_FOLDERS = [GAME_LIFE_PATH, GAME_KNOWLEDGE_PATH, FOOD_LIFE_PATH, DIALOGUE_PATH];

// Load all markdown files in the entire vault to build a general file index
const vaultFilesMap = new Map(); // Map from normalized basename to full path

function buildVaultIndex(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      buildVaultIndex(fullPath);
    } else if (stat.isFile() && item.endsWith('.md')) {
      const basename = item.replace(/\.md$/, '');
      vaultFilesMap.set(basename.toLowerCase(), fullPath);
    }
  }
}

console.log('Building vault index...');
buildVaultIndex(VAULT_PATH);
console.log(`Indexed ${vaultFilesMap.size} markdown files in vault.`);

const brokenLinks = [];

function scanNoteForLinks(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const wikilinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  
  let match;
  while ((match = wikilinkRegex.exec(content)) !== null) {
    const originalLink = match[1].trim();
    // In Obsidian, links can contain paths or just basenames. We extract the basename:
    const linkBasename = originalLink.split('/').pop().replace(/\.md$/, '');
    
    // Check if it exists in the vault
    const exists = vaultFilesMap.has(linkBasename.toLowerCase());
    
    // We ignore test_img1.png/test_img2.png since they are image attachments, not notes
    if (!exists && !originalLink.endsWith('.png') && !originalLink.endsWith('.jpg') && !originalLink.endsWith('.jpeg')) {
      brokenLinks.push({
        notePath: filePath,
        noteName: path.basename(filePath),
        link: originalLink,
        linkBasename: linkBasename
      });
    }
  }
}

function scanRecursively(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanRecursively(fullPath);
    } else if (stat.isFile() && item.endsWith('.md')) {
      scanNoteForLinks(fullPath);
    }
  }
}

console.log('Scanning organized notes for broken links...');
TARGET_FOLDERS.forEach(folder => {
  scanRecursively(folder);
});

console.log(`\nFound ${brokenLinks.length} broken wikilinks in organized notes (excluding image attachments).`);

if (brokenLinks.length > 0) {
  const noteMap = {};
  brokenLinks.forEach(b => {
    const relPath = path.relative(VAULT_PATH, b.notePath);
    if (!noteMap[relPath]) noteMap[relPath] = [];
    noteMap[relPath].push(b);
  });

  for (const note in noteMap) {
    console.log(`\nNote: ${note}`);
    noteMap[note].forEach(b => {
      console.log(`   - Broken Link: [[${b.link}]]`);
    });
  }
} else {
  console.log('🎉 All wikilinks to raw archives and notes are fully resolved!');
}
