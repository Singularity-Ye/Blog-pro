import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:\\Users\\Yhx06\\Documents\\Obsidian Vault';
const FOOD_DIR = path.join(VAULT_ROOT, '03_生活簿（生活区）', '食味录（美食与探店）');
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

// 1. Scan for duplicates (files starting with date vs files with styled title in the same directory)
const duplicateReport = [];
const dirFiles = {};

walkDir(FOOD_DIR, (filePath) => {
  const dir = path.dirname(filePath);
  const name = path.basename(filePath);
  if (!dirFiles[dir]) dirFiles[dir] = [];
  dirFiles[dir].push(name);
});

const unmatchedDateFiles = [];
for (const [dir, files] of Object.entries(dirFiles)) {
  const dateFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}_/.test(f));
  const styledFiles = files.filter(f => !/^\d{4}-\d{2}-\d{2}_/.test(f));
  
  for (const df of dateFiles) {
    const dfContent = fs.readFileSync(path.join(dir, df), 'utf-8');
    const dfUrlMatch = dfContent.match(/url:\s*"(.*?)"/);
    const dfUrl = dfUrlMatch ? dfUrlMatch[1].split('?')[0].trim() : '';
    
    let matched = false;
    for (const sf of styledFiles) {
      const sfContent = fs.readFileSync(path.join(dir, sf), 'utf-8');
      const sfUrlMatch = sfContent.match(/url:\s*"(.*?)"/);
      const sfUrl = sfUrlMatch ? sfUrlMatch[1].split('?')[0].trim() : '';
      
      // Match by normalized URL
      if (dfUrl && sfUrl && sfUrl === dfUrl) {
        duplicateReport.push({
          dir: path.relative(FOOD_DIR, dir),
          oldFile: df,
          newFile: sf,
          reason: 'URL match'
        });
        matched = true;
        break;
      }
      
      // Match by raw evidence reference inside newFile
      const evidenceMatch = sfContent.match(/本地证据：\[\[(.*?)\]\]/) || sfContent.match(/\[\[(202\d-\d{2}-\d{2}_.*?)\]\]/);
      if (evidenceMatch) {
        const rawRef = evidenceMatch[1].replace(/_[a-f0-9]{6}$/, '').trim(); // e.g. 2026-06-01_拱墅江西小炒避世馆
        const dfBase = df.replace(/\.md$/, '').trim();
        if (rawRef === dfBase || rawRef.includes(dfBase) || dfBase.includes(rawRef)) {
          duplicateReport.push({
            dir: path.relative(FOOD_DIR, dir),
            oldFile: df,
            newFile: sf,
            reason: 'Raw reference match'
          });
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      unmatchedDateFiles.push({
        dir: path.relative(FOOD_DIR, dir),
        file: df
      });
    }
  }
}

// 2. Scan for styled files missing images compared to raw files
const imageMismatchReport = [];
walkDir(FOOD_DIR, (filePath) => {
  const name = path.basename(filePath);
  if (/^\d{4}-\d{2}-\d{2}_/.test(name)) return; // skip raw/old files
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const evidenceMatch = content.match(/本地证据：\[\[(.*?)\]\]/) || content.match(/\[\[(202\d-\d{2}-\d{2}_.*?)\]\]/);
  if (evidenceMatch) {
    const rawNameNoExt = evidenceMatch[1].trim();
    const rawFilePath = path.join(ARCHIVE_RAW_DIR, `${rawNameNoExt}.md`);
    if (fs.existsSync(rawFilePath)) {
      const rawContent = fs.readFileSync(rawFilePath, 'utf-8');
      
      // Extract unique images in raw file
      const rawImages = [];
      const obsRegex = /!\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g;
      const stdRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let m;
      while ((m = obsRegex.exec(rawContent)) !== null) rawImages.push(path.basename(m[1].trim()));
      while ((m = stdRegex.exec(rawContent)) !== null) rawImages.push(path.basename(m[2].trim()));
      const uniqueRawImages = [...new Set(rawImages)].filter(img => img.endsWith('.jpg') || img.endsWith('.png'));
      
      // Extract unique images in styled file
      const styledImages = [];
      while ((m = obsRegex.exec(content)) !== null) styledImages.push(path.basename(m[1].trim()));
      while ((m = stdRegex.exec(content)) !== null) styledImages.push(path.basename(m[2].trim()));
      const uniqueStyledImages = [...new Set(styledImages)].filter(img => img.endsWith('.jpg') || img.endsWith('.png'));
      
      if (uniqueRawImages.length > uniqueStyledImages.length) {
        imageMismatchReport.push({
          file: path.relative(FOOD_DIR, filePath),
          rawFile: `${rawNameNoExt}.md`,
          rawImagesCount: uniqueRawImages.length,
          styledImagesCount: uniqueStyledImages.length,
          missingImages: uniqueRawImages.filter(img => !uniqueStyledImages.includes(img))
        });
      }
    }
  }
});

const outputPath = path.join(process.cwd(), 'analyze-output.json');
fs.writeFileSync(outputPath, JSON.stringify({ duplicateReport, unmatchedDateFiles, imageMismatchReport }, null, 2), 'utf-8');
console.log(`✅ Reports written to ${outputPath}`);

