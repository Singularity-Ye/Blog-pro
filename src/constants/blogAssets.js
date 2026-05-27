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
import bgMain from '../assets/images/blog/overview/background.png';
import bgWall from '../assets/images/blog/indoor/background.png';
import bgFores from '../assets/images/blog/outdoor/background.png';
import bgTravel from '../assets/images/blog/travel/background.png';
import bgArchive from '../assets/images/blog/archive/background.png';
import bgWorkshop from '../assets/images/blog/workshop/background.png';
import bgHallway from '../assets/images/blog/junction/background.png';
import bgMinimap from '../assets/images/blog/shared/minimap-background.png';

import leafGreen from '../assets/images/blog/indoor/leaf-green.png';
import leafGold from '../assets/images/blog/indoor/leaf-gold.png';
import scrollBamboo from '../assets/images/blog/outdoor/scroll-bamboo.png';
import scrollJade from '../assets/images/blog/outdoor/scroll-jade.png';
import scrollOpen from '../assets/images/blog/shared/scroll-open.png';

import mapBook from '../assets/images/blog/shared/map-book.png';
import mapCutout from '../assets/images/blog/travel/map-cutout.png';
import mapOpen from '../assets/images/blog/travel/map-open.png';
import noteBox from '../assets/images/blog/shared/note-box.png';
import drawer from '../assets/images/blog/shared/drawer.png';
import blueprint from '../assets/images/blog/shared/blueprint.png';
import scroll from '../assets/images/blog/shared/scroll.png';
import mapScroll from '../assets/images/blog/travel/map-scroll.png';
import parchmentReader from '../assets/images/blog/shared/parchment-reader.png';

// Cropped environmental items
import travelMap from '../assets/images/blog/travel/travel-map.png';
import travelScroll from '../assets/images/blog/travel/travel-scroll.png';
import archiveDrawer from '../assets/images/blog/archive/drawer.png';
import archiveNoteBox from '../assets/images/blog/archive/note-box.png';
import workshopBlueprint from '../assets/images/blog/workshop/workshop-blueprint-old.png';
import workshopScroll from '../assets/images/blog/workshop/workshop-scroll-old.png';
import workshopBlueprintMap from '../assets/images/blog/workshop/blueprint-map.png';
import workshopPotions from '../assets/images/blog/workshop/potions.png';
import workshopAstrolabe from '../assets/images/blog/workshop/astrolabe.png';

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
  mapScroll,
  parchmentReader,
  travelMap,
  travelScroll,
  archiveDrawer,
  archiveNoteBox,
  workshopBlueprint,
  workshopScroll,
  workshopBlueprintMap,
  workshopPotions,
  workshopAstrolabe,
};

export const getBlogAssetByKey = (assetKey) => {
  return assetKey.split('.').reduce((current, key) => current?.[key], BLOG_ASSETS.proto);
};
