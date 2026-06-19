import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:/Users/Yhx06/Documents/Obsidian Vault';

const paths = {
  // Note 1: Claude Code command center update
  note1Source: path.join(VAULT_ROOT, '00_松果池（收件箱）/B站/技艺录（技术与工具）/2026-06/2026-06-02_把 Obsidian 改造成 Claude Code 指挥中心：终端 + 仪表盘 + 一键技能 - ....md'),
  note1Target: path.join(VAULT_ROOT, '01_藏经阁（知识库）/技艺录（技术与工具）/AI工具与订阅/Claude Code指挥中心：把Obsidian变成AI控制台.md'),
  note1Archive: path.join(VAULT_ROOT, '01_藏经阁（知识库）/archive_raw（原始证据库）/2026-06-02_把 Obsidian 改造成 Claude Code 指挥中心：终端 + 仪表盘 + 一键技能 - P1 video_trimmed.md'),

  // Note 2: Karpathy LLM Wiki
  note2Source: path.join(VAULT_ROOT, '00_松果池（收件箱）/B站/技艺录（技术与工具）/2026-06/2026-06-03_Karpathy大模型知识库心法_b3d482.md'),
  note2Target: path.join(VAULT_ROOT, '01_藏经阁（知识库）/技艺录（技术与工具）/Obsidian/Karpathy大模型知识库：基于编译器的“活体”笔记系统.md'),
  note2Archive: path.join(VAULT_ROOT, '01_藏经阁（知识库）/archive_raw（原始证据库）/2026-06-03_Karpathy大模型知识库心法_b3d482.md'),

  // Note 3: LPL Esports Finals (mismatched)
  note3Source: path.join(VAULT_ROOT, '00_松果池（收件箱）/B站/技艺录（技术与工具）/2026-06/2026-06-01_我是怎么用 remotion + Claude Code 批量生产视频的，希望能给你带来一些启发.md'),
  note3Target: path.join(VAULT_ROOT, '03_生活簿（生活区）/游艺录（游戏与娱乐）/战至伦敦终局：LPL双雄的宿命对决与世界赛出征实录.md'),
  note3Archive: path.join(VAULT_ROOT, '01_藏经阁（知识库）/archive_raw（原始证据库）/2026-06-01_WBG与BLG宿命之战：LPL世界赛伦敦决赛出征纪录_BV1fwRQB5EP8.md')
};

// Check if a directory exists, if not, create it
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

const note2Content = `---
tags:
  - 知识管理
  - 大模型
  - AI工作流
  - Obsidian
url: "https://www.bilibili.com/video/BV1Y3R4BAE33/"
title: "Karpathy大模型知识库：基于编译器的“活体”笔记系统"
date: 2026-06-03
---
# Karpathy大模型知识库：基于编译器的“活体”笔记系统

## 0. 原始资料
- 来源：B站视频《Karpathy大模型知识库心法》
- 原文链接：[https://www.bilibili.com/video/BV1Y3R4BAE33/](https://www.bilibili.com/video/BV1Y3R4BAE33/)
- 本地证据：[[2026-06-03_Karpathy大模型知识库心法_b3d482]]
- 所属领域：技艺录 / Obsidian / 知识管理

## 1. 这条内容在讲什么
这篇文章介绍了前特斯拉 AI 总监 Andrej Karpathy 提出的“LLM Wiki（大模型 Wiki）”个人知识库构建理念。核心思想是**将大模型从“临时咨询的解释器”转变为“持续维护知识的编译器”**。通过白盒的 Markdown 格式与 Git 版本控制，大模型能够自动处理新摄入的原始资料、提取概念、自动建立双向链接，并将高价值的问答自动回填进知识库，实现知识资产的“生长”与“复利”。

## 2. 核心系统架构（三层洞府）
Karpathy 设计的知识库包含清晰的三层结构：
*   **\`raw/\`（只读原矿区）**：存放未加工的原始典籍、网页剪报、ASR 转写、PDF。采取**只读不写**策略，确保一切知识源头可追溯、事实不失真。
*   **\`wiki/\`（结构化编译区）**：由大模型完全管理和写入。大模型将 \`raw/\` 中的碎片知识提炼成概念、实体（人、工具、机构），并自动插入 Obsidian 双向链接（Wikilinks），织成知识经络网。
*   **\`schema.md\`（契约规则）**：定义大模型解读、编译和巡检知识库的具体规范，相当于给知识库管理员（AI Agent）的工作手册。

## 3. 三步知识生长循环

\`\`\`mermaid
graph TD
    A["新素材投入 raw/"] -->|1. 摄入编译| B["大模型解析并更新 wiki/"]
    B -->|2. 自动缝合| C["更新 10~15 个相关概念页面的双链"]
    D["用户查询知识库"] -->|3. 查询回填| E["生成的高质量回答写回 wiki/"]
    F["定期健康检查 lint"] -->|4. 捉虫维护| G["自动修复矛盾/孤立页面"]
\`\`\`

1.  **摄入与强行缝合**：新文章放入 \`raw/\` 后，触发大模型进行分析。大模型不仅生成摘要，还会通读已有 wiki，发现关联点后自动在旧页面中插入引用，杜绝产生孤岛。
2.  **查询与积累回填**：查询不仅是单次对话。问答过程中产生的优质提炼，会由系统自动存回 \`wiki/\` 目录，使知识随使用次数的增加而自我迭代。
3.  **自动化 Lint（健康巡查）**：大模型定期执行自动化检查，扫描整个 Vault，及时发现并标记内容矛盾、信息过时、无引用的孤立页面。

## 4. 传统 RAG 与 LLM Wiki 对比

| 维度 | 传统 RAG (检索增强) | LLM Wiki (编译器模式) |
| :--- | :--- | :--- |
| **角色定位** | 大模型作为**“解释器”**，只负责临时拼凑 | 大模型作为**“编译器”**，负责结构化沉淀 |
| **关联度** | 孤立的块检索，碎片之间缺乏深层逻辑 | 预先构建双向链接网络，呈现整体经络图 |
| **知识复利** | 查完即焚，第 100 篇不会让前 99 篇变聪明 | 问答结果自动回填，知识库随时间持续生长 |
| **可干预度** | 向量库黑盒，逻辑不透明，难于手动纠错 | 白盒 Markdown 文本，结合 Git 随时手动修改 |

## 5. 这件事为什么有意思 / 有什么用
*   **对抗知识腐化**：通过大模型做编译器，新旧知识能自动编织联动，使得收集不再是“收藏即吃灰”。
*   **适合个人开发者与研究者**：不需要架设复杂的向量数据库，仅需使用白盒 Markdown 配合 Git，轻量、安全、可移植。

## 6. 可以沉淀成哪些卡片
*   **概念卡：编译器 vs 解释器知识库**
    *   解释器模式仅在使用时组装上下文；编译器模式在平时就将散落数据梳理编译为高内聚的知识网络。
*   **术语卡：只读 raw 策略**
    *   \`raw/\` 文件夹强制只读，保证大模型在二次编译时有绝对真实的历史基准（Truth Base），不被 AI 幻觉污染。
*   **金句卡**：
    *   "不要让大模型只做临时解卦的算命先生，要让它做能编纂、会关联的藏经阁总管。"
`;

const note3Content = `---
tags:
  - 赛事随记
  - 英雄联盟
  - 电子竞技
  - LPL
url: "https://www.bilibili.com/video/BV1fwRQB5EP8"
title: "战至伦敦终局：LPL双雄的宿命对决与世界赛出征实录"
date: 2026-06-01
---
# 战至伦敦终局：LPL双雄的宿命对决与世界赛出征实录

## 0. 原始资料
- 来源：B站视频《我是怎么用 remotion + Claude Code 批量生产视频的，希望能给你带来一些启发》 (注：原始 ASR 文件名有误，实际内容为 WBG vs BLG 世界赛出征纪录片)
- 原文链接：[https://www.bilibili.com/video/BV1fwRQB5EP8](https://www.bilibili.com/video/BV1fwRQB5EP8)
- 本地证据：[[2026-06-01_WBG与BLG宿命之战：LPL世界赛伦敦决赛出征纪录_BV1fwRQB5EP8]]
- 所属领域：游艺录 / 游戏与娱乐

## 1. 赛事实况记录
这篇笔记记录了英雄联盟 LPL 赛区两大豪门战队——Weibo Gaming (WBG) 与 Bilibili Gaming (BLG) 在世界赛终极对决前夕的纪录片转写。短片回顾了队员们的心路历程、队伍之间相互克制的风格战术、以及倒在决赛舞台上的遗憾和对冠军的终极渴望：
*   **风格克制与挑战**：WBG 队员坦言，自从加入战队以来，在 BO3 和 BO5 中对阵 BLG 经常输掉比赛，对方的打法 and 选手风格在一定程度上存在克制，队伍也为此交了不少学费。
*   **弥补遗憾的渴望**：回顾去年世界赛半决赛失利，队员们表示非常失落和遗憾，每个失误操作画面都历历在目。
*   **证明自己的舞台**：LPL 的冠军、MSI 的荣耀固然耀眼，但在世界总决赛的伦敦舞台上证明自己，才是最渴望的终极目标。
*   **伦敦决赛抗韩集结**：正如选手所言：“我和 Bin 选手都倒在过世界赛决赛的舞台上，所以不管这一次我们谁进入到总决赛，都要让 LPL 的欢呼声响彻伦敦！”

## 2. 现场高光选手金句
*   “自从我加入 WBG 以来，对阵 BLG 的比赛我们吃过很多的苦头。Now begins the age of Billy...”
*   “在很重要的比赛里面相遇，说明我们两支战队都是非常有实力的 LPL 战队。”
*   “去年输掉比赛一瞬间，我觉得 LPL 冠军队伍我远远不够，我还需要一次世界舞台证明自己。”
*   “虽然你们在 LPL 击败了我们无数次，但是最重要的胜利会属于我们。”

## 3. 原文归档
原始 ASR 转写及解说现场台词见本地证据文件：[[2026-06-01_WBG与BLG宿命之战：LPL世界赛伦敦决赛出征纪录_BV1fwRQB5EP8]]。
`;

// Task 1: Update Claude Code command center note
function processNote1() {
  console.log('--- Processing Note 1: Claude Code Command Center ---');
  if (!fs.existsSync(paths.note1Source)) {
    console.error(`Source note 1 not found: ${paths.note1Source}`);
    return;
  }
  if (!fs.existsSync(paths.note1Target)) {
    console.error(`Target note 1 not found: ${paths.note1Target}`);
    return;
  }

  // 1. Read existing target content
  let targetContent = fs.readFileSync(paths.note1Target, 'utf-8');

  // 2. Add raw evidence block if it doesn't already have one
  if (!targetContent.includes('## 0. 原始资料')) {
    const titleLine = targetContent.match(/^# .*/m);
    if (titleLine) {
      const title = titleLine[0];
      const replacement = `${title}\n\n## 0. 原始资料\n- 来源：B站视频《把 Obsidian 改造成 Claude Code 指挥中心：终端 + 仪表盘 + 一键技能》\n- 原文链接：[https://www.bilibili.com/video/BV13LL36dEZJ](https://www.bilibili.com/video/BV13LL36dEZJ)\n- 本地证据：[[2026-06-02_把 Obsidian 改造成 Claude Code 指挥中心：终端 + 仪表盘 + 一键技能 - P1 video_trimmed]]\n- 所属领域：AI 工具与订阅 / 知识管理`;
      targetContent = targetContent.replace(title, replacement);
    }
  }

  fs.writeFileSync(paths.note1Target, targetContent, 'utf-8');
  console.log(`Successfully updated target note with metadata link: ${paths.note1Target}`);

  // 3. Move source to archive_raw
  ensureDir(paths.note1Archive);
  fs.renameSync(paths.note1Source, paths.note1Archive);
  console.log(`Successfully archived original note to: ${paths.note1Archive}`);
}

// Task 2: Process Karpathy LLM Wiki note
function processNote2() {
  console.log('--- Processing Note 2: Karpathy LLM Wiki ---');
  if (!fs.existsSync(paths.note2Source)) {
    console.error(`Source note 2 not found: ${paths.note2Source}`);
    return;
  }

  // 1. Write target expanded file
  ensureDir(paths.note2Target);
  fs.writeFileSync(paths.note2Target, note2Content, 'utf-8');
  console.log(`Successfully written expanded note to: ${paths.note2Target}`);

  // 2. Archive raw file
  ensureDir(paths.note2Archive);
  fs.renameSync(paths.note2Source, paths.note2Archive);
  console.log(`Successfully archived original note to: ${paths.note2Archive}`);
}

// Task 3: Process LPL esports note (correct mismatch)
function processNote3() {
  console.log('--- Processing Note 3: WBG vs BLG esports final ---');
  if (!fs.existsSync(paths.note3Source)) {
    console.error(`Source note 3 not found: ${paths.note3Source}`);
    return;
  }

  // 1. Write target expanded file
  ensureDir(paths.note3Target);
  fs.writeFileSync(paths.note3Target, note3Content, 'utf-8');
  console.log(`Successfully written expanded note to: ${paths.note3Target}`);

  // 2. Read source, update title/metadata, and archive under correct name
  let originalContent = fs.readFileSync(paths.note3Source, 'utf-8');
  originalContent = originalContent.replace(
    'title: "我是怎么用 remotion + Claude Code 批量生产视频的，希望能给你带来一些启发"',
    'title: "WBG与BLG宿命之战：LPL世界赛伦敦决赛出征纪录"'
  );
  originalContent = originalContent.replace(
    '# 我是怎么用 remotion + Claude Code 批量生产视频的，希望能给你带来一些启发',
    '# WBG与BLG宿命之战：LPL世界赛伦敦决赛出征纪录'
  );

  ensureDir(paths.note3Archive);
  fs.writeFileSync(paths.note3Archive, originalContent, 'utf-8');
  fs.unlinkSync(paths.note3Source); // Remove original file from inbox
  console.log(`Successfully archived corrected original note to: ${paths.note3Archive}`);
}

try {
  processNote1();
  processNote2();
  processNote3();
  console.log('Batch processing completed successfully!');
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
