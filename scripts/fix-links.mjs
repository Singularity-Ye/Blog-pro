import fs from 'fs';
import path from 'path';

const VAULT_PATH = 'C:/Users/Yhx06/Documents/Obsidian Vault';
const ARCHIVE_RAW_PATH = path.join(VAULT_PATH, '01_藏经阁（知识库）/archive_raw（原始证据库）');

console.log('=== Phase 1: Renaming no-ext files in archive_raw ===');

if (fs.existsSync(ARCHIVE_RAW_PATH)) {
  const files = fs.readdirSync(ARCHIVE_RAW_PATH);
  let renameCount = 0;

  for (const file of files) {
    const fullPath = path.join(ARCHIVE_RAW_PATH, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && !file.includes('.')) {
      const newName = `${file}.md`;
      const newFullPath = path.join(ARCHIVE_RAW_PATH, newName);
      
      console.log(`Renaming: "${file}" -> "${newName}"`);
      fs.renameSync(fullPath, newFullPath);
      renameCount++;
    }
  }
  console.log(`Successfully renamed ${renameCount} files.`);
} else {
  console.error(`Error: archive_raw path does not exist at ${ARCHIVE_RAW_PATH}`);
}

console.log('\n=== Phase 2: Fixing links in target notes ===');

const noteFixes = [
  {
    filePath: path.join(VAULT_PATH, '01_藏经阁（知识库）/游艺录（游戏与娱乐）/小说与文字游艺/穿越纵横蛊界，呐喊：不懂啊，你们真是什么也不懂。.md'),
    replacements: [
      {
        target: '[[穿越纵横蛊界，呐喊：“不懂啊，你们真是什么也不懂”。8779ef]]',
        replacement: '[[2026-06-01_穿越纵横蛊界，呐喊：不懂啊，你们真是什么也不懂。8779ef]]'
      }
    ]
  },
  {
    filePath: path.join(VAULT_PATH, '03_生活簿（生活区）/食味录（美食与探店）/未分类/懒人减脂福音：九道蒸菜一键出锅术.md'),
    replacements: [
      {
        target: '[[2026-05-30_蛤蟆祥参悟·九蒸减脂膳_a9306d]]',
        replacement: '[[2026-05-30_懒人减脂福音_九道蒸菜一键出锅术_a9306d]]'
      }
    ]
  },
  {
    filePath: path.join(VAULT_PATH, '03_生活簿（生活区）/食味录（美食与探店）/未分类/淮海路探宝：九大宝藏店铺打卡指南.md'),
    replacements: [
      {
        target: '[[2026-05-28_上海老街新玩法_1a2b3c]]',
        replacement: '[[2026-05-29_上海淮海路秘境探店手札_cc16ca]]'
      }
    ]
  },
  {
    filePath: path.join(VAULT_PATH, '03_生活簿（生活区）/食味录（美食与探店）/西湖区/杭州甜品节：鳗鱼塔可与蓝莓三明治的甜蜜冒险.md'),
    replacements: [
      {
        target: '[[2026-06-01_甜品节逛吃小札_369ecb]]',
        replacement: '[[2026-06-01_杭州甜品节美食攻略_369ecb]]'
      }
    ]
  }
];

let fixCount = 0;
for (const fix of noteFixes) {
  if (fs.existsSync(fix.filePath)) {
    let content = fs.readFileSync(fix.filePath, 'utf-8');
    let modified = false;

    for (const rep of fix.replacements) {
      if (content.includes(rep.target)) {
        content = content.replace(rep.target, rep.replacement);
        modified = true;
        console.log(`Fixed link in "${path.basename(fix.filePath)}": "${rep.target}" -> "${rep.replacement}"`);
      }
    }

    if (modified) {
      fs.writeFileSync(fix.filePath, content, 'utf-8');
      fixCount++;
    } else {
      console.log(`No matching link to fix in "${path.basename(fix.filePath)}". It might already be fixed.`);
    }
  } else {
    console.error(`Error: target note does not exist at ${fix.filePath}`);
  }
}

console.log(`Successfully updated links in ${fixCount} notes.`);
console.log('=== Fix Complete ===');
