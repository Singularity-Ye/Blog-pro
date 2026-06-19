import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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
const VAULT_ROOT = env.VAULT_PATH || 'C:/Users/Yhx06/Documents/Obsidian Vault';
const INBOX_DIR = path.join(VAULT_ROOT, '00_松果池（收件箱）');

if (!GROQ_API_KEY) {
  console.error('Error: GROQ_API_KEY is not defined in .env');
  process.exit(1);
}

console.log(`Vault Root: ${VAULT_ROOT}`);
console.log(`Inbox Directory: ${INBOX_DIR}`);
console.log(`Groq API Key detected: ${GROQ_API_KEY.substring(0, 10)}...`);

// 2. Scan Inbox recursively for md files
function getMdFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getMdFiles(filePath));
    } else if (path.extname(file) === '.md' && file !== '📬 松果池说明.md' && file !== '00_松果池（收件箱）.md') {
      results.push(filePath);
    }
  }
  return results;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Truncate long body text to prevent token size limits (413 errors)
function truncateContent(content) {
  let body = content;
  let fm = '';
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (match) {
    fm = match[0];
    body = content.substring(match.index + match[0].length);
  }

  const MAX_BODY_CHARS = 2500;
  if (body.length > MAX_BODY_CHARS) {
    console.log(`   -> Truncating large note body from ${body.length} to ${MAX_BODY_CHARS} characters to avoid API token limits.`);
    const firstPart = body.substring(0, 1700);
    const lastPart = body.substring(body.length - 800);
    body = `${firstPart}\n\n...[转写原文过长，中间部分进行截断以节省Token并防范Token超限风险]...\n\n${lastPart}`;
  }

  return fm + body;
}

// Search and migrate inbox physical image attachments to vault global attachments/<category>/ directory
function processInboxImages(originalContent, baseDir, VAULT_ROOT, INBOX_DIR, targetCategory) {
  const images = [];
  
  // 1. Match Obsidian Wikilink image: ![[image.png]]
  const obsidianImgRegex = /!\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g;
  let match;
  while ((match = obsidianImgRegex.exec(originalContent)) !== null) {
    const imgName = match[1].trim();
    if (imgName && !imgName.startsWith('http://') && !imgName.startsWith('https://') && !imgName.startsWith('/')) {
      images.push(imgName);
    }
  }

  // 2. Match standard Markdown image: ![alt](url)
  const standardImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = standardImgRegex.exec(originalContent)) !== null) {
    const imgUrl = match[2].trim();
    if (imgUrl && !imgUrl.startsWith('http://') && !imgUrl.startsWith('https://') && !imgUrl.startsWith('/')) {
      images.push(imgUrl);
    }
  }

  const uniqueImages = [...new Set(images)];
  if (uniqueImages.length === 0) return null;

  const targetAttachmentDir = path.join(VAULT_ROOT, 'attachments', targetCategory);
  if (!fs.existsSync(targetAttachmentDir)) {
    fs.mkdirSync(targetAttachmentDir, { recursive: true });
  }

  const copiedImages = [];

  for (const imgRef of uniqueImages) {
    const imgName = path.basename(imgRef);
    
    // Search physical file recursively in candidate inbox directories
    const possiblePaths = [
      path.join(baseDir, imgRef),
      path.join(baseDir, 'attachments', imgRef),
      path.join(baseDir, 'attachments', imgName),
      path.join(baseDir, imgName),
      path.join(INBOX_DIR, 'attachments', imgRef),
      path.join(INBOX_DIR, 'attachments', imgName),
      path.join(INBOX_DIR, imgRef),
      path.join(INBOX_DIR, imgName)
    ];

    let foundPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    // Try case-insensitive filename match
    if (!foundPath) {
      const lowerName = imgName.toLowerCase();
      const searchDirs = [
        baseDir,
        path.join(baseDir, 'attachments'),
        INBOX_DIR,
        path.join(INBOX_DIR, 'attachments')
      ];
      for (const dir of searchDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const f = files.find(file => file.toLowerCase() === lowerName);
          if (f) {
            foundPath = path.join(dir, f);
            break;
          }
        }
      }
    }

    if (foundPath) {
      const destPath = path.join(targetAttachmentDir, imgName);
      try {
        fs.copyFileSync(foundPath, destPath);
        copiedImages.push(imgName);
        console.log(`   [Image Migration] Copied attachment: ${imgName} ➡️ attachments/${targetCategory.replace(/\\/g, '/')}/`);
      } catch (e) {
        console.error(`   [Image Migration] Failed to copy ${imgName}:`, e.message);
      }
    } else {
      console.warn(`   [Image Migration] Warning: Physical image file not found for reference: ${imgRef}`);
    }
  }

  return copiedImages;
}

async function callGroqAPI(messages, retries = 8) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const models = ['llama-3.3-70b-versatile', 'qwen/qwen3-32b', 'llama-3.1-8b-instant'];
  
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
          temperature: 0.2
        })
      });

      if (response.status === 429) {
        const errText = await response.text();
        let retryAfterMs = 15000; // default 15 seconds
        try {
          const errObj = JSON.parse(errText);
          const msg = errObj.error?.message || '';
          
          let parsed = null;
          const minMatch = msg.match(/(\d+)\s*m(?:in|inutes)?/i);
          const secMatch = msg.match(/(\d+(?:\.\d+)?)\s*s(?:ec|econds)?/i);
          const msMatch = msg.match(/(\d+)\s*ms/i);
          
          let minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
          let seconds = 0;
          let ms = msMatch ? parseInt(msMatch[1], 10) : 0;
          if (!msMatch && secMatch) {
            seconds = parseFloat(secMatch[1]);
          }
          
          if (minutes > 0 || seconds > 0 || ms > 0) {
            parsed = (minutes * 60 * 1000) + (seconds * 1000) + ms;
          }
          
          if (parsed !== null) {
            retryAfterMs = parsed;
          }
        } catch (e) {}
        
        // If wait time is too long, fallback to the next model immediately instead of sleeping
        if (retryAfterMs > 45000 && modelIndex < models.length - 1) {
          modelIndex++;
          currentModel = models[modelIndex];
          console.warn(`      ⚠️ Rate limit wait too long (${(retryAfterMs / 1000).toFixed(1)}s) for previous model. Falling back to ${currentModel}...`);
          attempt = 1; // reset attempts
          continue;
        }

        // If wait time exceeds 60s even on the last model, do not sleep forever! Skip file or fallback.
        if (retryAfterMs > 60000) {
          if (modelIndex < models.length - 1) {
            modelIndex++;
            currentModel = models[modelIndex];
            console.warn(`      ⚠️ Rate limit wait is ${(retryAfterMs / 1000).toFixed(1)}s. Falling back to ${currentModel}...`);
            attempt = 1;
            continue;
          } else {
            throw new Error(`Rate limit wait time too long (${(retryAfterMs / 1000).toFixed(1)}s) on final fallback model ${currentModel}. Skipping file.`);
          }
        }

        if (attempt === retries) {
          if (modelIndex < models.length - 1) {
            modelIndex++;
            currentModel = models[modelIndex];
            console.warn(`      ⚠️ Exhausted attempts on previous model. Falling back to ${currentModel}...`);
            attempt = 1;
            continue;
          } else {
            throw new Error(`Rate limit exceeded (429) on all fallback models.`);
          }
        }
        
        const backoffBuffer = (attempt - 1) * 8000;
        const totalWait = retryAfterMs + 2000 + backoffBuffer;
        
        console.warn(`      ⚠️ Rate limited (429). Attempt ${attempt}/${retries} on ${currentModel}. Waiting ${(totalWait / 1000).toFixed(1)}s (base: ${(retryAfterMs / 1000).toFixed(1)}s, backoff: ${(backoffBuffer / 1000).toFixed(1)}s) and retrying...`);
        await sleep(totalWait);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 413) {
          if (modelIndex < models.length - 1) {
            modelIndex++;
            currentModel = models[modelIndex];
            console.warn(`      ⚠️ Request too large (413) for previous model. Falling back to ${currentModel}...`);
            attempt = 1;
            continue;
          }
        }
        throw new Error(`API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      if (attempt === retries) {
        if (modelIndex < models.length - 1) {
          modelIndex++;
          currentModel = models[modelIndex];
          console.warn(`      ⚠️ Error on previous model: ${err.message}. Falling back to ${currentModel}...`);
          attempt = 1;
          continue;
        } else {
          throw err;
        }
      }
      const errBackoff = 8000 + (attempt - 1) * 5000;
      console.warn(`      ⚠️ Attempt ${attempt}/${retries} failed on ${currentModel}: ${err.message}. Retrying in ${(errBackoff / 1000).toFixed(1)}s...`);
      await sleep(errBackoff);
    }
  }
}

// 3. Main process
async function startBatchProcess() {
  const mdFiles = getMdFiles(INBOX_DIR);
  console.log(`Found ${mdFiles.length} candidate files in the inbox.`);

  const MAX_BATCH_LIMIT = 30; // Process 30 files per batch run
  const filesToProcess = mdFiles.slice(0, MAX_BATCH_LIMIT);
  console.log(`Selected first ${filesToProcess.length} files to process in this run.\n`);

  let successCount = 0;

  for (let i = 0; i < filesToProcess.length; i++) {
    const filePath = filesToProcess[i];
    const fileName = path.basename(filePath);
    console.log(`[${i + 1}/${filesToProcess.length}] Processing file: ${fileName}`);

    try {
      const originalContent = fs.readFileSync(filePath, 'utf-8');
      const content = truncateContent(originalContent);

      // Simple name parsing: YYYY-MM-DD_Title_Hash.md
      let date = new Date().toISOString().split('T')[0];
      let originalTitle = path.basename(filePath, '.md');
      let shortHash = '';

      const nameMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})_(.*)_([a-f0-9]{6})\.md$/);
      if (nameMatch) {
        date = nameMatch[1];
        originalTitle = nameMatch[2];
        shortHash = nameMatch[3];
      } else {
        const nameMatch2 = fileName.match(/^(\d{4}-\d{2}-\d{2})_(.*)\.md$/);
        if (nameMatch2) {
          date = nameMatch2[1];
          originalTitle = nameMatch2[2];
        }
        // Generate random hash if none exists
        shortHash = Math.random().toString(16).substring(2, 8);
      }

      const systemPrompt = `你是一个Obsidian知识库管理Agent，专门处理收件箱中的原始ASR语音转写和网页抓取文档。
你的任务是将这些原始文本，根据松果阁的知识库分类标准进行分类，并将其改写并扩写为高质量、通俗易懂且富有生活趣味的笔记。

分类与目标物理文件夹相对路径映射规则（注意区分 01_藏经阁 和 03_生活簿）：
1. 职场段子、向上管理、人情世故 ➡️ 01_藏经阁（知识库）/刀笔集（锐评与观察）/老头宇宙/ 或 老韩宇宙/
2. 哲学拟人、荒诞思辨、社会现象解构 ➡️ 01_藏经阁（知识库）/思辨录（认知与方法论）/休谟宇宙/
3. 学习心法、方法论、知识管理、时间管理 ➡️ 01_藏经阁（知识库）/思辨录（认知与方法论）/
4. 音乐、电影常识、自然科普、科技发展通识、商业模式 ➡️ 01_藏经阁（知识库）/博物志（见闻与科普）/ 下的子文件夹 (人文与历史, 影音与艺术, 社会与商业, 科技与数字, 自然与生命, 身心与日常)
5. 脚本、配置、技术教程、API对接 ➡️ 01_藏经阁（知识库）/技艺录（技术与工具）/ 下的子文件夹 (AI工具与订阅, Obsidian, 建站实录)
6. 游戏玩法、游戏实况、MOD、娱乐 ➡️ 03_生活簿（生活区）/游艺录（游戏与娱乐）/
7. 美食探店、菜谱 ➡️ 03_生活簿（生活区）/食味录（美食与探店）/
8. 旅游攻略、城市导览 ➡️ 03_生活簿（生活区）/行路志（旅行与城市）/
9. 影视解说、动漫推荐、剧情分析 ➡️ 03_生活簿（生活区）/映卷录（影视与动漫）/
10. 书籍随记、阅读文学 ➡️ 03_生活簿（生活区）/案上书（阅读与文学）/

笔记风格与格式规范：
- 语言活泼轻快，带有一点人味，不要死板总结或写成说教式论文，不要空洞鸡汤。必须使用直白的语言和有趣的修辞/比喻（Metaphors）进行概念解构，让读者能轻易理解资料的深刻内涵。
- 必须在关键节点上配合使用 Mermaid 语法绘制图表（如 \`graph TD\`、\`sequenceDiagram\` 等）来美化视觉呈现，直观展示事物发展脉络、流程、关系或逻辑。
- 必须在顶部包含 YAML frontmatter (包含 tags, url, title, date)。
- 顶级标题 # [生活流趣味化标题] 应是clickbaity的白话标题。
- 必须包含 "## 0. 原始资料"，其中 "本地证据" 指向 Wikilink 双链。双链格式必须为：[[归档文件名]]（不带.md，注意归档文件名必须与correctedRawFileName保持一致，去掉.md后缀）。
- 科普类必须包含 "## 3. 小白补课区" 以及 "## 4. 关键概念/事实整理"（用表格呈现）。
- 戏剧/对话类必须保留对话剧本形式、语境 and 笑点。严禁编写技术代码。
- 实操类必须有步骤、命令和代码。

输出格式：请务必直接输出以下带有标记符的内容，不要用 JSON，也不要用任何 markdown 标记包裹返回：

<<<ROUTED_CATEGORY>>>
精确的物理子文件夹相对路径，例如: 01_藏经阁（知识库）/思辨录（认知与方法论）

<<<NEW_TITLE>>>
改写后的生活流趣味化标题 (不带.md)

<<<CORRECTED_RAW_NAME>>>
纠正后的原始证据文件名，应为: YYYY-MM-DD_真实标题_短Hash.md (如果发现原文件名与实际口播主题不符，必须在此纠正标题名称)

<<<EXPANDED_MARKDOWN>>>
完整的重构扩写后Markdown内容
`;

      const userContent = `文件名: ${fileName}
解析出的日期: ${date}
解析出的原标题: ${originalTitle}
随机短Hash: ${shortHash}

原始文件正文：
${content}
`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ];

      // Call API
      const resultText = await callGroqAPI(messages);
      
      const routedCategoryMatch = resultText.match(/<<<ROUTED_CATEGORY>>>\s*\n([\s\S]*?)(?:\n<<<|$)/);
      const newTitleMatch = resultText.match(/<<<NEW_TITLE>>>\s*\n([\s\S]*?)(?:\n<<<|$)/);
      const correctedRawFileNameMatch = resultText.match(/<<<CORRECTED_RAW_NAME>>>\s*\n([\s\S]*?)(?:\n<<<|$)/);
      const expandedMarkdownMatch = resultText.match(/<<<EXPANDED_MARKDOWN>>>\s*\n([\s\S]*)$/);
      
      if (!routedCategoryMatch || !newTitleMatch || !correctedRawFileNameMatch || !expandedMarkdownMatch) {
        fs.writeFileSync('scratch/failed_output.txt', resultText, 'utf-8');
        throw new Error("Failed to parse model output. Markers not found in text. Saved full response to scratch/failed_output.txt. Preview: " + resultText.substring(0, 300));
      }

      const targetCategory = routedCategoryMatch[1].trim();
      let newTitle = newTitleMatch[1].trim();
      let correctedRawName = correctedRawFileNameMatch[1].trim();
      let expandedMarkdown = expandedMarkdownMatch[1].trim();

      // Clean Windows illegal characters in filenames to prevent write failures
      const cleanWindowsFilename = (name) => {
        return name
          .replace(/["“”'‘’]/g, '')  // Remove quotes
          .replace(/[:：]/g, '：')   // Convert to Chinese colon
          .replace(/[?？]/g, '？')   // Convert to Chinese question mark
          .replace(/[\\/|]/g, '-')   // Replace slashes with dash
          .replace(/[*<>]/g, '')     // Remove stars and brackets
          .trim();
      };

      newTitle = cleanWindowsFilename(newTitle);

      let rawExt = path.extname(correctedRawName);
      let rawBase = path.basename(correctedRawName, rawExt);
      if (rawExt.toLowerCase() !== '.md') {
        rawBase = correctedRawName;
        rawExt = '.md';
      }
      correctedRawName = cleanWindowsFilename(rawBase) + rawExt;

      console.log(`   -> Routed to: ${targetCategory}`);
      console.log(`   -> New Title: ${newTitle}`);
      console.log(`   -> Corrected Raw Name: ${correctedRawName}`);

      const targetNotePath = path.join(VAULT_ROOT, targetCategory, `${newTitle}.md`);
      const archiveNotePath = path.join(VAULT_ROOT, '01_藏经阁（知识库）/archive_raw（原始证据库）', correctedRawName);

      // Verify and correct Wikilink inside expandedMarkdown to point to the correctedRawName
      const rawNameNoExt = path.basename(correctedRawName, '.md');
      expandedMarkdown = expandedMarkdown.replace(/本地证据：\[\[.*?\]\]/, `本地证据：[[${rawNameNoExt}]]`);

      // Search, copy, and construct image carousel slider if any physical image references exist
      const copiedImages = processInboxImages(originalContent, path.dirname(filePath), VAULT_ROOT, INBOX_DIR, targetCategory);
      if (copiedImages && copiedImages.length > 0) {
        // Calculate depth and relative path prefix
        const cleanTargetCategory = targetCategory.replace(/\\/g, '/');
        const segments = cleanTargetCategory.split('/').filter(Boolean);
        const depth = segments.length;
        const prefix = '../'.repeat(depth);

        let carouselHtml = '';
        if (copiedImages.length === 1) {
          carouselHtml = `\n![[${copiedImages[0]}]]\n`;
        } else {
          let slides = '';
          for (const img of copiedImages) {
            const relImgUrl = `${prefix}attachments/${cleanTargetCategory}/${img}`;
            slides += `  <div style="flex: 0 0 100%; scroll-snap-align: start; box-sizing: border-box; border-radius: 12px; overflow: hidden; border: 1px solid var(--background-modifier-border);">\n    <img src="${relImgUrl}" style="width: 100%; height: 320px; object-fit: cover; display: block;" />\n  </div>\n`;
          }
          carouselHtml = `\n<div class="obsidian-carousel" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 8px; width: 100%; max-width: 480px; margin: 15px auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">\n${slides}</div>\n<div style="text-align: center; font-size: 0.85em; color: var(--text-muted); margin-top: -5px; margin-bottom: 15px;">💡 左右滑动 or 使用滚轮查看更多图片</div>\n`;
        }

        const titleMatch = expandedMarkdown.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          const insertIndex = titleMatch.index + titleMatch[0].length;
          expandedMarkdown = expandedMarkdown.slice(0, insertIndex) + `\n${carouselHtml}` + expandedMarkdown.slice(insertIndex);
        } else {
          expandedMarkdown = carouselHtml + expandedMarkdown;
        }
        console.log(`   [Image Carousel] Created carousel with ${copiedImages.length} images.`);
      }

      // Ensure target directory exists
      if (!fs.existsSync(path.dirname(targetNotePath))) {
        fs.mkdirSync(path.dirname(targetNotePath), { recursive: true });
      }
      if (!fs.existsSync(path.dirname(archiveNotePath))) {
        fs.mkdirSync(path.dirname(archiveNotePath), { recursive: true });
      }

      // Write expanded note
      fs.writeFileSync(targetNotePath, expandedMarkdown, 'utf-8');
      
      // Move / Archive original file
      let rawArchiveContent = originalContent; // Keep original un-truncated content for archive!
      if (correctedRawName !== fileName) {
        const correctedTitleText = path.basename(correctedRawName, `_${shortHash}.md`).substring(11);
        rawArchiveContent = rawArchiveContent.replace(/^title:\s*".*?"/m, `title: "${correctedTitleText}"`);
        rawArchiveContent = rawArchiveContent.replace(/^#\s*(.*)/m, `# ${correctedTitleText}`);
      }

      fs.writeFileSync(archiveNotePath, rawArchiveContent, 'utf-8');
      fs.unlinkSync(filePath); // Delete from inbox

      console.log(`   -> Success! Note written and original archived.\n`);
      successCount++;

      // Wait 5 seconds to proactively prevent Groq Rate Limit
      await sleep(5000);
    } catch (fileErr) {
      console.error(`   ⚠️ Failed to process file ${fileName}:`, fileErr.message);
    }
  }

  console.log(`\nBatch finished. Successfully processed ${successCount} out of ${filesToProcess.length} files.`);

  // 4. Run post-process sync and git commit
  if (successCount > 0) {
    try {
      console.log('\nRunning note synchronization...');
      execSync('npm run sync-notes', { stdio: 'inherit' });

      console.log('\nRunning Git commit...');
      execSync(`git -C "${VAULT_ROOT}" add .`, { stdio: 'inherit' });
      execSync(`git -C "${VAULT_ROOT}" commit -m "docs: auto batch-processed ${successCount} notes from inbox"`, { stdio: 'inherit' });
      console.log('Git commit completed successfully!');
    } catch (postErr) {
      console.error('Error in post-processing sync/commit:', postErr.message);
    }
  }
}

startBatchProcess();
