import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const VAULT_ROOT = "C:/Users/Yhx06/Documents/Obsidian Vault";
const OLD_ATTACHMENT_DIR = path.join(VAULT_ROOT, "08_附件");
const TARGET_DIRS = [
  path.join(VAULT_ROOT, "03_生活簿（生活区）/食味录（美食与探店）"),
  path.join(VAULT_ROOT, "03_生活簿（生活区）/行路志（旅行与城市）")
];

// Helper to find all markdown files recursively
function findMdFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) {
        results = results.concat(findMdFiles(full));
      } else if (f.isFile() && f.name.toLowerCase().endsWith('.md')) {
        results.push(full);
      }
    }
  } catch (e) {
    console.error(`Error walking directory ${dir}:`, e.message);
  }
  return results;
}

if (!fs.existsSync(OLD_ATTACHMENT_DIR)) {
  console.log(`Source folder 08_附件 does not exist: ${OLD_ATTACHMENT_DIR}. Exiting.`);
  process.exit(0);
}

const mdFiles = [];
for (const targetDir of TARGET_DIRS) {
  console.log(`Scanning note directory: ${targetDir}`);
  mdFiles.push(...findMdFiles(targetDir));
}
console.log(`Found ${mdFiles.length} markdown notes to scan.`);

let fileMoveCount = 0;
let noteUpdateCount = 0;

for (const mdFile of mdFiles) {
  const content = fs.readFileSync(mdFile, 'utf-8');
  
  // Find all references to "08_附件/" or "08_附件\"
  const regex = /08_附件[/\\]([^"'\)\]\s]+)/g;
  let match;
  const references = [];
  
  while ((match = regex.exec(content)) !== null) {
    references.push(match[1]);
  }
  
  if (references.length === 0) {
    continue;
  }
  
  const uniqueRefs = [...new Set(references)];
  console.log(`Processing note: ${path.basename(mdFile)} (${uniqueRefs.length} unique references)`);
  
  // Calculate relative paths
  const relPathFromVault = path.relative(VAULT_ROOT, mdFile); // e.g. "03_生活簿（生活区）/食味录（美食与探店）/钱塘区（下沙）/note.md"
  const dirName = path.dirname(relPathFromVault); // e.g. "03_生活簿（生活区）/食味录（美食与探店）/钱塘区（下沙）"
  const segments = dirName.split(/[/\\]/).filter(Boolean);
  const depth = segments.length;
  const prefix = '../'.repeat(depth); // e.g. "../../../"
  
  // Target folder inside attachments/
  const targetAttachmentFolder = path.join(VAULT_ROOT, 'attachments', dirName);
  
  let newContent = content;
  let updatedRefs = 0;
  
  for (const imgName of uniqueRefs) {
    const sourceImgPath = path.join(OLD_ATTACHMENT_DIR, imgName);
    const destImgPath = path.join(targetAttachmentFolder, imgName);
    
    // 1. Move file if it exists in old directory
    if (fs.existsSync(sourceImgPath)) {
      if (!fs.existsSync(targetAttachmentFolder)) {
        fs.mkdirSync(targetAttachmentFolder, { recursive: true });
      }
      try {
        fs.renameSync(sourceImgPath, destImgPath);
        fileMoveCount++;
        console.log(`   [Moved] ${imgName} ➡️ attachments/${dirName.replace(/\\/g, '/')}/`);
      } catch (err) {
        console.error(`   [Error] Failed to move ${imgName}:`, err.message);
      }
    } else {
      // If it doesn't exist in 08_附件, it might have already been moved in a previous run
      if (fs.existsSync(destImgPath)) {
        // console.log(`   [Already Moved] ${imgName} is already in destination folder.`);
      } else {
        console.warn(`   [Warning] Physical image file not found anywhere: ${imgName}`);
      }
    }
    
    // 2. Perform path replacement in the note content
    // We want to replace "08_附件/imgName" or "08_附件\imgName" with the relative path
    const escapedImgName = imgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceRegex = new RegExp(`08_附件[\\/\\\\]${escapedImgName}`, 'g');
    
    const relativeRefPath = `${prefix}attachments/${dirName.replace(/\\/g, '/')}/${imgName}`;
    newContent = newContent.replace(replaceRegex, relativeRefPath);
    updatedRefs++;
  }
  
  if (newContent !== content) {
    fs.writeFileSync(mdFile, newContent, 'utf-8');
    noteUpdateCount++;
    console.log(`   🎉 [Updated Note] Rewrote ${updatedRefs} image path references to relative format.`);
  }
}

console.log(`\nReorganization completed.`);
console.log(`Moved ${fileMoveCount} physical image files.`);
console.log(`Updated references in ${noteUpdateCount} notes.`);

// Check if 08_附件 is empty and can be deleted
try {
  if (fs.existsSync(OLD_ATTACHMENT_DIR)) {
    const filesLeft = fs.readdirSync(OLD_ATTACHMENT_DIR);
    if (filesLeft.length === 0) {
      fs.rmdirSync(OLD_ATTACHMENT_DIR);
      console.log(`Deleted now-empty temporary folder: 08_附件/`);
    } else {
      console.log(`Temporary folder 08_附件/ still contains ${filesLeft.length} files. Kept folder.`);
    }
  }
} catch (cleanupErr) {
  console.error(`Failed to clean up old attachment directory:`, cleanupErr.message);
}
