import master from '../assets/images/blog/interior/master.png';
import leftShelf from '../assets/images/blog/interior/left-shelf.png';
import centerDesk from '../assets/images/blog/interior/center-desk.png';
import travelZone from '../assets/images/blog/interior/travel-zone.png';
import rightShelf from '../assets/images/blog/interior/right-shelf.png';
import scrollZone from '../assets/images/blog/interior/scroll-zone.png';
import exteriorSkyBg from '../assets/images/blog/exterior/exterior-sky-bg.png';
import exteriorHouseMain from '../assets/images/blog/exterior/exterior-house-main.png';
import exteriorPlatformForeground from '../assets/images/blog/exterior/exterior-platform-foreground.png';
import exteriorFrog from '../assets/images/blog/exterior/frogg.png';
import exteriorFrogGuide from '../assets/images/blog/exterior/frog.png';
import exteriorFrogLantern from '../assets/images/blog/exterior/froggg.png';
import notesSource from '../assets/images/blog/proto/notes/notes001.png';
import notesStack from '../assets/images/blog/proto/notes/stack.png';
import mapbookSource from '../assets/images/blog/proto/mapbook/source.png';

// ── 导入新博客页的精简视觉资产 ─────────────────────────────────────
import bgMain from '../assets/images/blog/bg-main.png';
import bgWall from '../assets/images/blog/bg-wall.png';
import bgFores from '../assets/images/blog/bg-forest.png';
import bgTravel from '../assets/images/blog/bg-travel.png';
import bgArchive from '../assets/images/blog/bg-archive.png';
import bgWorkshop from '../assets/images/blog/bg-workshop.png';
import bgHallway from '../assets/images/blog/junction.png';
import bgMinimap from '../assets/images/blog/bg-minimap.png';

import leafGreen from '../assets/images/blog/leaf-green.png';
import leafGold from '../assets/images/blog/leaf-gold.png';
import scrollBamboo from '../assets/images/blog/scroll-bamboo.png';
import scrollJade from '../assets/images/blog/scroll-jade.png';
import scrollOpen from '../assets/images/blog/scroll-open.png';

import mapBook from '../assets/images/blog/map-book.png';
import mapCutout from '../assets/images/blog/map-cutout.png';
import mapOpen from '../assets/images/blog/map-open.png';
import noteBox from '../assets/images/blog/note-box.png';
import drawer from '../assets/images/blog/drawer.png';
import blueprint from '../assets/images/blog/blueprint.png';
import scroll from '../assets/images/blog/scroll.png';

// Cropped environmental items
import travelMap from '../assets/images/blog/cropped/travel-map.png';
import travelScroll from '../assets/images/blog/cropped/travel-scroll.png';
import archiveDrawer from '../assets/images/blog/cropped/archive-drawer.png';
import archiveNoteBox from '../assets/images/blog/cropped/archive-note-box.png';
import workshopBlueprint from '../assets/images/blog/cropped/workshop-blueprint.png';
import workshopScroll from '../assets/images/blog/cropped/workshop-scroll.png';

export const BLOG_ASSETS = {
  interior: {
    master,
    leftShelf,
    centerDesk,
    travelZone,
    rightShelf,
    scrollZone,
  },
  exterior: {
    skyBg: exteriorSkyBg,
    houseMain: exteriorHouseMain,
    platformForeground: exteriorPlatformForeground,
    frog: exteriorFrog,
    frogGuide: exteriorFrogGuide,
    frogLantern: exteriorFrogLantern,
  },
  proto: {
    notes: {
      source: notesSource,
      stack: notesStack,
    },
    mapbook: {
      source: mapbookSource,
    },
  },
};

export const BLOG_NEW_ASSETS = {
  bgMain,
  bgWall,
  bgFores,
  bgTravel,
  bgArchive,
  bgWorkshop,
  bgHallway,
  bgMinimap,
  leafGreen,
  leafGold,
  scrollBamboo,
  scrollJade,
  scrollOpen,
  mapBook,
  mapCutout,
  mapOpen,
  noteBox,
  drawer,
  blueprint,
  scroll,
  travelMap,
  travelScroll,
  archiveDrawer,
  archiveNoteBox,
  workshopBlueprint,
  workshopScroll,
};

export const getBlogAssetByKey = (assetKey) => {
  return assetKey.split('.').reduce((current, key) => current?.[key], BLOG_ASSETS.proto);
};
