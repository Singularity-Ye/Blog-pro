import { BLOG_ASSETS } from './blogAssets';

export const BLOG_CLOSEUP_IMAGE_SIZES = {
  centerDesk: { width: 1448, height: 1086 },
  leftShelf: { width: 1448, height: 1086 },
  travelZone: { width: 1448, height: 1086 },
  rightShelf: { width: 1448, height: 1086 },
  scrollZone: { width: 1448, height: 1086 },
};

export const BLOG_ZONES = [
  {
    id: 'left-shelf',
    title: '左侧书架',
    hint: '索引和节点都藏在这一格里。',
    closeup: BLOG_ASSETS.interior.leftShelf,
    focus: { x: '28%', y: '42%' },
    zoom: 1.45,
    hotspot: { left: '18%', top: '32%', width: '24%', height: '24%' },
  },
  {
    id: 'center-desk',
    title: '中央桌面',
    hint: '最近的手札先落在桌面上。',
    closeup: BLOG_ASSETS.interior.centerDesk,
    focus: { x: '50%', y: '50%' },
    zoom: 1.35,
    hotspot: { left: '40%', top: '36%', width: '22%', height: '24%' },
  },
  {
    id: 'travel-zone',
    title: '旅行地图区',
    hint: '路线、城市和散步计划铺在这里。',
    closeup: BLOG_ASSETS.interior.travelZone,
    focus: { x: '35%', y: '72%' },
    zoom: 1.45,
    hotspot: { left: '18%', top: '62%', width: '28%', height: '24%' },
  },
  {
    id: 'right-shelf',
    title: '右侧书架',
    hint: '技术机关书在这边发着微光。',
    closeup: BLOG_ASSETS.interior.rightShelf,
    focus: { x: '72%', y: '40%' },
    zoom: 1.5,
    hotspot: { left: '62%', top: '28%', width: '28%', height: '26%' },
  },
  {
    id: 'scroll-zone',
    title: '卷轴角落',
    hint: '旧地图和世界观草稿卷在一处。',
    closeup: BLOG_ASSETS.interior.scrollZone,
    focus: { x: '72%', y: '68%' },
    zoom: 1.45,
    hotspot: { left: '62%', top: '60%', width: '26%', height: '26%' },
  },
];
