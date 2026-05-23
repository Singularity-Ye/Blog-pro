import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import MiniGraph from '../components/GraphView/MiniGraph';
import {
  filterGraphByCollection,
  getGraphStats,
  normalizeGraph,
} from '../utils/graphFilters';
import atlasArchiveBg from '../assets/images/atlas/pinecone-observatory-bg.png';

const COLLECTIONS = [
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

const collectionBySlug = new Map(COLLECTIONS.map((item) => [item.slug, item]));

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

function useAtlasData() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [indexData, setIndexData] = useState({ notes: [], collections: [] });

  useEffect(() => {
    fetch('/graph.json')
      .then((response) => response.json())
      .then(setGraphData)
      .catch(() => setGraphData({ nodes: [], links: [] }));

    fetch('/notes-index.json')
      .then((response) => response.json())
      .then(setIndexData)
      .catch(() => setIndexData({ notes: [], collections: [] }));
  }, []);

  return { graphData, indexData };
}

function AtlasRail({ activeSlug, counts }) {
  return (
    <Rail>
      <RailTitle to="/atlas">图谱大厅</RailTitle>
      <NavList aria-label="已发布 Obsidian 内容">
        {COLLECTIONS.map((item) => (
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

function AtlasHall({ graphData, indexData, counts }) {
  return (
    <Page>
      <Shell>
        <AtlasRail activeSlug="hall" counts={counts} />
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
            {COLLECTIONS.map((item) => (
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

function AtlasDetail({ collection, graphData, indexData, counts }) {
  const notes = useMemo(
    () => indexData.notes.filter((note) => note.collection === collection.kind),
    [collection.kind, indexData.notes]
  );

  return (
    <Page>
      <Shell>
        <AtlasRail activeSlug={collection.slug} counts={counts} />
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

          <SectionTitle id="notes">笔记入口</SectionTitle>
          <NoteList>
            {notes.map((note) => (
              <NoteItem key={note.slug} to={`/note/${note.slug}`} $accent={collection.accent}>
                <strong>{note.title}</strong>
                <span>{note.tags?.slice(0, 2).join(' / ') || note.path}</span>
              </NoteItem>
            ))}
          </NoteList>
        </Main>
        <RightSidebar graphData={graphData} indexData={indexData} activeCollection={collection} />
      </Shell>
    </Page>
  );
}

export default function Atlas() {
  const { type } = useParams();
  const { graphData, indexData } = useAtlasData();
  const counts = useMemo(() => getCollectionCounts(indexData), [indexData]);
  const currentCollection = type ? collectionBySlug.get(type) : null;

  if (!type) {
    return <AtlasHall graphData={graphData} indexData={indexData} counts={counts} />;
  }

  if (!currentCollection) {
    return <Navigate to="/atlas" replace />;
  }

  return (
    <AtlasDetail
      collection={currentCollection}
      graphData={graphData}
      indexData={indexData}
      counts={counts}
    />
  );
}
