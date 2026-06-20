import fs from 'fs';
import path from 'path';

// 1. Load Environment Variables from personal-blog/.env
const ENV_PATH = path.resolve('.env');
if (!fs.existsSync(ENV_PATH)) {
  console.error(`Error: .env file not found at ${ENV_PATH}`);
  process.exit(1);
}

const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const GROQ_API_KEY = env.GROQ_API_KEY;
const VAULT_ROOT = env.VAULT_PATH || 'C:\\Users\\Yhx06\\Documents\\Obsidian Vault';
const FOOD_DIR = path.join(VAULT_ROOT, '03_生活簿（生活区）', '食味录（美食与探店）');
const ARCHIVE_RAW_DIR = path.join(VAULT_ROOT, '01_藏经阁（知识库）', 'archive_raw（原始证据库）');

if (!GROQ_API_KEY) {
  console.error('Error: GROQ_API_KEY is not defined in .env');
  process.exit(1);
}

console.log('🚀 Starting LLM-powered Gallery Consolidation & Caption Rewriting Process...\n');

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

// Parse a raw note file to extract image and its original OCR/description block
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
    
    if (imgFile && (imgFile.endsWith('.jpg') || imgFile.endsWith('.png') || imgFile.endsWith('.jpeg'))) {
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
      
      images.push({
        file: imgFile,
        rawDesc: fullDesc.trim()
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
    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const imgPath = imgMatch[2];
      const filename = path.basename(imgPath).toLowerCase();
      
      let caption = '';
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().startsWith('>') || lines[j].trim() === '')) {
        if (lines[j].trim().startsWith('>')) {
          caption += lines[j].trim().replace(/^>\s*/, '') + ' ';
        }
        j++;
      }
      caption = caption.trim();
      
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
        desc: desc || ''
      };
    }
  }
  return imageMap;
}

function getCoreBodyContent(content) {
  // Remove yaml frontmatter
  let body = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
  
  // Remove old sections
  const oldSectionRegexes = [
    /## 🖼️视觉证据链[\s\S]*?(?=\n##\s|$)/gi,
    /## 📸\s*\d+\.\s*图集手札[\s\S]*?(?=\n##\s|$)/gi,
    /## 📸\s*图集手札[\s\S]*?(?=\n##\s|$)/gi,
    /## 🖼️ 图集手札[\s\S]*?(?=\n##\s|$)/gi
  ];
  
  oldSectionRegexes.forEach(regex => {
    body = body.replace(regex, '');
  });
  
  // Remove carousels
  const carouselRegex = /<div class="obsidian-carousel"[\s\S]*?<\/div>\s*(?:<div style="text-align: center;[\s\S]*?<\/div>)?/g;
  body = body.replace(carouselRegex, '');
  
  return body.trim();
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function callGroqAPI(messages, retries = 5) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  
  let modelIndex = 0;
  let currentModel = models[modelIndex];
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: currentModel,
          messages: messages,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (response.status === 429) {
        const totalWait = 5000 + (attempt - 1) * 5000;
        console.warn(`      ⚠️ Rate limited (429) on model ${currentModel}. Attempt ${attempt}/${retries}. Waiting ${totalWait/1000}s...`);
        
        // Fallback model if we get rate limited
        if (modelIndex < models.length - 1 && attempt >= 2) {
          modelIndex++;
          currentModel = models[modelIndex];
          console.warn(`      🔄 Falling back to model ${currentModel}...`);
        }
        
        await sleep(totalWait);
        continue;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      if (attempt === retries) throw err;
      const errBackoff = 3000 + (attempt - 1) * 3000;
      console.warn(`      ⚠️ Attempt ${attempt}/${retries} failed on ${currentModel}: ${err.message}. Retrying in ${errBackoff/1000}s...`);
      await sleep(errBackoff);
    }
  }
  throw new Error(`Exhausted all retries for Groq API on model ${currentModel}.`);
}

function extractJsonArray(text) {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.images && Array.isArray(parsed.images)) return parsed.images;
    if (parsed.gallery && Array.isArray(parsed.gallery)) return parsed.gallery;
  } catch (e) {
    // try regex match
    const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
  }
  throw new Error(`Failed to extract JSON array from text: ${text}`);
}

function isAlreadyConsolidated(content, rawImages) {
  if (/## 🖼️视觉证据链/i.test(content) || 
      /## 📸\s*\d+\.\s*图集手札/i.test(content) || 
      /## 📸\s*图集手札/i.test(content) || 
      /class="obsidian-carousel"/i.test(content) || 
      /<div\s+style="flex:\s*0\s+0\s+100%;/i.test(content)) {
    return false;
  }
  
  if (!content.includes('## 🖼️ 图集手札')) {
    return false;
  }
  
  if (content.includes('为您呈现的美味瞬间') || content.includes('美味推荐') || content.includes('美味探索')) {
    return false;
  }
  
  for (const img of rawImages) {
    if (!content.toLowerCase().includes(img.file.toLowerCase())) {
      return false;
    }
  }
  
  return true;
}

async function processNote(filePath) {
  const name = path.basename(filePath);
  if (/^\d{4}-\d{2}-\d{2}_/.test(name)) return false; // skip raw notes
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const evidenceMatch = content.match(/本地证据：\[\[(.*?)\]\]/) || content.match(/\[\[(202\d-\d{2}-\d{2}_.*?)\]\]/);
  
  if (!evidenceMatch) return false;
  
  const rawRef = evidenceMatch[1].trim();
  const rawFilePath = path.join(ARCHIVE_RAW_DIR, `${rawRef}.md`);
  
  if (!fs.existsSync(rawFilePath)) {
    console.warn(`  ⚠️ Warning: Raw note does not exist for: ${name} (Reference: ${rawRef})`);
    return false;
  }
  
  const rawImages = parseRawNoteImages(rawFilePath);
  if (rawImages.length === 0) return false;
  
  if (isAlreadyConsolidated(content, rawImages)) {
    console.log(`  ⏭️ Skipping already consolidated: ${name}`);
    return false;
  }
  
  console.log(`  👉 Note: ${path.relative(FOOD_DIR, filePath)} (${rawImages.length} images)`);
  
  const district = path.basename(path.dirname(filePath));
  const existingImages = parseExistingImages(content);
  const coreBody = getCoreBodyContent(content);
  
  // Prepare information for LLM
  const imageInfoForLlm = rawImages.map((img, idx) => {
    const filenameLower = img.file.toLowerCase();
    const extInfo = existingImages[filenameLower] || {};
    return {
      index: idx + 1,
      file: img.file,
      rawDesc: img.rawDesc || '',
      existingDesc: (extInfo.desc && !extInfo.desc.includes('为您呈现的美味瞬间')) ? `${extInfo.title ? extInfo.title + ': ' : ''}${extInfo.desc}` : ''
    };
  });
  
  const systemPrompt = `你是一个美食专栏作家和知识库管理员，笔名叫作"蛤蟆祥"（一个热情、贪吃、机灵的宠物向导，称呼读者为"道友"，风格是现代、活泼、充满生活烟火气的小红书种草风，禁用修仙黑话如“饕餮转化”、“胃腑道基”、“法眼解析”等）。
我们正在整理一系列美食探店与食谱笔记。由于要适配网页端的3D图画廊，笔记底部的“图集手札”中的每张图片必须绑定精美、干净、人设化的“标题”与“风味解析描述”。

你的任务是：阅读提供的【Styled笔记正文】和【图片列表（含原始OCR与旧描述）】，为图集中的每一张图片重新生成精美、符合“蛤蟆祥”人设的“标题”与“描述”。

具体规则：
1. Title（标题）：必须极其简短（控制在15个字以内），代表图片中的核心食物（如“黄豆香辣猪蹄”、“铁板酸菜烤肉”）、场景（如“霓虹闪烁的门头”）或细节。
2. Description（风味解析描述）：
   - 必须以“蛤蟆祥”口吻重写。保持活泼好客、现代小红书风格，突出美味诱人和实打实的食客体验。
   - 绝不能包含任何技术或OCR标记字眼，例如“文字识别：”、“图片展示：”、“描述：”、“提取：”、“****”等，将这些内容融化并转化为自然的吃货向导描述。
   - 如果该图片在原始记录中没有描述（只有占位符或空），你必须根据【Styled笔记正文】中提到的具体菜品、口味（如咸蛋黄、蒜香、辣度、口感）或就餐环境，进行合情合理的、细节生动的趣味补充，绝不能用死板的占位符（例如“蛤蟆祥在红尘中为您呈现的美味瞬间”）。
3. 必须输出为 JSON 对象格式，包含一个名为 "gallery" 的数组。数组中每个对象包含:
   - "file": 图片文件名
   - "title": 净化后的简短标题
   - "desc": 人设化的趣味风味解析描述

请确保返回合规的 JSON 对象，且数组中的所有条目都已填充。`;

  const userContent = `【Styled笔记正文】
${coreBody}

【图片列表】
${JSON.stringify(imageInfoForLlm, null, 2)}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];
  
  // Call API
  const resultText = await callGroqAPI(messages);
  const galleryItems = extractJsonArray(resultText);
  
  // Match results back to paths
  const itemMap = {};
  galleryItems.forEach(item => {
    if (item.file) {
      itemMap[item.file.toLowerCase()] = item;
    }
  });
  
  const imageLines = rawImages.map(img => {
    const filenameLower = img.file.toLowerCase();
    const resultItem = itemMap[filenameLower] || {};
    
    let title = resultItem.title || '美味探索';
    let desc = resultItem.desc || '蛤蟆祥为您推荐的红尘美味。';
    
    // Clean brackets or other characters that split alt text
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
    console.log(`  ✅ Successfully updated: ${name}`);
    return true;
  }
  return false;
}

async function run() {
  const files = [];
  walkDir(FOOD_DIR, (filePath) => {
    files.push(filePath);
  });
  
  console.log(`Found ${files.length} candidate styled notes in total.`);
  let processedCount = 0;
  
  for (const file of files) {
    try {
      const updated = await processNote(file);
      if (updated) {
        processedCount++;
        // Proactive sleep to avoid Groq TPM limits
        await sleep(3500);
      }
    } catch (e) {
      console.error(`  ❌ Error processing file ${path.basename(file)}:`, e);
    }
  }
  
  console.log(`\n🎉 Process complete! Restructured and rewrote galleries in ${processedCount} notes.`);
}

run();
