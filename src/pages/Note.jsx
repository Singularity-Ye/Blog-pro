import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styled from 'styled-components';
import MiniGraph from '../components/GraphView/MiniGraph';
import { filterGraphByLocal } from '../utils/graphFilters';
import atlasArchiveBg from '../assets/images/atlas/pinecone-observatory-bg.png';

// ── 样式 ──────────────────────────────────────────────────────

const NoteLayout = styled.div`
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  gap: 2rem;
  min-height: 100vh;
  position: relative;
  isolation: isolate;

  &::before,
  &::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    z-index: -2;
    background:
      linear-gradient(90deg, rgba(5, 12, 10, 0.2), rgba(8, 15, 14, 0.12) 46%, rgba(10, 7, 5, 0.34)),
      linear-gradient(180deg, rgba(5, 10, 8, 0.12), rgba(5, 10, 8, 0.48)),
      url(${atlasArchiveBg}) center top / cover fixed,
      #122018;
  }

  &::after {
    z-index: -1;
    opacity: 0.16;
    background:
      linear-gradient(rgba(215, 187, 135, 0.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(215, 187, 135, 0.022) 1px, transparent 1px),
      radial-gradient(circle at 24% 24%, rgba(246, 213, 139, 0.1) 0 1px, transparent 2px),
      radial-gradient(circle at 72% 66%, rgba(90, 163, 143, 0.08) 0 1px, transparent 2px);
    background-size: 48px 48px, 48px 48px, 190px 190px, 230px 230px;
    mask-image: radial-gradient(circle at 50% 40%, black, transparent 80%);
    animation: note-dust-drift 30s linear infinite;
  }

  @keyframes note-dust-drift {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-80px, 64px, 0); }
  }
`;

const NoteContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NoteSidebar = styled.aside`
  width: 300px;
  flex-shrink: 0;
  align-self: stretch; /* Stretch to parent height to allow inner children to stick */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 900px) {
    display: none;
  }
`;

const TocContainer = styled.div`
  background: rgba(9, 19, 17, 0.72);
  border: 1px solid rgba(231, 199, 126, 0.16);
  border-radius: 8px;
  padding: 1rem;
`;

const StickyTocContainer = styled(TocContainer)`
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;

  /* Custom scrollbar to keep it premium */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(223, 198, 146, 0.2);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(223, 198, 146, 0.4);
  }
`;

const TocTitle = styled.div`
  font-size: 0.75rem;
  color: rgba(231, 199, 126, 0.72);
  font-weight: 500;
  margin-bottom: 0.75rem;
`;

const TocList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const TocItem = styled.li`
  padding: 4px 0;
  padding-left: ${props => (props.$level - 1) * 12}px;
  font-size: 0.8rem;
  a {
    color: rgba(245, 239, 227, 0.62);
    transition: color 0.2s;
    &:hover { color: #e7c77e; }
  }
`;

const NoteTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #fff7df;
  margin-bottom: 0.5rem;
`;

const NoteMeta = styled.div`
  font-size: 0.8rem;
  color: rgba(245, 239, 227, 0.42);
  margin-bottom: 2rem;
`;

const PropertyPanel = styled.section`
  display: grid;
  gap: 0.75rem;
  margin: 1.4rem 0 1.8rem;
  padding: 1rem;
  border: 1px solid rgba(231, 199, 126, 0.22);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 247, 223, 0.12), rgba(9, 19, 17, 0.66)),
    rgba(9, 19, 17, 0.72);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.16);
`;

const PropertyTitle = styled.div`
  color: #e7c77e;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.55rem;
`;

const PropertyItem = styled.div`
  min-width: 0;
  padding: 0.55rem 0.65rem;
  border: 1px solid rgba(231, 199, 126, 0.14);
  border-radius: 6px;
  background: rgba(4, 12, 10, 0.34);

  span {
    display: block;
    margin-bottom: 0.18rem;
    color: rgba(245, 239, 227, 0.48);
    font-size: 0.68rem;
  }

  strong {
    display: block;
    overflow: hidden;
    color: #fff7df;
    font-size: 0.86rem;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.1rem;
`;

const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  max-width: 100%;
  margin: 0;
  padding: 0.1rem 0.46rem;
  border: 1px solid rgba(90, 163, 143, 0.26);
  border-radius: 999px;
  background: rgba(90, 163, 143, 0.12);
  color: rgba(245, 239, 227, 0.82);
  font-size: 0.72rem;
  line-height: 1.2;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  width: fit-content;
  padding: 0.5rem 1.2rem;
  border: 1px solid rgba(231, 199, 126, 0.3);
  border-radius: 20px;
  background: rgba(9, 19, 17, 0.6);
  backdrop-filter: blur(4px);
  font-size: 0.8rem;
  color: #fff7df;
  font-weight: 500;
  letter-spacing: 0.05em;
  margin-bottom: 1.8rem;
  cursor: pointer;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 0 8px rgba(231, 199, 126, 0.05);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  svg {
    transition: transform 0.3s ease;
    stroke: #e7c77e;
  }

  &:hover {
    color: #fff;
    background: rgba(231, 199, 126, 0.12);
    border-color: #e7c77e;
    box-shadow: 
      0 6px 16px rgba(231, 199, 126, 0.15),
      inset 0 0 12px rgba(231, 199, 126, 0.1);
    transform: translateY(-1px);

    svg {
      transform: translateX(-4px);
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

// Markdown 内容样式
const MarkdownBody = styled.div`
  color: #f5efe3;
  line-height: 1.8;
  font-size: 0.95rem;

  h1, h2, h3, h4, h5, h6 {
    color: #fff7df;
    font-weight: 600;
    margin: 2rem 0 0.75rem;
    scroll-margin-top: 80px;
  }
  h1 { font-size: 1.6rem; }
  h2 { font-size: 1.35rem; border-bottom: 1px solid rgba(231, 199, 126, 0.16); padding-bottom: 0.3rem; }
  h3 { font-size: 1.15rem; }

  p { margin: 0.75rem 0; }

  a {
    color: #e7c77e;
    text-decoration: none;
    border-bottom: 1px solid rgba(231, 199, 126, 0.3);
    transition: border-color 0.2s;
    &:hover { border-color: #fff7df; }
  }

  .unresolved-wikilink {
    color: rgba(245, 239, 227, 0.56);
    border-bottom: 1px dashed rgba(231, 199, 126, 0.34);
    cursor: help;
  }

  code {
    background: rgba(231, 199, 126, 0.1);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.85em;
    font-family: 'IBM Plex Mono', 'Fira Code', monospace;
  }

  pre {
    background: rgba(9, 19, 17, 0.76);
    border: 1px solid rgba(231, 199, 126, 0.16);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    code { background: none; padding: 0; }
  }

  blockquote {
    border-left: 3px solid rgba(231, 199, 126, 0.42);
    padding: 0.5rem 1rem;
    margin: 1rem 0;
    color: rgba(245, 239, 227, 0.72);
    background: rgba(231, 199, 126, 0.07);
    border-radius: 0 8px 8px 0;
  }

  ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; }
  li { margin: 0.25rem 0; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    th, td {
      border: 1px solid rgba(231, 199, 126, 0.16);
      padding: 8px 12px;
      text-align: left;
    }
    th { background: rgba(231, 199, 126, 0.1); font-weight: 600; }
  }

  img {
    max-width: 100%;
    border-radius: 8px;
  }

  hr {
    border: none;
    border-top: 1px solid rgba(231, 199, 126, 0.16);
    margin: 2rem 0;
  }
`;

// ── Wikilink 处理 ─────────────────────────────────────────────

function toNoteHref(slug) {
  return `/note/${String(slug).split('/').map(encodeURIComponent).join('/')}`;
}

function normalizeLinkKey(value) {
  return String(value || '').trim().replace(/\.md$/i, '').toLowerCase();
}

function getIndexCandidates(index, group, key) {
  const value = index?.[group]?.[normalizeLinkKey(key)];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function chooseWikilinkCandidate(candidates, sourceSlug, sourceCollectionRoot) {
  const unique = [...new Set(candidates.filter(Boolean))];
  if (unique.length <= 1) return { slug: unique[0] || null, status: unique[0] ? 'resolved' : 'unresolved' };

  const sourceDir = sourceSlug.split('/').slice(0, -1).join('/');
  const sameDir = unique.filter((slug) => slug.split('/').slice(0, -1).join('/') === sourceDir);
  if (sameDir.length === 1) return { slug: sameDir[0], status: 'resolved' };

  const sameCollection = unique.filter((slug) => slug.startsWith(`${sourceCollectionRoot}/`));
  if (sameCollection.length === 1) return { slug: sameCollection[0], status: 'resolved' };

  return { slug: null, status: 'ambiguous' };
}

/** 将 [[wikilink]] 语法转为站内笔记链接 */
function remarkWikilinks(options = {}) {
  const resolveWikilink = options.resolve;
  return (tree) => {
    const visit = (node, parent) => {
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          visit(node.children[i], node);
        }
      }
      if (node.type === 'text' && parent) {
        const regex = /\[\[([^\]|#]+)(?:\|([^\]]*))?(?:#[^\]]*)?\]\]/g;
        let match;
        const parts = [];
        let lastIndex = 0;

        while ((match = regex.exec(node.value)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
          }
          const target = match[1].trim();
          const display = match[2] ? match[2].trim() : target;
          const result = resolveWikilink?.(target);
          const resolvedSlug = typeof result === 'string' ? result : result?.slug;
          if (resolvedSlug && result?.status !== 'ambiguous') {
            parts.push({
              type: 'link',
              url: toNoteHref(resolvedSlug),
              children: [{ type: 'text', value: display }],
            });
          } else {
            parts.push({
              type: 'link',
              url: `#${result?.status === 'ambiguous' ? 'wikilink-ambiguous' : 'wikilink-unresolved'}:${encodeURIComponent(target)}`,
              children: [{ type: 'text', value: display }],
            });
          }
          lastIndex = match.index + match[0].length;
        }

        if (parts.length > 0) {
          if (lastIndex < node.value.length) {
            parts.push({ type: 'text', value: node.value.slice(lastIndex) });
          }
          const idx = parent.children.indexOf(node);
          parent.children.splice(idx, 1, ...parts);
        }
      }
    };
    visit(tree, null);
  };
}

// ── 提取标题目录 ──────────────────────────────────────────────

function extractHeadings(markdown) {
  const headings = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        id: match[2].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, ''),
      });
    }
  }
  return headings;
}

const PROPERTY_LABELS = {
  type: '类型',
  name: '名称',
  city: '城市',
  district: '区域',
  category: '分类',
  duration: '建议停留',
  date: '日期',
  open_time: '开放时间',
  price: '价格',
  ticket: '票价',
  verified: '已核验',
  source: '来源',
  tags: '标签',
};

const PROPERTY_ORDER = [
  'type',
  'name',
  'city',
  'district',
  'category',
  'duration',
  'date',
  'open_time',
  'price',
  'ticket',
  'verified',
  'source',
  'tags',
];

const TYPE_LABELS = {
  place: '地点',
  note: '笔记',
  project: '项目',
  guide: '指南',
};

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') return '是';
  if (trimmed === 'false') return '否';
  if (trimmed === '[]') return '';
  return trimmed.replace(/^["']|["']$/g, '');
}

function parseFrontmatter(markdown) {
  const normalized = String(markdown || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { body: markdown, properties: [] };

  const raw = match[1].split('\n');
  const data = {};
  let currentKey = null;

  for (const line of raw) {
    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentKey) {
      data[currentKey] = [...(Array.isArray(data[currentKey]) ? data[currentKey] : []), parseValue(listItem[1])];
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    currentKey = pair[1];
    data[currentKey] = pair[2] ? parseValue(pair[2]) : [];
  }

  const properties = PROPERTY_ORDER
    .filter((key) => data[key] && PROPERTY_LABELS[key])
    .map((key) => {
      const value = Array.isArray(data[key]) ? data[key].filter(Boolean) : data[key];
      return {
        key,
        label: PROPERTY_LABELS[key],
        value: key === 'type' ? (TYPE_LABELS[value] || value) : value,
      };
    })
    .filter((item) => (Array.isArray(item.value) ? item.value.length : item.value));

  return {
    body: normalized.slice(match[0].length),
    properties,
  };
}

function getDisplayValue(value) {
  return Array.isArray(value) ? value.join(' / ') : value;
}

// ── 主组件 ────────────────────────────────────────────────────

export default function Note() {
  const { '*': slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState(null);

  const decodedSlug = useMemo(() => decodeURIComponent(slug || ''), [slug]);

  const handleBackClick = () => {
    const fromBook = location.state?.fromBook;
    const activeTab = location.state?.activeTab;
    if (fromBook) {
      navigate('/blog', { state: { openBook: fromBook, activeTab } });
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/blog');
      }
    }
  };

  // 加载图谱数据
  useEffect(() => {
    fetch('/graph.json')
      .then(r => r.json())
      .then(setGraphData)
      .catch(console.error);
  }, []);

  // 加载笔记内容
  useEffect(() => {
    if (!decodedSlug) return;
    setLoading(true);
    setError(null);

    fetch(`/notes/${decodedSlug}.md`)
      .then(r => {
        if (!r.ok) throw new Error(`笔记未找到: ${decodedSlug}`);
        return r.text();
      })
      .then(text => {
        setMarkdown(text);
        // 提取标题
        const parsed = parseFrontmatter(text);
        const fmTitle = text.replace(/\r\n?/g, '\n').match(/^---\n[\s\S]*?^title:\s*["']?(.+?)["']?\s*$/m);
        const h1Title = parsed.body.match(/^#\s+(.+)$/m);
        const fileName = decodedSlug.split('/').pop();
        setTitle(fmTitle?.[1] || h1Title?.[1] || fileName);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [decodedSlug]);

  const parsedNote = useMemo(() => parseFrontmatter(markdown), [markdown]);
  const headings = useMemo(() => extractHeadings(parsedNote.body), [parsedNote.body]);
  const localGraphData = useMemo(
    () => (graphData ? filterGraphByLocal(graphData, decodedSlug) : null),
    [decodedSlug, graphData]
  );
  const currentNode = useMemo(
    () => graphData?.nodes?.find((node) => node.id === decodedSlug || node.slug === decodedSlug) ?? null,
    [decodedSlug, graphData]
  );
  const wikilinkResolver = useMemo(() => {
    const sourceCollectionRoot = decodedSlug.split('/')[0] || currentNode?.collection || '';
    const sourceDir = decodedSlug.split('/').slice(0, -1).join('/');
    const index = graphData?.wikilinkIndex;

    if (index) {
      return (target) => {
        const cleanTarget = String(target).split('#')[0].split('^')[0];
        const key = normalizeLinkKey(cleanTarget);

        if (key.includes('/')) {
          return chooseWikilinkCandidate([
            ...getIndexCandidates(index, 'pathIndex', key),
            ...getIndexCandidates(index, 'pathIndex', `${sourceDir}/${key}`),
            ...getIndexCandidates(index, 'pathIndex', `${sourceCollectionRoot}/${key}`),
          ], decodedSlug, sourceCollectionRoot);
        }

        return chooseWikilinkCandidate([
          ...getIndexCandidates(index, 'pathIndex', `${sourceDir}/${key}`),
          ...getIndexCandidates(index, 'aliasIndex', key),
          ...getIndexCandidates(index, 'titleIndex', key),
          ...getIndexCandidates(index, 'basenameIndex', key),
          ...getIndexCandidates(index, 'pathIndex', key),
        ], decodedSlug, sourceCollectionRoot);
      };
    }

    return (target) => {
      const linkMap = new Map();
      for (const node of graphData?.nodes ?? []) {
        const slugValue = node.slug || node.id;
        const fileName = slugValue?.split('/').pop();
        const candidates = [node.title, node.id, node.slug, node.path, fileName, ...(node.aliases || [])];
        for (const candidate of candidates) {
          const mapKey = normalizeLinkKey(candidate);
          if (!mapKey) continue;
          linkMap.set(mapKey, [...(linkMap.get(mapKey) || []), slugValue]);
        }
      }
      return chooseWikilinkCandidate(linkMap.get(normalizeLinkKey(target)) || [], decodedSlug, sourceCollectionRoot);
    };
  }, [currentNode?.collection, decodedSlug, graphData]);
  const collectionGraphHref = currentNode?.collection
    ? `/graph?collection=${encodeURIComponent(currentNode.collection)}`
    : '/graph';

  if (loading) {
    return (
      <NoteLayout>
        <NoteContent>
          <div style={{ color: 'rgba(224,231,255,0.5)', padding: '4rem 0', textAlign: 'center' }}>
            加载中...
          </div>
        </NoteContent>
      </NoteLayout>
    );
  }

  if (error) {
    return (
      <NoteLayout>
        <NoteContent>
          <BackButton type="button" onClick={handleBackClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            返回上一页
          </BackButton>
          <div style={{ color: 'rgba(224,231,255,0.5)', padding: '4rem 0', textAlign: 'center' }}>
            {error}
          </div>
        </NoteContent>
      </NoteLayout>
    );
  }

  return (
    <NoteLayout>
      <NoteContent>
        <BackButton type="button" onClick={handleBackClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回上一页
        </BackButton>
        <NoteTitle>{title}</NoteTitle>
        <NoteMeta>笔记路径: {decodedSlug}</NoteMeta>
        {parsedNote.properties.length > 0 && (
          <PropertyPanel>
            <PropertyTitle>档案属性</PropertyTitle>
            <PropertyGrid>
              {parsedNote.properties.map((item) => (
                <PropertyItem key={item.key}>
                  <span>{item.label}</span>
                  {item.key === 'tags' && Array.isArray(item.value) ? (
                    <TagList>
                      {item.value.map((tag) => (
                        <TagChip key={tag}>{tag}</TagChip>
                      ))}
                    </TagList>
                  ) : (
                    <strong title={getDisplayValue(item.value)}>{getDisplayValue(item.value)}</strong>
                  )}
                </PropertyItem>
              ))}
            </PropertyGrid>
          </PropertyPanel>
        )}
        <MarkdownBody>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, [remarkWikilinks, { resolve: wikilinkResolver }]]}
            components={{
              h1: ({children, ...props}) => {
                const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '');
                return <h1 id={id} {...props}>{children}</h1>;
              },
              h2: ({children, ...props}) => {
                const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '');
                return <h2 id={id} {...props}>{children}</h2>;
              },
              h3: ({children, ...props}) => {
                const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '');
                return <h3 id={id} {...props}>{children}</h3>;
              },
              a: ({href, children, ...props}) => {
                if (href?.startsWith('#wikilink-unresolved:')) {
                  return (
                    <span className="unresolved-wikilink" title="未发布或未收录">
                      {children}
                    </span>
                  );
                }
                if (href?.startsWith('#wikilink-ambiguous:')) {
                  return (
                    <span className="unresolved-wikilink" title="存在多个同名笔记，请在 Obsidian 中补全路径">
                      {children}
                    </span>
                  );
                }
                if (href && href.startsWith('/note/')) {
                  return <Link to={href} {...props}>{children}</Link>;
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
              },
              img: ({src, alt, ...props}) => {
                let width = undefined;
                let cleanAlt = alt || '';
                if (cleanAlt.includes('|')) {
                  const parts = cleanAlt.split('|');
                  cleanAlt = parts[0];
                  const sizePart = parts[1];
                  if (/^\d+$/.test(sizePart)) {
                    width = sizePart + 'px';
                  } else if (sizePart.includes('x')) {
                    const [w] = sizePart.split('x');
                    width = w + 'px';
                  }
                }
                return (
                  <img
                    src={src}
                    alt={cleanAlt}
                    style={{
                      width: width || '100%',
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      margin: '1.8rem auto',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(231, 199, 126, 0.16)'
                    }}
                    {...props}
                  />
                );
              },
            }}
          >
            {parsedNote.body}
          </ReactMarkdown>
        </MarkdownBody>
      </NoteContent>

      <NoteSidebar>
        {localGraphData && (
          <MiniGraph
            currentSlug={decodedSlug}
            graphData={localGraphData}
            label="局部关系图"
            theme="publishLocal"
            expandHref={`/graph?local=${encodeURIComponent(decodedSlug)}`}
          />
        )}
        {graphData && (
          <TocContainer>
            <TocTitle>图谱视图</TocTitle>
            <TocList>
              <TocItem $level={1}>
                <Link to={`/graph?local=${encodeURIComponent(decodedSlug)}`} state={{ backgroundLocation: location }}>展开局部关系图</Link>
              </TocItem>
              <TocItem $level={1}>
                <Link to={collectionGraphHref} state={{ backgroundLocation: location }}>展开分类全局图</Link>
              </TocItem>
            </TocList>
          </TocContainer>
        )}
        {headings.length > 0 && (
          <StickyTocContainer>
            <TocTitle>目录</TocTitle>
            <TocList>
              {headings.map((h, i) => (
                <TocItem key={i} $level={h.level}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </TocItem>
              ))}
            </TocList>
          </StickyTocContainer>
        )}
      </NoteSidebar>
    </NoteLayout>
  );
}
