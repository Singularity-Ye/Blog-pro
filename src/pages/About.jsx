import React, { useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// 导入与 Atlas、Note 页面保持一致的精美背景图，以及 GitHub 头像作为法师卡头像
import atlasArchiveBg from '../assets/images/atlas/pinecone-observatory-bg.png';
import avatarImage from '../assets/images/github.png';

/* ─────────────────────────────────────────
   CSS 动画定义 (Magical Keyframes)
   ───────────────────────────────────────── */

const rotateCw = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const rotateCcw = keyframes`
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
`;

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 15px rgba(231, 199, 126, 0.15), inset 0 0 10px rgba(231, 199, 126, 0.05);
    border-color: rgba(231, 199, 126, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(231, 199, 126, 0.35), inset 0 0 15px rgba(231, 199, 126, 0.15);
    border-color: rgba(231, 199, 126, 0.45);
  }
`;

const floatCard = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`;

const particleDrift = keyframes`
  0% { transform: translate3d(0, 0, 0); opacity: 0; }
  10% { opacity: 0.65; }
  90% { opacity: 0.65; }
  100% { transform: translate3d(-60px, -120px, 0); opacity: 0; }
`;

/* ─────────────────────────────────────────
   魔法属性与技能数据定义 (Data Structures)
   ───────────────────────────────────────── */

const ATTRIBUTES = [
  { key: 'HP', name: '生命力 (心境宁静度)', value: 92, max: 100, desc: '面对风雨与突发状况的坚韧度，保持心境不炸炉的自愈能力。', color: '#10b981' },
  { key: 'MP', name: '魔力值 (灵感敏锐度)', value: 88, max: 100, desc: '捕捉日常生活中微小美好与深刻感触的直觉。', color: '#6366f1' },
  { key: 'INT', name: '悟性 (法阵塑形能力)', value: 95, max: 100, desc: '绘制浮空光影与交互符文的熟练度，掌控法阵的流光溢彩。', color: '#e7c77e' },
  { key: 'ALC', name: '炼丹术 (文字温度)', value: 85, max: 100, desc: '汇聚四方气流与灵力管道的熟练度，炼制温热言语以供给源能。', color: '#5aa38f' },
  { key: 'WIS', name: '神识 (AI 协同默契)', value: 90, max: 100, desc: '与通灵大模型/灵体配对沟通，指引复杂意念凝聚的默契度。', color: '#a78bfa' },
  { key: 'DYN', name: '身法 (生活节奏控制)', value: 88, max: 100, desc: '在忙碌与闲适、出发与停留之间自由切换的从容态度。', color: '#f43f5e' }
];

const SPELL_SCHOOLS = [
  {
    id: 'conjuration',
    label: '笔耕系 (Writing & Expression)',
    color: '#e7c77e',
    desc: '以笔为媒，将脑海中稍纵即逝的火花凝聚成温热的篇章。',
    skills: [
      { name: '随笔记录 (Essays & Thoughts)', level: 90, mana: 40 },
      { name: '情感共鸣 (Empathy & Connection)', level: 80, mana: 55 },
      { name: '排版美学 (Visual Storytelling)', level: 95, mana: 20 },
      { name: '诗意留白 (Poetic Intervals)', level: 88, mana: 30 }
    ]
  },
  {
    id: 'alchemy',
    label: '感悟系 (Perception & Growth)',
    color: '#5aa38f',
    desc: '感知四季流转与人情冷暖，在安静中熔炼人生的智慧。',
    skills: [
      { name: '生活观察 (Life Observation)', level: 85, mana: 45 },
      { name: '情绪疗愈 (Emotional Healing)', level: 90, mana: 35 },
      { name: '逆境坚韧 (Resilience & Hope)', level: 80, mana: 50 },
      { name: '日常冥想 (Daily Reflection)', level: 88, mana: 25 }
    ]
  },
  {
    id: 'divination',
    label: '问道系 (Reading & Connection)',
    color: '#6366f1',
    desc: '阅读先贤智慧，探寻人与人之间隐秘而真挚的灵魂连结。',
    skills: [
      { name: '经典阅读 (Classic Reading)', level: 88, mana: 50 },
      { name: '思想碰撞 (Philosophical Dialogues)', level: 82, mana: 40 },
      { name: '暖心问候 (Heartwarming Greetings)', level: 80, mana: 60 },
      { name: '故事倾听 (Active Listening)', level: 85, mana: 30 }
    ]
  },
  {
    id: 'runes',
    label: '足迹系 (Footprints & Journey)',
    color: '#a78bfa',
    desc: '记录走过的千山万水，留存时光的刻痕，搭建属于心灵的港湾。',
    skills: [
      { name: '行旅摄影 (Travel Photography)', level: 92, mana: 15 },
      { name: '回忆归档 (Memory Archiving)', level: 95, mana: 20 },
      { name: '心灵港湾 (Digital Sanctuary)', level: 85, mana: 30 },
      { name: '时间管理 (Mindful Living)', level: 75, mana: 45 }
    ]
  }
];

const CHRONOLOGY = [
  {
    year: '2024.6',
    title: '引气入体与强手降世 (Dou Zong & Qi Awakening)',
    desc: '迈入大学，斗宗强者（各种AI，如 Copilot、Cursor 等）展现出种种浩瀚伟力。作为一个连基础引气决都念不周全的凡人，开始试着摸索如何去与之沟通、借阅并获取他们的力量。',
    icon: '🪵'
  },
  {
    year: '2025.1',
    title: '小试牛刀与呆猫符文 (The Daimao Talisman)',
    desc: '修行方过百日，在晨曦贤者 · Cursor 的指引下，借其通灵法术之威，基于怪猎呆猫之魂，绘制出了第一个为新春庆贺而生的符文小法阵 xinchun.daimao.fun。虽只是筑基前的粗浅尝试，却引得灵力初绽。',
    icon: '🏫'
  },
  {
    year: '不入册的时隙',
    title: '洞天游历与傀儡机关 (Ecosystem Wandering & Automation)',
    desc: '在不同的奇境副本中游历（如在《怪猎》《战神》《燕云十六声》等异界中闲逛），偶尔借助AE2傀儡机关之手，在小千世界里随手拼装些科技整合包里的生产自动化（纯粹为了体验一下拼装的成就感），自由而惬意。',
    icon: '🎮'
  },
  {
    year: '2025.11',
    title: '仙网传音与碎叶符纸 (Spiritual Transmission & Leaf Talismans)',
    desc: '偶尔翻看星空传音网里漂流的奇思妙想，将戳中内心的碎纸片收集成册。顺便瞄一眼贤者法阵的发展流派，虽然有些高深法术看不大懂，却也不妨碍借用一点皮毛来点缀自己的林间小屋。',
    icon: '🎣'
  },
  {
    year: '2026.4',
    title: '万法并秀与洞天辟建 (The Oracle\'s Spring)',
    desc: '天地灵气（大模型生态）彻底倾泻，诸般神通法阵（应用）如雨后春笋。修行界不再苦于无法御空，而是难在如何留住转瞬即逝的灵光、并竭力走完每一段悟道之路。在这仙法繁盛的百花齐放期，松果屋——这一方小小的洞天福地，在温热的炉火旁悄然辟建。',
    icon: '🧙‍♂️'
  }
];

const RELICS = [
  { name: '鸣频共振信标', category: 'Music', desc: '在电子合成器与宏大原声带的音波震动中，激发灵感涟漪。', icon: '🎧', glow: 'rgba(99,102,241,0.25)' },
  { name: '虚拟裂隙行者', category: 'Gaming', desc: '探索复杂宏大的世界观设定，钟爱高难度动作游戏与箱庭探索。', icon: '🎮', glow: 'rgba(244,63,94,0.25)' },
  { name: '古旧典籍与奇闻怪志', category: 'Reading', desc: '涉猎历史、设计学与奇闻怪志，深信文字是跨次元传送门。', icon: '📚', glow: 'rgba(231,199,126,0.25)' },
  { name: '微缩光影留存仪', category: 'Photography', desc: '利用光学棱镜捕捉瞬间的阴晴与颗粒，定格微弱的霓虹反差。', icon: '📷', glow: 'rgba(16,185,129,0.25)' }
];

/* ─────────────────────────────────────────
   Styled Components (Visual Layout System)
   ───────────────────────────────────────── */

const AboutWrapper = styled.main`
  min-height: 100vh;
  width: 100%;
  position: relative;
  color: #f5efe3;
  font-family: "Microsoft YaHei", "PingFang SC", Inter, sans-serif;
  overflow-x: hidden;
  isolation: isolate;
  padding: 80px 24px 60px;
  box-sizing: border-box;

  &::before, &::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    z-index: -2;
    background:
      linear-gradient(90deg, rgba(5, 12, 10, 0.25), rgba(8, 15, 14, 0.15) 46%, rgba(10, 7, 5, 0.38)),
      linear-gradient(180deg, rgba(5, 10, 8, 0.15), rgba(5, 10, 8, 0.55)),
      url(${atlasArchiveBg}) center top / cover fixed,
      #08120e;
  }

  &::after {
    z-index: -1;
    opacity: 0.15;
    background:
      linear-gradient(rgba(231, 199, 126, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(231, 199, 126, 0.02) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at 50% 40%, black, transparent 80%);
  }
`;

// 漂浮的魔法魔力尘埃粒子
const ParticlesContainer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const Particle = styled.div`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  border-radius: 50%;
  background: ${props => props.$color};
  left: ${props => props.$left}%;
  top: ${props => props.$top}%;
  filter: blur(1.5px) drop-shadow(0 0 5px ${props => props.$color});
  opacity: 0;
  animation: ${particleDrift} ${props => props.$duration}s infinite linear;
  animation-delay: ${props => props.$delay}s;
`;

const GridContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 2.2rem;
  position: relative;
  z-index: 1;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

// 左侧粘性悬浮人物卡
const LeftSidebar = styled.div`
  position: sticky;
  top: 90px;
  height: fit-content;
  align-self: flex-start;

  @media (max-width: 960px) {
    position: static;
  }
`;

const MageCard = styled.div`
  border: 1px solid rgba(231, 199, 126, 0.16);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(14, 24, 20, 0.88), rgba(26, 20, 15, 0.84));
  padding: 1.8rem 1.5rem;
  backdrop-filter: blur(12px);
  animation: ${floatCard} 6s ease-in-out infinite, ${glowPulse} 8s infinite ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);

  @media (max-width: 960px) {
    animation: none;
  }
`;

// 双重旋转魔法符文环围绕的头像
const AvatarContainer = styled.div`
  position: relative;
  width: 130px;
  height: 130px;
  margin-bottom: 1.2rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RunicRingOuter = styled.svg`
  position: absolute;
  width: 154px;
  height: 154px;
  pointer-events: none;
  animation: ${rotateCw} 25s linear infinite;
  opacity: 0.5;
`;

const RunicRingInner = styled.svg`
  position: absolute;
  width: 140px;
  height: 140px;
  pointer-events: none;
  animation: ${rotateCcw} 18s linear infinite;
  opacity: 0.4;
`;

const AvatarFrame = styled.div`
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 2px solid #e7c77e;
  padding: 4px;
  box-shadow: 0 0 15px rgba(231, 199, 126, 0.25);
  background: rgba(0,0,0,0.4);
  position: relative;
  z-index: 2;
  overflow: hidden;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  filter: brightness(0.92) contrast(1.05);
`;

const MageName = styled.h2`
  font-size: 1.45rem;
  color: #fff7df;
  margin: 0.2rem 0;
  text-shadow: 0 0 10px rgba(231, 199, 126, 0.25);
  font-weight: 700;
`;

const MageTitle = styled.div`
  font-size: 0.75rem;
  color: #e7c77e;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 800;
  margin-bottom: 0.8rem;
`;

const MageDesc = styled.p`
  font-size: 0.8rem;
  color: rgba(245, 239, 227, 0.65);
  text-align: center;
  line-height: 1.5;
  margin-bottom: 1.4rem;
  border-bottom: 1px dashed rgba(231, 199, 126, 0.12);
  padding-bottom: 1rem;
  width: 100%;
`;

// 属性水平进度槽
const StatWrapper = styled.div`
  width: 100%;
  margin-bottom: 0.85rem;
  cursor: pointer;
  position: relative;

  &:hover .stat-tooltip {
    opacity: 1;
    transform: translate(-50%, -8px);
    pointer-events: auto;
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.76rem;
  margin-bottom: 4px;
  font-weight: 600;
`;

const StatLabel = styled.span`
  color: rgba(245, 239, 227, 0.82);
`;

const StatVal = styled.span`
  color: ${props => props.$color};
  font-family: 'IBM Plex Mono', monospace;
`;

const BarBg = styled.div`
  height: 6px;
  width: 100%;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const BarFill = styled(motion.div)`
  height: 100%;
  border-radius: 3px;
  background: ${props => props.$color};
  box-shadow: 0 0 8px ${props => props.$color};
`;

const StatTooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, 0px);
  background: rgba(8, 16, 12, 0.95);
  border: 1px solid rgba(231, 199, 126, 0.3);
  border-radius: 6px;
  padding: 8px 12px;
  color: rgba(245, 239, 227, 0.9);
  font-size: 0.72rem;
  line-height: 1.4;
  width: 180px;
  text-align: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s, transform 0.25s;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  z-index: 10;
`;

// 右侧内容滚动区
const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.2rem;
`;

const Section = styled.section`
  border: 1px solid rgba(231, 199, 126, 0.12);
  border-radius: 12px;
  background: rgba(9, 19, 17, 0.68);
  padding: 1.8rem;
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(231, 199, 126, 0.16);
  padding-bottom: 0.6rem;
`;

const SectionIcon = styled.span`
  font-size: 1.45rem;
  filter: drop-shadow(0 0 4px #e7c77e);
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  color: #fff7df;
  font-weight: 700;
  letter-spacing: 0.05em;
`;

// 法术书选项卡样式
const SpellTabs = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(231, 199, 126, 0.08);
  margin-bottom: 1.4rem;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SpellTabButton = styled.button`
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${props => props.$active ? props.$color : 'rgba(245, 239, 227, 0.48)'};
  border-bottom: 2px solid ${props => props.$active ? props.$color : 'transparent'};
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: ${props => props.$color};
    background: rgba(231, 199, 126, 0.03);
  }
`;

const SpellSchoolDesc = styled.p`
  font-size: 0.82rem;
  color: rgba(245, 239, 227, 0.68);
  font-style: italic;
  margin-bottom: 1.2rem;
  border-left: 2px solid ${props => props.$color};
  padding-left: 10px;
  line-height: 1.5;
`;

const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.9rem;
`;

const SkillCard = styled.div`
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.25s, transform 0.22s;

  &:hover {
    border-color: ${props => props.$color};
    transform: translateY(-2px);
  }
`;

const SkillInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.84rem;
  font-weight: 600;
`;

const SkillName = styled.span`
  color: #fff7df;
`;

const SkillMana = styled.span`
  font-size: 0.72rem;
  color: rgba(231, 199, 126, 0.75);
  font-family: 'IBM Plex Mono', monospace;
`;

const SkillBarBg = styled.div`
  height: 4px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
`;

const SkillBarFill = styled(motion.div)`
  height: 100%;
  background: ${props => props.$color};
  box-shadow: 0 0 6px ${props => props.$color};
  border-radius: 2px;
`;

// 编年史时间轴样式
const ChronoTimeline = styled.div`
  position: relative;
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 1.8rem;

  &::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 5px;
    bottom: 5px;
    width: 2px;
    background: linear-gradient(to bottom, #e7c77e, rgba(90, 163, 143, 0.5), rgba(255, 255, 255, 0.02));
    box-shadow: 0 0 8px rgba(231, 199, 126, 0.3);
  }
`;

const ChronoItem = styled(motion.div)`
  position: relative;
`;

const ChronoDot = styled.div`
  position: absolute;
  left: -23px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e7c77e;
  border: 3px solid #08120e;
  box-shadow: 0 0 8px #e7c77e;
  z-index: 2;
  transition: transform 0.25s;

  ${ChronoItem}:hover & {
    transform: scale(1.3);
  }
`;

const ChronoCard = styled.div`
  background: rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(231, 199, 126, 0.08);
  border-radius: 8px;
  padding: 1.1rem;
  transition: border-color 0.25s, background 0.25s;

  ${ChronoItem}:hover & {
    border-color: rgba(231, 199, 126, 0.25);
    background: rgba(0, 0, 0, 0.44);
  }
`;

const ChronoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
`;

const ChronoYear = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.95rem;
  color: #e7c77e;
  background: rgba(231, 199, 126, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(231, 199, 126, 0.15);
`;

const ChronoIcon = styled.span`
  font-size: 1.1rem;
`;

const ChronoTitle = styled.h4`
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff7df;
  margin-bottom: 0.4rem;
`;

const ChronoDesc = styled.p`
  font-size: 0.8rem;
  color: rgba(245, 239, 227, 0.7);
  line-height: 1.6;
`;

// 收藏品 / 爱好卡片网格
const RelicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.1rem;
`;

const RelicCard = styled.div`
  background: rgba(0, 0, 0, 0.38);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 1.2rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: radial-gradient(circle at 10% 10%, ${props => props.$glow}, transparent 55%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    transform: translateY(-4px) scale(1.01);
    border-color: rgba(231, 199, 126, 0.25);
    box-shadow: 
      0 12px 30px rgba(0, 0, 0, 0.4),
      0 0 15px ${props => props.$glow};
      
    &::before {
      opacity: 1;
    }
  }
`;

const RelicIcon = styled.div`
  font-size: 1.8rem;
  margin-bottom: 0.6rem;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
`;

const RelicCategory = styled.span`
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #e7c77e;
  letter-spacing: 0.1em;
  background: rgba(231, 199, 126, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(231, 199, 126, 0.12);
`;

const RelicName = styled.h4`
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff7df;
  margin-bottom: 0.4rem;
  position: relative;
  z-index: 1;
`;

const RelicDesc = styled.p`
  font-size: 0.78rem;
  color: rgba(245, 239, 227, 0.65);
  line-height: 1.5;
  position: relative;
  z-index: 1;
`;

/* ─────────────────────────────────────────
   主要组件实现 (About Main Component)
   ───────────────────────────────────────── */

export default function About() {
  const [activeTab, setActiveTab] = useState('conjuration');
  const selectedSchool = useMemo(() => SPELL_SCHOOLS.find(s => s.id === activeTab), [activeTab]);

  // 生成用于漂移的背景尘埃粒子
  const particles = useMemo(() => {
    const list = [];
    const colors = ['rgba(231,199,126,0.35)', 'rgba(90,163,143,0.3)', 'rgba(99,102,241,0.25)'];
    for (let i = 0; i < 15; i++) {
      list.push({
        id: i,
        size: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 8 + 12,
        delay: Math.random() * -15,
        color: colors[i % colors.length]
      });
    }
    return list;
  }, []);

  return (
    <AboutWrapper>
      <ParticlesContainer>
        {particles.map(p => (
          <Particle
            key={p.id}
            $size={p.size}
            $left={p.left}
            $top={p.top}
            $duration={p.duration}
            $delay={p.delay}
            $color={p.color}
          />
        ))}
      </ParticlesContainer>

      <GridContainer>
        {/* 左侧粘性卡片 - 人物属性 */}
        <LeftSidebar>
          <MageCard>
            <AvatarContainer>
              {/* 外圈旋转符文 */}
              <RunicRingOuter viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(231,199,126,0.25)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(231,199,126,0.18)" strokeWidth="0.5" strokeDasharray="3, 5" />
                <path id="outer-text-path" fill="none" d="M 50,50 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
                <text fill="rgba(231,199,126,0.4)" fontSize="3.5" letterSpacing="2.2" fontWeight="700">
                  <textPath href="#outer-text-path" startOffset="0%">
                    * KNOWLEDGE * COGNITION * CREATION * IMAGINATION * LOGIC * ARCHITECTURE
                  </textPath>
                </text>
              </RunicRingOuter>
              {/* 内圈旋转符文 */}
              <RunicRingInner viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(90,163,143,0.22)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="39" fill="none" stroke="rgba(90,163,143,0.14)" strokeWidth="0.5" strokeDasharray="2, 4" />
                <path id="inner-text-path" fill="none" d="M 50,50 m -39,0 a 39,39 0 1,1 78,0 a 39,39 0 1,1 -78,0" />
                <text fill="rgba(90,163,143,0.35)" fontSize="3.2" letterSpacing="1.8">
                  <textPath href="#inner-text-path" startOffset="50%">
                    * PINECONE ARCHIVE * ADVENTURER * MAGE CODEX * WEAVEINK
                  </textPath>
                </text>
              </RunicRingInner>
              <AvatarFrame>
                <AvatarImg src={avatarImage} alt="Mage Avatar" />
              </AvatarFrame>
            </AvatarContainer>

            <MageName>Ye Singularity</MageName>
            <MageTitle>星空大贤者 · Gemini / 以太织网者 · GPT (见习魔法师)</MageTitle>
            <MageDesc>
              “在安静的时间里，把脑海中的碎片拼凑成册。不求惊鸣世界，只愿在风经过时，能留下一些真实的痕迹。”
            </MageDesc>

            {/* 属性进度槽列表 */}
            {ATTRIBUTES.map(attr => (
              <StatWrapper key={attr.key}>
                <StatHeader>
                  <StatLabel>{attr.name}</StatLabel>
                  <StatVal $color={attr.color}>{attr.value}%</StatVal>
                </StatHeader>
                <BarBg>
                  <BarFill
                    $color={attr.color}
                    initial={{ width: 0 }}
                    animate={{ width: `${attr.value}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                  />
                </BarBg>
                <StatTooltip className="stat-tooltip">
                  <strong>{attr.key} · 属性解析</strong>
                  <div style={{ marginTop: '4px', opacity: 0.85 }}>{attr.desc}</div>
                </StatTooltip>
              </StatWrapper>
            ))}
          </MageCard>
        </LeftSidebar>

        {/* 右侧核心面板 - 技能与里程碑 */}
        <MainContent>
          {/* 技能流派 Spellbook */}
          <Section>
            <SectionHeader>
              <SectionIcon>📖</SectionIcon>
              <SectionTitle>知识矩阵 · 主修法术书</SectionTitle>
            </SectionHeader>

            <SpellTabs>
              {SPELL_SCHOOLS.map(school => (
                <SpellTabButton
                  key={school.id}
                  $active={activeTab === school.id}
                  $color={school.color}
                  onClick={() => setActiveTab(school.id)}
                >
                  {school.label}
                </SpellTabButton>
              ))}
            </SpellTabs>

            <AnimatePresence mode="wait">
              {selectedSchool && (
                <motion.div
                  key={selectedSchool.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <SpellSchoolDesc $color={selectedSchool.color}>
                    {selectedSchool.desc}
                  </SpellSchoolDesc>

                  <SkillsGrid>
                    {selectedSchool.skills.map((skill, index) => (
                      <SkillCard key={skill.name} $color={selectedSchool.color}>
                        <SkillInfo>
                          <SkillName>{skill.name}</SkillName>
                          <SkillMana>Mana: {skill.mana}</SkillMana>
                        </SkillInfo>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(245,239,227,0.48)' }}>
                          <span>掌握阶层</span>
                          <span>Lv.{skill.level}</span>
                        </div>
                        <SkillBarBg>
                          <SkillBarFill
                            $color={selectedSchool.color}
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.level}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.08 }}
                          />
                        </SkillBarBg>
                      </SkillCard>
                    ))}
                  </SkillsGrid>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          {/* 编年史里程碑 Chronology */}
          <Section>
            <SectionHeader>
              <SectionIcon>🧭</SectionIcon>
              <SectionTitle>编年史 · 冒险者日志</SectionTitle>
            </SectionHeader>

            <ChronoTimeline>
              {CHRONOLOGY.map((item, index) => (
                <ChronoItem
                  key={item.year}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: index * 0.12 }}
                >
                  <ChronoDot />
                  <ChronoCard>
                    <ChronoHeader>
                      <ChronoYear>{item.year}</ChronoYear>
                      <ChronoIcon>{item.icon}</ChronoIcon>
                    </ChronoHeader>
                    <ChronoTitle>{item.title}</ChronoTitle>
                    <ChronoDesc>{item.desc}</ChronoDesc>
                  </ChronoCard>
                </ChronoItem>
              ))}
            </ChronoTimeline>
          </Section>

          {/* 兴趣搜罗 Relics */}
          <Section>
            <SectionHeader>
              <SectionIcon>🔮</SectionIcon>
              <SectionTitle>炼金台 · 狂想收藏品</SectionTitle>
            </SectionHeader>

            <RelicsGrid>
              {RELICS.map((relic, index) => (
                <RelicCard
                  key={relic.name}
                  $glow={relic.glow}
                  as={motion.div}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <RelicIcon>{relic.icon}</RelicIcon>
                  <RelicCategory>{relic.category}</RelicCategory>
                  <RelicName>{relic.name}</RelicName>
                  <RelicDesc>{relic.desc}</RelicDesc>
                </RelicCard>
              ))}
            </RelicsGrid>
          </Section>
        </MainContent>
      </GridContainer>
    </AboutWrapper>
  );
}