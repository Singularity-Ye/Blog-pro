import bgOcean from '../../../assets/images/home/card-ocean.png';
import bgForest from '../../../assets/images/home/card-forest.png';
import bgDesert from '../../../assets/images/home/card-desert.png';
import bgSnow from '../../../assets/images/home/card-snow.png';
import bgCity from '../../../assets/images/home/card-city.png';
import bgAbout from '../../../assets/images/home/card-about.png';

export const BIOMES = {
  ocean: {
    key: 'ocean',
    label: '潮汐湾',
    description: '重置星寰仪视角，回归大阵中心。',
    color: '#1598d3',
    glow: '#67e8f9',
    href: '/',
    bgImage: bgOcean,
  },
  forest: {
    key: 'forest',
    label: '松窗灵笈台',
    description: '松窗竹案，清心翻阅崖畔的修行手札与技术札记。',
    longDescription: '坐落在孤峰拔地、云雾绕流的凌空悬崖书台。此地是屋主松影斑驳的清修案台，崖顶建有“松果阁”。窗扉半掩，清风拂面，竹案旁存放着记录感悟与秘籍的“灵笈书匣”。技术真解与凡尘随笔皆收纳于此，静候有缘之人驻足翻阅。',
    color: '#10b981',
    glow: '#a7f3d0',
    href: '/blog',
    bgImage: bgForest,
  },
  desert: {
    key: 'desert',
    label: '星络天机原',
    description: '鸟瞰纵横星宿，在无垠星沙间探寻因果关联的轨迹。',
    longDescription: '心识波澜与万法关联在此具象，化为横跨群星彼岸的无垠星沙荒原。在此处，松窗灵笈台中的每一篇手札与心得，都化为了一颗颗闪烁的因果星宿。星轨交错，连结成一张浩大的“天机图谱”。道友可拨动星仪，探索不同法门体系之间的隐秘脉络。',
    color: '#d97706',
    glow: '#fef08a',
    href: '/atlas',
    bgImage: bgDesert,
  },
  snow: {
    key: 'snow',
    label: '玄枢造物坊',
    description: '在极寒雪峰间拨动齿轮，观摩冷凝于风雪中的玄机法器。',
    longDescription: '矗立于茫茫雪峰与极寒之地的天工造物工坊。屋主在此架设旋转的“玄枢大阵”，将无形的逻辑机制冷凝汇聚，锻造出可自由触摸、运转互动的奇异机关与法宝。齿轮咬合，玄机暗藏，静待道友探入神识，亲手拨动这些在风雪中吟唱的造物。',
    color: '#0284c7',
    glow: '#e0f2fe',
    href: '/projects',
    bgImage: bgSnow,
  },
  city: {
    key: 'city',
    label: '听雨寄笺坞',
    description: '在细雨翠竹间折纸投潭，给屋主递送传音飞笺。',
    longDescription: '竹林掩映，细雨连绵，是一处水汽氤氲的清幽驿站。此地乃是通往松果屋的精神连结通道。你可以将心里话或传音手札化作纸船投入潭水之中，由在水畔静静垂钓的“碧潭邮差”蛤蟆祥将其钓起呈送。若事态紧急，柱上的飞剑阵法亦能替你御剑传音。',
    color: '#0d9488',
    glow: '#99f6e4',
    href: '/contact',
    bgImage: bgCity,
  },
  about: {
    key: 'about',
    label: '浮生道迹屿',
    description: '漫步在本命浮空仙岛，探寻屋主的修行履历与藏宝仙阁。',
    longDescription: '悬浮于虚空彼岸的本命真灵之岛。云雾聚散间，明镜般的“三生石”倒映着屋主的凡尘履历与求索轨迹；“道行碑”上铭刻着他苦修得来的诸般神通本领；而在错落的“藏宝阁”内，则存放着他平日喜爱的奇珍趣玩与闲暇志趣。到此驻足，可一览屋主问天求道的完整浮生轨迹。',
    color: '#7c3aed',
    glow: '#ddd6fe',
    href: '/about',
    bgImage: bgAbout,
  },
};

export const BIOME_ORDER = ['ocean', 'forest', 'desert', 'snow', 'city', 'about'];
