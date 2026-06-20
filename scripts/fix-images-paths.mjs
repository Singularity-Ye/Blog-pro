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

// Map of image filename -> array of relative paths from VAULT_ROOT
const imageMap = {};

function scanAttachments(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanAttachments(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.jpg') || entry.name.endsWith('.png'))) {
      const relPath = path.relative(VAULT_ROOT, fullPath).replace(/\\/g, '/');
      const key = entry.name.toLowerCase();
      if (!imageMap[key]) {
        imageMap[key] = [];
      }
      imageMap[key].push(relPath);
    }
  }
}

console.log('🔍 Scanning attachments directory...');
scanAttachments(path.join(VAULT_ROOT, 'attachments'));
console.log(`Found ${Object.keys(imageMap).length} unique images in attachments.\n`);

let updatedCount = 0;

walkDir(FOOD_DIR, (filePath) => {
  const name = path.basename(filePath);
  if (/^\d{4}-\d{2}-\d{2}_/.test(name)) return; // skip raw notes
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  
  // Find all matches of `(images/filename.ext)`
  const imagesRegex = /\((images\/[^)]+)\)/g;
  let match;
  let matchesFound = [];
  
  while ((match = imagesRegex.exec(content)) !== null) {
    matchesFound.push(match[1]);
  }
  
  // Also scan for already-fixed relative links to see if they point to the wrong district, and fix them too!
  // Match links pointing to attachments: `(../../../attachments/.../filename.ext)`
  const attachmentsRegex = /\((\.\.\/)+attachments\/([^)]+)\)/g;
  while ((match = attachmentsRegex.exec(content)) !== null) {
    matchesFound.push(match[0].slice(1, -1)); // extract the path inside parentheses
  }
  
  if (matchesFound.length === 0) return;
  
  const noteDir = path.dirname(filePath);
  const district = path.basename(noteDir); // e.g. "拱墅区"
  
  // Remove duplicates from matchesFound to avoid double-processing
  matchesFound = [...new Set(matchesFound)];
  
  matchesFound.forEach((imagePath) => {
    const filename = path.basename(imagePath).toLowerCase();
    const candidates = imageMap[filename];
    
    if (candidates && candidates.length > 0) {
      // Prioritize candidate in the same district
      let resolvedRelPath = candidates.find(c => c.toLowerCase().includes(`/${district.toLowerCase()}/`));
      if (!resolvedRelPath) {
        resolvedRelPath = candidates[0]; // fallback
      }
      
      const absoluteImagePath = path.join(VAULT_ROOT, resolvedRelPath);
      // Calculate correct relative path from note to absoluteImagePath
      let relativeLink = path.relative(noteDir, absoluteImagePath).replace(/\\/g, '/');
      
      if (imagePath !== relativeLink) {
        content = content.replace(imagePath, relativeLink);
        console.log(`   ✏️ Updated: "${imagePath}" -> "${relativeLink}" in ${path.relative(FOOD_DIR, filePath)}`);
      }
    } else {
      // Only warn if it starts with images/ (since those are definitely broken)
      if (imagePath.startsWith('images/')) {
        console.warn(`   ⚠️ Warning: Image "${filename}" not found in attachments map (referenced in ${path.relative(FOOD_DIR, filePath)})`);
      }
    }
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    updatedCount++;
  }
});

console.log(`\n🎉 Completed! Fixed image references in ${updatedCount} styled food notes.`);
