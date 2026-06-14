import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import MiniGraph from '../components/GraphView/MiniGraph';
import {
  filterGraphByCollection,
  getGraphStats,
  normalizeGraph,
} from '../utils/graphFilters';
import atlasArchiveBgLight from '../assets/images/atlas/Celestial-Sands-Field-Light.png';
import atlasArchiveBgDark from '../assets/images/atlas/Celestial-Sands-Field-Dark.png';
import { MouseWakeRipple } from '../components/MouseEffects';

const METADATA_COLLECTIONS = [
  // 1. 落沙寻迹图录 (travel)
  {
    slug: 'travel',
    kind: 'travel',
    title: '落沙行路 · 杭州旅游攻略',
    eyebrow: 'GEOMANTIC RECORDING MATRIX',
    description: '行者无疆，落沙为迹。此志乃神游杭城之灵视地貌图谱，悉心收录凡尘街巷的烟火食单、西子湖畔的山水秘境与四季景致之实地勘测，指引每一位红尘游子在步履交错间，领略天地造化之美。',
    accent: '#d8a247',
  },
  // 2. 万象建站炼成阵 (project)
  {
    slug: 'project',
    kind: 'project',
    title: '万象构筑 · 个人建站流程',
    eyebrow: 'AETHERIC RECONSTRUCTION GRAPH',
    description: '破译数字虚无之营造秘仪。从域名敕令的生死绑定，到云端服务器的洞天开辟，乃至静态资源分发网络之阵法部署，完整记述仙术工坊开宗立派、抵御网络风暴侵蚀与防御攻守之工程实录。',
    accent: '#c8933f',
  },
  // 3. 叶间林径编织手稿 (blog-design)
  {
    slug: 'blog-design',
    kind: 'blog-design',
    title: '松窗灵笈 · 个人博客构建',
    eyebrow: 'LEAF-BORDERED SANCTUARY ENTRANCE',
    description: '松窗临风，灵笈藏真。此册系松窗灵笈台的营造天工图纸，囊括星沙图谱的拓扑演算法则、仙居门户之极简美学构筑、以及前端交互法阵与光影动态特效的熔炼细节，记录本博客迭代升华之轨迹。',
    accent: '#c7a46a',
  },
  // 4. 编译原理
  {
    slug: 'compiler-theory',
    kind: 'compiler-theory',
    title: '天玄奥道 · 编译原理',
    eyebrow: 'OCCULT AETHERIC METHODOLOGIES',
    description: '洞悉混沌语言化为神念之天规秩序。剖析编译器法阵之符文流转，详解词法与语法分析之破阵之法，融会贯通中间代码生成与目标代码优化之无上真诀，为修士搭建从高级语言直通底层金石的通天桥梁。',
    accent: '#cca362',
  },
  // 5. Linux 笔记
  {
    slug: 'linux-notes',
    kind: 'linux-notes',
    title: '天玄奥道 · Linux 笔记',
    eyebrow: 'OCCULT AETHERIC METHODOLOGIES',
    description: '驾驭Linux寰宇之筑基法门。总览系统内核之穴位运转，敕令常用命令行符咒，编制自动化 Shell 脚本傀儡，更有降伏服务宕机、调顺云端灵气运行之运维纪实，乃掌控多维服务器的通关秘籍。',
    accent: '#cca362',
  },
  // 6. 嵌入式开发
  {
    slug: 'embedded',
    kind: 'embedded',
    title: '天玄奥道 · 嵌入式开发',
    eyebrow: 'OCCULT AETHERIC METHODOLOGIES',
    description: '金石交感，妙动于微。此篇专研单片机硬件与现实世界的灵力共鸣，记述串口通信契约、外设接口的微秒级控制，以及裸机底层驱动程序的熔铸流程，助修士勘破软硬结界，以代码号令冷铁飞鸣。',
    accent: '#cca362',
  },
  // 7. 知识杂货铺
  {
    slug: 'knowledge-grocery',
    kind: 'knowledge-grocery',
    title: '青灯闲情 · 知识杂货铺',
    eyebrow: 'TRANQUIL MEDITATION JOURNAL',
    description: '修行之余，闲听八方。这是一座收录大千世界奇闻轶事的杂货当铺，既有现代前沿科学之异端奇想，亦有古今冷门趣味之小道消息与互联网技术流变史话，清茶一盏，佐以天下见闻，博君莞尔一笑。',
    accent: '#caa866',
  },
  // 8. 认知札记
  {
    slug: 'internal-skills',
    kind: 'internal-skills',
    title: '太玄 · 认知札记',
    eyebrow: 'COGNITIVE REFLECTIONS',
    description: '识海洗髓，心魔退散。这里是磨砺神魂、构建心智模型的修真道场，旨在抗御外界纷扰与信息毒化的精神腐蚀，深度剖析自我认知壁垒、决断策略与底层思维逻辑，于静默中完成心性的涅槃与蜕变。',
    accent: '#cca362',
  },
  // 9. 代号《织墨》(WeaveInk)
  {
    slug: 'weaveink',
    kind: 'weaveink',
    title: '代号《织墨》 · 引擎研发',
    eyebrow: 'PROJECT WEAVEINK ENGINE',
    description: '天工开物，笔落惊风。此乃自研“织墨”图文排版引擎的太初炼器秘籍，融合星空拓扑的图形法阵、自适应界面的伸缩道术，以及跨端流畅交互的飞羽动效，展现从零铸造一款现代排版神器的研发全貌。',
    accent: '#8b5cf6',
  },
  // 10. 老韩宇宙
  {
    slug: 'laohan-criticism',
    kind: 'laohan-criticism',
    title: '老韩宇宙 · 乱世观察',
    eyebrow: 'LAOHAN COSMIC OBSERVATORY',
    description: '世事如棋，冷眼旁观。此乃散修“老韩”神游红尘之锐评手札，以辛辣幽默之文笔剖析世间百态，冷峻观察凡俗之离合悲欢，戳破浮华假象。读之如烈酒入喉，顿觉尘世喧嚣皆为笑谈，令人神清气爽。',
    accent: '#ec4899',
  },
  // 11. 老头宇宙
  {
    slug: 'laotou-criticism',
    kind: 'laotou-criticism',
    title: '老头宇宙 · 岁月秘史',
    eyebrow: 'LAOTOU CHRONICLES',
    description: '光阴留痕，逝水无声。此集聚焦于“老头”漫长岁月的风雨纪事与生活感悟，收录古早岁月的逸闻旧事、尘封已久的心历路程与世事变迁的无声叹息，如同一卷昏黄画轴，缓缓诉说着时光深处的密语。',
    accent: '#3b82f6',
  },
  // 12. 观心阁
  {
    slug: 'guanxin-pavilion',
    kind: 'guanxin-pavilion',
    title: '观心阁 · 自我审视',
    eyebrow: 'GUANXIN REFLECTION CHAMBER',
    description: '静室蒲团，面壁思过。此阁乃修士照见本性、拷问自我的绝对净土，剥离一切虚妄社交假象，直面“观己、观人、待人、待己”的心路暗流，在血淋淋的自我剖析与自省中，重建支离破碎的真我道心。',
    accent: '#10b981',
  }
];

export function parseElegantTitle(title) {
  if (!title) return { mainText: '', subText: null };
  
  // 1. 优先匹配括号包裹的内容，并剥离括号
  const parenMatch = title.match(/^([^(（]+)[(（](.+?)[)）]\s*$/);
  if (parenMatch) {
    return {
      mainText: parenMatch[1].trim(),
      subText: parenMatch[2].trim()
    };
  }
  
  // 2. 管道符分割
  if (title.includes('|')) {
    const parts = title.split('|');
    return {
      mainText: parts[0].trim(),
      subText: parts[1].trim()
    };
  }
  
  // 3. 中点分割，保留中点作为卷轴修饰符
  if (title.includes('·')) {
    const parts = title.split('·');
    return {
      mainText: parts[0].trim(),
      subText: `· ${parts[1].trim()}`
    };
  }
  
  // 4. 横线分割
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    return {
      mainText: parts[0].trim(),
      subText: parts[1].trim()
    };
  }
  
  return {
    mainText: title.trim(),
    subText: null
  };
}

const Page = styled.div`
  min-height: 100vh;
  position: relative;
  isolation: isolate;
  overflow-x: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background 0.5s ease, color 0.5s ease;

  --bg-primary: ${({ $theme }) => $theme === 'light' ? '#f5efe3' : '#07100e'};
  --bg-stars: ${({ $theme }) => $theme === 'light' ? 'rgba(99, 72, 28, 0.05)' : 'rgba(245, 239, 227, 0.12)'};
  --text-primary: ${({ $theme }) => $theme === 'light' ? '#2c251d' : '#f5efe3'};
  --text-muted: ${({ $theme }) => $theme === 'light' ? 'rgba(44, 37, 29, 0.7)' : 'rgba(255, 240, 212, 0.84)'};
  --text-accent: ${({ $theme }) => $theme === 'light' ? '#996316' : '#ffe197'};
  
  /* Container Amber Glass styles */
  --glass-bg: ${({ $theme }) => $theme === 'light' ? 'rgba(242, 233, 218, 0.76)' : 'rgba(28, 18, 12, 0.52)'};
  --glass-bg-alt: ${({ $theme }) => $theme === 'light' ? 'rgba(232, 220, 202, 0.45)' : 'rgba(20, 13, 8, 0.45)'};
  --glass-border: ${({ $theme }) => $theme === 'light' ? 'rgba(180, 127, 45, 0.35)' : 'rgba(216, 162, 71, 0.36)'};
  --glass-border-highlight: ${({ $theme }) => $theme === 'light' ? 'rgba(180, 127, 45, 0.6)' : 'rgba(231, 199, 126, 0.7)'};
  --glass-shadow: ${({ $theme }) => $theme === 'light' ? '0 12px 32px rgba(120, 90, 60, 0.12)' : '0 20px 48px rgba(0, 0, 0, 0.24)'};
  --glass-inset: ${({ $theme }) => $theme === 'light' ? 'inset 0 1px 0 rgba(255, 255, 255, 0.5)' : 'inset 0 1px 0 rgba(255, 247, 223, 0.22)'};
  
  /* Item backgrounds */
  --item-bg: ${({ $theme }) => $theme === 'light' ? 'rgba(253, 251, 247, 0.75)' : 'rgba(10, 20, 34, 0.48)'};
  --item-border: ${({ $theme }) => $theme === 'light' ? 'rgba(180, 127, 45, 0.18)' : 'rgba(231, 199, 126, 0.22)'};
  --item-hover-bg: ${({ $theme }) => $theme === 'light' ? 'rgba(180, 127, 45, 0.08)' : 'rgba(231, 199, 126, 0.1)'};
  --item-text-active: ${({ $theme }) => $theme === 'light' ? '#784d0f' : '#fff7df'};

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: ${({ $theme }) => $theme === 'light'
      ? `url(${atlasArchiveBgLight}) center center / cover no-repeat, var(--bg-primary)`
      : `url(${atlasArchiveBgDark}) center center / cover no-repeat, var(--bg-primary)`
    };
    background-blend-mode: normal;
    filter: none;
    opacity: ${({ $theme }) => $theme === 'light' ? 0.95 : 1};
    transition: background 0.5s ease, filter 0.5s ease;
  }

  @keyframes atlas-dust-drift {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-90px, 70px, 0); }
  }
`;

const AtlasStars = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: ${({ $theme }) => $theme === 'light' ? 0.35 : 0.52};
  background:
    radial-gradient(circle at 22% 30%, var(--bg-stars) 0 1px, transparent 2px),
    radial-gradient(circle at 48% 62%, var(--bg-stars) 0 1px, transparent 2px),
    radial-gradient(circle at 82% 38%, var(--bg-stars) 0 1px, transparent 2px),
    linear-gradient(rgba(215, 187, 135, 0.026) 1px, transparent 1px),
    linear-gradient(90deg, rgba(215, 187, 135, 0.018) 1px, transparent 1px);
  background-size: 180px 180px, 240px 240px, 210px 210px, 52px 52px, 52px 52px;
  mask-image: radial-gradient(circle at 52% 38%, black 0%, black 38%, transparent 82%);
  animation: atlas-dust-drift 34s linear infinite;
  transition: opacity 0.5s ease;
`;

const ThemeToggleWrapper = styled.div`
  position: absolute;
  top: 0.2rem;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  z-index: 9999;
  
  @media (max-width: 900px) {
    top: 0.2rem;
    right: 0;
  }
`;

const ToggleLabel = styled.span`
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--text-accent);
  text-shadow: ${({ $theme }) => $theme === 'light' ? 'none' : '0 0 8px rgba(231,199,126,0.4)'};
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: 0.18rem 0.45rem;
  border-radius: 4px;
  backdrop-filter: blur(8px);
  pointer-events: none;
  user-select: none;
  transition: all 0.3s ease;
  white-space: nowrap;
`;

const ThemeToggle = styled.button`
  width: 38px;
  height: 76px;
  border-radius: 19px;
  border: 1.5px solid var(--glass-border);
  background: ${({ $theme }) => $theme === 'light' 
    ? 'linear-gradient(to bottom, #7ec0ee, #bce3ff)' 
    : 'linear-gradient(to bottom, #090f1d, #141c30)'};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 3px 0;
  position: relative;
  overflow: hidden;
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(12px);
  transition: background 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: var(--glass-border-highlight);
    box-shadow: 0 0 15px rgba(216, 162, 71, 0.4);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ToggleKnob = styled(motion.div)`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  position: relative;
  z-index: 2;
  background: ${({ $theme }) => $theme === 'light' 
    ? 'radial-gradient(circle at 30% 30%, #ffdf79, #fdb813)' 
    : 'radial-gradient(circle at 30% 30%, #f1f5f9, #94a3b8)'};
  box-shadow: ${({ $theme }) => $theme === 'light' 
    ? '0 0 8px rgba(253, 184, 19, 0.6), inset -2px -2px 4px rgba(0,0,0,0.1)' 
    : '0 0 8px rgba(226, 232, 240, 0.4), inset -3px -3px 0px 0px #64748b'};
`;

const DecorationLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .cloud {
    position: absolute;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 50%;
    opacity: ${({ $theme }) => $theme === 'light' ? 1 : 0};
    transform: translateX(${({ $theme }) => $theme === 'light' ? '0' : '-15px'});
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .cloud-1 { width: 14px; height: 14px; bottom: 22px; left: 6px; }
  .cloud-2 { width: 22px; height: 12px; bottom: 12px; left: 10px; border-radius: 6px; }

  .star {
    position: absolute;
    background: white;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    opacity: ${({ $theme }) => $theme === 'light' ? 0 : 0.8};
    transform: translateX(${({ $theme }) => $theme === 'light' ? '15px' : '0'});
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .star-1 { top: 12px; left: 10px; animation: toggle-twinkle 2s infinite alternate; }
  .star-2 { top: 22px; left: 24px; animation: toggle-twinkle 1.5s infinite alternate 0.5s; }
  .star-3 { top: 32px; left: 8px; animation: toggle-twinkle 3s infinite alternate 1s; }

  @keyframes toggle-twinkle {
    0% { opacity: 0.3; }
    100% { opacity: 1; }
  }
`;

const LoadingScreen = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: #060908;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  color: #ffedd5;
  user-select: none;
  -webkit-user-select: none;
  
  .astro-circle {
    width: 90px;
    height: 90px;
    border: 1px dashed rgba(231, 199, 126, 0.2);
    border-radius: 50%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: loadingSpin 20s linear infinite;
    
    &::before {
      content: '';
      position: absolute;
      width: 70px;
      height: 70px;
      border: 1px solid rgba(90, 163, 143, 0.45);
      border-radius: 50%;
      border-top-color: transparent;
      border-bottom-color: transparent;
      animation: loadingSpinCounter 8s linear infinite;
    }
    
    &::after {
      content: '🪐';
      font-size: 1.6rem;
      animation: loadingBreathe 2.5s ease-in-out infinite alternate;
    }
  }

  .loading-text {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: rgba(245, 239, 227, 0.85);
    text-shadow: 0 0 10px rgba(90, 163, 143, 0.35);
  }

  .loading-bar-bg {
    width: 140px;
    height: 2px;
    background: rgba(90, 163, 143, 0.15);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }

  .loading-bar-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, transparent, #d8a247, transparent);
    animation: loadingBarMove 1.6s infinite linear;
  }

  @keyframes loadingSpin {
    to { transform: rotate(360deg); }
  }

  @keyframes loadingSpinCounter {
    to { transform: rotate(-360deg); }
  }

  @keyframes loadingBreathe {
    0% { transform: scale(0.9) rotate(-10deg); opacity: 0.7; }
    100% { transform: scale(1.1) rotate(10deg); opacity: 1; }
  }

  @keyframes loadingBarMove {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const Shell = styled.div`
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: minmax(190px, 236px) minmax(0, 1fr) minmax(300px, 380px);
  gap: clamp(1rem, 2vw, 1.5rem);
  width: min(1500px, 100%);
  margin: 0 auto;
  padding: clamp(1rem, 2.5vw, 2rem);

  @media (max-width: 1120px) {
    grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
  }

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const Rail = styled.aside`
  position: sticky;
  top: 1.25rem;
  align-self: start;
  max-height: calc(100vh - 2.5rem);
  padding: 1rem 0.75rem;
  overflow: auto;
  border: 1px solid var(--glass-border);
  border-left: 2px solid var(--glass-border-highlight);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 244, 218, 0.08), rgba(99, 61, 26, 0.04)),
    radial-gradient(circle at 85% 8%, rgba(255, 225, 151, 0.12), transparent 32%),
    var(--glass-bg);
  box-shadow:
    var(--glass-shadow),
    var(--glass-inset),
    inset 0 0 28px rgba(231, 199, 126, 0.02);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  transition: background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--glass-border-highlight);
    border-radius: 999px;
  }

  @media (max-width: 780px) {
    position: static;
    max-height: none;
    border-left-width: 1px;
    background: var(--glass-bg);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
`;

const RailTitle = styled(Link)`
  display: block;
  margin: 0 0.35rem 0.8rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--glass-border);
  color: var(--text-accent);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-shadow: 0 0 16px rgba(231, 199, 126, 0.18);
  transition: color 0.5s ease, border-color 0.5s ease;
`;

const NavList = styled.nav`
  display: grid;
  gap: 0.22rem;
`;

const NavLink = styled(Link)`
  display: grid;
  grid-template-columns: 8px 1fr auto;
  align-items: center;
  gap: 0.55rem;
  min-height: 38px;
  padding: 0.46rem 0.58rem;
  border-radius: 6px;
  color: ${({ $active }) => ($active ? 'var(--item-text-active)' : 'var(--text-muted)')};
  text-shadow: 
    0 1px 2px rgba(12, 9, 6, 0.15),
    ${({ $active }) => ($active ? '0 0 10px rgba(231, 199, 126, 0.22)' : 'none')};
  background: ${({ $active, $accent }) => ($active ? `linear-gradient(90deg, ${$accent}30, rgba(255, 247, 223, 0.04))` : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? 'var(--glass-border)' : 'transparent')};
  font-size: 0.8rem;
  text-decoration: none;
  line-height: 1.25;
  transition: all 0.2s ease;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $accent }) => $accent};
    box-shadow: ${({ $active, $accent }) => ($active ? `0 0 14px ${$accent}` : `0 0 8px ${$accent}80`)};
  }

  &:hover {
    color: var(--text-accent);
    background: var(--item-hover-bg);
    border-color: var(--glass-border-highlight);
    transform: translateX(2px);
  }
`;

const Count = styled.span`
  color: var(--text-muted);
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
`;

const Main = styled.main`
  min-width: 0;
  padding: clamp(1.3rem, 4vw, 3rem) 0 clamp(2rem, 5vw, 4rem);
  position: relative;
`;

const Hero = styled.section`
  padding-bottom: 1.2rem;
  border-bottom: 1px solid var(--glass-border);
  transition: border-color 0.5s ease;
  position: relative;
  padding-right: 80px;
`;

const Eyebrow = styled.div`
  margin-bottom: 0.6rem;
  color: ${({ $accent }) => $accent};
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`;

const Title = styled(motion.h1)`
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(1.8rem, 3.8vw, 2.8rem);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.01em;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-shadow: ${({ $theme }) => $theme === 'light' ? 'none' : '0 0 12px rgba(231, 199, 126, 0.35)'};
  transition: color 0.5s ease;
`;

const TitleSubtitle = styled(motion.div)`
  margin-top: 0.45rem;
  font-size: clamp(1.05rem, 1.8vw, 1.3rem);
  font-weight: 300;
  color: var(--text-accent);
  letter-spacing: 0.08em;
  opacity: 0.85;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  text-shadow: ${({ $theme }) => $theme === 'light' ? 'none' : '0 0 8px rgba(231, 199, 126, 0.25)'};
  transition: color 0.5s ease;
`;

const Lead = styled.p`
  width: min(780px, 100%);
  margin: 1rem 0 0;
  color: var(--text-muted);
  font-size: clamp(1rem, 1.5vw, 1.16rem);
  line-height: 1.8;
  transition: color 0.5s ease;
`;

const SectionTitle = styled.h2`
  margin: 2rem 0 0.8rem;
  color: var(--text-accent);
  font-size: 1.15rem;
  font-weight: 900;
  transition: color 0.5s ease;
`;

const CardGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

const CollectionCard = styled(Link)`
  display: grid;
  min-height: 148px;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  border-left: 2px solid ${({ $accent }) => `${$accent}aa`};
  background:
    linear-gradient(135deg, var(--glass-bg-alt), rgba(20, 16, 23, 0.05)),
    radial-gradient(circle at 82% 14%, ${({ $accent }) => `${$accent}18`}, transparent 36%),
    var(--glass-bg);
  color: var(--text-primary);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  box-shadow:
    var(--glass-shadow),
    var(--glass-inset);
  transition: all 0.3s ease;
  text-decoration: none;

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ $accent }) => $accent};
    box-shadow: 
      0 18px 42px rgba(0, 0, 0, 0.24),
      0 0 16px ${({ $accent }) => `${$accent}40`};
  }

  strong {
    font-size: 1.12rem;
    line-height: 1.25;
    color: var(--text-accent);
    text-shadow: ${({ $theme }) => $theme === 'light' ? 'none' : '0 1px 2px rgba(12, 9, 6, 0.78)'};
    transition: color 0.5s ease;
  }

  span {
    align-self: end;
    color: var(--text-muted);
    font-size: 0.9rem;
    line-height: 1.55;
    transition: color 0.5s ease;
  }
`;

const NoteList = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const NoteItem = styled(Link)`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  min-height: 52px;
  padding: 0.78rem 0.9rem;
  border-radius: 8px;
  border: 1px solid var(--item-border);
  background: var(--item-bg);
  color: var(--text-primary);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  transition: all 0.28s ease;

  &:hover {
    border-color: var(--glass-border-highlight);
    background: var(--item-hover-bg);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.94rem;
    color: var(--text-primary);
    transition: color 0.5s ease;
  }

  span {
    color: var(--text-muted);
    font-size: 0.72rem;
    transition: color 0.5s ease;
  }
`;

const TreeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background:
    linear-gradient(135deg, rgba(255, 244, 218, 0.08), rgba(99, 61, 26, 0.04)),
    radial-gradient(circle at 82% 10%, rgba(255, 225, 151, 0.12), transparent 34%),
    var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-left: 2px solid var(--glass-border-highlight);
  border-radius: 10px;
  padding: 1.1rem;
  margin-top: 1rem;
  outline: 1px solid rgba(255, 255, 255, 0.05);
  outline-offset: -4px;
  box-shadow:
    var(--glass-shadow),
    var(--glass-inset),
    inset 0 0 24px rgba(231, 199, 126, 0.02);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  transition: background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
`;

const TreeNodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const TreeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease, border-color 0.2s ease;
  min-width: 0;

  &:hover {
    background: var(--item-hover-bg);
  }
`;

const FolderRow = styled(TreeRow)`
  color: var(--text-accent);
  font-weight: 600;
  text-shadow: ${({ $theme }) => $theme === 'light' ? 'none' : '0 1px 2px rgba(12, 9, 6, 0.74)'};
  transition: color 0.5s ease;
`;

const FileRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  color: var(--text-muted);
  text-decoration: none;
  min-width: 0;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${({ $accent }) => `${$accent}18`};
    color: var(--text-accent);
  }
`;

const NodeName = styled.span`
  flex: 1;
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FolderCount = styled.span`
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-left: 0.35rem;
  font-weight: normal;
  opacity: 0.8;
  transition: color 0.5s ease;
`;

const FileMeta = styled.span`
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-left: auto;
  padding-left: 0.5rem;
  flex-shrink: 0;
  opacity: 0.76;
  transition: color 0.5s ease;
`;

const SubTree = styled.div`
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px dashed var(--glass-border);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: border-color 0.5s ease;
`;

const ChevronSvg = ({ isOpen }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const FolderSvg = ({ accent }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={accent || '#e7c77e'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, opacity: 0.88 }}
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const FileSvg = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="rgba(111, 70, 22, 0.72)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

function DirectoryNode({ node, accent, expandedPaths, onToggle, theme }) {
  if (node.type === 'folder') {
    const isOpen = expandedPaths.has(node.path);
    const countFiles = (n) => {
      let count = 0;
      n.children.forEach(c => {
        if (c.type === 'file') count++;
        else count += countFiles(c);
      });
      return count;
    };
    const fileCount = countFiles(node);

    return (
      <TreeNodeWrapper>
        <FolderRow onClick={() => onToggle(node.path)} $theme={theme}>
          <ChevronSvg isOpen={isOpen} />
          <FolderSvg accent={accent} />
          <NodeName>
            {node.name}
            <FolderCount>({fileCount})</FolderCount>
          </NodeName>
        </FolderRow>
        {isOpen && (
          <SubTree>
            {node.children.map((child, idx) => (
              <DirectoryNode
                key={child.path || child.name + idx}
                node={child}
                accent={accent}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                theme={theme}
              />
            ))}
          </SubTree>
        )}
      </TreeNodeWrapper>
    );
  }

  const note = node.note;
  return (
    <FileRow to={`/note/${note.slug}`} $accent={accent}>
      <span style={{ width: 10, display: 'inline-block', flexShrink: 0 }} />
      <FileSvg />
      <NodeName title={note.title}>{note.title}</NodeName>
      <FileMeta>{note.tags?.slice(0, 1).join(' / ') || ''}</FileMeta>
    </FileRow>
  );
}

const RightPanel = styled.aside`
  position: sticky;
  top: 1.25rem;
  align-self: start;
  display: grid;
  gap: 1rem;
  padding: 1rem 0 0.75rem;

  @media (max-width: 1120px) {
    grid-column: 2;
    position: static;
  }

  @media (max-width: 780px) {
    grid-column: auto;
  }
`;

const PreviewPanel = styled.div`
  border: 1px solid var(--glass-border);
  border-left: 2.5px solid var(--glass-border-highlight);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(255, 244, 218, 0.08), rgba(99, 61, 26, 0.04)),
    radial-gradient(circle at 82% 10%, rgba(255, 225, 151, 0.15), transparent 34%),
    var(--glass-bg);
  color: var(--text-primary);
  overflow: hidden;
  box-shadow:
    var(--glass-shadow),
    var(--glass-inset);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  transition: background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 50px;
  padding: 0 0.9rem;
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg-alt);
  transition: background 0.5s ease, border-color 0.5s ease;
`;

const PanelTitle = styled.span`
  color: var(--text-accent);
  font-size: 0.86rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  transition: color 0.5s ease;
`;

const GraphActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
`;

const GraphPill = styled(Link)`
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 0.68rem;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-alt);
  color: var(--text-accent);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  transition: all 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -6px;
    width: 10px;
    height: 10px;
    border-right: 1px solid var(--glass-border);
    border-bottom: 1px solid var(--glass-border);
    background: var(--glass-bg-alt);
    transform: translateX(-50%) rotate(45deg);
    transition: all 0.2s ease;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: var(--glass-border-highlight);
    background: var(--item-hover-bg);
    color: var(--text-accent);
    box-shadow: 0 0 18px rgba(216, 162, 71, 0.2);
  }

  &:hover::after {
    border-color: var(--glass-border-highlight);
    background: var(--item-hover-bg);
  }
`;

const GraphIcon = styled(Link)`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--text-accent);
  font-size: 1.35rem;
  font-weight: 900;
  transition: transform 0.18s ease, color 0.18s ease, text-shadow 0.18s ease;

  &:hover {
    color: var(--text-primary);
    transform: translate(2px, -2px);
  }
`;

const PreviewBody = styled.div`
  aspect-ratio: 1 / 1;
  min-height: 280px;
  background: var(--glass-bg-alt);
  transition: background 0.5s ease;

  .mini-graph-container {
    height: 100%;
    border: 0;
    background: transparent;
  }
`;

const SideList = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.9rem;
  background: var(--glass-bg-alt);
  transition: background 0.5s ease;

  a,
  span {
    color: var(--text-muted);
    font-size: 0.88rem;
    transition: color 0.5s ease;
  }

  a:hover {
    color: var(--text-accent);
  }
`;

function getCollectionCounts(indexData) {
  const counts = new Map();
  for (const note of indexData?.notes ?? []) {
    counts.set(note.collection, (counts.get(note.collection) ?? 0) + 1);
  }
  return counts;
}

// 全局静态数据与背景图缓存，避免多次后退产生加载动画
let cachedGraphData = null;
let cachedIndexData = null;
let isBgPreloaded = false;

function useAtlasData() {
  const [graphData, setGraphData] = useState(cachedGraphData || { nodes: [], links: [] });
  const [indexData, setIndexData] = useState(cachedIndexData || { notes: [], collections: [] });
  const [loading, setLoading] = useState(!cachedGraphData || !cachedIndexData || !isBgPreloaded);

  useEffect(() => {
    // 若已有缓存，则跳过本次加载，直接展示
    if (cachedGraphData && cachedIndexData && isBgPreloaded) {
      return;
    }

    const fetchGraph = cachedGraphData
      ? Promise.resolve(cachedGraphData)
      : fetch('/graph.json')
          .then((response) => response.json())
          .then((data) => {
            cachedGraphData = data;
            setGraphData(data);
            return data;
          })
          .catch(() => setGraphData({ nodes: [], links: [] }));

    const fetchIndex = cachedIndexData
      ? Promise.resolve(cachedIndexData)
      : fetch('/notes-index.json')
          .then((response) => response.json())
          .then((data) => {
            cachedIndexData = data;
            setIndexData(data);
            return data;
          })
          .catch(() => setIndexData({ notes: [], collections: [] }));

    const preloadBg = isBgPreloaded
      ? Promise.resolve()
      : Promise.all([
          new Promise((resolve) => {
            const img = new Image();
            img.src = atlasArchiveBgLight;
            img.onload = resolve;
            img.onerror = resolve;
          }),
          new Promise((resolve) => {
            const img = new Image();
            img.src = atlasArchiveBgDark;
            img.onload = resolve;
            img.onerror = resolve;
          })
        ]).then(() => {
          isBgPreloaded = true;
        });

    Promise.all([fetchGraph, fetchIndex, preloadBg]).then(() => {
      setTimeout(() => {
        setLoading(false);
      }, 800);
    });
  }, []);

  return { graphData, indexData, loading };
}

function AtlasRail({ activeSlug, counts, collections }) {
  return (
    <Rail>
      <RailTitle to="/atlas">图谱大厅</RailTitle>
      <NavList aria-label="已发布 Obsidian 内容">
        {collections.map((item) => (
          <NavLink
            key={item.slug}
            to={`/atlas/${item.slug}`}
            $active={activeSlug === item.slug}
            $accent={item.accent}
          >
            {item.title.replace(/\s*\|\s*/g, '')}
            <Count>{counts.get(item.kind) ?? 0}</Count>
          </NavLink>
        ))}
      </NavList>
    </Rail>
  );
}

function RightSidebar({ graphData, indexData, activeCollection, theme }) {
  const location = useLocation();
  const activeKind = activeCollection?.kind ?? null;
  const previewGraph = useMemo(
    () => (activeKind ? filterGraphByCollection(graphData, activeKind) : normalizeGraph(graphData)),
    [activeKind, graphData]
  );
  const stats = useMemo(() => getGraphStats(previewGraph), [previewGraph]);
  const graphHref = activeKind ? `/graph?collection=${encodeURIComponent(activeKind)}` : '/graph';

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 900 : false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <RightPanel>
      {!isMobile && (
        <PreviewPanel>
          <PanelHeader>
            <PanelTitle>关系图谱</PanelTitle>
            <GraphActions>
              <GraphPill to={graphHref} state={{ backgroundLocation: location }}>
                {activeKind ? '分类全局图' : '全站图谱'}
              </GraphPill>
              <GraphIcon to={graphHref} state={{ backgroundLocation: location }} aria-label="展开图谱">↗</GraphIcon>
            </GraphActions>
          </PanelHeader>
          <PreviewBody>
            <MiniGraph
              graphData={previewGraph}
              label={activeKind ? '分类图谱预览' : '已发布图谱'}
              theme={theme}
              expandHref={graphHref}
            />
          </PreviewBody>
        </PreviewPanel>
      )}
      <PreviewPanel>
        <PanelHeader>
          <PanelTitle>发布档案</PanelTitle>
        </PanelHeader>
        <SideList>
          {!isMobile && (
            <>
              <Link to={graphHref} state={{ backgroundLocation: location }}>打开当前图谱</Link>
              {activeKind ? (
                <Link to="/graph" state={{ backgroundLocation: location }}>切到全站图谱</Link>
              ) : (
                <Link to="/atlas/travel">查看旅游图谱</Link>
              )}
            </>
          )}
          <span>笔记：{stats.nodeCount || indexData.notes.length}</span>
          <span>关系：{stats.linkCount}</span>
          <span>来源：Obsidian 选择性发布</span>
        </SideList>
      </PreviewPanel>
    </RightPanel>
  );
}

function AtlasHall({ graphData, indexData, counts, collections, theme, toggleTheme }) {
  return (
    <Page $theme={theme}>
      <AtlasStars $theme={theme} />
      <Shell>
        <AtlasRail activeSlug="hall" counts={counts} collections={collections} />
        <Main>
          <Hero id="overview">
            <ThemeToggleWrapper>
              <ToggleLabel $theme={theme}>
                {theme === 'light' ? '推演 · 晨曦' : '推演 · 幽夜'}
              </ToggleLabel>
              <ThemeToggle $theme={theme} onClick={toggleTheme} aria-label="切换主题">
                <DecorationLayer $theme={theme}>
                  <div className="cloud cloud-1" />
                  <div className="cloud cloud-2" />
                  <div className="star star-1" />
                  <div className="star star-2" />
                  <div className="star star-3" />
                </DecorationLayer>
                <ToggleKnob 
                  $theme={theme}
                  animate={{ y: theme === 'light' ? 0 : 42 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                />
              </ThemeToggle>
            </ThemeToggleWrapper>
            <Eyebrow $accent="#e7c77e">STELLAR SANDS ASTROLABE</Eyebrow>
            <Title
              $theme={theme}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              星砂浑天图谱
            </Title>
            <Lead>
              星砂汇聚，凝为棋局。此阵乃沟通大千的虚空节点，每一枚知识玉简皆落在星沙棋盘上，化作引力交织的星砂坐标。
              藉由眼前的星轨坐标，启迪传送法阵，即可越过无垠沙海，神游于‘叶间树林’的阅读殿堂中。
            </Lead>
          </Hero>
 
          <SectionTitle id="entries">虚空定位仪轨</SectionTitle>
          <CardGrid>
            {collections.map((item) => (
              <CollectionCard key={item.slug} to={`/atlas/${item.slug}`} $accent={item.accent} $theme={theme}>
                <strong>{item.title.replace(/\s*\|\s*/g, '')}</strong>
                <span>
                  {item.description}
                  <br />
                  {counts.get(item.kind) ?? 0} 篇笔记
                </span>
              </CollectionCard>
            ))}
          </CardGrid>
 
          <SectionTitle id="notes">近来浮光的星砂玉简</SectionTitle>
          <NoteList>
            {indexData.notes.slice(0, 12).map((note) => (
              <NoteItem key={note.slug} to={`/note/${note.slug}`} $accent="#a78bfa">
                <strong>{note.title}</strong>
                <span>{note.collectionLabel}</span>
              </NoteItem>
            ))}
          </NoteList>
        </Main>
        <RightSidebar graphData={graphData} indexData={indexData} theme={theme} />
      </Shell>
    </Page>
  );
}

function AtlasDetail({ collection, graphData, indexData, counts, collections, theme, toggleTheme }) {
  const notes = useMemo(
    () => indexData.notes.filter((note) => note.collection === collection.kind),
    [collection.kind, indexData.notes]
  );

  // Build tree hierarchy
  const tree = useMemo(() => {
    const root = { type: 'folder', name: 'root', path: '', children: [] };
    const folderMap = new Map();

    notes.forEach((note) => {
      const parts = note.path ? note.path.split('/') : [note.title];
      let currentFolder = root;
      let accumulatedPath = '';

      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${folderName}` : folderName;

        if (!folderMap.has(accumulatedPath)) {
          const newFolder = {
            type: 'folder',
            name: folderName,
            path: accumulatedPath,
            children: []
          };
          currentFolder.children.push(newFolder);
          folderMap.set(accumulatedPath, newFolder);
        }
        currentFolder = folderMap.get(accumulatedPath);
      }

      currentFolder.children.push({
        type: 'file',
        name: note.title,
        note: note
      });
    });

    const sortTree = (node) => {
      if (node.type === 'folder') {
        node.children.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
          return a.name.localeCompare(b.name, 'zh');
        });
        node.children.forEach(sortTree);
      }
    };

    sortTree(root);
    return root;
  }, [notes]);

  // Extract all folder paths for default expansion
  const allFolderPaths = useMemo(() => {
    const paths = [];
    const getPaths = (n) => {
      if (n.type === 'folder') {
        if (n.path) paths.push(n.path);
        n.children.forEach(getPaths);
      }
    };
    getPaths(tree);
    return paths;
  }, [tree]);

  const [expandedPaths, setExpandedPaths] = useState(new Set());

  // Automatically expand all folders when the collection changes
  useEffect(() => {
    setExpandedPaths(new Set(allFolderPaths));
  }, [allFolderPaths]);

  const toggleFolder = (path) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <Page $theme={theme}>
      <AtlasStars $theme={theme} />
      <Shell>
        <AtlasRail activeSlug={collection.slug} counts={counts} collections={collections} />
        <Main>
          <Hero id="overview">
            <ThemeToggleWrapper>
              <ToggleLabel $theme={theme}>
                {theme === 'light' ? '推演 · 晨曦' : '推演 · 幽夜'}
              </ToggleLabel>
              <ThemeToggle $theme={theme} onClick={toggleTheme} aria-label="切换主题">
                <DecorationLayer $theme={theme}>
                  <div className="cloud cloud-1" />
                  <div className="cloud cloud-2" />
                  <div className="star star-1" />
                  <div className="star star-2" />
                  <div className="star star-3" />
                </DecorationLayer>
                <ToggleKnob 
                  $theme={theme}
                  animate={{ y: theme === 'light' ? 0 : 42 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                />
              </ThemeToggle>
            </ThemeToggleWrapper>
            <Eyebrow $accent={collection.accent}>{collection.eyebrow}</Eyebrow>
            {(() => {
              const { mainText, subText } = parseElegantTitle(collection.title);
              return (
                <>
                  <Title
                    $theme={theme}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    {mainText}
                  </Title>
                  {subText && (
                    <TitleSubtitle
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 0.85, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    >
                      {subText}
                    </TitleSubtitle>
                  )}
                </>
              );
            })()}
            <Lead>{collection.description}</Lead>
          </Hero>

          <SectionTitle id="notes">笔记目录</SectionTitle>
          <TreeContainer>
            {tree.children.length > 0 ? (
              tree.children.map((child, idx) => (
                <DirectoryNode
                  key={child.path || child.name + idx}
                  node={child}
                  accent={collection.accent}
                  expandedPaths={expandedPaths}
                  onToggle={toggleFolder}
                  theme={theme}
                />
              ))
            ) : (
              <span style={{ fontSize: '0.88rem', color: 'rgba(245,239,227,0.4)', padding: '0.5rem' }}>
                暂无相关笔记数据
              </span>
            )}
          </TreeContainer>
        </Main>
        <RightSidebar graphData={graphData} indexData={indexData} activeCollection={collection} theme={theme} />
      </Shell>
    </Page>
  );
}

export default function Atlas() {
  const { type } = useParams();
  const { graphData, indexData, loading } = useAtlasData();
  const counts = useMemo(() => getCollectionCounts(indexData), [indexData]);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('atlas-theme');
    if (saved) return saved;
    const hour = new Date().getHours();
    return (hour >= 7 && hour < 19) ? 'light' : 'dark';
  });
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('atlas-theme', next);
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    const syncTheme = () => {
      const saved = localStorage.getItem('atlas-theme');
      if (saved) {
        setTheme(saved);
      } else {
        const hour = new Date().getHours();
        setTheme((hour >= 7 && hour < 19) ? 'light' : 'dark');
      }
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const collections = useMemo(() => {
    const list = [];
    
    // Merge indexData collections with predefined metadata
    for (const c of indexData?.collections ?? []) {
      const matched = METADATA_COLLECTIONS.find((item) => 
        item.kind === c.kind || 
        c.kind.toLowerCase().includes(item.kind.toLowerCase()) ||
        c.label.toLowerCase().includes(item.kind.toLowerCase())
      );
      if (matched) {
        list.push({
          ...matched,
          count: c.count,
        });
      } else {
        // Fallback for new dynamically added collections
        list.push({
          slug: c.kind,
          kind: c.kind,
          title: c.label,
          eyebrow: 'Obsidian 笔记库',
          description: `包含当前分类下的所有相关笔记与知识节点。`,
          accent: '#a78bfa', // dynamic default purple accent
          count: c.count,
        });
      }
    }

    if (list.length === 0) {
      return METADATA_COLLECTIONS.map(item => ({ ...item, count: 0 }));
    }

    return list;
  }, [indexData]);

  const collectionsMap = useMemo(() => {
    return new Map(collections.map((item) => [item.slug, item]));
  }, [collections]);

  const currentCollection = type ? collectionsMap.get(type) : null;

  if (type && !currentCollection) {
    return <Navigate to="/atlas" replace />;
  }

  return (
    <>
      <AnimatePresence>
        {loading && (
          <LoadingScreen
            key="atlas-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.65, ease: 'easeInOut' } }}
          >
            <div className="astro-circle" />
            <div className="loading-text">正在推演图谱星轨...</div>
            <div className="loading-bar-bg">
              <div className="loading-bar-fill" />
            </div>
          </LoadingScreen>
        )}
      </AnimatePresence>

      {!type ? (
        <AtlasHall
          graphData={graphData}
          indexData={indexData}
          counts={counts}
          collections={collections}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <AtlasDetail
          collection={currentCollection}
          graphData={graphData}
          indexData={indexData}
          counts={counts}
          collections={collections}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      <MouseWakeRipple 
        theme={theme}
        zIndex={1}
      />
    </>
  );
}
