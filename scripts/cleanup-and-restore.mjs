import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:\\Users\\Yhx06\\Documents\\Obsidian Vault';
const FOOD_DIR = path.join(VAULT_ROOT, '03_生活簿（生活区）', '食味录（美食与探店）');
const ARCHIVE_RAW_DIR = path.join(VAULT_ROOT, '01_藏经阁（知识库）', 'archive_raw（原始证据库）');

console.log('🚀 Starting Cleanup and Image Restoration Process...\n');

// Helper to walk directory for Markdown files
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

// ==========================================
// 1. DELETE DUPLICATES IN DISTRICT FOLDERS
// ==========================================
console.log('--- Phase 1: Deleting Duplicate Notes ---');
const duplicates = [
  { dir: '拱墅区', file: '2026-06-01_拱墅江西小炒避世馆.md' },
  { dir: '滨江区', file: '2026-05-31_滨江断层好吃小破店探秘.md' },
  { dir: '钱塘区（下沙）', file: '2026-05-31_下沙女大觅食指南.md' },
  { dir: '钱塘区（下沙）', file: '2026-05-31_下沙私厨觅食手札.md' }
];

duplicates.forEach(({ dir, file }) => {
  const filePath = path.join(FOOD_DIR, dir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted duplicate: ${dir}/${file}`);
    } catch (e) {
      console.error(`❌ Failed to delete duplicate ${dir}/${file}: ${e.message}`);
    }
  } else {
    console.log(`ℹ️ Duplicate already deleted/not found: ${dir}/${file}`);
  }
});
console.log();

// ==========================================
// 2. DELETE 4 TEXT-ONLY FILES & THEIR RAW COPIES
// ==========================================
console.log('--- Phase 2: Deleting 4 Text-Only Notes and Raw Archives ---');
const textOnlyFiles = [
  { styled: '未分类/寻味蚝里蟹：开盲盒与海洋奥秘.md', raw: '2026-05-31_寻味蚝里蟹：开盲盒与海洋奥秘_ac8d80.md' },
  { styled: '未分类/小红书美食宇宙全图鉴：从泡面到米其林的种草指南.md', raw: '2026-06-02_小红书美食防坑与寻味手册_04ed5a.md' },
  { styled: '未分类/上海淮海路探宝：九大宝藏店铺打卡指南.md', raw: '2026-05-29_淮海路闲游探宝手札_53bc06.md' },
  { styled: '未分类/济南烧烤局：老友重聚的烟火气与羊排秘籍.md', raw: '2026-06-01_泉城烧烤悟道录_1cec54.md' }
];

textOnlyFiles.forEach(({ styled, raw }) => {
  const styledPath = path.join(FOOD_DIR, styled);
  const rawPath = path.join(ARCHIVE_RAW_DIR, raw);
  
  if (fs.existsSync(styledPath)) {
    try {
      fs.unlinkSync(styledPath);
      console.log(`✅ Deleted styled text-only guide: ${styled}`);
    } catch (e) {
      console.error(`❌ Failed to delete styled ${styled}: ${e.message}`);
    }
  } else {
    console.log(`ℹ️ Styled text-only guide already deleted: ${styled}`);
  }
  
  if (fs.existsSync(rawPath)) {
    try {
      fs.unlinkSync(rawPath);
      console.log(`✅ Deleted raw archive: ${raw}`);
    } catch (e) {
      console.error(`❌ Failed to delete raw ${raw}: ${e.message}`);
    }
  } else {
    console.log(`ℹ️ Raw archive already deleted: ${raw}`);
  }
});
console.log();

// ==========================================
// 3. STYLE & ARCHIVE UNMATCHED NOTES
// ==========================================
console.log('--- Phase 3: Styling and Renaming Unmatched Notes ---');

// Unmatched Note 1: 浙大小龙虾价格揭秘.md
const xiaoloxiaOldPath = path.join(FOOD_DIR, '西湖区', '2026-05-31_浙大小龙虾价格揭秘.md');
if (fs.existsSync(xiaoloxiaOldPath)) {
  const oldContent = fs.readFileSync(xiaoloxiaOldPath, 'utf-8');
  
  // Save original version to archive_raw
  const rawDestPath = path.join(ARCHIVE_RAW_DIR, '2026-05-31_浙大小龙虾价格揭秘_f34a81.md');
  fs.writeFileSync(rawDestPath, oldContent, 'utf-8');
  console.log('✅ Archived raw version of 浙大小龙虾价格揭秘 to archive_raw');
  
  // Write the new styled version
  const styledDestPath = path.join(FOOD_DIR, '西湖区', '浙大食堂小龙虾烧烤狂欢节：把价格打下来的终极快乐.md');
  const styledContent = `---
title: "浙大食堂小龙虾烧烤狂欢节：把价格打下来的终极快乐"
date: 2026-05-31
tags:
  - 校园美食
  - 浙江大学
  - 龙虾节
  - 探店攻略
type: place
name: "浙大食堂"
city: "杭州"
district: "西湖区"
price: "人均20-30元"
verified: true
---

# 浙大食堂小龙虾烧烤狂欢节：把价格打下来的终极快乐

## 🌟 0. 原始资料
本地证据：[[2026-05-31_浙大小龙虾价格揭秘_f34a81]]

---

🐸 **蛤蟆祥的悄悄话：**

道友道友！小蛤蟆我掐指一算，最近浙大食堂可是出了重磅大招！他们直接把小龙虾的价格给‘打’到了**13.8元/斤**！这价格在外面小摊上连塞牙缝都不够，简直是高校食堂的降维打击福利。不仅有麻辣、蒜蓉、十三香等各种口味，周末去排队的人潮简直比做法会的还要多！如果你有缘能进浙大（或者赶紧找个浙大同学带路），绝对不能错过这场周末限定的小龙虾狂欢！小蛤蟆在池边听着，哈喇子都已经流了一地了……🐸✨

---

## 🏆 推荐座次
- 🥇 **超级必点 (金杯)**：油焖小龙虾（6元/份，极其入味！）、咸蛋黄薯片小龙虾（极其新颖，6元/份）。
- 🥈 **值得尝鲜 (银杯)**：小龙虾锅贴（3元/个，外酥里嫩，满口虾香）、小龙虾杯杯面（7元/份，碳水解馋首选）。
- 🥉 **谨慎避坑 (铜杯)**：臭豆腐小龙虾火锅杯（15元，口味混合后有些奇怪，猎奇党可试，普通人避坑！）。

---

## 🍲 招牌心动卡

| 推荐单品 | 推荐指数 | 口味画像 | 蛤蟆祥的体验 |
| :--- | :---: | :--- | :--- |
| **咸蛋黄薯片小龙虾** | 🥇 金杯 | 沙感浓郁、香脆、虾肉弹牙 | 蛋黄裹得很均匀，搭配薯片的香脆，口感层次非常丰富！ |
| **小龙虾锅贴** | 🥈 银杯 | 焦脆、辣鲜、多汁 | 锅贴底煎得金黄酥脆，咬开里面满满的小龙虾肉 and 汤汁，很赞。 |
| **臭豆腐小龙虾火锅杯** | 🥉 铜杯 | 臭豆腐香、汤汁咸、微腥 | 臭豆腐和小龙虾的奇妙组合，但感觉汤汁有点偏咸，海鲜和豆腐味道有点打架。 |

---

## 🖼️ 图集手札

![辣卤小龙虾|白色碗里的辣卤小龙虾，配上金黄的蒜瓣和浓郁的卤汁，看着就让人食指大动](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_0.jpg)

![麻辣烫大杯|满满一大杯麻辣烫，里面有大只的小龙虾、Q弹的丸子和吸饱汤汁的豆干，十分满足](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_1.jpg)

![食堂充电站门口|浙大食堂外人山人海，人群早早就聚集在食堂门口排起长龙](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_2.jpg)

![排队长龙与横幅|挂着“食在浙大·小龙虾烧烤狂欢节”横幅的摊位前挤满了人，烤串的香气铺鼻而来](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_3.jpg)

![金黄烤肉串|金黄油亮、撒满孜然和辣椒面发亮的烤肉串与烤土豆串，火候拿捏得非常到位](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_4.jpg)

![集市小吃摊|热闹的小吃摊位，售卖着龙虾杯杯面、碳烤鱿鱼须和臭豆腐小龙虾火锅杯等新奇吃法](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_5.jpg)

![烧烤节菜单A|活动现场菜单立牌：炸大大串18元，椒盐龙虾尾5元，薄荷之夏饮品6元](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_6.jpg)

![小龙虾菜单B|招牌麻辣、泡椒、茶香小龙虾只要6元一份，还有香喷喷的烤包子与馕饼](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_7.jpg)

![小龙虾菜单C|油焖和干菜小龙虾均售6元，再配上一贴冷盘卤花生和炝拌毛豆，下酒绝配](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_8.jpg)

![饮品菜单D|解辣救星！各种温润的西柚汁、芒果汁、蓝莓汁，特惠尝鲜只要6元](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_9.jpg)

![特色菜单E|咸蛋黄薯片小龙虾6元，飘香鸡架3元，小龙虾火鸡面10元，物美价廉](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_10.jpg)

![特色菜单F|经典辣卤小龙虾6元，小龙虾锅贴3元，还有冰凉解渴的凤梨菠萝冰](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_11.jpg)

![火锅杯菜单G|臭豆腐小龙虾火锅杯15元，小龙虾杯杯面7元，烤鱿鱼串6元](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_12.jpg)

![外卖面条|打包出来的喜乐蒸面，配有饱满的香肠和蟹钳，酱汁拌面非常好吃](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_13.jpg)

![狂欢节餐桌|满满一桌的美食！有啤酒、小酥肉、多款小龙虾，三五好友聚会畅饮简直美哉](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/西湖区/2026-05-31_浙大小龙虾价格揭秘_14.jpg)

---

## 👣 避坑与出行红尘账
| 项目 | 详情 |
| :--- | :--- |
| **红尘账目** | 单道菜品6-15元，人均20-30元即可大快朵颐。 |
| **排队预警** | 周末排队长龙可达百米，建议下午17:00前或19:30后错峰前往。 |
| **交通指南** | 浙江大学食堂，地铁5号线直达，外校人员需关注学校预约政策。 |
`;
  fs.writeFileSync(styledDestPath, styledContent, 'utf-8');
  fs.unlinkSync(xiaoloxiaOldPath);
  console.log('✅ Created styled version and deleted old timestamp file for 浙大小龙虾价格揭秘');
}

// Unmatched Note 2: 下沙的巨！！！大！！！麻糍.md
const maciOldPath = path.join(FOOD_DIR, '钱塘区（下沙）', '2026-06-01_下沙的巨！！！大！！！麻糍.md');
if (fs.existsSync(maciOldPath)) {
  const oldContent = fs.readFileSync(maciOldPath, 'utf-8');
  
  // Archive raw version
  const rawDestPath = path.join(ARCHIVE_RAW_DIR, '2026-06-01_下沙的巨大麻糍_d537f2.md');
  fs.writeFileSync(rawDestPath, oldContent, 'utf-8');
  console.log('✅ Archived raw version of 下沙的巨大麻糍 to archive_raw');
  
  // Write the new styled version
  const styledDestPath = path.join(FOOD_DIR, '钱塘区（下沙）', '下沙巨无霸双拼麻糍：15元吃到撑的糯叽叽天花板.md');
  const styledContent = `---
title: "下沙巨无霸双拼麻糍：15元吃到撑的糯叽叽天花板"
date: 2026-06-01
tags:
  - 下沙美食
  - 糯叽叽
  - 麻糍
  - 性价比
type: place
name: "双拼麻糍"
city: "杭州"
district: "钱塘区（下沙）"
price: "15元/人"
verified: true
---

# 下沙巨无霸双拼麻糍：15元吃到撑的糯叽叽天花板

## 🌟 0. 原始资料
本地证据：[[2026-06-01_下沙的巨大麻糍_d537f2]]

---

🐸 **蛤蟆祥的悄悄话：**

道友道友！快来看看我今天在下沙淘到的糯叽叽神物！只要15块钱，就能拿到一个比拳头还要大出好多、沉甸甸的巨无霸双拼麻糍，真是一口下去就顶饱了。麻糍表面裹满了香浓的巧克力碎和焦糖饼干碎，咬开里面是拉丝又软糯的麻糍皮，甜而不腻，简直是下沙糯叽叽爱好者的修仙天花板！

---

## 🏆 推荐座次
- 🥇 **超级必点 (金杯)**：巧克力焦糖饼干双拼麻糍（分量极大，糯米星人闭眼入！）。

---

## 🖼️ 图集手札

![巧克力饼干碎麻糍|裹满巧克力和焦糖饼干碎的巨无霸麻糍，个头非常大，拿在手里沉甸甸的](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/钱塘区（下沙）/2026-06-01_下沙的巨！！！大！！！麻糍_0.jpg)

![蛋黄酥脆麻糍|表面撒满金黄酥脆碎屑的双拼麻糍，外皮极其软糯，香甜诱人](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/钱塘区（下沙）/2026-06-01_下沙的巨！！！大！！！麻糍_1.jpg)

---

## 👣 避坑与出行红尘账
| 项目 | 详情 |
| :--- | :--- |
| **红尘账目** | 15元一个，分量十足，非常抗饿。 |
| **排队预警** | 下午3-5点下午茶时间人较多，建议错峰购买。 |
| **交通指南** | 下沙高沙小区周边小摊或商铺，地铁1号线高沙路站步行可达。 |
`;
  fs.writeFileSync(styledDestPath, styledContent, 'utf-8');
  fs.unlinkSync(maciOldPath);
  console.log('✅ Created styled version and deleted old timestamp file for 下沙巨大麻糍');
}

// Unmatched Note 3: 科艺美食第三弹.md
const keyiOldPath = path.join(FOOD_DIR, '钱塘区（下沙）', '2026-06-01_科艺美食第三弹.md');
if (fs.existsSync(keyiOldPath)) {
  const oldContent = fs.readFileSync(keyiOldPath, 'utf-8');
  
  // Archive raw version
  const rawDestPath = path.join(ARCHIVE_RAW_DIR, '2026-06-01_科艺美食第三弹_c27df9.md');
  fs.writeFileSync(rawDestPath, oldContent, 'utf-8');
  console.log('✅ Archived raw version of 科艺美食第三弹 to archive_raw');
  
  // Write styled version
  const styledDestPath = path.join(FOOD_DIR, '钱塘区（下沙）', '金华科艺校外外卖大测评：避坑鸭腿饭与吹爆糯米饭.md');
  const styledContent = `---
title: "金华科艺校外外卖大测评：避坑鸭腿饭与吹爆糯米饭"
date: 2026-06-01
tags:
  - 校园美食
  - 外卖测评
  - 避坑指南
  - 浙江理工大学科艺学院
type: guide
name: "科艺校外外卖"
city: "金华"
district: "婺城区"
price: "人均15元"
verified: true
---

# 金华科艺校外外卖大测评：避坑鸭腿饭与吹爆糯米饭

## 🌟 0. 原始资料
本地证据：[[2026-06-01_科艺美食第三弹_c27df9]]

---

🐸 **蛤蟆祥的悄悄话：**

道友！今天我帮你搜集了浙江理工大学科技与艺术学院校外的一波外卖大测评。小蛤蟆我把大家的吃货评价整理了一下，这几款外卖可以说是悲喜交加：贵州糯米饭惊艳全场，口感香糯入味；炒河粉锅气十足、辣得过瘾；但那个鸭腿饭酱汁偏甜容易发腻，干锅鸭里的鸭肉表现也平平无奇，快来看看怎么避坑点外卖吧！

---

## 🏆 推荐座次
- 🥇 **超级必点 (金杯)**：贵州糯米饭（香辣入味，糯米非常软糯，超级好吃！）、辣炒河粉（锅气足，辣辣的很开胃）。
- 🥈 **值得尝鲜 (银杯)**：校外特调卷饼（饼皮很香，只是稍微有一点点油）。
- 🥉 **谨慎避坑 (铜杯)**：鸭腿饭（酱汁甜度太高，吃两口就觉得发腻）、干锅鸭（配菜还可以，但鸭肉偏咸偏干，骨头多）。

---

## 🍲 招牌心动卡

| 外卖单品 | 推荐指数 | 口味画像 | 蛤蟆祥的体验反馈 |
| :--- | :---: | :--- | :--- |
| **贵州糯米饭** | 🥇 金杯 | 香糯、香辣、多配料 | 配料扎实，辣味渗透糯米，强烈推荐！ |
| **辣炒河粉** | 🥇 金杯 | 锅气、鲜辣、油润 | 火候很好，辣辣的很过瘾，吃完非常解馋。 |
| **鸭腿饭** | 🥉 铜杯 | 偏甜、油腻、易腻口 | 调味偏甜，鸭腿处理有些一般，吃多了容易发腻。 |
| **干锅鸭** | 🥉 铜杯 | 咸干、骨头多、酱重 | 鸭肉有点柴且咸，配菜（如土豆条）反而比鸭肉好吃。 |

---

## 🖼️ 图集手札

![外卖全家福|校外点来的多份外卖合照，有卷饼、糯米饭、炒河粉等，品类非常丰富](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/钱塘区（下沙）/2026-06-01_科艺美食第三弹_0.jpg)

![外卖包装|包装精美的外卖饭盒，热气腾腾，分量很足](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/钱塘区（下沙）/2026-06-01_科艺美食第三弹_1.jpg)

![外卖大盘点|展示了鸭腿饭、糯米饭、炒河粉和干锅鸭等菜品，并附带了吃货的真实避坑吐槽](../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/钱塘区（下沙）/2026-06-01_科艺美食第三弹_2.jpg)

---

## 👣 避坑与出行红尘账
| 项目 | 详情 |
| :--- | :--- |
| **红尘账目** | 单份外卖在10-20元之间，人均15元能吃得很饱。 |
| **避坑预警** | 口味偏清淡或者不喜欢太甜的道友一定要避开鸭腿饭！ |
| **坐标定位** | 针对金华婺城区科艺校外外卖商铺，外卖平台点单即可。 |
`;
  fs.writeFileSync(styledDestPath, styledContent, 'utf-8');
  fs.unlinkSync(keyiOldPath);
  console.log('✅ Created styled version and deleted old timestamp file for 科艺美食第三弹');
}
console.log();

// ==========================================
// 4. RESTORE MISSING IMAGES IN STYLED NOTES
// ==========================================
console.log('--- Phase 4: Automatically Restoring Missing Images ---');

// Parse a raw note file to extract image-caption structures
function parseRawNoteImages(rawFilePath) {
  if (!fs.existsSync(rawFilePath)) return [];
  const content = fs.readFileSync(rawFilePath, 'utf-8');
  const images = [];
  
  // Find all standard and obsidian image tags
  const obsRegex = /!\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g;
  const stdRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  // Capture blocks
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
      // Find following callout lines
      let descriptionLines = [];
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().startsWith('>') || lines[j].trim() === '')) {
        if (lines[j].trim().startsWith('>')) {
          descriptionLines.push(lines[j].trim());
        }
        j++;
      }
      
      // Clean description
      let fullDesc = descriptionLines
        .map(l => l.replace(/^>\s*/, '').trim())
        .filter(l => l !== '')
        .join(' ');
      
      // Clean up headers and keys
      fullDesc = fullDesc
        .replace(/#+\s*/g, '') // Strip Markdown heading hashes (e.g. ###, ##)
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
        
      // Extract a clean title (often bold or before punctuation)
      let title = '美食影像';
      let desc = fullDesc;
      
      // Try to find if there is a list of text from which we can extract title
      // E.g., if desc contains a title at the start
      const firstBold = fullDesc.match(/^\*\*(.*?)\*\*/);
      if (firstBold) {
        title = firstBold[1].replace(/[:：]/g, '').trim();
        desc = fullDesc.replace(/^\*\*(.*?)\*\*\s*[:：]?\s*/, '').trim();
      } else {
        // Try to match the first short sentence or label
        const firstSegment = fullDesc.split(/[。；;|]/)[0];
        if (firstSegment.length > 2 && firstSegment.length <= 15 && !firstSegment.includes('这是')) {
          title = firstSegment.trim();
        } else {
          // Look for words
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

// Process styled notes and restore missing images
let restoredCount = 0;
walkDir(FOOD_DIR, (filePath) => {
  const name = path.basename(filePath);
  if (/^\d{4}-\d{2}-\d{2}_/.test(name)) return; // skip old/raw files in food dir
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const evidenceMatch = content.match(/本地证据：\[\[(.*?)\]\]/) || content.match(/\[\[(202\d-\d{2}-\d{2}_.*?)\]\]/);
  
  if (evidenceMatch) {
    const rawRef = evidenceMatch[1].trim();
    const rawFilePath = path.join(ARCHIVE_RAW_DIR, `${rawRef}.md`);
    
    if (fs.existsSync(rawFilePath)) {
      const rawImages = parseRawNoteImages(rawFilePath);
      if (rawImages.length === 0) return;
      
      const district = path.basename(path.dirname(filePath));
      const districtRelativePath = `../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/${district}/${name.slice(0, -3)}`; // fallback
      
      // We will completely reconstruct the ## 🖼️ 图集手札 section with ALL images from the raw note
      console.log(`🔍 Processing styled note: ${path.relative(FOOD_DIR, filePath)} (Found ${rawImages.length} images in raw archive)`);
      
      const imageLines = rawImages.map(img => {
        // Construct the correct relative attachment path
        let relativeImagePath = `../../../attachments/03_生活簿（生活区）/食味录（美食与探店）/`;
        if (district === '未分类') {
          relativeImagePath += `未分类/${img.file}`;
        } else {
          relativeImagePath += `${district}/${img.file}`;
        }
        
        // Clean title and description
        const title = img.title.replace(/[|\[\]()]/g, '').trim() || '美味探索';
        const desc = img.desc.replace(/[|\[\]()]/g, '').trim() || '美味推荐';
        
        return `![${title}|${desc}](${relativeImagePath})`;
      }).join('\n\n');
      
      const newGallerySection = `## 🖼️ 图集手札\n\n${imageLines}\n\n`;
      
      // Replace existing ## 🖼️ 图集手札 section or append if missing
      // Also match and remove any HTML carousel code blocks
      const carouselRegex = /<div class="obsidian-carousel"[\s\S]*?<\/div>\s*(?:<div style="text-align: center;[\s\S]*?<\/div>)?/g;
      let newContent = content.replace(carouselRegex, '').trim();
      
      const galleryRegex = /## 🖼️ 图集手札[\s\S]*?(?=\n##\s|$)/;
      if (galleryRegex.test(newContent)) {
        newContent = newContent.replace(galleryRegex, () => newGallerySection);
      } else {
        // Insert before the last section (typically ## 👣 避坑与出行红尘账 or similar)
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
      newContent = newContent.replace(/\n{3,}/g, '\n\n');
      
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`   ✅ Restored and formatted ${rawImages.length} images under standard markdown syntax.`);
      restoredCount++;
    }
  }
});

console.log(`\n🎉 Process Complete! Cleaned duplicates, deleted text-only files, styled unmatched notes, and updated/restored images for ${restoredCount} styled food notes.`);
