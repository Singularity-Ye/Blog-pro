import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { BLOG_ASSETS, getBlogAssetByKey } from '../constants/blogAssets';
import { ENABLE_PLACEMENT_DEBUG } from '../constants/blogDebug';
import { BLOG_OBJECTS } from '../constants/blogObjects';
import { BLOG_ZONES } from '../constants/blogZones';

const panelLabelMap = {
  notebook: 'Notebook',
  cards: 'Cards',
  book: 'Mapbook',
  mechanism: 'Mechanism',
  scroll: 'Scroll',
};

const guideItems = ['项目实验', '笔记索引', '旅行地图册', '旧卷轴设定'];

const exteriorFrogObject = {
  id: 'frog-greeter',
  title: '青蛙管家',
  placement: {
    left: '61.8%',
    top: '56.6%',
    width: '10%',
    rotate: '-4deg',
    opacity: 0.92,
  },
};

const Blog = () => {
  const [sceneMode, setSceneMode] = useState('exterior');
  const [isEnteringInterior, setIsEnteringInterior] = useState(false);
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [activeObjectId, setActiveObjectId] = useState(null);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [hoveredObjectId, setHoveredObjectId] = useState(null);
  const [hoveredExteriorHotspot, setHoveredExteriorHotspot] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [debugPlacement, setDebugPlacement] = useState(null);

  const activeZone = useMemo(
    () => BLOG_ZONES.find((zone) => zone.id === activeZoneId) || null,
    [activeZoneId]
  );

  const activeObject = useMemo(() => {
    return BLOG_OBJECTS.find((object) => object.id === activeObjectId) || null;
  }, [activeObjectId]);

  const hoveredZone = useMemo(
    () => BLOG_ZONES.find((zone) => zone.id === hoveredZoneId) || null,
    [hoveredZoneId]
  );

  const activeZoneObjects = useMemo(() => {
    if (!activeZone) {
      return [];
    }

    return BLOG_OBJECTS
      .filter(
        (object) =>
          object.zoneId === activeZone.id &&
          (object.enabled || ENABLE_PLACEMENT_DEBUG)
      )
      .map((object) => ({
        ...object,
        asset: getBlogAssetByKey(object.assetKey),
      }))
      .filter((object) => object.enabled || ENABLE_PLACEMENT_DEBUG || Boolean(object.asset));
  }, [activeZone]);

  const displayedObject = activeZoneObjects[0] || null;
  const placementDebugTarget = sceneMode === 'interior' ? displayedObject : null;
  const currentPlacement = debugPlacement || placementDebugTarget?.placement || null;

  const enterInterior = useCallback(() => {
    if (isEnteringInterior) {
      return;
    }

    setIsEnteringInterior(true);
    setIsGuideOpen(false);
    setHoveredExteriorHotspot(null);

    window.setTimeout(() => {
      setSceneMode('interior');
      setIsEnteringInterior(false);
    }, 680);
  }, [isEnteringInterior]);

  const returnToExterior = () => {
    setSceneMode('exterior');
    setActiveZoneId(null);
    setActiveObjectId(null);
    setHoveredZoneId(null);
    setHoveredObjectId(null);
    setDebugPlacement(null);
  };

  const enterZone = (zoneId) => {
    setActiveZoneId(zoneId);
    setActiveObjectId(null);
    setHoveredObjectId(null);
    setDebugPlacement(null);
  };

  const closeObject = () => {
    setActiveObjectId(null);
  };

  const returnToMaster = () => {
    setActiveZoneId(null);
    setActiveObjectId(null);
    setHoveredObjectId(null);
    setDebugPlacement(null);
  };

  const updateDebugPlacement = useCallback((patch) => {
    if (!placementDebugTarget?.placement) {
      return;
    }

    setDebugPlacement((current) => ({
      ...placementDebugTarget.placement,
      ...current,
      ...patch,
    }));
  }, [placementDebugTarget]);

  const nudgeDebugPlacement = useCallback((field, delta) => {
    const base = debugPlacement || placementDebugTarget?.placement;
    if (!base) {
      return;
    }

    const nextValue = parseFloat(base[field]) + delta;
    const unit = field === 'rotate' ? 'deg' : '%';
    updateDebugPlacement({ [field]: `${Number(nextValue.toFixed(2))}${unit}` });
  }, [debugPlacement, placementDebugTarget, updateDebugPlacement]);

  const copyDebugPlacement = async () => {
    const placement = debugPlacement || placementDebugTarget?.placement;
    if (!placement) {
      return;
    }

    const text = JSON.stringify(placement, null, 2).replace(/"([^"]+)":/g, '$1:');
    await navigator.clipboard?.writeText(text);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (ENABLE_PLACEMENT_DEBUG && placementDebugTarget?.placement) {
        const step = event.shiftKey ? 1 : 0.2;
        const keyActions = {
          ArrowLeft: () => nudgeDebugPlacement('left', -step),
          ArrowRight: () => nudgeDebugPlacement('left', step),
          ArrowUp: () => nudgeDebugPlacement('top', -step),
          ArrowDown: () => nudgeDebugPlacement('top', step),
          '[': () => nudgeDebugPlacement('width', -step),
          ']': () => nudgeDebugPlacement('width', step),
          ',': () => nudgeDebugPlacement('rotate', -1),
          '.': () => nudgeDebugPlacement('rotate', 1),
        };

        if (keyActions[event.key]) {
          event.preventDefault();
          keyActions[event.key]();
          return;
        }
      }

      if (event.key !== 'Escape') {
        return;
      }

      if (activeObject) {
        closeObject();
        return;
      }

      if (activeZone) {
        returnToMaster();
        return;
      }

      if (sceneMode === 'interior') {
        returnToExterior();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeObject, activeZone, nudgeDebugPlacement, placementDebugTarget, sceneMode]);

  return (
    <BlogWorld>
      <PineconeLibraryStage>
        <StageShell>
          <StageViewport onClick={activeObject ? closeObject : undefined}>
            {sceneMode === 'exterior' && (
              <ExteriorScene $isEntering={isEnteringInterior}>
                <ExteriorSkyImage
                  src={BLOG_ASSETS.exterior.skyBg}
                  alt=""
                  aria-hidden="true"
                />
                <ExteriorHouseMainImage
                  src={BLOG_ASSETS.exterior.houseMain}
                  alt="夜色树枝上的松果屋外景主体"
                />
                <ExteriorFrogImage
                  src={BLOG_ASSETS.exterior.frog}
                  alt="青蛙管家"
                  $placement={currentPlacement || exteriorFrogObject.placement}
                  $debugOpacity={(currentPlacement || exteriorFrogObject.placement).opacity}
                />
                <ExteriorPlatformForegroundImage
                  src={BLOG_ASSETS.exterior.platformForeground}
                  alt=""
                  aria-hidden="true"
                />
                <ExteriorShade aria-hidden="true" />

                <ExteriorIntroPanel className="exteriorIntroPanel">
                  <span>松果灵感书屋</span>
                  <strong>沿着灯火，走进项目、笔记与奇怪实验的藏书室。</strong>
                  <p>屋外入口先负责欢迎和导览。真正的内容，藏在书屋里面。</p>
                  <ExteriorEnterButton
                    className="exteriorEnterButton"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      enterInterior();
                    }}
                  >
                    进入书屋
                  </ExteriorEnterButton>
                </ExteriorIntroPanel>

                <ExteriorHotspotLayer className="ExteriorHotspotLayer">
                  <ExteriorHouseHotspot
                    className="exteriorHouseHotspot"
                    type="button"
                    onMouseEnter={() => setHoveredExteriorHotspot('house')}
                    onMouseLeave={() => setHoveredExteriorHotspot(null)}
                    onClick={(event) => {
                      event.stopPropagation();
                      enterInterior();
                    }}
                    aria-label="进入松果书屋内部"
                  >
                    <span>进入书屋</span>
                  </ExteriorHouseHotspot>

                  <ExteriorBridgeHotspot
                    className="exteriorBridgeHotspot"
                    type="button"
                    onMouseEnter={() => setHoveredExteriorHotspot('bridge')}
                    onMouseLeave={() => setHoveredExteriorHotspot(null)}
                    onClick={(event) => {
                      event.stopPropagation();
                      enterInterior();
                    }}
                    aria-label="沿木桥进入书屋"
                  />

                  <ExteriorSignpostHotspot
                    className="exteriorSignpostHotspot"
                    type="button"
                    onMouseEnter={() => {
                      setHoveredExteriorHotspot('signpost');
                      setIsGuideOpen(true);
                    }}
                    onMouseLeave={() => setHoveredExteriorHotspot(null)}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsGuideOpen((current) => !current);
                    }}
                    aria-label="查看书屋导览"
                  />

                  <ExteriorLanternHotspot
                    className="exteriorLanternHotspot"
                    type="button"
                    onMouseEnter={() => setHoveredExteriorHotspot('lantern')}
                    onMouseLeave={() => setHoveredExteriorHotspot(null)}
                    aria-label="查看灯火提示"
                  />
                </ExteriorHotspotLayer>

                {isGuideOpen && (
                  <ExteriorGuideCard onMouseEnter={() => setIsGuideOpen(true)}>
                    <strong>书屋里藏着什么</strong>
                    <ul>
                      {guideItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </ExteriorGuideCard>
                )}

                {hoveredExteriorHotspot === 'house' && (
                  <ExteriorTooltip $left="68%" $top="34%">
                    点击进入书屋内部
                  </ExteriorTooltip>
                )}
                {hoveredExteriorHotspot === 'bridge' && (
                  <ExteriorTooltip $left="35%" $top="74%">
                    沿着灯火继续往前走
                  </ExteriorTooltip>
                )}
                {hoveredExteriorHotspot === 'lantern' && (
                  <ExteriorTooltip $left="47%" $top="40%">
                    今晚也有新的笔记在发光
                  </ExteriorTooltip>
                )}

                <EnterFlash $isVisible={isEnteringInterior} aria-hidden="true" />
              </ExteriorScene>
            )}

            {sceneMode === 'interior' && (
              <InteriorScene>
                <MasterLayer
                  $activeZone={activeZone}
                  src={BLOG_ASSETS.interior.master}
                  alt="松果书屋内部完整主场景"
                />

                <StageShade aria-hidden="true" />
                <AmbientEffects aria-hidden="true">
                  <StarField />
                  <DustMotes />
                  <LanternBreath />
                </AmbientEffects>

                <StagePrompt>
                  <span>松果灵感书屋</span>
                  <strong>{activeZone ? activeZone.title : '先选择一个区域靠近看看'}</strong>
                  <p>
                    {activeZone
                      ? `${activeZone.hint} 点击局部物件继续展开。`
                      : '完整书屋负责区域导航，进入局部场景后再选择具体物件。'}
                  </p>
                </StagePrompt>

                {!activeZone && (
                  <ExteriorReturnButton type="button" onClick={returnToExterior}>
                    返回屋外
                  </ExteriorReturnButton>
                )}

                <RegionHotspotLayer aria-label="松果书屋区域导航" $isHidden={Boolean(activeZone)}>
                  {BLOG_ZONES.map((zone) => (
                    <RegionHotspotButton
                      key={zone.id}
                      type="button"
                      $zone={zone}
                      onClick={(event) => {
                        event.stopPropagation();
                        enterZone(zone.id);
                      }}
                      onMouseEnter={() => setHoveredZoneId(zone.id)}
                      onMouseLeave={() => setHoveredZoneId(null)}
                      aria-label={`进入${zone.title}`}
                    >
                      <span>{zone.title}</span>
                    </RegionHotspotButton>
                  ))}
                </RegionHotspotLayer>

                <CloseupLayer $isVisible={Boolean(activeZone)}>
                  {activeZone && (
                    <>
                      <CloseupStage>
                        <CloseupImage
                          key={activeZone.id}
                          src={activeZone.closeup}
                          alt={`${activeZone.title}局部近景`}
                        />
                        <ObjectLayer>
                          {activeZoneObjects.map((object) => {
                            const placement =
                              object.id === displayedObject?.id && currentPlacement
                                ? currentPlacement
                                : object.placement;
                            const opacity =
                              object.id === displayedObject?.id
                                ? currentPlacement?.opacity
                                : object.placement.opacity;

                            return object.asset ? (
                              <ProtoObjectButton
                                key={object.id}
                                type="button"
                                $placement={placement}
                                $debugOpacity={opacity}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActiveObjectId(object.id);
                                }}
                                onMouseEnter={() => setHoveredObjectId(object.id)}
                                onMouseLeave={() => setHoveredObjectId(null)}
                                aria-label={`打开${object.title}`}
                              >
                                <img src={object.asset} alt={object.title} />
                              </ProtoObjectButton>
                            ) : (
                              <DebugObjectProxy
                                key={object.id}
                                type="button"
                                $placement={placement}
                                $debugOpacity={opacity}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActiveObjectId(object.id);
                                }}
                                onMouseEnter={() => setHoveredObjectId(object.id)}
                                onMouseLeave={() => setHoveredObjectId(null)}
                                aria-label={`调试${object.title}`}
                              >
                                {object.title}
                              </DebugObjectProxy>
                            );
                          })}
                        </ObjectLayer>
                      </CloseupStage>
                      <CloseupHint>
                        <strong>{activeZone.title}</strong>
                        <span>点击局部图中的物件继续展开。</span>
                      </CloseupHint>
                      <BackButton
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          returnToMaster();
                        }}
                      >
                        返回书屋
                      </BackButton>
                    </>
                  )}
                </CloseupLayer>

                {activeObject && (
                  <DetailPanel
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={`blog-object-${activeObject.id}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <PanelLabel>{panelLabelMap[activeObject.panelType]}</PanelLabel>
                    <h2 id={`blog-object-${activeObject.id}`}>{activeObject.title}</h2>
                    <p>{activeObject.subtitle}</p>
                    <PanelText>{activeObject.description}</PanelText>
                    <EntryList>
                      {activeObject.entries.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </EntryList>
                    <PanelActions>
                      <button type="button">查看内容</button>
                      <button type="button" onClick={closeObject}>
                        收起面板
                      </button>
                    </PanelActions>
                  </DetailPanel>
                )}

                {hoveredZone && !activeZone && <Tooltip $zone={hoveredZone}>{hoveredZone.title}</Tooltip>}

                {activeZone &&
                  hoveredObjectId &&
                  !activeObject &&
                  (() => {
                    const hoveredObject = activeZoneObjects.find((object) => object.id === hoveredObjectId);
                    return hoveredObject ? (
                      <ProtoObjectTooltip $object={hoveredObject}>
                        {hoveredObject.tooltip || hoveredObject.title}
                      </ProtoObjectTooltip>
                    ) : null;
                  })()}
              </InteriorScene>
            )}
          </StageViewport>
        </StageShell>

        {ENABLE_PLACEMENT_DEBUG && placementDebugTarget?.placement && (
          <PlacementDebugPanel>
            <strong>Placement Debug: {placementDebugTarget.id}</strong>
            {['left', 'top', 'width', 'rotate'].map((field) => (
              <label key={field}>
                <span>{field}</span>
                <input
                  value={(debugPlacement || placementDebugTarget.placement)[field] || ''}
                  onChange={(event) => updateDebugPlacement({ [field]: event.target.value })}
                />
              </label>
            ))}
            <label>
              <span>opacity</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={(debugPlacement || placementDebugTarget.placement).opacity ?? 1}
                onChange={(event) => updateDebugPlacement({ opacity: Number(event.target.value) })}
              />
            </label>
            <DebugCode>
              {JSON.stringify(debugPlacement || placementDebugTarget.placement, null, 2)}
            </DebugCode>
            <button type="button" onClick={copyDebugPlacement}>
              复制配置
            </button>
            <small>方向键移动，[ ] 调宽，, . 调旋转，Shift 加速。</small>
          </PlacementDebugPanel>
        )}

        {sceneMode === 'interior' && !activeZone && (
          <MobileZoneList>
            {BLOG_ZONES.map((zone) => (
              <MobileZoneCard key={zone.id} type="button" onClick={() => enterZone(zone.id)}>
                <strong>{zone.title}</strong>
                <span>{zone.hint}</span>
              </MobileZoneCard>
            ))}
          </MobileZoneList>
        )}

        {sceneMode === 'interior' && activeZone && (
          <MobileObjectActions>
            {activeZoneObjects.map((object) => (
              <MobileZoneCard key={object.id} type="button" onClick={() => setActiveObjectId(object.id)}>
                <strong>{object.title}</strong>
                <span>{object.subtitle}</span>
              </MobileZoneCard>
            ))}
            <MobileBackButton type="button" onClick={returnToMaster}>
              返回完整书屋
            </MobileBackButton>
          </MobileObjectActions>
        )}
      </PineconeLibraryStage>
    </BlogWorld>
  );
};

const BlogWorld = styled.div`
  height: 100dvh;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  padding: 0;
  color: #f8ead1;
  background:
    radial-gradient(circle at 50% 6%, rgba(56, 88, 142, 0.32), transparent 32%),
    radial-gradient(circle at 12% 88%, rgba(147, 99, 54, 0.18), transparent 36%),
    linear-gradient(180deg, #050816 0%, #090714 48%, #140c07 100%);
  overflow: hidden;

  @media (max-width: 760px) {
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
  }
`;

const PineconeLibraryStage = styled.section`
  width: 100vw;
  height: 100dvh;
  min-height: 0;
  margin: 0 auto;
  align-self: center;

  @media (max-width: 760px) {
    width: 100vw;
  }
`;

const StageShell = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0;
  background:
    linear-gradient(135deg, rgba(255, 211, 137, 0.08), transparent 34%),
    rgba(10, 7, 10, 0.72);
  box-shadow:
    0 34px 100px rgba(0, 0, 0, 0.48),
    0 0 120px rgba(215, 151, 70, 0.16);

  @media (max-width: 760px) {
    aspect-ratio: auto;
  }
`;

const StageViewport = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  cursor: default;
  isolation: isolate;

  @media (max-width: 760px) {
    aspect-ratio: auto;
    min-height: 0;
  }
`;

const ExteriorScene = styled.div`
  position: absolute;
  inset: 0;
  z-index: 8;
  overflow: hidden;
  transform: ${({ $isEntering }) => ($isEntering ? 'scale(1.055)' : 'scale(1)')};
  filter: ${({ $isEntering }) => ($isEntering ? 'brightness(1.18) saturate(1.08)' : 'brightness(1)')};
  transition:
    transform 680ms ease,
    filter 680ms ease,
    opacity 680ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 180ms ease;
    transform: none;
  }
`;

const ExteriorSkyImage = styled.img`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  filter: brightness(1.02) saturate(1.05);
  transform: scale(1.012);
  transform-origin: center;
  pointer-events: none;
`;

const ExteriorHouseMainImage = styled.img`
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 30px 48px rgba(0, 0, 0, 0.34));
  transform: scale(1.03);
  transform-origin: center;
  pointer-events: none;
`;

const ExteriorFrogImage = styled.img`
  position: absolute;
  left: ${({ $placement }) => $placement.left};
  top: ${({ $placement }) => $placement.top};
  width: ${({ $placement }) => $placement.width};
  z-index: 3;
  opacity: ${({ $debugOpacity }) => $debugOpacity ?? 1};
  transform: translate(-50%, -50%) rotate(${({ $placement }) => $placement.rotate});
  transform-origin: 50% 72%;
  pointer-events: none;
  filter:
    brightness(0.86)
    saturate(0.92)
    sepia(0.08)
    drop-shadow(0 8px 10px rgba(0, 0, 0, 0.32));
  transition:
    transform 220ms ease,
    filter 220ms ease;

  @media (max-width: 760px) {
    width: 15%;
    left: 64%;
    top: 59%;
  }
`;

const ExteriorPlatformForegroundImage = styled.img`
  position: absolute;
  inset: 0;
  z-index: 4;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  transform: scale(1.03);
  transform-origin: center;
  pointer-events: none;
`;

const ExteriorShade = styled.div`
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background:
    radial-gradient(circle at 61% 47%, transparent 0 28%, rgba(0, 0, 0, 0.28) 64%, rgba(0, 0, 0, 0.52) 100%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.34), transparent 34%, rgba(0, 0, 0, 0.18));
`;

const InteriorScene = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
`;

const AmbientEffects = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
`;

const StarField = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.42;
  background-image:
    radial-gradient(circle, rgba(255, 232, 166, 0.9) 0 1px, transparent 1.5px),
    radial-gradient(circle, rgba(164, 203, 255, 0.54) 0 1px, transparent 1.7px),
    radial-gradient(circle, rgba(255, 241, 198, 0.72) 0 1px, transparent 1.4px);
  background-position:
    8% 18%,
    86% 12%,
    72% 38%;
  background-size:
    190px 160px,
    250px 210px,
    310px 260px;
  mask-image: linear-gradient(to bottom, #000 0 42%, transparent 72%);
  animation: starTwinkle 7s ease-in-out infinite alternate;

  @keyframes starTwinkle {
    from {
      opacity: 0.26;
      transform: translate3d(0, 0, 0);
    }
    to {
      opacity: 0.58;
      transform: translate3d(0, -7px, 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const DustMotes = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.44;
  background-image:
    radial-gradient(circle, rgba(255, 196, 95, 0.55) 0 1.4px, transparent 2px),
    radial-gradient(circle, rgba(255, 231, 170, 0.42) 0 1px, transparent 1.8px);
  background-position:
    18% 74%,
    62% 46%;
  background-size:
    220px 180px,
    170px 150px;
  filter: blur(0.2px);
  animation: moteDrift 12s ease-in-out infinite alternate;

  @keyframes moteDrift {
    from {
      transform: translate3d(-8px, 6px, 0);
    }
    to {
      transform: translate3d(10px, -10px, 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const LanternBreath = styled.div`
  position: absolute;
  left: 62%;
  top: 42%;
  width: min(28vw, 430px);
  aspect-ratio: 1;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(255, 193, 87, 0.34),
    rgba(255, 155, 54, 0.12) 38%,
    transparent 66%
  );
  filter: blur(18px);
  transform: translate(-50%, -50%) scale(0.92);
  mix-blend-mode: screen;
  opacity: 0.62;
  animation: lanternPulse 4.8s ease-in-out infinite alternate;

  @keyframes lanternPulse {
    from {
      opacity: 0.36;
      transform: translate(-50%, -50%) scale(0.9);
    }
    to {
      opacity: 0.74;
      transform: translate(-50%, -50%) scale(1.08);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ExteriorIntroPanel = styled.div`
  position: absolute;
  left: clamp(18px, 4vw, 64px);
  top: clamp(18px, 5vw, 76px);
  z-index: 8;
  width: min(420px, 36%);
  padding: clamp(16px, 2.4vw, 26px);
  border: 1px solid rgba(255, 224, 164, 0.24);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(28, 17, 10, 0.72), rgba(5, 8, 18, 0.58));
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.34);
  color: #fff0cf;
  backdrop-filter: blur(12px);

  span {
    display: block;
    color: #ffd88d;
    font-size: clamp(0.72rem, 0.95vw, 0.9rem);
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: #fff4d6;
    font-size: clamp(1.35rem, 2.3vw, 2.5rem);
    line-height: 1.12;
  }

  p {
    margin: 10px 0 0;
    color: rgba(255, 239, 207, 0.74);
    font-size: clamp(0.86rem, 1vw, 1rem);
    line-height: 1.52;
  }

  @media (max-width: 760px) {
    width: min(330px, calc(100% - 32px));
  }
`;

const ExteriorEnterButton = styled.button`
  margin-top: 16px;
  min-height: 42px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 224, 164, 0.34);
  border-radius: 8px;
  background: rgba(255, 198, 104, 0.18);
  color: #fff2d0;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(255, 184, 83, 0.14);
`;

const ExteriorHotspotLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;

  button {
    pointer-events: auto;
  }
`;

const exteriorHotspotBase = `
  position: absolute;
  z-index: 6;
  border: 1px solid rgba(255, 224, 164, 0.16);
  border-radius: 999px;
  background: rgba(255, 214, 142, 0.025);
  cursor: pointer;
  transition: border-color 220ms ease, background 220ms ease, box-shadow 220ms ease, transform 220ms ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(255, 224, 164, 0.64);
    background: rgba(255, 190, 91, 0.1);
    box-shadow: 0 0 34px rgba(255, 194, 105, 0.18), inset 0 0 28px rgba(255, 194, 105, 0.12);
    outline: none;
  }
`;

const ExteriorHouseHotspot = styled.button`
  ${exteriorHotspotBase}
  left: 58%;
  top: 24%;
  width: 27%;
  height: 26%;
  border-radius: 42% 48% 36% 40%;

  span {
    position: absolute;
    left: 50%;
    bottom: 16%;
    transform: translateX(-50%);
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(20, 12, 8, 0.68);
    color: rgba(255, 239, 205, 0);
    font-weight: 900;
    white-space: nowrap;
    transition: color 220ms ease;
  }

  &:hover span,
  &:focus-visible span {
    color: rgba(255, 239, 205, 0.96);
  }
`;

const ExteriorBridgeHotspot = styled.button`
  ${exteriorHotspotBase}
  left: 22%;
  top: 68%;
  width: 30%;
  height: 10%;
  transform: rotate(-13deg);
`;

const ExteriorSignpostHotspot = styled.button`
  ${exteriorHotspotBase}
  left: 9%;
  top: 42%;
  width: 18%;
  height: 27%;
  border-radius: 8px;
`;

const ExteriorLanternHotspot = styled.button`
  ${exteriorHotspotBase}
  left: 43%;
  top: 39%;
  width: 9%;
  height: 13%;
`;

const ExteriorGuideCard = styled.div`
  position: absolute;
  left: 25%;
  top: 39%;
  z-index: 8;
  width: min(260px, 24%);
  padding: 13px 14px;
  border: 1px solid rgba(255, 224, 164, 0.26);
  border-radius: 8px;
  background: rgba(17, 10, 8, 0.78);
  color: #ffe9b9;
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34);

  ul {
    display: grid;
    gap: 6px;
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }

  li {
    color: rgba(255, 239, 207, 0.78);
    font-size: 0.86rem;
  }
`;

const ExteriorTooltip = styled.div`
  position: absolute;
  left: ${({ $left }) => $left};
  top: ${({ $top }) => $top};
  z-index: 9;
  padding: 7px 10px;
  border: 1px solid rgba(255, 219, 154, 0.36);
  border-radius: 8px;
  background: rgba(12, 8, 8, 0.72);
  color: #ffe7b4;
  font-size: 0.86rem;
  font-weight: 800;
  pointer-events: none;
  transform: translate(-50%, -100%);
  backdrop-filter: blur(10px);
`;

const EnterFlash = styled.div`
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  background:
    radial-gradient(circle at 62% 45%, rgba(255, 208, 124, 0.9), rgba(255, 178, 75, 0.32) 28%, transparent 58%);
  filter: blur(4px);
  transition: opacity 520ms ease;
`;

const MasterLayer = styled.img`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: ${({ $activeZone }) =>
    $activeZone ? `${$activeZone.focus.x} ${$activeZone.focus.y}` : '50% 50%'};
  transform: ${({ $activeZone }) =>
    $activeZone ? `scale(${$activeZone.zoom})` : 'scale(1)'};
  filter: ${({ $activeZone }) =>
    $activeZone ? 'brightness(0.58) saturate(0.88)' : 'brightness(0.95)'};
  transition:
    transform 720ms ease,
    filter 520ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: filter 180ms ease;
    transform: none;
  }
`;

const StageShade = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 46%, transparent 45%, rgba(0, 0, 0, 0.52) 100%),
    linear-gradient(to bottom, rgba(2, 4, 12, 0.18), transparent 34%, rgba(5, 2, 3, 0.3));
`;

const StagePrompt = styled.div`
  position: absolute;
  left: clamp(16px, 2.4vw, 34px);
  top: clamp(16px, 2.4vw, 34px);
  z-index: 6;
  width: min(360px, 34%);
  padding: 12px 14px;
  border: 1px solid rgba(255, 224, 164, 0.2);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(29, 18, 10, 0.58), rgba(6, 8, 18, 0.46));
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  color: #fff0cf;
  pointer-events: none;
  backdrop-filter: blur(10px);

  span {
    display: block;
    color: #ffd88d;
    font-size: clamp(0.62rem, 0.85vw, 0.78rem);
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  strong {
    display: block;
    margin-top: 3px;
    color: #fff4d6;
    font-size: clamp(1rem, 1.55vw, 1.5rem);
    line-height: 1.12;
  }

  p {
    margin-top: 5px;
    color: rgba(255, 239, 207, 0.74);
    font-size: clamp(0.72rem, 0.95vw, 0.9rem);
    line-height: 1.42;
  }

  @media (max-width: 760px) {
    width: min(310px, calc(100% - 32px));
  }
`;

const ExteriorReturnButton = styled.button`
  position: absolute;
  right: clamp(16px, 3vw, 36px);
  top: clamp(16px, 3vw, 36px);
  z-index: 8;
  min-height: 38px;
  padding: 8px 13px;
  border: 1px solid rgba(255, 220, 155, 0.24);
  border-radius: 8px;
  background: rgba(10, 7, 8, 0.7);
  color: #ffe9b9;
  font-weight: 800;
  cursor: pointer;
  backdrop-filter: blur(10px);
`;

const RegionHotspotLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  opacity: ${({ $isHidden }) => ($isHidden ? 0 : 1)};
  pointer-events: ${({ $isHidden }) => ($isHidden ? 'none' : 'auto')};
  transition: opacity 220ms ease;

  @media (max-width: 760px) {
    display: none;
  }
`;

const RegionHotspotButton = styled.button`
  position: absolute;
  left: ${({ $zone }) => $zone.hotspot.left};
  top: ${({ $zone }) => $zone.hotspot.top};
  width: ${({ $zone }) => $zone.hotspot.width};
  height: ${({ $zone }) => $zone.hotspot.height};
  border: 1px solid rgba(255, 224, 164, 0.16);
  border-radius: 8px;
  background: rgba(255, 214, 142, 0.035);
  box-shadow: inset 0 0 22px rgba(255, 194, 105, 0.07);
  color: transparent;
  cursor: pointer;
  transition:
    border-color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease,
    transform 220ms ease;

  span {
    position: absolute;
    left: 10px;
    bottom: 8px;
    max-width: calc(100% - 20px);
    color: rgba(255, 239, 205, 0);
    font-size: 0.82rem;
    font-weight: 800;
    line-height: 1.2;
    text-align: left;
    transition: color 220ms ease;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(255, 218, 150, 0.62);
    background: rgba(255, 188, 91, 0.11);
    box-shadow:
      inset 0 0 34px rgba(255, 194, 105, 0.14),
      0 0 30px rgba(255, 194, 105, 0.12);
    transform: translateY(-2px);
    outline: none;

    span {
      color: rgba(255, 239, 205, 0.92);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    transform: none;
  }
`;

const CloseupLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: clamp(18px, 3vw, 44px);
  pointer-events: ${({ $isVisible }) => ($isVisible ? 'auto' : 'none')};
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  background:
    radial-gradient(circle at 52% 46%, rgba(255, 195, 112, 0.12), transparent 38%),
    rgba(6, 4, 6, 0.48);
  transition: opacity 380ms ease;
`;

const CloseupStage = styled.div`
  position: relative;
  width: min(72%, 980px);
  max-height: 82%;
  border: 1px solid rgba(255, 225, 170, 0.22);
  border-radius: 8px;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.46);
  animation: closeupIn 420ms ease both;
  overflow: visible;

  @keyframes closeupIn {
    from {
      opacity: 0;
      transform: scale(0.975);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 960px) {
    width: min(86%, 760px);
  }

  @media (max-width: 760px) {
    width: 94%;
    max-height: 55%;
    align-self: start;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const CloseupImage = styled.img`
  width: 100%;
  max-height: 82vh;
  display: block;
  object-fit: contain;
  border-radius: 8px;
`;

const ObjectLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
  background: transparent;
`;

const CloseupHint = styled.div`
  position: absolute;
  left: clamp(16px, 3vw, 36px);
  top: clamp(16px, 3vw, 36px);
  z-index: 7;
  display: grid;
  gap: 2px;
  max-width: min(360px, calc(100% - 120px));
  padding: 10px 12px;
  border: 1px solid rgba(255, 220, 155, 0.22);
  border-radius: 8px;
  background: rgba(10, 7, 8, 0.68);
  color: #ffe9b9;
  backdrop-filter: blur(10px);

  strong {
    font-size: 0.96rem;
  }

  span {
    color: rgba(255, 234, 195, 0.72);
    font-size: 0.82rem;
    line-height: 1.4;
  }
`;

const BackButton = styled.button`
  position: absolute;
  right: clamp(16px, 3vw, 36px);
  top: clamp(16px, 3vw, 36px);
  z-index: 9;
  min-height: 38px;
  padding: 8px 13px;
  border: 1px solid rgba(255, 220, 155, 0.24);
  border-radius: 8px;
  background: rgba(10, 7, 8, 0.7);
  color: #ffe9b9;
  font-weight: 800;
  cursor: pointer;
  backdrop-filter: blur(10px);
`;

const ProtoObjectButton = styled.button`
  position: absolute;
  left: ${({ $placement }) => $placement.left};
  top: ${({ $placement }) => $placement.top};
  width: ${({ $placement }) => $placement.width};
  z-index: 8;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  opacity: ${({ $debugOpacity }) => $debugOpacity ?? 1};
  transform: translate(-50%, -50%) rotate(${({ $placement }) => $placement.rotate});

  img {
    width: 100%;
    display: block;
    background: transparent;
    filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.35));
    transition:
      transform 220ms ease,
      filter 220ms ease,
      opacity 220ms ease;
  }

  &:hover,
  &:focus-visible {
    outline: none;

    img {
      transform: translateY(-5px) scale(1.04);
      filter:
        drop-shadow(0 14px 16px rgba(0, 0, 0, 0.42))
        drop-shadow(0 0 14px rgba(255, 198, 104, 0.35));
    }
  }

  @media (max-width: 760px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    img {
      transition: filter 160ms ease;
    }

    &:hover img,
    &:focus-visible img {
      transform: none;
    }
  }
`;

const DebugObjectProxy = styled.button`
  position: absolute;
  left: ${({ $placement }) => $placement.left};
  top: ${({ $placement }) => $placement.top};
  width: ${({ $placement }) => $placement.width};
  min-height: clamp(44px, 7vw, 92px);
  z-index: 8;
  padding: 8px;
  border: 1px dashed rgba(255, 220, 155, 0.72);
  border-radius: 8px;
  background: rgba(255, 198, 104, 0.12);
  color: rgba(255, 239, 205, 0.92);
  cursor: pointer;
  pointer-events: auto;
  opacity: ${({ $debugOpacity }) => $debugOpacity ?? 0.72};
  transform: translate(-50%, -50%) rotate(${({ $placement }) => $placement.rotate});
  font-size: clamp(0.72rem, 1vw, 0.9rem);
  font-weight: 900;
  line-height: 1.2;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
  box-shadow:
    inset 0 0 20px rgba(255, 211, 140, 0.12),
    0 12px 24px rgba(0, 0, 0, 0.22);
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(255, 232, 184, 0.95);
    background: rgba(255, 198, 104, 0.2);
    outline: none;
    transform: translate(-50%, calc(-50% - 5px)) rotate(${({ $placement }) => $placement.rotate})
      scale(1.035);
    box-shadow:
      inset 0 0 24px rgba(255, 211, 140, 0.16),
      0 14px 28px rgba(0, 0, 0, 0.28),
      0 0 18px rgba(255, 198, 104, 0.26);
  }

  @media (max-width: 760px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover,
    &:focus-visible {
      transform: translate(-50%, -50%) rotate(${({ $placement }) => $placement.rotate});
    }
  }
`;

const DetailPanel = styled.aside`
  position: absolute;
  right: clamp(18px, 4vw, 58px);
  top: 50%;
  z-index: 10;
  width: min(380px, calc(100% - 36px));
  max-height: calc(100% - 40px);
  overflow: auto;
  padding: 20px;
  border: 1px solid rgba(92, 55, 25, 0.34);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 244, 216, 0.95), rgba(229, 194, 139, 0.94)),
    #f4dfb7;
  color: #332014;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.42);
  transform: translateY(-50%);
  animation: panelIn 360ms ease both;

  h2 {
    margin: 6px 0 6px;
    color: #24150d;
    font-size: clamp(1.55rem, 2.4vw, 2.1rem);
    line-height: 1.08;
    letter-spacing: 0;
  }

  p {
    color: rgba(55, 34, 20, 0.78);
    font-weight: 700;
    line-height: 1.55;
  }

  @keyframes panelIn {
    from {
      opacity: 0;
      transform: translate(16px, -50%);
    }
    to {
      opacity: 1;
      transform: translate(0, -50%);
    }
  }

  @media (max-width: 760px) {
    left: 14px;
    right: 14px;
    top: auto;
    bottom: 14px;
    width: auto;
    max-height: 48%;
    transform: none;

    @keyframes panelIn {
      from {
        opacity: 0;
        transform: translateY(14px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const PanelLabel = styled.span`
  color: rgba(87, 49, 18, 0.58);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const PanelText = styled.div`
  margin-top: 12px;
  color: rgba(55, 34, 20, 0.74);
  line-height: 1.62;
`;

const EntryList = styled.ul`
  display: grid;
  gap: 8px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;

  li {
    padding: 9px 10px;
    border: 1px solid rgba(91, 52, 22, 0.18);
    border-radius: 8px;
    background: rgba(255, 248, 226, 0.52);
    color: #3d2516;
    font-size: 0.9rem;
  }
`;

const PanelActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;

  button {
    min-height: 38px;
    padding: 8px 13px;
    border: 1px solid rgba(69, 38, 18, 0.24);
    border-radius: 8px;
    background: #3a2418;
    color: #fff0d4;
    font-weight: 800;
    cursor: pointer;
  }

  button:last-child {
    background: rgba(255, 248, 226, 0.62);
    color: #3a2418;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  left: ${({ $zone }) => $zone?.focus.x || '50%'};
  top: ${({ $zone }) => $zone?.focus.y || '50%'};
  z-index: 8;
  padding: 8px 11px;
  border: 1px solid rgba(255, 219, 154, 0.36);
  border-radius: 8px;
  background: rgba(12, 8, 8, 0.72);
  color: #ffe7b4;
  font-size: 0.86rem;
  font-weight: 800;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 12px));
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.34);
`;

const ProtoObjectTooltip = styled.div`
  position: absolute;
  left: ${({ $object }) => {
    const left = parseFloat($object?.placement?.left || '50');
    const width = parseFloat($object?.placement?.width || '12');
    return `${left + width * 0.28}%`;
  }};
  top: ${({ $object }) => {
    const top = parseFloat($object?.placement?.top || '50');
    return `${top - 9}%`;
  }};
  z-index: 11;
  padding: 5px 9px;
  border: 1px solid rgba(114, 74, 34, 0.22);
  border-radius: 6px;
  background: rgba(255, 236, 188, 0.88);
  color: #4b2c16;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.2;
  pointer-events: none;
  transform: rotate(-3deg);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
`;

const MobileZoneList = styled.div`
  display: none;

  @media (max-width: 760px) {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }
`;

const MobileObjectActions = styled(MobileZoneList)``;

const MobileZoneCard = styled.button`
  min-height: 74px;
  padding: 13px 14px;
  border: 1px solid rgba(255, 218, 150, 0.18);
  border-radius: 8px;
  background: rgba(12, 9, 14, 0.78);
  color: #fff1d1;
  text-align: left;
  cursor: pointer;

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 1rem;
  }

  span {
    margin-top: 3px;
    color: rgba(248, 234, 209, 0.72);
    font-size: 0.88rem;
    line-height: 1.4;
  }
`;

const MobileBackButton = styled.button`
  min-height: 44px;
  border: 1px solid rgba(255, 218, 150, 0.18);
  border-radius: 8px;
  background: rgba(255, 238, 202, 0.08);
  color: #ffe8b8;
  font-weight: 800;
`;

const PlacementDebugPanel = styled.div`
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 200;
  display: grid;
  gap: 6px;
  width: min(270px, calc(100vw - 32px));
  padding: 10px;
  border: 1px solid rgba(255, 218, 150, 0.28);
  border-radius: 8px;
  background: rgba(10, 8, 12, 0.9);
  color: #ffe8b8;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);

  strong {
    font-size: 0.9rem;
  }

  label {
    display: grid;
    grid-template-columns: 54px 1fr;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
  }

  input {
    width: 100%;
    min-height: 28px;
    padding: 3px 7px;
    border: 1px solid rgba(255, 218, 150, 0.22);
    border-radius: 6px;
    background: rgba(255, 245, 220, 0.08);
    color: #fff1d1;
  }

  button {
    min-height: 32px;
    border: 1px solid rgba(255, 218, 150, 0.28);
    border-radius: 6px;
    background: rgba(255, 204, 119, 0.18);
    color: #ffe8b8;
    font-weight: 800;
    cursor: pointer;
  }

  small {
    display: none;
    color: rgba(255, 232, 184, 0.68);
    line-height: 1.4;
  }
`;

const DebugCode = styled.pre`
  max-height: 96px;
  overflow: auto;
  margin: 0;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.24);
  color: rgba(255, 240, 210, 0.8);
  font-size: 0.72rem;
  white-space: pre-wrap;
`;

export default Blog;
