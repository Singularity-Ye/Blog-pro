import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const RADIUS = 120; // 环形展开的半径

const getItemOffset = (index) => {
  const angle = 80 + index * 22;
  const rad = (angle * Math.PI) / 180;

  return {
    x: RADIUS * Math.cos(rad),
    y: -RADIUS * Math.sin(rad),
  };
};

const NAV_ITEMS = [
  {
    key: 'ocean',
    label: '潮汐湾',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
    href: '/',
  },
  {
    key: 'forest',
    label: '松窗灵笈台',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8.5C18.5 18 13.5 20 11 20z" />
        <path d="M19 2c-2.26 4.33-5.27 7.14-8 10" />
      </svg>
    ),
    href: '/blog',
  },
  {
    key: 'desert',
    label: '星络天机原',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
    href: '/atlas',
  },
  {
    key: 'snow',
    label: '玄枢造物坊',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <path d="m20 16-4-4 4-4" />
        <path d="m4 8 4 4-4 4" />
        <path d="m16 4-4 4-4-4" />
        <path d="m8 20 4-4 4 4" />
      </svg>
    ),
    href: '/projects',
  },
  {
    key: 'city',
    label: '听雨寄笺坞',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
    href: '/contact',
  },
  {
    key: 'about',
    label: '浮生道迹屿',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    href: '/about',
  },
  {
    key: 'hologram',
    label: '以太全息舱',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 22 22 22" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <polyline points="2 22 12 14 22 22" />
        <circle cx="12" cy="14" r="2.5" />
      </svg>
    ),
    href: '/spatial-ui',
  },
];

const Container = styled(motion.div)`
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ClickOutsideOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9990;
  background: rgba(4, 2, 10, 0.12);
  backdrop-filter: blur(1px);
`;

const MainButton = styled(motion.button)`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1.5px solid rgba(217, 119, 6, 0.6); /* 深琥珀色边框 */
  background: radial-gradient(circle at 35% 30%, #fcd34d 0%, #b45309 40%, #78350f 75%, #451a03 100%); /* 松果渐变：从亮金到深棕 */
  color: #fef3c7; /* 浅暖色图标，保证对比度 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9999;
  position: relative;
  outline: none;
  box-shadow: 
    0 8px 24px rgba(69, 26, 3, 0.45),
    inset 0 2px 4px rgba(255, 255, 255, 0.25),
    0 0 0 1px rgba(245, 158, 11, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: box-shadow 0.3s ease;

  svg {
    width: 25px;
    height: 25px;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    box-shadow: 
      0 12px 30px rgba(69, 26, 3, 0.6),
      0 0 20px rgba(217, 119, 6, 0.6),
      inset 0 2px 4px rgba(255, 255, 255, 0.35);
    background: radial-gradient(circle at 35% 30%, #fde68a 0%, #d97706 40%, #92400e 75%, #78350f 100%); /* 悬停时更亮更暖 */
  }

  &::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 7px;
    width: 10px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
    transform: rotate(-15deg);
    pointer-events: none;
  }
`;

const ItemWrapper = styled(motion.div)`
  position: absolute;
  z-index: ${props => props.$hovered ? 10005 : 9995};
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Swatch = styled(motion.div)`
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  svg {
    width: 19px;
    height: 19px;
    stroke-width: 2.2;
    transition: transform 0.3s ease;
  }

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 5px;
    width: 8px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
    transform: rotate(-15deg);
    pointer-events: none;
  }

  ${({ $biomeKey }) => {
    switch ($biomeKey) {
      case 'ocean':
        return `
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(224, 242, 254, 0.25) 30%, rgba(14, 165, 233, 0.15) 75%, rgba(3, 105, 161, 0.55) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.7),
            inset 0 -2px 6px rgba(3, 105, 161, 0.25),
            0 4px 12px rgba(14, 165, 233, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.4);
          color: rgba(3, 105, 161, 0.85);
          stroke: rgba(3, 105, 161, 0.85);
        `;
      case 'forest':
        return `
          border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(220, 252, 231, 0.25) 30%, rgba(22, 163, 74, 0.15) 70%, rgba(21, 128, 61, 0.55) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.7),
            inset 0 -2px 6px rgba(21, 128, 61, 0.25),
            0 4px 12px rgba(22, 163, 74, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.35);
          color: rgba(21, 128, 61, 0.85);
          stroke: rgba(21, 128, 61, 0.85);
        `;
      case 'desert':
        return `
          border-radius: 45% 45% 55% 55% / 50% 50% 50% 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(254, 243, 199, 0.3) 30%, rgba(245, 158, 11, 0.15) 75%, rgba(180, 83, 9, 0.5) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.7),
            inset 0 -2px 6px rgba(180, 83, 9, 0.25),
            0 4px 12px rgba(245, 158, 11, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.4);
          color: rgba(180, 83, 9, 0.85);
          stroke: rgba(180, 83, 9, 0.85);
        `;
      case 'snow':
        return `
          border-radius: 40% 60% 45% 55% / 55% 45% 55% 45%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.35) 40%, rgba(186, 230, 253, 0.2) 70%, rgba(125, 211, 252, 0.4) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.8),
            inset 0 -2px 6px rgba(56, 189, 248, 0.15),
            0 4px 12px rgba(186, 230, 253, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.45);
          color: rgba(3, 105, 161, 0.8);
          stroke: rgba(3, 105, 161, 0.8);
        `;
      case 'city':
        return `
          border-radius: 55% 45% 50% 50% / 45% 55% 45% 55%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 237, 213, 0.3) 30%, rgba(249, 115, 22, 0.15) 75%, rgba(194, 65, 12, 0.5) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.7),
            inset 0 -2px 6px rgba(194, 65, 12, 0.25),
            0 4px 12px rgba(249, 115, 22, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.4);
          color: rgba(194, 65, 12, 0.85);
          stroke: rgba(194, 65, 12, 0.85);
        `;
      case 'about':
        return `
          border-radius: 40% 50% 50% 60% / 45% 45% 55% 55%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(243, 232, 255, 0.3) 30%, rgba(168, 85, 247, 0.15) 75%, rgba(109, 40, 217, 0.5) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.7),
            inset 0 -2px 6px rgba(109, 40, 217, 0.25),
            0 4px 12px rgba(168, 85, 247, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.4);
          color: rgba(109, 40, 217, 0.85);
          stroke: rgba(109, 40, 217, 0.85);
        `;
      case 'hologram':
        return `
          border-radius: 40% 45% 55% 45% / 50% 50% 50% 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(224, 254, 254, 0.3) 30%, rgba(0, 229, 255, 0.15) 75%, rgba(0, 180, 216, 0.55) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.7),
            inset 0 -2px 6px rgba(0, 180, 216, 0.25),
            0 4px 12px rgba(0, 229, 255, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.4);
          color: rgba(0, 180, 216, 0.85);
          stroke: rgba(0, 180, 216, 0.85);
        `;

      default:
        return '';
    }
  }}

  &:hover {
    transform: scale(1.15) !important;
    ${({ $biomeKey }) => {
      switch ($biomeKey) {
        case 'ocean':
          return `
            background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.35), 0 0 0 1.5px rgba(255, 255, 255, 0.7);
            color: #ffffff;
            stroke: #ffffff;
            svg { transform: scale(1.1) rotate(-45deg); }
          `;
        case 'forest':
          return `
            background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
            box-shadow: 0 6px 20px rgba(34, 197, 94, 0.35), 0 0 0 1.5px rgba(255, 255, 255, 0.7);
            color: #ffffff;
            stroke: #ffffff;
            svg { transform: scale(1.1) rotate(12deg); }
          `;
        case 'desert':
          return `
            background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.32), 0 0 0 1.5px rgba(255, 255, 255, 0.7);
            color: #ffffff;
            stroke: #ffffff;
            svg { transform: scale(1.1) rotate(15deg); }
          `;
        case 'snow':
          return `
            background: linear-gradient(135deg, #e0f2fe 0%, #38bdf8 100%);
            box-shadow: 0 6px 20px rgba(56, 189, 248, 0.25), 0 0 0 1.5px rgba(255, 255, 255, 0.7);
            color: #0369a1;
            stroke: #0369a1;
            svg { transform: scale(1.1) rotate(45deg); }
          `;
        case 'city':
          return `
            background: linear-gradient(135deg, #fb923c 0%, #c2410c 100%);
            box-shadow: 0 6px 20px rgba(249, 115, 22, 0.32), 0 0 0 1.5px rgba(255, 255, 255, 0.7);
            color: #ffffff;
            stroke: #ffffff;
            svg { transform: scale(1.1) translate(-1px, -1px); }
          `;
        case 'about':
          return `
            background: linear-gradient(135deg, #c084fc 0%, #7c3aed 100%);
            box-shadow: 0 6px 20px rgba(168, 85, 247, 0.32), 0 0 0 1.5px rgba(255, 255, 255, 0.7);
            color: #ffffff;
            stroke: #ffffff;
            svg { transform: scale(1.1) rotate(10deg); }
          `;
        case 'hologram':
          return `
            background: linear-gradient(135deg, #00f0ff 0%, #0077b6 100%);
            box-shadow: 0 6px 20px rgba(0, 240, 255, 0.32), 0 0 0 1.5px rgba(255, 255, 255, 0.7);
            color: #ffffff;
            stroke: #ffffff;
            svg { transform: scale(1.1) rotate(15deg); }
          `;

        default:
          return '';
      }
    }}
  }
`;

const Tooltip = styled(motion.div)`
  position: fixed;
  left: ${({ $left }) => `${$left}px`};
  top: ${({ $top }) => `${$top}px`};
  transform: translate(-100%, -50%);
  background: rgba(10, 5, 25, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e2e8f0;
  border: 1px solid rgba(167, 139, 250, 0.3);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  white-space: nowrap;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.45),
    0 0 8px rgba(167, 139, 250, 0.15);
  pointer-events: none;
  z-index: 10020;
`;

const MainTooltip = styled(motion.div)`
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  background: rgba(69, 26, 3, 0.94); /* 深松果棕色背景 */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fde68a; /* 暖金文字 */
  border: 1px solid rgba(217, 119, 6, 0.4); /* 琥珀边框 */
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.45),
    0 0 10px rgba(217, 119, 6, 0.25);
  pointer-events: none;
  z-index: 10000;
`;

const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.2,
    x: 0,
    y: 0,
    pointerEvents: 'none',
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
    },
  },
  visible: (i) => {
    // 角度从 80° 到 190° 分布 (6 个项之间有 5 个间隔，每个间隔 22°)
    const { x, y } = getItemOffset(i);
    return {
      opacity: 1,
      scale: 1,
      x: x,
      y: y,
      pointerEvents: 'auto',
      transition: {
        type: 'spring',
        stiffness: 140,
        damping: 14,
        delay: i * 0.035, // 顺次弹出的微弱延迟
      },
    };
  },
};

function GlobalNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mainHovered, setMainHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const itemRefs = useRef([]);

  // 路由改变时自动关闭菜单
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const handleItemClick = (href) => {
    navigate(href);
    setIsOpen(false);
  };
  const handleItemMouseEnter = (index) => {
    const rect = itemRefs.current[index]?.getBoundingClientRect();
    setHoveredIndex(index);

    if (rect) {
      setTooltipPosition({
        left: rect.left - 10,
        top: rect.top + rect.height / 2,
      });
    }
  };
  const handleItemMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPosition(null);
  };

  const isHome = location.pathname === '/';

  return (
    <AnimatePresence>
      {!isHome && (
        <>
          {/* 当菜单展开时，渲染背景半透遮罩，点击可收起 */}
          <AnimatePresence>
            {isOpen && (
              <ClickOutsideOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsOpen(false)}
              />
            )}
          </AnimatePresence>

          <Container
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* 环形展开的子按钮 */}
            {NAV_ITEMS.map((item, index) => (
              <ItemWrapper
                key={item.key}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate={isOpen ? 'visible' : 'hidden'}
                $hovered={hoveredIndex === index}
              >
                <Swatch
                  $biomeKey={item.key}
                  onClick={() => handleItemClick(item.href)}
                  onMouseEnter={() => handleItemMouseEnter(index)}
                  onMouseLeave={handleItemMouseLeave}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.icon}
                </Swatch>
              </ItemWrapper>
            ))}

            {/* 核心主控导航按钮 */}
            <MainButton
              onClick={toggleOpen}
              onMouseEnter={() => setMainHovered(true)}
              onMouseLeave={() => setMainHovered(false)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* 松果图案 */}
                  <path d="M12 2C7 6 5 11 5 16A7 7 0 0 0 19 16C19 11 17 6 12 2Z" fill="currentColor" fillOpacity="0.15" />
                  <path d="M5 13L12 17L19 13" />
                  <path d="M7 9L12 13L17 9" />
                  <path d="M9 5L12 8L15 5" />
                </svg>
              </div>
            </MainButton>

            {/* 主控按钮悬浮提示气泡 (仅在菜单关闭时展示，避免阻挡展开的子按钮) */}
            <AnimatePresence>
              {mainHovered && !isOpen && (
                <MainTooltip
                  initial={{ opacity: 0, x: 8, y: '-50%' }}
                  animate={{ opacity: 1, x: 0, y: '-50%' }}
                  exit={{ opacity: 0, x: 8, y: '-50%' }}
                  transition={{ duration: 0.18 }}
                >
                  开启松果传送门
                </MainTooltip>
              )}
            </AnimatePresence>
          </Container>

          {createPortal(
            <AnimatePresence>
              {hoveredIndex !== null && tooltipPosition && (
                <Tooltip
                  $left={tooltipPosition.left}
                  $top={tooltipPosition.top}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {NAV_ITEMS[hoveredIndex].label}
                </Tooltip>
              )}
            </AnimatePresence>,
            document.body
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export default GlobalNav;
