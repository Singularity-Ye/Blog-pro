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
import atlasArchiveBg from '../assets/images/atlas/pinecone-observatory-bg.png';

const METADATA_COLLECTIONS = [
  {
    slug: 'travel',
    kind: 'travel',
    title: '杭州五一旅游攻略',
    eyebrow: '旅行笔记库',
    description: '路线、景点、美食、活动与逐日计划组成的旅行知识地图。',
    accent: '#5aa38f',
  },
  {
    slug: 'project',
    kind: 'project',
    title: '建站流程指南',
    eyebrow: '发布流程库',
    description: '域名、部署、DNS、Cloudflare、Vercel 与 Quartz 建站流程。',
    accent: '#c8933f',
  },
  {
    slug: 'blog-design',
    kind: 'blog-design',
    title: '博客网站设计思路',
    eyebrow: '松果屋设计档案',
    description: '首页、博客页、图谱页、交互物件和视觉资产的设计记录。',
    accent: '#9b8ac7',
  },
];

const Page = styled.div`
  min-height: 100vh;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(5, 12, 10, 0.16), rgba(8, 15, 14, 0.1) 44%, rgba(11, 8, 5, 0.28)),
    linear-gradient(180deg, rgba(5, 10, 8, 0.06), rgba(5, 10, 8, 0.34)),
    url(${atlasArchiveBg}) center top / cover fixed,
    #122018;
  color: #f5efe3;

  &::before,
  &::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    z-index: -2;
    opacity: 0.16;
    background:
      linear-gradient(rgba(215, 187, 135, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(215, 187, 135, 0.025) 1px, transparent 1px),
      radial-gradient(circle at 22% 30%, rgba(245, 239, 227, 0.05), transparent 18%),
      radial-gradient(circle at 74% 62%, rgba(199, 147, 63, 0.05), transparent 20%);
    background-size: 46px 46px, 46px 46px, 100% 100%, 100% 100%;
    mask-image: radial-gradient(circle at 50% 42%, black, transparent 78%);
  }

  &::after {
    z-index: -1;
    opacity: 0.42;
    background:
      radial-gradient(circle at 18% 24%, rgba(246, 213, 139, 0.12) 0 1px, transparent 2px),
      radial-gradient(circle at 48% 62%, rgba(90, 163, 143, 0.1) 0 1px, transparent 2px),
      radial-gradient(circle at 82% 38%, rgba(245, 239, 227, 0.08) 0 1px, transparent 2px);
    background-size: 180px 180px, 240px 240px, 210px 210px;
    animation: atlas-dust-drift 28s linear infinite;
  }

  @keyframes atlas-dust-drift {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-90px, 70px, 0); }
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
    background: linear-gradient(90deg, transparent, #5aa38f, transparent);
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
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(210px, 260px) minmax(0, 1fr) minmax(300px, 380px);
  gap: clamp(1rem, 2vw, 1.5rem);
  width: min(1500px, 100%);
  margin: 0 auto;
  padding: clamp(1rem, 2.5vw, 2rem);

  @media (max-width: 1120px) {
    grid-template-columns: minmax(190px, 230px) minmax(0, 1fr);
  }

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const Rail = styled.aside`
  position: sticky;
  top: 1.25rem;
  align-self: start;
  min-height: calc(100vh - 2.5rem);
  padding: 1rem 0.8rem;
  border-right: 1px solid rgba(223, 198, 146, 0.18);

  @media (max-width: 780px) {
    position: static;
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid rgba(223, 198, 146, 0.18);
  }
`;

const RailTitle = styled(Link)`
  display: block;
  margin-bottom: 1rem;
  color: #e7c77e;
  font-size: 0.9rem;
  font-weight: 900;
  letter-spacing: 0.12em;
`;

const NavList = styled.nav`
  display: grid;
  gap: 0.45rem;
`;

const NavLink = styled(Link)`
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  gap: 0.65rem;
  min-height: 44px;
  padding: 0.55rem 0.65rem;
  border-radius: 6px;
  color: ${({ $active }) => ($active ? '#fff7df' : 'rgba(245, 239, 227, 0.68)')};
  background: ${({ $active, $accent }) => ($active ? `${$accent}1f` : 'transparent')};
  border: 1px solid ${({ $active, $accent }) => ($active ? `${$accent}55` : 'transparent')};
  font-size: 0.88rem;
  line-height: 1.25;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $accent }) => $accent};
    box-shadow: 0 0 14px ${({ $accent }) => $accent};
  }

  &:hover {
    color: #fff7df;
    background: rgba(255, 255, 255, 0.06);
  }
`;

const Count = styled.span`
  color: rgba(245, 239, 227, 0.45);
  font-size: 0.72rem;
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
  border-radius: 8px;
  border: 1px solid ${({ $accent }) => `${$accent}35`};
  background:
    linear-gradient(135deg, ${({ $accent }) => `${$accent}20`}, rgba(231, 199, 126, 0.055)),
    rgba(9, 19, 17, 0.76);
  color: #fff7df;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ $accent }) => `${$accent}aa`};
  }

  strong {
    font-size: 1.12rem;
    line-height: 1.25;
  }

  span {
    align-self: end;
    color: rgba(245, 239, 227, 0.68);
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
  border: 1px solid rgba(223, 198, 146, 0.16);
  background: rgba(10, 23, 20, 0.68);
  color: #fff7df;

  &:hover {
    border-color: ${({ $accent }) => `${$accent}77`};
    background: ${({ $accent }) => `${$accent}16`};
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.94rem;
  }

  span {
    color: rgba(245, 239, 227, 0.46);
    font-size: 0.72rem;
  }
`;

const TreeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: rgba(10, 23, 20, 0.48);
  border: 1px solid rgba(223, 198, 146, 0.12);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
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
    background: rgba(255, 255, 255, 0.04);
  }
`;

const FolderRow = styled(TreeRow)`
  color: #fff7df;
  font-weight: 600;
`;

const FileRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  color: rgba(245, 239, 227, 0.85);
  text-decoration: none;
  min-width: 0;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${({ $accent }) => `${$accent}16`};
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
  color: rgba(245, 239, 227, 0.36);
  margin-left: 0.35rem;
  font-weight: normal;
`;

const FileMeta = styled.span`
  font-size: 0.72rem;
  color: rgba(245, 239, 227, 0.38);
  margin-left: auto;
  padding-left: 0.5rem;
  flex-shrink: 0;
`;

const SubTree = styled.div`
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px dashed rgba(223, 198, 146, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
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
    stroke="rgba(245, 239, 227, 0.65)"
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
  border: 1px solid rgba(91, 70, 48, 0.28);
  background: #f1eadb;
  color: #362d22;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.18);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 50px;
  padding: 0 0.9rem;
  border-bottom: 1px solid rgba(91, 70, 48, 0.22);
  background:
    linear-gradient(90deg, rgba(255, 250, 238, 0.88), rgba(241, 234, 219, 0.78)),
    #f1eadb;
`;

const PanelTitle = styled.span`
  color: #362d22;
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
  border: 1px solid rgba(36, 91, 74, 0.24);
  background: rgba(255, 250, 238, 0.78);
  color: #245b4a;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.03em;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -6px;
    width: 10px;
    height: 10px;
    border-right: 1px solid rgba(36, 91, 74, 0.24);
    border-bottom: 1px solid rgba(36, 91, 74, 0.24);
    background: rgba(255, 250, 238, 0.78);
    transform: translateX(-50%) rotate(45deg);
  }
`;

const GraphIcon = styled(Link)`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #245b4a;
  font-size: 1.35rem;
  font-weight: 900;
`;

const PreviewBody = styled.div`
  aspect-ratio: 1 / 1;
  min-height: 280px;

  .mini-graph-container {
    height: 100%;
    border: 0;
  }
`;

const SideList = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.9rem;
  background: rgba(255, 251, 241, 0.35);

  a,
  span {
    color: rgba(54, 45, 34, 0.74);
    font-size: 0.88rem;
  }

  a:hover {
    color: #245b4a;
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
    <Page>
      <Shell>
        <AtlasRail activeSlug="hall" counts={counts} collections={collections} />
        <Main>
          <Hero id="overview">
            <Eyebrow $accent="#e7c77e">Pinecone Archive</Eyebrow>
            <Title
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              图谱大厅
            </Title>
            <Lead>
              这里展示的是从 Obsidian Vault 选择性发布到博客站点的真实笔记网络。
              右侧关系图谱会按当前内容区过滤，展开后进入当前分类的全局图谱。
            </Lead>
          </Hero>
 
          <SectionTitle id="entries">已发布内容区</SectionTitle>
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
 
          <SectionTitle id="notes">最近发布的笔记</SectionTitle>
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
    </Page>
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
    <Page>
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
    </Page>
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
      const matched = METADATA_COLLECTIONS.find((item) => item.kind === c.kind);
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
