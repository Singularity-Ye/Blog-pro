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
import atlasArchiveBg from '../assets/images/atlas/Celestial-Sands-Field.png';

const METADATA_COLLECTIONS = [
  // 1. 落沙寻迹图录 (原 travel)
  {
    slug: 'travel',
    kind: 'travel',
    title: '落沙寻迹图录',
    eyebrow: 'GEOMANTIC RECORDING MATRIX',
    description: '烙印在神州地脉之上的行走轨迹，凡人眼中的凡尘路线、烟火美味与逐日景致，在此阵中化作被封存的星沙坐标。',
    accent: '#d8a247',
  },
  // 2. 万象建站炼成阵 (原 project / 对应 02_楼阁)
  {
    slug: 'project',
    kind: 'project',
    title: '万象建站炼成阵',
    eyebrow: 'AETHERIC RECONSTRUCTION GRAPH',
    description: '探寻数字迷雾的营造法则。域名敕令、节点部署、DNS 织网、Cloudflare 避雷、Vercel 唤醒与 Quartz 雕琢，皆是可被逆向推演的构筑星轨。',
    accent: '#c8933f',
  },
  // 3. 叶间林径编织手稿 (原 blog-design / 对应 01_天工)
  {
    slug: 'blog-design',
    kind: 'blog-design',
    title: '叶间林径编织手稿',
    eyebrow: 'LEAF-BORDERED SANCTUARY ENTRANCE',
    description: '描绘彼端‘叶间树林’容貌的设计残卷。涵盖门户、文库、图谱大厅之营造图法，此间手稿借由星沙传送阵，与叶间树林的阅读法阵紧密呼应。',
    accent: '#c7a46a',
  },
  // 4. 筑梦现场
  {
    slug: 'dream-site',
    kind: 'dream-site',
    title: '造化筑梦之阶',
    eyebrow: 'GENESIS FABRICATION SITE',
    description: '此间为万物破土之界。以意驭神，构筑大千世界之根基，记录一切重制与超凡创思的炼成仪轨。',
    accent: '#cfa258',
  },
  // 5. 天衡 (流程与规范)
  {
    slug: 'tianheng',
    kind: '天衡',
    title: '天衡星轨纪律',
    eyebrow: 'HEAVENLY BALANCE REGULATION',
    description: '洞悉天道运转之法则。仙门大典之流程、修行契约之规范，于此间被归纳平整，使诸般万象不离常轨。',
    accent: '#cca552',
  },
  // 6. 天工 (美学与设计)
  {
    slug: 'tiangong',
    kind: '天工',
    title: '巧夺天工秘卷',
    eyebrow: 'DIVINE CRAFT DESIGN AESTHETICS',
    description: '仙界奇观之图解，美轮美奂的排版法则与配色心诀，汇聚此中，夺天地之造化以饰仙居门庭。',
    accent: '#c49a45',
  },
  // 7. 楼阁 (页面与开发)
  {
    slug: 'louge',
    kind: '楼阁',
    title: '万象楼阁构筑',
    eyebrow: 'STELLAR PAVILION ARCHITECTURE',
    description: '起手而平地生楼阁，虚实相生。探寻仙网界面的构筑秘符，一砖一瓦皆是仙元演化的代码玉简。',
    accent: '#bfa261',
  },
  // 8. 造物 (玩具与工坊)
  {
    slug: 'zaowu',
    kind: '造物',
    title: '太初造物秘传',
    eyebrow: 'ARCHETYPAL MANUFACTURE WORKSHOP',
    description: '收录工坊之中所铸奇珍傀儡、法宝玩物。奇巧机关，造化玄机，皆可在此间一窥其以气运驭之妙术。',
    accent: '#cca15a',
  },
  // 9. 秘术 / 技术札记
  {
    slug: 'mixu',
    kind: '秘术',
    title: '天玄奥道秘术',
    eyebrow: 'OCCULT AETHERIC METHODOLOGIES',
    description: '修真界诸般攻防真诀，包括系统性技术心得、算法符箓与道法传承，是克敌机先、稳固根基的无上古卷。',
    accent: '#cca362',
  },
  // 兼容老的分类
  {
    slug: 'compiler-theory',
    kind: 'compiler-theory',
    title: '天玄奥道秘术 · 编译卷',
    eyebrow: 'OCCULT AETHERIC METHODOLOGIES',
    description: '修真界诸般攻防真诀，包括系统性技术心得、算法符箓与道法传承，是克敌机先、稳固根基的无上古卷。',
    accent: '#cca362',
  },
  {
    slug: 'linux-notes',
    kind: 'linux-notes',
    title: '天玄奥道秘术 · 筑基卷',
    eyebrow: 'OCCULT AETHERIC METHODOLOGIES',
    description: '修真界诸般攻防真诀，包括系统性技术心得、算法符箓与道法传承，是克敌机先、稳固根基的无上古卷。',
    accent: '#cca362',
  },
  {
    slug: 'embedded',
    kind: 'embedded',
    title: '天玄奥道秘术 · 金石卷',
    eyebrow: 'OCCULT AETHERIC METHODOLOGIES',
    description: '修真界诸般攻防真诀，包括系统性技术心得、算法符箓与道法传承，是克敌机先、稳固根基的无上古卷。',
    accent: '#cca362',
  },
  // 10. 闲情 (幕后与手札)
  {
    slug: 'xianqing',
    kind: '闲情',
    title: '青灯余暇闲情',
    eyebrow: 'TRANQUIL MEDITATION JOURNAL',
    description: '修行有得，提笔著书。红尘游历、心魔感悟与道友杂谈，皆温存入纸，可堪在风定雨歇时佐茶细读。',
    accent: '#caa866',
  },
  {
    slug: 'desk-thoughts',
    kind: 'desk-thoughts',
    title: '青灯余暇闲情 · 案头卷',
    eyebrow: 'TRANQUIL MEDITATION JOURNAL',
    description: '修行有得，提笔著书。红尘游历、心魔感悟与道友杂谈，皆温存入纸，可堪在风定雨歇时佐茶细读。',
    accent: '#caa866',
  },
  {
    slug: 'knowledge-grocery',
    kind: 'knowledge-grocery',
    title: '青灯余暇闲情 · 杂货卷',
    eyebrow: 'TRANQUIL MEDITATION JOURNAL',
    description: '修行有得，提笔著书。红尘游历、心魔感悟与道友杂谈，皆温存入纸，可堪在风定雨歇时佐茶细读。',
    accent: '#caa866',
  },
  // 11. 内功心法
  {
    slug: 'internal-skills',
    kind: 'internal-skills',
    title: '太玄内功心法',
    eyebrow: 'INNER CULTIVATION DIRECTIVES',
    description: '修仙者筑基长生、洗髓伐脉之底层核心心诀。吐纳归真，洗涤俗虑，重塑神识周天之根本。',
    accent: '#cca362',
  },
  // 12. 纪要 (缺陷与工单)
  {
    slug: 'jiyao',
    kind: '纪要',
    title: '业障天道补缀',
    eyebrow: 'AETHERIC REPAIR RESOLUTIONS',
    description: '记载修行中遇阻的天道疏漏与缺陷因果，是消除破障、斩断业报、调顺仙力周天的补天纪要。',
    accent: '#caa75b',
  },
  // 13. 遗迹 (历史陈迹)
  {
    slug: 'yiji',
    kind: '遗迹',
    title: '太古历史遗迹',
    eyebrow: 'ANCIENT ARCHIVE RELICS',
    description: '过往修持之残篇、未尽之演算法阵，虽然尘封已久，却在岁月中凝结为值得回溯警醒的太古遗迹。',
    accent: '#b8a682',
  }
];

const Page = styled.div`
  min-height: 100vh;
  position: relative;
  isolation: isolate;
  overflow-x: hidden;
  background: #07100e;
  color: #f5efe3;

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    z-index: 0;
    background:
      url(${atlasArchiveBg}) center center / cover no-repeat,
      #07100e;
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
  opacity: 0.52;
  background:
    radial-gradient(circle at 22% 30%, rgba(245, 239, 227, 0.12) 0 1px, transparent 2px),
    radial-gradient(circle at 48% 62%, rgba(90, 163, 143, 0.1) 0 1px, transparent 2px),
    radial-gradient(circle at 82% 38%, rgba(231, 199, 126, 0.11) 0 1px, transparent 2px),
    linear-gradient(rgba(215, 187, 135, 0.026) 1px, transparent 1px),
    linear-gradient(90deg, rgba(215, 187, 135, 0.018) 1px, transparent 1px);
  background-size: 180px 180px, 240px 240px, 210px 210px, 52px 52px, 52px 52px;
  mask-image: radial-gradient(circle at 52% 38%, black 0%, black 38%, transparent 82%);
  animation: atlas-dust-drift 34s linear infinite;
`;

const AtlasFrame = ({ children }) => (
  <Page>
    <AtlasStars />
    {children}
  </Page>
);

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
  border: 1px solid rgba(216, 162, 71, 0.34);
  border-left: 2px solid rgba(231, 199, 126, 0.58);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 244, 218, 0.26), rgba(99, 61, 26, 0.2)),
    radial-gradient(circle at 85% 8%, rgba(255, 225, 151, 0.24), transparent 32%),
    rgba(38, 25, 18, 0.46);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 247, 223, 0.24),
    inset 0 0 28px rgba(231, 199, 126, 0.05);
  backdrop-filter: blur(4px) saturate(1.12);
  -webkit-backdrop-filter: blur(4px) saturate(1.12);

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(231, 199, 126, 0.34);
    border-radius: 999px;
  }

  @media (max-width: 780px) {
    position: static;
    max-height: none;
    border-left-width: 1px;
    background: rgba(82, 52, 26, 0.48);
    border-radius: 12px;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
  }
`;

const RailTitle = styled(Link)`
  display: block;
  margin: 0 0.35rem 0.8rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 225, 151, 0.24);
  color: #ffe197;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-shadow: 0 0 16px rgba(231, 199, 126, 0.28);
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
  color: ${({ $active }) => ($active ? '#fff7df' : 'rgba(255, 240, 212, 0.94)')};
  text-shadow: 
    0 1px 2px rgba(12, 9, 6, 0.76),
    ${({ $active }) => ($active ? '0 0 10px rgba(231, 199, 126, 0.42)' : 'none')};
  background: ${({ $active, $accent }) => ($active ? `linear-gradient(90deg, ${$accent}30, rgba(255, 247, 223, 0.08))` : 'transparent')};
  border: 1px solid ${({ $active, $accent }) => ($active ? `${$accent}66` : 'transparent')};
  font-size: 0.8rem;
  text-decoration: none;
  line-height: 1.25;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $accent }) => $accent};
    box-shadow: ${({ $active, $accent }) => ($active ? `0 0 14px ${$accent}` : `0 0 8px ${$accent}80`)};
  }

  &:hover {
    color: #fff7df;
    background: rgba(255, 225, 151, 0.12);
    border-color: rgba(255, 225, 151, 0.28);
    transform: translateX(2px);
  }
`;

const Count = styled.span`
  color: rgba(255, 225, 151, 0.78);
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
`;

const Main = styled.main`
  min-width: 0;
  padding: clamp(1.3rem, 4vw, 3rem) 0 clamp(2rem, 5vw, 4rem);
`;

const Hero = styled.section`
  padding-bottom: 1.2rem;
  border-bottom: 1px solid rgba(223, 198, 146, 0.24);
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
  color: #fff7df;
  font-size: clamp(2.3rem, 7vw, 5.2rem);
  font-weight: 300;
  line-height: 1.02;
  text-shadow: 
    0 0 12px rgba(231, 199, 126, 0.35),
    0 2px 4px rgba(0, 0, 0, 0.8);
`;

const Lead = styled.p`
  width: min(780px, 100%);
  margin: 1rem 0 0;
  color: rgba(245, 239, 227, 0.72);
  font-size: clamp(1rem, 1.5vw, 1.16rem);
  line-height: 1.8;
`;

const SectionTitle = styled.h2`
  margin: 2rem 0 0.8rem;
  color: #e7c77e;
  font-size: 1.15rem;
  font-weight: 900;
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
  border: 1px solid rgba(231, 199, 126, 0.28);
  border-left: 2px solid ${({ $accent }) => `${$accent}aa`};
  background:
    linear-gradient(135deg, rgba(10, 20, 34, 0.72), rgba(20, 16, 23, 0.46)),
    radial-gradient(circle at 82% 14%, ${({ $accent }) => `${$accent}22`}, transparent 36%),
    rgba(8, 13, 22, 0.36);
  color: #f5efe3;
  backdrop-filter: blur(3px) saturate(1.08);
  -webkit-backdrop-filter: blur(3px) saturate(1.08);
  box-shadow:
    0 18px 38px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 247, 223, 0.06);
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
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
    color: #f5d98f;
    text-shadow: 0 1px 2px rgba(12, 9, 6, 0.78);
  }

  span {
    align-self: end;
    color: rgba(245, 239, 227, 0.72);
    font-size: 0.9rem;
    line-height: 1.55;
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
  border: 1px solid rgba(231, 199, 126, 0.22);
  background: rgba(10, 20, 34, 0.48);
  color: #f5efe3;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  text-decoration: none;

  &:hover {
    border-color: ${({ $accent }) => $accent};
    background: rgba(231, 199, 126, 0.1);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.94rem;
    color: #fff7df;
  }

  span {
    color: rgba(245, 217, 143, 0.62);
    font-size: 0.72rem;
  }
`;

const TreeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background:
    linear-gradient(135deg, rgba(255, 244, 218, 0.32), rgba(111, 72, 28, 0.22)),
    radial-gradient(circle at 82% 10%, rgba(255, 225, 151, 0.24), transparent 34%),
    rgba(38, 25, 18, 0.44);
  border: 1px solid rgba(216, 162, 71, 0.34);
  border-left: 2px solid rgba(231, 199, 126, 0.54);
  border-radius: 10px;
  padding: 1.1rem;
  margin-top: 1rem;
  outline: 1px solid rgba(255, 247, 223, 0.18);
  outline-offset: -4px;
  box-shadow:
    0 22px 50px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 247, 223, 0.22),
    inset 0 0 24px rgba(231, 199, 126, 0.06);
  backdrop-filter: blur(4px) saturate(1.12);
  -webkit-backdrop-filter: blur(4px) saturate(1.12);
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
    background: rgba(255, 225, 151, 0.12);
  }
`;

const FolderRow = styled(TreeRow)`
  color: #ffe197;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(12, 9, 6, 0.74);
`;

const FileRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  color: rgba(255, 240, 212, 0.84);
  text-decoration: none;
  min-width: 0;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${({ $accent }) => `${$accent}18`};
    color: #fff7df;
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
  color: rgba(255, 225, 151, 0.64);
  margin-left: 0.35rem;
  font-weight: normal;
`;

const FileMeta = styled.span`
  font-size: 0.72rem;
  color: rgba(255, 225, 151, 0.56);
  margin-left: auto;
  padding-left: 0.5rem;
  flex-shrink: 0;
`;

const SubTree = styled.div`
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px dashed rgba(255, 225, 151, 0.28);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

function DirectoryNode({ node, accent, expandedPaths, onToggle }) {
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
        <FolderRow onClick={() => onToggle(node.path)}>
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
  border: 1px solid rgba(216, 162, 71, 0.36);
  border-left: 2.5px solid rgba(231, 199, 126, 0.7);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(255, 244, 218, 0.08), rgba(99, 61, 26, 0.04)),
    radial-gradient(circle at 82% 10%, rgba(255, 225, 151, 0.24), transparent 34%),
    rgba(28, 18, 12, 0.52);
  color: #fff7df;
  overflow: hidden;
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 247, 223, 0.22);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 50px;
  padding: 0 0.9rem;
  border-bottom: 1px solid rgba(216, 162, 71, 0.24);
  background: rgba(20, 13, 8, 0.45);
`;

const PanelTitle = styled.span`
  color: #ffe197;
  font-size: 0.86rem;
  font-weight: 900;
  letter-spacing: 0.04em;
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
  border: 1px solid rgba(216, 162, 71, 0.4);
  background: rgba(28, 18, 12, 0.6);
  color: #ffe197;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -6px;
    width: 10px;
    height: 10px;
    border-right: 1px solid rgba(216, 162, 71, 0.4);
    border-bottom: 1px solid rgba(216, 162, 71, 0.4);
    background: rgba(28, 18, 12, 0.6);
    transform: translateX(-50%) rotate(45deg);
    transition: border-color 0.18s ease, background 0.18s ease;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: #c49a45;
    background: rgba(216, 162, 71, 0.2);
    color: #fff7df;
    box-shadow: 0 0 18px rgba(216, 162, 71, 0.3);
  }

  &:hover::after {
    border-color: #c49a45;
    background: rgba(216, 162, 71, 0.2);
  }
`;

const GraphIcon = styled(Link)`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #ffe197;
  font-size: 1.35rem;
  font-weight: 900;
  transition: transform 0.18s ease, color 0.18s ease, text-shadow 0.18s ease;

  &:hover {
    color: #fff7df;
    text-shadow: 0 0 16px rgba(216, 162, 71, 0.48);
    transform: translate(2px, -2px);
  }
`;

const PreviewBody = styled.div`
  aspect-ratio: 1 / 1;
  min-height: 280px;
  background: rgba(0, 0, 0, 0.15);

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
  background: rgba(0, 0, 0, 0.15);

  a,
  span {
    color: rgba(255, 240, 212, 0.84);
    font-size: 0.88rem;
  }

  a:hover {
    color: #ffe197;
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
      : new Promise((resolve) => {
          const img = new Image();
          img.src = atlasArchiveBg;
          img.onload = () => {
            isBgPreloaded = true;
            resolve();
          };
          img.onerror = () => {
            isBgPreloaded = true;
            resolve();
          };
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
            {item.title}
            <Count>{counts.get(item.kind) ?? 0}</Count>
          </NavLink>
        ))}
      </NavList>
    </Rail>
  );
}

function RightSidebar({ graphData, indexData, activeCollection }) {
  const location = useLocation();
  const activeKind = activeCollection?.kind ?? null;
  const previewGraph = useMemo(
    () => (activeKind ? filterGraphByCollection(graphData, activeKind) : normalizeGraph(graphData)),
    [activeKind, graphData]
  );
  const stats = useMemo(() => getGraphStats(previewGraph), [previewGraph]);
  const graphHref = activeKind ? `/graph?collection=${encodeURIComponent(activeKind)}` : '/graph';

  return (
    <RightPanel>
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
            theme="publishGlobal"
            expandHref={graphHref}
          />
        </PreviewBody>
      </PreviewPanel>
      <PreviewPanel>
        <PanelHeader>
          <PanelTitle>发布档案</PanelTitle>
        </PanelHeader>
        <SideList>
          <Link to={graphHref} state={{ backgroundLocation: location }}>打开当前图谱</Link>
          {activeKind ? (
            <Link to="/graph" state={{ backgroundLocation: location }}>切到全站图谱</Link>
          ) : (
            <Link to="/atlas/travel">查看旅游图谱</Link>
          )}
          <span>笔记：{stats.nodeCount || indexData.notes.length}</span>
          <span>关系：{stats.linkCount}</span>
          <span>来源：Obsidian 选择性发布</span>
        </SideList>
      </PreviewPanel>
    </RightPanel>
  );
}

function AtlasHall({ graphData, indexData, counts, collections }) {
  return (
    <AtlasFrame>
      <Shell>
        <AtlasRail activeSlug="hall" counts={counts} collections={collections} />
        <Main>
          <Hero id="overview">
            <Eyebrow $accent="#e7c77e">STELLAR SANDS ASTROLABE</Eyebrow>
            <Title
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
              <CollectionCard key={item.slug} to={`/atlas/${item.slug}`} $accent={item.accent}>
                <strong>{item.title}</strong>
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
        <RightSidebar graphData={graphData} indexData={indexData} />
      </Shell>
    </AtlasFrame>
  );
}

function AtlasDetail({ collection, graphData, indexData, counts, collections }) {
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
    <AtlasFrame>
      <Shell>
        <AtlasRail activeSlug={collection.slug} counts={counts} collections={collections} />
        <Main>
          <Hero id="overview">
            <Eyebrow $accent={collection.accent}>{collection.eyebrow}</Eyebrow>
            <Title
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              {collection.title}
            </Title>
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
                />
              ))
            ) : (
              <span style={{ fontSize: '0.88rem', color: 'rgba(245,239,227,0.4)', padding: '0.5rem' }}>
                暂无相关笔记数据
              </span>
            )}
          </TreeContainer>
        </Main>
        <RightSidebar graphData={graphData} indexData={indexData} activeCollection={collection} />
      </Shell>
    </AtlasFrame>
  );
}

export default function Atlas() {
  const { type } = useParams();
  const { graphData, indexData, loading } = useAtlasData();
  const counts = useMemo(() => getCollectionCounts(indexData), [indexData]);

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
        />
      ) : (
        <AtlasDetail
          collection={currentCollection}
          graphData={graphData}
          indexData={indexData}
          counts={counts}
          collections={collections}
        />
      )}
    </>
  );
}
