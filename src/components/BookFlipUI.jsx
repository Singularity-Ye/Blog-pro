import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { toNoteHref } from '../utils/notePaths';

// ── 动画定义 ──────────────────────────────────────────────────
const backdropFadeIn = keyframes`
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(10px); }
`;

const bookEntrance = keyframes`
  from { opacity: 0; transform: translate(-50%, -45%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const rippleEffect = keyframes`
  0% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1.6); opacity: 0; }
`;

const floatingLight = keyframes`
  0% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-15px) rotate(180deg); opacity: 0.7; }
  100% { transform: translateY(0) rotate(360deg); opacity: 0.3; }
`;

// ── 主组件 ────────────────────────────────────────────────────
export default function BookFlipUI({ bookId = 'notes-source', onClose }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [indexData, setIndexData] = useState({ notes: [], collections: [] });
  const [loading, setLoading] = useState(true);

  // 书籍主题配置数据
  const bookConfig = useMemo(() => {
    if (bookId === 'mapbook-main') {
      return {
        accentColor: '#1b2c25', // 深松绿皮革
        sealType: 'compass',
        coverTitle: '旅行地图册',
        coverSubtitle: 'PINECONE TRAVEL ATLAS & ROUTES',
        coverIndicator: '点击翻开地图册',
        prefaceTitle: '旅行地图册 · 序言',
        prefaceText: (
          <>
            林深路远，步履不停。此册地图收录了杭州五一巡游计划、经典小众景点以及逐日探索路线。
            <br />
            沿着指针方向，让我们一同在数字关系图谱与景点日记中漫步。
          </>
        ),
        tabs: [
          { id: 'routes', label: '路线地图', subLabel: 'Exploration Routes', icon: '🗺️' },
          { id: 'spots', label: '景点巡礼', subLabel: 'Scenic Spots', icon: '📍' },
          { id: 'diaries', label: '旅行手札', subLabel: 'Travel Diaries', icon: '🍃' },
        ],
        defaultTab: 'routes',
        filterNotes: (notes, activeTab) => {
          const travelNotes = notes.filter(
            (note) => note.collection === 'travel' || note.id.startsWith('杭州旅游攻略')
          );
          if (activeTab === 'routes') {
            return travelNotes.filter(
              (note) =>
                note.title.includes('路线') ||
                note.title.includes('地图') ||
                note.title.includes('攻略') ||
                note.path.includes('路线') ||
                note.path.includes('地图') ||
                note.path.includes('攻略')
            ).slice(0, 6);
          } else if (activeTab === 'spots') {
            return travelNotes.filter(
              (note) => note.path.includes('景点/') || note.tags?.includes('景点')
            ).slice(0, 6);
          } else if (activeTab === 'diaries') {
            return travelNotes.filter(
              (note) =>
                !(
                  note.title.includes('路线') ||
                  note.title.includes('地图') ||
                  note.title.includes('攻略') ||
                  note.path.includes('路线') ||
                  note.path.includes('地图') ||
                  note.path.includes('攻略')
                ) && !(note.path.includes('景点/') || note.tags?.includes('景点'))
            ).slice(0, 6);
          }
          return travelNotes.slice(0, 6);
        },
      };
    }

    // 默认近日手札配置 (notes-source)
    return {
      accentColor: '#2c1a11', // 深褐色皮革
      sealType: 'pinecone',
      coverTitle: '近日手札',
      coverSubtitle: 'PINECONE LIBRARY OBSIDIAN DIARY',
      coverIndicator: '点击翻开手札',
      prefaceTitle: '近日手札 · 卷首语',
      prefaceText: (
        <>
          林间的松果书屋是思绪栖息之所。此册手札通过魔法罗盘，与后山密室的 <strong>Obsidian 知识库</strong> 互为映射。
          <br />
          博主最近的探索心得、建站蓝图以及视觉设计碎片，皆被墨水封存在这些羊皮纸中。
        </>
      ),
      tabs: [
        { id: 'recent', label: '最新文章', subLabel: 'Recent Updates', icon: '📜' },
        { id: 'design', label: '设计档案', subLabel: 'Design Dossiers', icon: '🎨' },
        { id: 'tech', label: '技术记录', subLabel: 'Codex Records', icon: '⚙️' },
      ],
      defaultTab: 'recent',
      filterNotes: (notes, activeTab) => {
        if (activeTab === 'recent') {
          return notes.slice(0, 5);
        } else if (activeTab === 'design') {
          return notes.filter(
            (note) => note.collection === 'blog-design' || note.id.startsWith('博客网站')
          ).slice(0, 6);
        } else if (activeTab === 'tech') {
          return notes.filter(
            (note) => note.collection === 'project' || note.id.startsWith('建站流程指南')
          ).slice(0, 6);
        }
        return [];
      },
    };
  }, [bookId]);

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || bookConfig.defaultTab;
  });

  // 当书籍主题切换时，重置激活的分类
  useEffect(() => {
    if (location.state?.openBook === bookId && location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    } else {
      setActiveTab(bookConfig.defaultTab);
    }
  }, [bookConfig, bookId, location.state]);

  const handleClose = useCallback(() => {
    if (isClosing || isZooming) return;
    setIsOpen(false);
    setIsClosing(true);
    // 等闭合动画放完再回调关闭
    setTimeout(() => {
      onClose();
    }, 900);
  }, [isClosing, isZooming, onClose]);

  const handleArticleClick = (e, slug) => {
    e.preventDefault();
    if (isZooming) return;
    setIsZooming(true);
    
    // 触发书本放大淡出，然后导航至笔记页面，传递来源书本与分类
    setTimeout(() => {
      navigate(toNoteHref(slug), { state: { fromBook: bookId, activeTab } });
    }, 600);
  };

  // 模拟生命周期延迟开启书本
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  // 加载笔记索引
  useEffect(() => {
    fetch('/notes-index.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load notes');
        return res.json();
      })
      .then((data) => {
        setIndexData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[BookFlipUI] Failed to load notes index:', err.message);
        setLoading(false);
      });
  }, []);

  // 处理 Esc 退出
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // 根据分类过滤笔记
  const filteredNotes = useMemo(() => {
    if (!indexData.notes) return [];
    return bookConfig.filterNotes(indexData.notes, activeTab);
  }, [indexData.notes, activeTab, bookConfig]);

  const activeTabObj = useMemo(() => {
    return bookConfig.tabs.find((t) => t.id === activeTab) || bookConfig.tabs[0];
  }, [activeTab, bookConfig]);

  return (
    <Overlay $isClosing={isClosing} onClick={handleClose}>
      <MagicalBackgroundEffects>
        <LightOrb style={{ left: '20%', top: '30%', width: '300px', animationDelay: '0s' }} />
        <LightOrb style={{ left: '70%', top: '60%', width: '400px', animationDelay: '-3s' }} />
      </MagicalBackgroundEffects>

      <BookWrapper 
        $isOpen={isOpen} 
        $isZooming={isZooming}
        onClick={(e) => e.stopPropagation()}
      >
        <BookInner $isOpen={isOpen}>
          
          {/* 右页底座 ( stationary, 书本打开时作为右侧页面 ) */}
          <RightPageBase $accentColor={bookConfig.accentColor}>
            <PageParchment>
              <PageCreaseSide $direction="right" />
              <PageContent>
                <PageHeader>
                  <PageCategoryTitle>
                    {activeTabObj?.icon} {activeTabObj?.label} / {activeTabObj?.subLabel}
                  </PageCategoryTitle>
                  <PageOrnament viewBox="0 0 100 10"><path d="M 0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="rgba(74, 45, 27, 0.3)" strokeWidth="1.5"/></PageOrnament>
                </PageHeader>
                
                {loading ? (
                  <LoadingArea>
                    <BookPulseDot />
                    <span>正在翻阅手札卷页...</span>
                  </LoadingArea>
                ) : (
                  <ArticleList>
                    {filteredNotes.length === 0 ? (
                      <EmptyNotes>
                        <p>该分类下暂无尘封的笔记手札</p>
                        <small>请等待魔法罗盘同步 Obsidian 文件</small>
                      </EmptyNotes>
                    ) : (
                      filteredNotes.map((note, index) => (
                        <ArticleLink 
                          key={note.id} 
                          href={toNoteHref(note.slug)}
                          style={{ animationDelay: `${index * 80}ms` }}
                          onClick={(e) => handleArticleClick(e, note.slug)}
                        >
                          <ArticleTitleGroup>
                            <ArticleBullet>✦</ArticleBullet>
                            <ArticleTitle>{note.title || note.path.replace('.md', '')}</ArticleTitle>
                          </ArticleTitleGroup>
                          <ArticleMeta>
                            <span>{note.collectionLabel || '归档'}</span>
                            <ArticleArrow>→</ArticleArrow>
                          </ArticleMeta>
                        </ArticleLink>
                      ))
                    )}
                  </ArticleList>
                )}

                <PageFooter>
                  <span>页码 {activeTab === bookConfig.tabs[0]?.id ? '01' : activeTab === bookConfig.tabs[1]?.id ? '02' : '03'}</span>
                </PageFooter>
              </PageContent>
            </PageParchment>
          </RightPageBase>

          {/* 3D 翻盖 ( 包含外封面和内左页，绕左边缘旋转 ) */}
          <FlippingCover $isOpen={isOpen} onClick={(e) => { if (!isOpen) { e.stopPropagation(); setIsOpen(true); } }}>
            
            {/* 封面 ( 书本合拢时朝外 ) */}
            <CoverFront>
              <CoverLeather $accentColor={bookConfig.accentColor}>
                <CoverBorder>
                  <CornerOrnament style={{ top: '10px', left: '10px', borderTop: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }} />
                  <CornerOrnament style={{ top: '10px', right: '10px', borderTop: '2px solid #d4af37', borderRight: '2px solid #d4af37' }} />
                  <CornerOrnament style={{ bottom: '10px', left: '10px', borderBottom: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }} />
                  <CornerOrnament style={{ bottom: '10px', right: '10px', borderBottom: '2px solid #d4af37', borderRight: '2px solid #d4af37' }} />
                  
                  <CoverSpineGlow />
                  <CoverMainContent>
                    <SealContainer>
                      <PulseRing />
                      {bookConfig.sealType === 'compass' ? (
                        <SealIcon viewBox="0 0 100 100">
                          {/* 黄金导航罗盘 */}
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3"/>
                          <circle cx="50" cy="50" r="39" fill="none" stroke="#d4af37" strokeWidth="1.5"/>
                          <circle cx="50" cy="50" r="34" fill="none" stroke="#d4af37" strokeWidth="0.8"/>
                          <text x="50" y="24" fill="#d4af37" fontSize="8" fontWeight="bold" textAnchor="middle">N</text>
                          <text x="50" y="84" fill="#d4af37" fontSize="8" fontWeight="bold" textAnchor="middle">S</text>
                          <text x="80" y="53" fill="#d4af37" fontSize="8" fontWeight="bold" textAnchor="middle">E</text>
                          <text x="20" y="53" fill="#d4af37" fontSize="8" fontWeight="bold" textAnchor="middle">W</text>
                          <polygon points="50,28 54,50 50,46" fill="url(#goldGrad)" stroke="#d4af37" strokeWidth="0.5"/>
                          <polygon points="50,28 46,50 50,46" fill="#aa7c11" stroke="#d4af37" strokeWidth="0.5"/>
                          <polygon points="50,72 54,50 50,54" fill="#aa7c11" stroke="#d4af37" strokeWidth="0.5"/>
                          <polygon points="50,72 46,50 50,54" fill="url(#goldGrad)" stroke="#d4af37" strokeWidth="0.5"/>
                          <polygon points="72,50 50,54 54,50" fill="url(#goldGrad)" stroke="#d4af37" strokeWidth="0.5"/>
                          <polygon points="72,50 50,46 54,50" fill="#aa7c11" stroke="#d4af37" strokeWidth="0.5"/>
                          <polygon points="28,50 50,54 46,50" fill="#aa7c11" stroke="#d4af37" strokeWidth="0.5"/>
                          <polygon points="28,50 50,46 46,50" fill="url(#goldGrad)" stroke="#d4af37" strokeWidth="0.5"/>
                          <circle cx="50" cy="50" r="5" fill="#1b2c25" stroke="#d4af37" strokeWidth="1"/>
                          <circle cx="50" cy="50" r="2" fill="#ffd88d"/>
                          <defs>
                            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#fff3cc" />
                              <stop offset="50%" stopColor="#d4af37" />
                              <stop offset="100%" stopColor="#aa7c11" />
                            </linearGradient>
                          </defs>
                        </SealIcon>
                      ) : (
                        <SealIcon viewBox="0 0 100 100">
                          {/* 金色古典松果魔法阵 */}
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3"/>
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#d4af37" strokeWidth="1.5"/>
                          <polygon points="50,15 80,68 20,68" fill="none" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1"/>
                          <polygon points="50,85 80,32 20,32" fill="none" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1"/>
                          <path d="M50,28 C55,38 62,48 62,56 C62,64 56,70 50,70 C44,70 38,64 38,56 C38,48 45,38 50,28 Z" fill="url(#goldGrad)" stroke="#d4af37" strokeWidth="1.5"/>
                          <path d="M50,70 C54,65 59,58 59,52 M50,70 C46,65 41,58 41,52 M50,60 C53,55 57,50 57,44 M50,60 C47,55 43,50 43,44 M50,50 C52,45 54,40 54,36 M50,50 C48,45 46,40 46,36" fill="none" stroke="#6b461c" strokeWidth="1"/>
                          <defs>
                            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#fff3cc" />
                              <stop offset="50%" stopColor="#d4af37" />
                              <stop offset="100%" stopColor="#aa7c11" />
                            </linearGradient>
                          </defs>
                        </SealIcon>
                      )}
                    </SealContainer>
                    
                    <CoverTitle>{bookConfig.coverTitle}</CoverTitle>
                    <CoverSubtitle>{bookConfig.coverSubtitle}</CoverSubtitle>
                    
                    <CoverIndicator>{bookConfig.coverIndicator}</CoverIndicator>
                  </CoverMainContent>
                </CoverBorder>
              </CoverLeather>
            </CoverFront>

            {/* 内左页 ( 书本打开时朝向屏幕，作为左侧页面 ) */}
            <CoverBack>
              <PageParchment>
                <PageCreaseSide $direction="left" />
                <PageContent>
                  <PageHeader>
                    <BookTitle>{bookConfig.prefaceTitle}</BookTitle>
                    <PageOrnament viewBox="0 0 100 10"><path d="M 0 5 Q 25 10, 50 5 T 100 5" fill="none" stroke="rgba(74, 45, 27, 0.3)" strokeWidth="1.5"/></PageOrnament>
                  </PageHeader>

                  <PrefaceText>
                    {bookConfig.prefaceText}
                  </PrefaceText>

                  <TabContainer>
                    <TabTitle>分栏导航 / CATEGORIES</TabTitle>
                    <TabList>
                      {bookConfig.tabs.map((tab) => (
                        <TabButton 
                          key={tab.id}
                          $active={activeTab === tab.id} 
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <TabIcon>{tab.icon}</TabIcon>
                          <TabLabelGroup>
                            <strong>{tab.label}</strong>
                            <span>{tab.subLabel}</span>
                          </TabLabelGroup>
                        </TabButton>
                      ))}
                    </TabList>
                  </TabContainer>

                  <PageFooter>
                    <span>松果灵感书屋 · 藏书室</span>
                  </PageFooter>
                </PageContent>
              </PageParchment>
            </CoverBack>

          </FlippingCover>

        </BookInner>

        <CloseButton 
          type="button" 
          onClick={handleClose}
          aria-label="合上此手札"
        >
          合上手札 (ESC)
        </CloseButton>
      </BookWrapper>
    </Overlay>
  );
}

// ── 样式定义 ──────────────────────────────────────────────────
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(12, 8, 7, 0.85);
  box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.8);
  animation: ${backdropFadeIn} 450ms ease forwards;
  opacity: ${({ $isClosing }) => ($isClosing ? 0 : 1)};
  transition: opacity 600ms ease, backdrop-filter 600ms ease;
  overflow: hidden;
`;

const MagicalBackgroundEffects = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const LightOrb = styled.div`
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(255, 155, 54, 0.03) 50%, transparent 70%);
  filter: blur(40px);
  mix-blend-mode: screen;
  animation: ${floatingLight} 12s infinite ease-in-out;
`;

const BookWrapper = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 900px;
  height: 580px;
  z-index: 2;
  perspective: 1600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${bookEntrance} 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  
  opacity: ${({ $isZooming }) => ($isZooming ? 0 : 1)};
  transform: ${({ $isZooming }) => ($isZooming ? 'translate(-50%, -50%) scale(1.6)' : 'translate(-50%, -50%)')};
  filter: ${({ $isZooming }) => ($isZooming ? 'blur(10px)' : 'none')};
  transition: opacity 550ms cubic-bezier(0.55, 0, 0.1, 1), transform 550ms cubic-bezier(0.55, 0, 0.1, 1), filter 550ms ease;

  @media (max-width: 960px) { transform: translate(-50%, -50%) scale(0.85); }
  @media (max-width: 800px) { transform: translate(-50%, -50%) scale(0.72); }
  @media (max-width: 660px) { transform: translate(-50%, -50%) scale(0.58); }
  @media (max-width: 480px) { transform: translate(-50%, -50%) scale(0.44); }
`;

const BookInner = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 900ms cubic-bezier(0.2, 0.9, 0.3, 1);
  box-shadow: 
    0 30px 60px rgba(0,0,0,0.65), 
    inset 0 0 50px rgba(0,0,0,0.3);
  border-radius: 6px;
  
  /* 当书本打开时，整体移回居中；合拢时向左偏移25%以居中显示封面 */
  transform: ${({ $isOpen }) => ($isOpen ? 'rotateX(5deg) rotateY(0deg) translateX(0px)' : 'rotateX(0deg) rotateY(0deg) translateX(-25%)')};
`;

// ── 右页底座 ──────────────────────────────────────────────────
const RightPageBase = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  width: 50%;
  height: 100%;
  z-index: 1;
  transform-origin: left center;
  background: #3a2418;
  border-radius: 0 8px 8px 0;
  box-shadow: 
    0 15px 35px rgba(0,0,0,0.4), 
    3px 0 10px rgba(0,0,0,0.2);
  display: flex;
  overflow: hidden;

  /* 右侧书口模拟厚度 */
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 5px;
    bottom: 5px;
    width: 6px;
    background: linear-gradient(90deg, #f2ead7 0%, #d8caa7 70%, #aa9b79 100%);
    border-radius: 0 4px 4px 0;
    box-shadow: inset 1px 0 3px rgba(0,0,0,0.2);
  }
`;

const PageParchment = styled.div`
  position: absolute;
  inset: 5px 8px 5px 0;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.15), transparent),
    #faf5eb;
  border: 1px solid #e3d2bd;
  border-left: 0;
  box-shadow: 
    5px 0 15px rgba(0,0,0,0.06),
    inset -10px 0 30px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
`;

const PageCreaseSide = styled.div`
  position: absolute;
  ${({ $direction }) => $direction === 'left' ? 'right: 0;' : 'left: 0;'}
  top: 0;
  bottom: 0;
  width: 25px;
  background: ${({ $direction }) => 
    $direction === 'left' 
      ? 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.22) 100%)' 
      : 'linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.04) 50%, transparent 100%)'
  };
  pointer-events: none;
  z-index: 5;
`;

const PageContent = styled.div`
  flex: 1;
  padding: 34px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #4a2d1b;
  position: relative;
  z-index: 2;
  font-family: Georgia, serif;
`;

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PageCategoryTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  color: #4a2d1b;
  text-shadow: 0 1px 1px rgba(255,255,255,0.8);
  border-left: 3px solid #d4af37;
  padding-left: 8px;
  line-height: 1.2;
`;

const BookTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: #4a2d1b;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PageOrnament = styled.svg`
  width: 100%;
  height: 8px;
  margin-top: 4px;
  opacity: 0.8;
`;

const PrefaceText = styled.p`
  margin: 16px 0 0;
  font-size: 0.84rem;
  line-height: 1.62;
  color: #654c38;
  text-align: justify;
  font-style: italic;

  strong {
    color: #4a2d1b;
    font-weight: bold;
  }
`;

const TabContainer = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TabTitle = styled.span`
  font-size: 0.72rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(74, 45, 27, 0.55);
`;

const TabList = styled.div`
  display: grid;
  gap: 8px;
`;

const TabButton = styled.button`
  border: 1px dashed rgba(74, 45, 27, 0.22);
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  transition: all 250ms ease;
  
  background: ${({ $active }) => $active ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.2)'};
  border-color: ${({ $active }) => $active ? '#d4af37' : 'rgba(74, 45, 27, 0.2)'};
  box-shadow: ${({ $active }) => $active ? '0 4px 10px rgba(212, 175, 55, 0.08)' : 'none'};

  &:hover {
    background: rgba(212, 175, 55, 0.08);
    border-color: #d4af37;
  }
`;

const TabIcon = styled.span`
  font-size: 1.15rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
`;

const TabLabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  
  strong {
    font-size: 0.84rem;
    color: #4a2d1b;
    font-weight: 800;
  }

  span {
    font-size: 0.65rem;
    color: rgba(74, 45, 27, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const PageFooter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.7rem;
  color: rgba(74, 45, 27, 0.45);
  letter-spacing: 0.08em;
  border-top: 1px dashed rgba(74, 45, 27, 0.12);
  padding-top: 10px;
  margin-top: 12px;
`;

// ── 右侧文章列表 ──────────────────────────────────────────────
const LoadingArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(74, 45, 27, 0.6);
  font-size: 0.8rem;
`;

const BookPulseDot = styled.div`
  width: 14px;
  height: 14px;
  background-color: #d4af37;
  border-radius: 50%;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: inherit;
    border-radius: inherit;
    animation: ${rippleEffect} 1.6s infinite ease-out;
  }
`;

const ArticleList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
  overflow-y: auto;
  padding-right: 4px;

  /* 隐藏滚动条但保留滚动 */
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const slideInArticle = keyframes`
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
`;

const ArticleLink = styled.a`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(74, 45, 27, 0.05);
  text-decoration: none;
  color: #4a2d1b;
  transition: all 220ms ease;
  animation: ${slideInArticle} 380ms ease both;

  &:hover {
    background: rgba(212, 175, 55, 0.08);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 
      inset 0 0 10px rgba(212, 175, 55, 0.03),
      0 3px 8px rgba(0,0,0,0.03);
    transform: translateX(3px);

    .bullet {
      color: #d4af37;
      transform: scale(1.3) rotate(90deg);
    }

    .arrow {
      transform: translateX(2px);
      color: #d4af37;
    }
  }
`;

const ArticleTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const ArticleBullet = styled.span.attrs({ className: 'bullet' })`
  font-size: 0.7rem;
  color: rgba(74, 45, 27, 0.3);
  transition: all 250ms ease;
`;

const ArticleTitle = styled.span.attrs({ className: 'title' })`
  font-size: 0.82rem;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #4a2d1b;
`;

const ArticleMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  
  span {
    font-size: 0.65rem;
    color: rgba(74, 45, 27, 0.45);
    background: rgba(74, 45, 27, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
  }
`;

const ArticleArrow = styled.span.attrs({ className: 'arrow' })`
  font-size: 0.78rem;
  color: rgba(74, 45, 27, 0.3);
  transition: all 220ms ease;
`;

const EmptyNotes = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(74, 45, 27, 0.45);
  font-style: italic;

  p { margin: 0 0 4px; font-size: 0.82rem; }
  small { font-size: 0.65rem; }
`;

// ── 3D 翻页封面 ( 核心动效层 ) ──────────────────────────────
const FlippingCover = styled.div`
  position: absolute;
  left: 50%; /* 起始位于右半部分，盖住右页底座 */
  top: 0;
  width: 50%;
  height: 100%;
  z-index: 10;
  transform-origin: left center; /* 绕中间中脊轴旋转 */
  transform-style: preserve-3d;
  transition: transform 950ms cubic-bezier(0.25, 1, 0.2, 1);
  cursor: ${({ $isOpen }) => ($isOpen ? 'default' : 'pointer')};
  
  transform: ${({ $isOpen }) => ($isOpen ? 'rotateY(-180deg)' : 'rotateY(0deg)')};

  &:hover {
    /* 合拢悬停时微微掀起外壳，形成交互勾引 */
    transform: ${({ $isOpen }) => ($isOpen ? 'rotateY(-180deg)' : 'rotateY(-6deg)')};
  }
`;

// ── 封面外壳 ( closed时朝上 ) ─────────────────────────────────
const CoverFront = styled.div`
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  z-index: 2;
  transform: rotateY(0deg);
  border-radius: 0 8px 8px 0; /* 合拢时位于右侧，所以右边圆角 */
  overflow: hidden;
  box-shadow: inset 5px 0 10px rgba(0,0,0,0.15);
`;

const CoverLeather = styled.div`
  width: 100%;
  height: 100%;
  background: 
    linear-gradient(to right, rgba(0,0,0,0.4), transparent 5%, transparent 95%, rgba(0,0,0,0.5)),
    #2c1a11; /* 经典深木色/皮革棕 */
  padding: 6px;
  display: flex;
`;

const CoverBorder = styled.div`
  flex: 1;
  border: 1px solid rgba(212, 175, 55, 0.22);
  outline: 1px solid rgba(212, 175, 55, 0.08);
  outline-offset: -5px;
  border-radius: 4px 0 0 4px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CornerOrnament = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
`;

const CoverSpineGlow = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  background: linear-gradient(to left, rgba(212, 175, 55, 0.15), transparent);
`;

const CoverMainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff0d4;
  font-family: Georgia, serif;
`;

const SealContainer = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 18px;
`;

const PulseRing = styled.div`
  position: absolute;
  inset: -6px;
  border: 1.5px solid rgba(212, 175, 55, 0.45);
  border-radius: 50%;
  animation: ${rippleEffect} 2.2s infinite ease-out;
`;

const SealIcon = styled.svg`
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.45));
`;

const CoverTitle = styled.h1`
  margin: 0;
  font-size: 2.2rem;
  font-weight: bold;
  letter-spacing: 0.1em;
  color: #ffd88d;
  text-shadow: 
    0 2px 4px rgba(0,0,0,0.5),
    0 0 8px rgba(212,175,55,0.4);
`;

const CoverSubtitle = styled.span`
  margin-top: 8px;
  font-size: 0.58rem;
  color: rgba(255, 240, 212, 0.42);
  letter-spacing: 0.16em;
  font-weight: 500;
  max-width: 180px;
  line-height: 1.4;
`;

const CoverIndicator = styled.div`
  margin-top: 36px;
  font-size: 0.72rem;
  color: rgba(255, 216, 141, 0.65);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.25);
  padding: 5px 12px;
  border-radius: 12px;
  letter-spacing: 0.08em;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  animation: floatingHint 2s infinite ease-in-out alternate;

  @keyframes floatingHint {
    0% { transform: translateY(0); box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
    100% { transform: translateY(-4px); box-shadow: 0 4px 10px rgba(212,175,55,0.18); }
  }
`;

// ── 内左页 ( open时朝屏幕 ) ─────────────────────────────────
const CoverBack = styled.div`
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  z-index: 1;
  transform: rotateY(180deg); /* 旋转180度使得合拢时面朝内 */
  border-radius: 0 8px 8px 0;
  overflow: hidden;
  box-shadow: inset 5px 0 10px rgba(0,0,0,0.15);
  
  /* 左侧书口模拟厚度 */
  &::before {
    content: '';
    position: absolute;
    right: 0; /* 旋转180度后，右边变左边，所以用 right 定位书口 */
    top: 5px;
    bottom: 5px;
    width: 6px;
    background: linear-gradient(270deg, #f2ead7 0%, #d8caa7 70%, #aa9b79 100%);
    border-radius: 4px 0 0 4px;
    box-shadow: inset -1px 0 3px rgba(0,0,0,0.2);
  }
`;

// ── 合页关闭按钮 ──────────────────────────────────────────────
const CloseButton = styled.button`
  margin-top: 24px;
  min-height: 38px;
  padding: 8px 18px;
  border: 1px solid rgba(255, 219, 154, 0.28);
  border-radius: 20px;
  background: rgba(18, 12, 10, 0.72);
  color: #ffeed3;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 
    0 4px 12px rgba(0,0,0,0.35),
    inset 0 1px 2px rgba(255,255,255,0.1);
  transition: all 220ms ease;

  &:hover {
    background: rgba(212, 175, 55, 0.16);
    border-color: rgba(212, 175, 55, 0.6);
    color: #ffd88d;
    box-shadow: 
      0 6px 16px rgba(0,0,0,0.45),
      0 0 10px rgba(212, 175, 55, 0.15);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;
