import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:\\Users\\Yhx06\\Documents\\Obsidian Vault';
const LIFESTYLE_DIR = path.join(VAULT_ROOT, '03_生活簿（生活区）');
const ARCHIVE_RAW_DIR = path.join(VAULT_ROOT, '01_藏经阁（知识库）', 'archive_raw（原始证据库）');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name !== '.git' && file.name !== '.obsidian') {
        walkDir(fullPath, callback);
      }
    } else if (file.isFile() && file.name.endsWith('.md')) {
      callback(fullPath);
    }
  }
}

let deletedNotesCount = 0;
let deletedRawCount = 0;

console.log('Scanning lifestyle folders for Xiaohongshu / Dianping notes with NO images...');

walkDir(LIFESTYLE_DIR, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Simple check for tags or url in frontmatter
  const hasXhsOrDpTag = /tags:\s*[\s\S]*?-\s*(小红书|大众点评|点评)/.test(content);
  const hasXhsOrDpUrl = /url:\s*"(https?:\/\/)?(www\.)?(xiaohongshu\.com|dianping\.com)/.test(content);
  
  if (hasXhsOrDpTag || hasXhsOrDpUrl) {
    // Check if it has any image syntax
    const hasStandardImg = /!\[([^\]]*)\]\(([^)]+)\)/.test(content);
    const hasObsidianImg = /!\[\[([^\]]+)\]\]/.test(content);
    const hasHtmlImg = /<img\s+/i.test(content);
    
    if (!hasStandardImg && !hasObsidianImg && !hasHtmlImg) {
      console.log(`\n🚨 Found no-image note: ${path.relative(VAULT_ROOT, filePath)}`);
      
      // Look for the raw evidence link
      // Match [[2026-05-30_下沙一周干饭图鉴_f0502e]]
      const evidenceMatch = content.match(/本地证据：\[\[(.*?)\]\]/) || content.match(/\[\[(202\d-\d{2}-\d{2}_.*?)\]\]/);
      if (evidenceMatch) {
        const rawNameNoExt = evidenceMatch[1].trim();
        const rawFilePath = path.join(ARCHIVE_RAW_DIR, `${rawNameNoExt}.md`);
        if (fs.existsSync(rawFilePath)) {
          try {
            fs.unlinkSync(rawFilePath);
            console.log(`   🗑️ Deleted raw evidence: ${rawNameNoExt}.md`);
            deletedRawCount++;
          } catch (e) {
            console.error(`   ❌ Failed to delete raw evidence: ${e.message}`);
          }
        } else {
          console.log(`   ℹ️ Raw evidence file not found in archive_raw: ${rawNameNoExt}.md`);
        }
      } else {
        console.log(`   ℹ️ No raw evidence link found in this note.`);
      }
      
      // Delete the main note
      try {
        fs.unlinkSync(filePath);
        console.log(`   🗑️ Deleted main note file.`);
        deletedNotesCount++;
      } catch (e) {
        console.error(`   ❌ Failed to delete main note: ${e.message}`);
      }
    }
  }
});

console.log(`\nCleanup complete: Deleted ${deletedNotesCount} main notes and ${deletedRawCount} raw evidence files.`);
