import fs from 'fs';
import path from 'path';

const VAULT_PATH = 'C:/Users/Yhx06/Documents/Obsidian Vault';

const moves = [
  {
    src: path.join(VAULT_PATH, '01_藏经阁（知识库）/博物志（见闻与科普）/影音与艺术/游戏与娱乐/王者荣耀新赛季神装强度天梯.md'),
    dest: path.join(VAULT_PATH, '03_生活簿（生活区）/游艺录（游戏与娱乐）/英雄联盟与电竞/王者荣耀新赛季神装强度天梯.md')
  },
  {
    src: path.join(VAULT_PATH, '01_藏经阁（知识库）/博物志（见闻与科普）/影音与艺术/《非法正义》无限解说第一期：青年创作者成长计划.md'),
    dest: path.join(VAULT_PATH, '03_生活簿（生活区）/映卷录（影视与动漫）/《非法正义》无限解说第一期：青年创作者成长计划.md')
  },
  {
    src: path.join(VAULT_PATH, '01_藏经阁（知识库）/博物志（见闻与科普）/影音与艺术/蛤蟆祥的AI动漫修行札记：《雷云与青烟》.md'),
    dest: path.join(VAULT_PATH, '03_生活簿（生活区）/映卷录（影视与动漫）/蛤蟆祥的AI动漫修行札记：《雷云与青烟》.md')
  },
  {
    src: path.join(VAULT_PATH, '01_藏经阁（知识库）/博物志（见闻与科普）/影音与艺术/邪恶莫蒂：逆袭心法.md'),
    dest: path.join(VAULT_PATH, '03_生活簿（生活区）/映卷录（影视与动漫）/邪恶莫蒂：逆袭心法.md')
  },
  {
    src: path.join(VAULT_PATH, '01_藏经阁（知识库）/博物志（见闻与科普）/影音与艺术/铁血战士：死亡星的生存之道.md'),
    dest: path.join(VAULT_PATH, '03_生活簿（生活区）/映卷录（影视与动漫）/铁血战士：死亡星的生存之道.md')
  }
];

console.log('=== Starting Note Migration ===');
let movedCount = 0;

for (const m of moves) {
  if (fs.existsSync(m.src)) {
    const destDir = path.dirname(m.dest);
    if (!fs.existsSync(destDir)) {
      console.log(`Creating directory: ${destDir}`);
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    console.log(`Moving:\n  From: ${m.src}\n  To:   ${m.dest}`);
    fs.renameSync(m.src, m.dest);
    movedCount++;
  } else {
    console.warn(`Warning: Source file does not exist: ${m.src}`);
  }
}

console.log(`Moved ${movedCount} files.`);

// Cleanup empty directory: 01_藏经阁（知识库）/博物志（见闻与科普）/影音与艺术/游戏与娱乐
const emptyDirPath = path.join(VAULT_PATH, '01_藏经阁（知识库）/博物志（见闻与科普）/影音与艺术/游戏与娱乐');
if (fs.existsSync(emptyDirPath)) {
  const files = fs.readdirSync(emptyDirPath);
  if (files.length === 0) {
    console.log(`Removing empty directory: ${emptyDirPath}`);
    fs.rmdirSync(emptyDirPath);
  } else {
    console.warn(`Warning: Directory is not empty, skipping removal: ${emptyDirPath}`);
  }
}

console.log('=== Migration Complete ===');
