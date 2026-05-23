export const BIOMES = {
  ocean: {
    key: 'ocean',
    label: '首页海洋',
    description: '回到灵感小地球仪的主控台',
    color: '#1598d3',
    glow: '#67e8f9',
    href: '/',
  },
  forest: {
    key: 'forest',
    label: '博客雨林',
    description: '文章、随笔与松果屋内容入口',
    color: '#57b83f',
    glow: '#bbf7d0',
    href: '/blog',
  },
  desert: {
    key: 'desert',
    label: '图谱荒漠',
    description: '知识地图、路线图与关系网络',
    color: '#e0a145',
    glow: '#fde68a',
    href: '/atlas',
  },
  snow: {
    key: 'snow',
    label: '项目雪山',
    description: '开发实验、作品集与 Three.js 试炼',
    color: '#f0fbff',
    glow: '#dbeafe',
    href: '/projects',
  },
  city: {
    key: 'city',
    label: '联系城市',
    description: '社交账号、留言与个人信标',
    color: '#9ca3af',
    glow: '#f0abfc',
    href: '/contact',
  },
};

export const BIOME_ORDER = ['ocean', 'forest', 'desert', 'snow', 'city'];
