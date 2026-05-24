import bgOcean from '../../../assets/images/home/card-ocean.png';
import bgForest from '../../../assets/images/home/card-forest.png';
import bgDesert from '../../../assets/images/home/card-desert.png';
import bgSnow from '../../../assets/images/home/card-snow.png';
import bgCity from '../../../assets/images/home/card-city.png';

export const BIOMES = {
  ocean: {
    key: 'ocean',
    label: '潮汐湾',
    description: '回到星寰核心，重新启航。',
    longDescription: '万物归流的原初港湾。此地记录着星寰仪的潮汐轨迹，可引导迷失的精神重返核心法阵。',
    color: '#1598d3',
    glow: '#67e8f9',
    href: '/',
    bgImage: bgOcean,
  },
  forest: {
    key: 'forest',
    label: '叶间书林',
    description: '收藏文章、随笔与手札。',
    longDescription: '由墨水与羊皮纸低语织成的笔记森林。每一片树叶都是封印了博主探索心得、技术图纸与随笔手札的载体。',
    color: '#57b83f',
    glow: '#bbf7d0',
    href: '/blog',
    bgImage: bgForest,
  },
  desert: {
    key: 'desert',
    label: '星沙图原',
    description: '从书林传送而来，展开关系图谱。',
    longDescription: '星沙漫天的研究荒原。叶间书林中的笔记链接于此汇聚，在以太引力下编织成纵横交错的可视化星图轨迹。',
    color: '#e0a145',
    glow: '#fde68a',
    href: '/atlas',
    bgImage: bgDesert,
  },
  snow: {
    key: 'snow',
    label: '幽霜析粹所',
    description: '调配魔药与析出三维幻术的幽室。',
    longDescription: '深藏在极寒雪峰下的幽光实验室。此地以冰霜为媒介，冷凝并析出代码背后的奥术晶华，陈列着各种充满诡想的交互式三维幻术成果。',
    color: '#f0fbff',
    glow: '#dbeafe',
    href: '/projects',
    bgImage: bgSnow,
  },
  city: {
    key: 'city',
    label: '池畔信亭',
    description: '在氤氲信亭投递手札，等候池畔回信。',
    longDescription: '水汽氤氲的深夜池畔信亭。你可以在此写下手札投入水中，静待发呆的青蛙邮差帮你将信件钓起，建立通往松果屋的精神连结。',
    color: '#fb923c',
    glow: '#fde047',
    href: '/contact',
    bgImage: bgCity,
  },
};

export const BIOME_ORDER = ['ocean', 'forest', 'desert', 'snow', 'city'];
