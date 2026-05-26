import bgOcean from '../../../assets/images/home/card-ocean.png';
import bgForest from '../../../assets/images/home/card-forest.png';
import bgDesert from '../../../assets/images/home/card-desert.png';
import bgSnow from '../../../assets/images/home/card-snow.png';
import bgCity from '../../../assets/images/home/card-city.png';

export const BIOMES = {
  ocean: {
    key: 'ocean',
    label: '潮汐湾',
    description: '重置星仪视角，回归主控大阵。',
    longDescription: '万物归流的原初港湾。此地是主导这方小千世界运转的星仪枢纽，海面上倒映着诸天法阵的流光。道友可在此重整神识，调控星环视角的每一次挪移，回归最初的主控法阵中心。',
    color: '#1598d3',
    glow: '#67e8f9',
    href: '/',
    bgImage: bgOcean,
  },
  forest: {
    key: 'forest',
    label: '叶间书林',
    description: '翻阅在下撰写的修行札记与技术秘籍。',
    longDescription: '在下偶然游历至此，寻得这片上古灵木汇聚的繁茂书林，遂在此依树辟建了“松果屋”。书屋的粉壁与门窗上，贴满了在下随手抄录灵感碎片的“碎叶符纸”，而树梢枝桠间则悬挂着记录修行心得的书籍与古卷。技术真解、凡尘杂感，均在此静待道友翻阅。',
    color: '#57b83f',
    glow: '#bbf7d0',
    href: '/blog',
    bgImage: bgForest,
  },
  desert: {
    key: 'desert',
    label: '星沙图原',
    description: '鸟瞰星沙棋盘，探索各篇札记的关联轨迹。',
    longDescription: '以太重力与逻辑交织的无垠沙原。叶间书林中的每一片碎叶符纸与悬空卷轴，在此都会被以太引力具象化为闪烁的知识星宿。它们在沙地上投影成错综复杂的星图棋盘，揭示着不同奥秘法门之间隐秘而神奇的关联轨迹。',
    color: '#e0a145',
    glow: '#fde68a',
    href: '/atlas',
    bgImage: bgDesert,
  },
  snow: {
    key: 'snow',
    label: '幽霜析粹所',
    description: '检视在下炼制的法宝与三维互动阵法。',
    longDescription: '坐落在皑皑雪峰与极寒之下的魔药法宝工坊。在下在此支起炼金炉，以冷冽的冰霜为媒介，将繁复的代码逻辑冷凝并析出成各种可触碰、可互动的奇妙法宝。这里陈列着各种具有三维互动阵法的实验性奥术成果，供道友自由把玩。',
    color: '#f0fbff',
    glow: '#dbeafe',
    href: '/projects',
    bgImage: bgSnow,
  },
  city: {
    key: 'city',
    label: '池畔信亭',
    description: '投递传音飞剑，与在下建立精神连结。',
    longDescription: '水汽氤氲、仙鸟往来的池畔小亭。这是通往松果屋最直接的精神通道，道友可以在此将写有心里话的传音手札投入水中，静待常在池边闲来垂钓的“青蛙邮差”将信件钓起。此外，信亭柱子上悬挂着的飞剑法阵（社交媒体链接）也能帮道友快速联系到在此驻守的见习魔法师。',
    color: '#fb923c',
    glow: '#fde047',
    href: '/contact',
    bgImage: bgCity,
  },
};

export const BIOME_ORDER = ['ocean', 'forest', 'desert', 'snow', 'city'];
