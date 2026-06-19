import fs from 'fs';
import path from 'path';

const VAULT_PATH = 'C:/Users/Yhx06/Documents/Obsidian Vault';

const GAME_LIFE_PATH = path.join(VAULT_PATH, '03_生活簿（生活区）/游艺录（游戏与娱乐）');
const GAME_KNOWLEDGE_PATH = path.join(VAULT_PATH, '01_藏经阁（知识库）/游艺录（游戏与娱乐）');
const FOOD_LIFE_PATH = path.join(VAULT_PATH, '03_生活簿（生活区）/食味录（美食与探店）');

function parseFrontmatter(content) {
  const fmRegex = /^---([\s\S]*?)---/;
  const match = content.match(fmRegex);
  if (!match) return { data: {}, body: content };
  
  const fmText = match[1];
  const body = content.slice(match[0].length);
  const data = {};
  
  const lines = fmText.split('\n');
  let currentKey = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('-') && currentKey) {
      const val = trimmed.slice(1).trim().replace(/^['"]|['"]$/g, '');
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      data[currentKey].push(val);
      continue;
    }
    
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    currentKey = key;
    
    if (val === '') {
      data[key] = [];
    } else if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      data[key] = val;
    }
  }
  return { data, body };
}

const incompleteFiles = [];

function checkFileCompleteness(filePath, content) {
  const trimmed = content.trim();
  const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) return true;
  
  const lastLine = lines[lines.length - 1];
  
  // 1. Check if cut off mid-word or ends with common cut-off signals
  const cutOffPatterns = [
    /^[a-zA-Z]{1,3}$/, // ends with 1-3 letters like "AI" on its own line
    /的$/,
    /在$/,
    /和$/,
    /是$/,
    /与$/,
    /或$/,
    /因为$/,
    /所以$/,
    /\.\.\.$/,
    /…$/,
    /【待整理】$/
  ];
  
  let isIncomplete = false;
  
  for (const pattern of cutOffPatterns) {
    if (pattern.test(lastLine)) {
      isIncomplete = true;
      break;
    }
  }
  
  // 2. Check if ends directly on a header with no content
  if (lastLine.startsWith('#')) {
    isIncomplete = true;
  }
  
  if (isIncomplete) {
    incompleteFiles.push({
      path: filePath,
      fileName: path.basename(filePath),
      lastLine: lastLine
    });
  }
  
  return isIncomplete;
}

// 1. Analyze game notes
const proposedGameMoves = [];

function analyzeGameNote(filePath, relativeDir) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check completeness
  checkFileCompleteness(filePath, content);
  
  const { data, body } = parseFrontmatter(content);
  
  const title = data.title || fileName.replace(/\.md$/, '');
  const tags = data.tags || [];
  const tagsStr = tags.join(' ');
  const fullText = title + ' ' + tagsStr + ' ' + body;
  
  let category = '其他游戏';
  
  // High-precision keyword check
  if (/火影|仙人模式|对空判定|水枪犬|浦式|我爱罗|斑爷|小豪|老佩恩|忍魂|忍法帖/i.test(title + ' ' + tagsStr)) {
    category = '火影忍者';
  } else if (/星露谷物语|Stardew/i.test(title + ' ' + tagsStr)) {
    category = '星露谷物语';
  } else if (/环世界|Rimworld/i.test(title + ' ' + tagsStr)) {
    category = '环世界';
  } else if (/我的世界|Minecraft|地狱门|监审者/i.test(title + ' ' + tagsStr)) {
    category = '我的世界';
  } else if (/英雄联盟|LOL|LPL|世界赛|出征|宿命对决/i.test(title + ' ' + tagsStr)) {
    category = '英雄联盟与电竞';
  } else if (/万物皆可蟹|蟹/i.test(title + ' ' + tagsStr)) {
    category = '独立与特色游戏';
  } else if (/塑料瓶|造船|整活|挑战/i.test(title + ' ' + tagsStr)) {
    category = '创意与趣味挑战';
  } else if (/小说|蛊界|方源/i.test(title + ' ' + tagsStr)) {
    category = '小说与文字游艺';
  } else {
    // Fallback to body content check
    if (/火影|对空判定|水枪犬|浦式|我爱罗|斑爷|老佩恩|忍魂|忍法帖/i.test(body)) {
      category = '火影忍者';
    } else if (/星露谷物语|Stardew/i.test(body)) {
      category = '星露谷物语';
    } else if (/环世界|Rimworld/i.test(body)) {
      category = '环世界';
    } else if (/我的世界|Minecraft|勇者之章|以太锭|庇护者/i.test(body)) {
      category = '我的世界';
    } else if (/英雄联盟|LOL|LPL|世界赛|出征|VN真伤|钩子/i.test(body)) {
      category = '英雄联盟与电竞';
    } else if (/蟹|万物皆可蟹/i.test(body)) {
      category = '独立与特色游戏';
    } else if (/塑料瓶|造船|荒诞挑战|创意工程/i.test(body)) {
      category = '创意与趣味挑战';
    } else if (/小说|蛊界|古月方源/i.test(body)) {
      category = '小说与文字游艺';
    }
  }
  
  const targetDir = path.join(relativeDir, category);
  const targetPath = path.join(targetDir, fileName);
  proposedGameMoves.push({
    source: filePath,
    targetDir,
    targetPath,
    fileName,
    category
  });
}

// 2. Analyze food notes
const proposedFoodMoves = [];

function analyzeFoodNote(filePath, relativeDir) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check completeness
  checkFileCompleteness(filePath, content);
  
  const { data, body } = parseFrontmatter(content);
  
  const title = data.title || fileName.replace(/\.md$/, '');
  const district = (data.district || '').trim();
  const tags = data.tags || [];
  const tagsStr = tags.join(' ');
  
  let targetSubDir = '未分类';
  
  // Check if it's explicitly non-Hangzhou first
  const isNonHangzhou = /上海|沪上|淮海路|济南|南京|北京/i.test(tagsStr + ' ' + title) || 
                       (/里脊肉|蒸菜|减脂/i.test(title) && !/杭州|下沙/i.test(title));
                       
  if (isNonHangzhou && !/台北天使鸡排|太厚甲/i.test(title)) {
    targetSubDir = '未分类';
  } else if (district.includes('钱塘') || district.includes('下沙') || /钱塘|下沙|福雷德|桃李苑|理工|科艺|财大|工商/i.test(title + ' ' + tagsStr)) {
    targetSubDir = '钱塘区（下沙）';
  } else if (district.includes('西湖') || /西湖|玉泉|求是|西投银泰|甜品节|烘焙市集/i.test(title + ' ' + tagsStr)) {
    targetSubDir = '西湖区';
  } else if (district.includes('拱墅') || /拱墅|香么天|恒隆/i.test(title + ' ' + tagsStr)) {
    targetSubDir = '拱墅区';
  } else if (district.includes('滨江') || /滨江|贵州炭烤/i.test(title + ' ' + tagsStr)) {
    targetSubDir = '滨江区';
  } else if (district.includes('萧山') || /萧山/i.test(title + ' ' + tagsStr)) {
    targetSubDir = '萧山区';
  } else if (district.includes('杭州') || /杭州|山姆|盒马|汉堡节/i.test(title + ' ' + tagsStr)) {
    targetSubDir = '杭州市区（其他）';
  } else {
    // Fallback to body content check
    const fullText = title + ' ' + tagsStr + ' ' + body;
    if (fullText.includes('上海') || fullText.includes('沪上') || fullText.includes('淮海路') || fullText.includes('济南')) {
      targetSubDir = '未分类';
    } else if (/钱塘|下沙|福雷德|桃李苑|理工|科艺|财大|工商/i.test(fullText)) {
      targetSubDir = '钱塘区（下沙）';
    } else if (/西湖|玉泉|求是|西投银泰|甜品节|烘焙市集/i.test(fullText)) {
      targetSubDir = '西湖区';
    } else if (/拱墅|香么天|恒隆/i.test(fullText)) {
      targetSubDir = '拱墅区';
    } else if (/滨江|贵州炭烤/i.test(fullText)) {
      targetSubDir = '滨江区';
    } else if (/萧山/i.test(fullText)) {
      targetSubDir = '萧山区';
    } else if (/杭州|山姆|盒马|汉堡节/i.test(fullText)) {
      targetSubDir = '杭州市区（其他）';
    }
  }
  
  const targetDir = path.join(relativeDir, targetSubDir);
  const targetPath = path.join(targetDir, fileName);
  proposedFoodMoves.push({
    source: filePath,
    targetDir,
    targetPath,
    fileName,
    category: targetSubDir
  });
}

// Scan directories
if (fs.existsSync(GAME_LIFE_PATH)) {
  fs.readdirSync(GAME_LIFE_PATH).forEach(file => {
    const filePath = path.join(GAME_LIFE_PATH, file);
    if (fs.statSync(filePath).isFile() && file.endsWith('.md')) {
      analyzeGameNote(filePath, GAME_LIFE_PATH);
    }
  });
}

if (fs.existsSync(GAME_KNOWLEDGE_PATH)) {
  fs.readdirSync(GAME_KNOWLEDGE_PATH).forEach(file => {
    const filePath = path.join(GAME_KNOWLEDGE_PATH, file);
    if (fs.statSync(filePath).isFile() && file.endsWith('.md')) {
      analyzeGameNote(filePath, GAME_KNOWLEDGE_PATH);
    }
  });
}

if (fs.existsSync(FOOD_LIFE_PATH)) {
  fs.readdirSync(FOOD_LIFE_PATH).forEach(file => {
    const filePath = path.join(FOOD_LIFE_PATH, file);
    if (fs.statSync(filePath).isFile() && file.endsWith('.md')) {
      analyzeFoodNote(filePath, FOOD_LIFE_PATH);
    }
  });
}

// Display game note moves by category
console.log('============= GAME NOTE CATEGORIES =============');
const gameMap = {};
proposedGameMoves.forEach(m => {
  if (!gameMap[m.category]) gameMap[m.category] = [];
  gameMap[m.category].push(m.fileName);
});
for (const cat in gameMap) {
  console.log(`\n安排 [${cat}] (${gameMap[cat].length} files):`);
  gameMap[cat].forEach(file => console.log(`   - ${file}`));
}

// Display food note moves by category
console.log('\n============= FOOD NOTE CATEGORIES =============');
const foodMap = {};
proposedFoodMoves.forEach(m => {
  if (!foodMap[m.category]) foodMap[m.category] = [];
  foodMap[m.category].push(m.fileName);
});
for (const cat in foodMap) {
  console.log(`\n安排 [${cat}] (${foodMap[cat].length} files):`);
  foodMap[cat].forEach(file => console.log(`   - ${file}`));
}

// Display incomplete files
console.log('\n============= INCOMPLETE FILES REPORT =============');
if (incompleteFiles.length === 0) {
  console.log('No incomplete files detected! 🎉');
} else {
  console.log(`Detected ${incompleteFiles.length} incomplete files:`);
  incompleteFiles.forEach(f => {
    console.log(`⚠️  [INCOMPLETE] ${f.fileName} (Ends with: "${f.lastLine}")`);
  });
}

const isExecute = process.argv.includes('--execute');

if (isExecute) {
  console.log('\n============= EXECUTING MOVES =============');
  const allMoves = [...proposedGameMoves, ...proposedFoodMoves];
  allMoves.forEach(m => {
    if (!fs.existsSync(m.targetDir)) {
      console.log(`Creating directory: ${m.targetDir}`);
      fs.mkdirSync(m.targetDir, { recursive: true });
    }
    console.log(`Moving: ${m.fileName} -> ${path.relative(VAULT_PATH, m.targetPath)}`);
    fs.renameSync(m.source, m.targetPath);
  });
  console.log('All notes organized successfully!');
} else {
  console.log('\nTo execute these moves, run with --execute: node scripts/organize-vault-notes.mjs --execute');
}
