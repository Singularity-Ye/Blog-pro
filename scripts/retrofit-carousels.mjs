import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const VAULT_ROOT = "C:/Users/Yhx06/Documents/Obsidian Vault";
const ARCHIVE_RAW_DIR = path.join(VAULT_ROOT, "01_藏经阁（知识库）/archive_raw（原始证据库）");
const INBOX_DIR = path.join(VAULT_ROOT, "00_松果池（收件箱）");
const GLOBAL_ATTACHMENT_DIR = path.join(VAULT_ROOT, "08_附件");

const TARGET_DIRS = [
  path.join(VAULT_ROOT, "03_生活簿（生活区）/食味录（美食与探店）"),
  path.join(VAULT_ROOT, "03_生活簿（生活区）/行路志（旅行与城市）")
];

// Build an index of all images under the inbox recursively
const inboxImages = new Map(); // filename (lowercase) -> absolute path
function buildInboxImageIndex(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) {
        buildInboxImageIndex(full);
      } else if (f.isFile()) {
        const ext = path.extname(f.name).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
          inboxImages.set(f.name.toLowerCase(), full);
        }
      }
    }
  } catch (e) {
    console.error(`Error indexing directory ${dir}:`, e.message);
  }
}

console.log("Scanning inbox for leftover images...");
buildInboxImageIndex(INBOX_DIR);
console.log(`Indexed ${inboxImages.size} image files under inbox.`);

// Find all Markdown files in a folder recursively
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

// Ensure the global attachment folder exists
if (!fs.existsSync(GLOBAL_ATTACHMENT_DIR)) {
  fs.mkdirSync(GLOBAL_ATTACHMENT_DIR, { recursive: true });
}

let scanCount = 0;
let retrofitCount = 0;

for (const targetDir of TARGET_DIRS) {
  if (!fs.existsSync(targetDir)) {
    console.warn(`Skip missing folder: ${targetDir}`);
    continue;
  }
  
  console.log(`\nScanning folder: ${targetDir}`);
  const mdFiles = findMdFiles(targetDir);
  console.log(`Found ${mdFiles.length} note files to check.`);
  
  for (const mdFile of mdFiles) {
    scanCount++;
    const content = fs.readFileSync(mdFile, 'utf-8');
    
    // Skip if it already contains a carousel HTML block
    if (content.includes('class="obsidian-carousel"') || content.includes('className="obsidian-carousel"')) {
      // console.log(`   - ${path.basename(mdFile)}: Already has carousel, skipping.`);
      continue;
    }
    
    // Find raw evidence wikilink: 本地证据：[[2026-05-30_下沙一周干饭图鉴_38abdc]]
    const evidenceMatch = content.match(/本地证据：\[\[(.*?)\]\]/);
    if (!evidenceMatch) {
      continue;
    }
    
    const rawNameNoExt = evidenceMatch[1].trim();
    const rawFilePath = path.join(ARCHIVE_RAW_DIR, `${rawNameNoExt}.md`);
    
    if (!fs.existsSync(rawFilePath)) {
      // console.log(`   - ${path.basename(mdFile)}: Raw file not found: ${rawNameNoExt}.md`);
      continue;
    }
    
    // Read the raw evidence to find image references
    const rawContent = fs.readFileSync(rawFilePath, 'utf-8');
    const images = [];
    
    // 1. Match Obsidian Wikilink image: ![[image.png]]
    const obsidianImgRegex = /!\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g;
    let match;
    while ((match = obsidianImgRegex.exec(rawContent)) !== null) {
      const imgName = match[1].trim();
      if (imgName && !imgName.startsWith('http://') && !imgName.startsWith('https://') && !imgName.startsWith('/')) {
        images.push(path.basename(imgName));
      }
    }

    // 2. Match standard Markdown image: ![alt](url)
    const standardImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    while ((match = standardImgRegex.exec(rawContent)) !== null) {
      const imgUrl = match[2].trim();
      if (imgUrl && !imgUrl.startsWith('http://') && !imgUrl.startsWith('https://') && !imgUrl.startsWith('/')) {
        images.push(path.basename(imgUrl));
      }
    }
    
    const uniqueImages = [...new Set(images)];
    if (uniqueImages.length < 2) {
      // Carousel is only needed for 2 or more images!
      continue;
    }
    
    // Try to resolve and copy images
    const copiedImages = [];
    for (const imgName of uniqueImages) {
      const globalPath = path.join(GLOBAL_ATTACHMENT_DIR, imgName);
      
      // If it's already in the global attachments, we can use it directly
      if (fs.existsSync(globalPath)) {
        copiedImages.push(imgName);
        continue;
      }
      
      // Otherwise, search inside the inbox index
      const inboxPath = inboxImages.get(imgName.toLowerCase());
      if (inboxPath && fs.existsSync(inboxPath)) {
        try {
          fs.copyFileSync(inboxPath, globalPath);
          copiedImages.push(imgName);
          console.log(`   [Copied] ${imgName} ➡️ 08_附件/`);
        } catch (e) {
          console.error(`   Failed to copy ${imgName}:`, e.message);
        }
      } else {
        // Warning: Physical image file not found anywhere
      }
    }
    
    if (copiedImages.length >= 2) {
      // Construct the carousel HTML block
      let slides = '';
      for (const img of copiedImages) {
        slides += `  <div style="flex: 0 0 100%; scroll-snap-align: start; box-sizing: border-box; border-radius: 12px; overflow: hidden; border: 1px solid var(--background-modifier-border);">\n    <img src="08_附件/${img}" style="width: 100%; height: 320px; object-fit: cover; display: block;" />\n  </div>\n`;
      }
      const carouselHtml = `\n<div class="obsidian-carousel" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 8px; width: 100%; max-width: 480px; margin: 15px auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">\n${slides}</div>\n<div style="text-align: center; font-size: 0.85em; color: var(--text-muted); margin-top: -5px; margin-bottom: 15px;">💡 左右滑动或使用滚轮查看更多图片</div>\n`;
      
      // Insert carouselHtml right under the H1 header of the note
      const h1Match = content.match(/^#\s+(.+)$/m);
      if (h1Match) {
        const insertIdx = h1Match.index + h1Match[0].length;
        const newContent = content.slice(0, insertIdx) + `\n${carouselHtml}` + content.slice(insertIdx);
        
        fs.writeFileSync(mdFile, newContent, 'utf-8');
        retrofitCount++;
        console.log(`🎉 [Retrofit Success] ${path.basename(mdFile)}: Injected carousel with ${copiedImages.length} images.`);
      }
    }
  }
}

console.log(`\nScan finished. Checked ${scanCount} files. Retrofitted ${retrofitCount} notes.`);

// Run note sync and git commit if changes were made
if (retrofitCount > 0) {
  try {
    console.log('\nRunning note synchronization...');
    execSync('npm run sync-notes', { stdio: 'inherit' });

    console.log('\nRunning Git commit in Vault...');
    execSync(`git -C "${VAULT_ROOT}" add .`, { stdio: 'inherit' });
    execSync(`git -C "${VAULT_ROOT}" commit -m "docs: retrofit carousel sliders for ${retrofitCount} historical lifestyle notes"`, { stdio: 'inherit' });
    console.log('Git commit completed successfully!');
  } catch (postErr) {
    console.error('Error in post-processing sync/commit:', postErr.message);
  }
}
