import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:\\Users\\Yhx06\\Documents\\Obsidian Vault';
const FOOD_DIR = path.join(VAULT_ROOT, '03_生活簿（生活区）', '食味录（美食与探店）');
const ATTACHMENTS_DIR = path.join(VAULT_ROOT, 'attachments', '03_生活簿（生活区）', '食味录（美食与探店）');

// 1. Move images to their correct district subfolders
const srcDir = ATTACHMENTS_DIR;
const moves = [
  {
    prefix: '2026-05-31_杭州深夜蛋炒饭秘境_',
    suffix: '.jpg',
    dest: '杭州市区（其他）'
  },
  {
    prefix: '2026-05-31_杭州汉堡节寻宝指南_',
    suffix: '.jpg',
    dest: '杭州市区（其他）'
  },
  {
    prefix: '2026-06-01_杭州恒隆新店·湛江鸡煲寻味记_',
    suffix: '.jpg',
    dest: '拱墅区'
  },
  {
    prefix: 'test_img',
    suffix: '.png',
    dest: '钱塘区（下沙）'
  }
];

// Ensure all target directories exist
const destDirs = new Set(moves.map(m => m.dest));
destDirs.forEach(dirName => {
  const dPath = path.join(ATTACHMENTS_DIR, dirName);
  if (!fs.existsSync(dPath)) {
    fs.mkdirSync(dPath, { recursive: true });
  }
});

if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir);
  files.forEach(file => {
    const matchedMove = moves.find(m => file.startsWith(m.prefix) && file.endsWith(m.suffix));
    if (matchedMove) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(ATTACHMENTS_DIR, matchedMove.dest, file);
      try {
        fs.renameSync(srcPath, destPath);
        console.log(`✅ Moved image: ${file} to ${matchedMove.dest}`);
      } catch (e) {
        console.error(`❌ Failed to move ${file}: ${e.message}`);
      }
    }
  });
}

// Helper to walk directory for Markdown files
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

// 2. Remove references to non-existent images in 科艺美食 note
const keyiNotePath = path.join(FOOD_DIR, '钱塘区（下沙）', '金华科艺校外外卖大测评：避坑鸭腿饭与吹爆糯米饭.md');
if (fs.existsSync(keyiNotePath)) {
  let content = fs.readFileSync(keyiNotePath, 'utf-8');
  const beforeLength = content.length;
  content = content.replace(/!\[.*?\]\(.*?2026-06-01_科艺美食第三弹_0\.jpg\)\s*/g, '');
  content = content.replace(/!\[.*?\]\(.*?2026-06-01_科艺美食第三弹_1\.jpg\)\s*/g, '');
  if (content.length !== beforeLength) {
    fs.writeFileSync(keyiNotePath, content, 'utf-8');
    console.log('✅ Cleaned up non-existent image references from 科艺美食 note.');
  }
}

// 3. Scan and remove HTML carousel blocks from all styled notes
walkDir(FOOD_DIR, (filePath) => {
  const name = path.basename(filePath);
  if (/^\d{4}-\d{2}-\d{2}_/.test(name)) return; // skip old/raw notes
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Match the HTML carousel block: starts with <div style="flex: 0 0 100%" (or similar) and goes until the helper text div
  const htmlCarouselRegex = /<div style="flex: 0 0 100%[\s\S]*?💡 左右滑动或使用滚轮查看更多图片<\/div>\s*/gi;
  const htmlCarouselRegex2 = /<div class="obsidian-carousel"[\s\S]*?💡 左右滑动或使用滚轮查看更多图片<\/div>\s*/gi;
  
  const beforeLength = content.length;
  content = content.replace(htmlCarouselRegex, '');
  content = content.replace(htmlCarouselRegex2, '');
  
  if (content.length !== beforeLength) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`🧹 Removed HTML carousel block from styled note: ${path.relative(FOOD_DIR, filePath)}`);
  }
});
