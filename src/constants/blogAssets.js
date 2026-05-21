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
import notesSource from '../assets/images/blog/proto/notes/source.png';
import notesStack from '../assets/images/blog/proto/notes/stack.png';
import mapbookSource from '../assets/images/blog/proto/mapbook/source.png';

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

export const getBlogAssetByKey = (assetKey) => {
  return assetKey.split('.').reduce((current, key) => current?.[key], BLOG_ASSETS.proto);
};
