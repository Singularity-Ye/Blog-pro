import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:\\Users\\Yhx06\\Documents\\Obsidian Vault';
const FOOD_DIR = path.join(VAULT_ROOT, '03_生活簿（生活区）', '食味录（美食与探店）');
const ARCHIVE_RAW_DIR = path.join(VAULT_ROOT, '01_藏经阁（知识库）', 'archive_raw（原始证据库）');

console.log('🚀 Starting Gallery Consolidation & Cleanup Process...\n');

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

// Parse a raw note file to extract image-caption structures
function parseRawNoteImages(rawFilePath) {
  if (!fs.existsSync(rawFilePath)) return [];
  const content = fs.readFileSync(rawFilePath, 'utf-8');
  const images = [];
  
  const obsRegex = /!\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g;
  const stdRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let imgFile = null;
    let m;
    
    obsRegex.lastIndex = 0;
    stdRegex.lastIndex = 0;
    
    if ((m = obsRegex.exec(line)) !== null) {
      imgFile = path.basename(m[1].trim());
    } else if ((m = stdRegex.exec(line)) !== null) {
      imgFile = path.basename(m[2].trim());
    }
    
    if (imgFile && (imgFile.endsWith('.jpg') || imgFile.endsWith('.png'))) {
      let descriptionLines = [];
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().startsWith('>') || lines[j].trim() === '')) {
        if (lines[j].trim().startsWith('>')) {
          descriptionLines.push(lines[j].trim());
        }
        j++;
      }
      
      let fullDesc = descriptionLines
        .map(l => l.replace(/^>\s*/, '').trim())
        .filter(l => l !== '')
        .join(' ');
      
      fullDesc = fullDesc
        .replace(/#+\s*/g, '') // Strip heading characters
        .replace(/💡\s*\*\*蛤蟆祥法眼解析\*\*：?/g, '')
        .replace(/\*\*[蛤蛤]蟆法眼解析\*\*：?/g, '')
        .replace(/###\s*描述/g, '')
        .replace(/###\s*图片描述/g, '')
        .replace(/描述：?/g, '')
        .replace(/OCR提取文字：?/g, '')
        .replace(/OCR识别文字：?/g, '')
        .replace(/提取文字：?/g, '')
        .replace(/识别文字：?/g, '')
        .replace(/文字识别：?/g, '')
        .replace(/OCR文字如下：?/g, '')
        .replace(/文字：?/g, '')
        .replace(/\s+/g, ' ')
        .trim();
        
      let title = '美食影像';
      let desc = fullDesc;
      
      const firstBold = fullDesc.match(/^\*\*(.*?)\*\*/);
      if (firstBold) {
        title = firstBold[1].replace(/[:：]/g, '').trim();
        desc = fullDesc.replace(/^\*\*(.*?)\*\*\s*[:：]?\s*/, '').trim();
      } else {
        const firstSegment = fullDesc.split(/[。；;|]/)[0];
        if (firstSegment.length > 2 && firstSegment.length <= 15 && !firstSegment.includes('这是')) {
          title = firstSegment.trim();
        } else {
          const matchTitle = fullDesc.match(/^([^\s，。：；]+店|[^\s，。：；]+虾|[^\s，。：；]+鸡|[^\s，。：；]+蟹|[^\s，。：；]+菜|[^\s，。：；]+饭|[^\s，。：；]+面|[^\s，。：；]+爆)/);
          if (matchTitle) {
            title = matchTitle[1].trim();
          }
        }
      }
      
      if (title.length > 20) {
        title = title.substring(0, 15) + '...';
      }
      
      images.push({
        file: imgFile,
        title: title,
        desc: desc || '蛤蟆祥在红尘中为您呈现的美味瞬间。'
      });
    }
  }
  
  return images;
}

// Parse existing styled note for any manually written image titles/descriptions
function parseExistingImages(content) {
  const imageMap = {};
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Match standard markdown image link
    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const imgPath = imgMatch[2];
      const filename = path.basename(imgPath).toLowerCase();
      
      // Look ahead for callout caption
      let caption = '';
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().startsWith('>') || lines[j].trim() === '')) {
        if (lines[j].trim().startsWith('>')) {
          caption += lines[j].trim().replace(/^>\s*/, '') + ' ';
        }
        j++;
      }
      caption = caption.trim();
      
      if (caption) {
        caption = caption
          .replace(/💡\s*\*\*蛤蟆祥法眼解析\*\*：?/g, '')
          .replace(/\*\*[蛤蛤]蟆法眼解析\*\*：?/g, '')
          .replace(/\*\*蛤蟆法眼解析\*\*：?/g, '')
          .replace(/\*\*辣味密码\*\*：?/g, '')
          .replace(/\*\*图解三部曲\*\*：?/g, '')
          .replace(/\*\*甜品玄机\*\*：?/g, '')
          .replace(/#+\s*/g, '')
          .trim();
      }
      
      // Clean up alt text to separate title and desc if formatted as title|desc
      let title = alt;
      let desc = caption;
      if (alt.includes('|')) {
        const parts = alt.split('|');
        title = parts[0].trim();
        if (!desc) {
          desc = parts[1].trim();
        }
      }
      
      imageMap[filename] = {
        title: title || '美食影像',
        desc: desc
      };
    }
  }
  return imageMap;
}

let processedCount = 0;

walkDir(FOOD_DIR, (filePath) => {
  const name = path.basename(filePath);
  if (/^\d{4}-\d{2}-\d{2}_/.test(name)) return; // skip raw notes
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const evidenceMatch = content.match(/本地证据：\[\[(.*?)\]\]/) || content.match(/\[\[(202\d-\d{2}-\d{2}_.*?)\]\]/);
  
  if (evidenceMatch) {
    const rawRef = evidenceMatch[1].trim();
    const rawFilePath = path.join(ARCHIVE_RAW_DIR, `${rawRef}.md`);
    
    if (fs.existsSync(rawFilePath)) {
      const rawImages = parseRawNoteImages(rawFilePath);
      if (rawImages.length === 0) return;
      
      const district = path.basename(path.dirname(filePath));
      const existingImages = parseExistingImages(content);
      
      // Construct unified gallery section with prioritised styled descriptions
      const imageLines = rawImages.map(img => {
        const filenameLower = img.file.toLowerCase();
        let title = img.title;
        let desc = img.desc;
        
        // Prefer manually styled titles & descriptions if they exist
        if (existingImages[filenameLower]) {
          const extImg = existingImages[filenameLower];
          if (extImg.title && extImg.title !== '美食影像' && extImg.title !== '美味探索') {
            title = extImg.title;
          }
          if (extImg.desc) {
            desc = extImg.desc;
          }
        }
        
        // Clean title and description
        title = title.replace(/[|\[\]()]/g, '').trim() || '美味探索';
        desc = desc.replace(/[|\[\]()]/g, '').trim() || '美味推荐';
        
        let relativeImagePath = `../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/`;
        if (district === '未分类') {
          relativeImagePath += `未分类/${img.file}`;
        } else {
          relativeImagePath += `${district}/${img.file}`;
        }
        
        return `![${title}|${desc}](${relativeImagePath})`;
      }).join('\n\n');
      
      const newGallerySection = `## 🖼️ 图集手札\n\n${imageLines}\n\n`;
      
      // 1. Remove duplicate/old image sections from body
      const oldSectionRegexes = [
        /## 🖼️视觉证据链[\s\S]*?(?=\n##\s|$)/gi,
        /## 📸\s*\d+\.\s*图集手札[\s\S]*?(?=\n##\s|$)/gi,
        /## 📸\s*图集手札[\s\S]*?(?=\n##\s|$)/gi
      ];
      
      let newContent = content;
      oldSectionRegexes.forEach(regex => {
        newContent = newContent.replace(regex, '');
      });
      
      // Remove any HTML carousel blocks too
      const carouselRegex = /<div class="obsidian-carousel"[\s\S]*?<\/div>\s*(?:<div style="text-align: center;[\s\S]*?<\/div>)?/g;
      newContent = newContent.replace(carouselRegex, '').trim();
      
      // 2. Insert or replace ## 🖼️ 图集手札
      const galleryRegex = /## 🖼️ 图集手札[\s\S]*?(?=\n##\s|$)/;
      if (galleryRegex.test(newContent)) {
        newContent = newContent.replace(galleryRegex, () => newGallerySection);
      } else {
        // Insert before ## 👣
        const lastSectionIndex = newContent.lastIndexOf('## 👣');
        if (lastSectionIndex !== -1) {
          newContent = newContent.substring(0, lastSectionIndex) + newGallerySection + newContent.substring(lastSectionIndex);
        } else {
          // Look for ## 📜
          const lastSectionIndex2 = newContent.lastIndexOf('## 📜');
          if (lastSectionIndex2 !== -1) {
            newContent = newContent.substring(0, lastSectionIndex2) + newGallerySection + newContent.substring(lastSectionIndex2);
          } else {
            newContent = newContent + '\n\n' + newGallerySection;
          }
        }
      }
      
      // Cleanup multiple blank lines
      newContent = newContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ Consolidated gallery in: ${path.relative(FOOD_DIR, filePath)} (Unified ${rawImages.length} images)`);
        processedCount++;
      }
    }
  }
});

console.log(`\n🎉 Consolidation complete! Unified galleries and removed body duplications in ${processedCount} notes.`);
