'use strict';

let Jimp = require('jimp'),
    logger = require('winston'),
    rgb = (r, g, b) => Jimp.rgbaToInt(r, g, b, 255);

module.exports = {
 binarize,
 scale,
 filterNoise
}

/**
 */
function scale (img) {
 return new Promise((r) => r(img.scale(4)));
}

/**
 */
function binarize (img) {
 const THRESHOLD = rgb(208, 208, 208),
       BLACK     = rgb(0, 0, 0),
       WHITE     = rgb(255, 255, 255);
 logger.debug(`Binarizing Img with the following threshold: ${THRESHOLD} ...`);
 return new Promise((resolve) => {
  img.forEachPixel((color, x, y) => {
   img.setPixelColor(color > THRESHOLD ? BLACK : WHITE, x, y);
  });
  resolve(img);
 });
}

/**
 * Remove noise from the capcha
 */
function filterNoise (img) {
 logger.debug("Filtering Noise ...");

 const CHAR_COUNT = 6,
       MIN_AREA = 50 * 30,
       MAX_ASPECT_RATIO = 5 / 3;

 let islands = [],
     w = img.bitmap.width,
     h = img.bitmap.height;

 return new Promise((resolve) => {
  let islands = discoverIslands(img);
  logger.info("\tFiltering garbage ...");

  // Erase islands that are not the correct shape or size
  islands.filter(isGarbage).forEach(erase);
  islands = islands.filter(negate(isGarbage));

  // Erase islands that are not aligned with the others
  if (islands.length > CHAR_COUNT) {
   logger.info("\tRemoving Outliers ...");
   removeOutliers (islands);
  }


  resolve(relocate(img));

  function removeOutliers(islands) {
   // Calculate the center point for each island
   islands = islands.map((island) => {
    let w = island.right - island.left, h = island.bottom - island.top;
    island.center = { x: island.left + (w / 2), y: island.top + (h / 2)};
    return island;
   });

   // Remove islands that 30px away from the mean in the y direction
   islands.filter(negate(isOutlierY)).forEach(erase);
   islands = islands.filter(isOutlierY);

   function isOutlierY (island) {
    return Math.abs(island.center.y - mean(islands.map((i) => i.center.y))) < 25;
   }

   function mean(vals) {
    return vals.reduce((sum, val) => sum + val, 0) / vals.length;
   }
  }

  function erase (island) {
   let x = island.landingPoint.x, y = island.landingPoint.y;
   img.islandFloodFill(x, y, img.getPixelColor(x, y), rgb(255, 255, 255));
  }

  function isGarbage (island) {
   let w = island.right - island.left, h = island.bottom - island.top;
   return w * h < MIN_AREA || w / h > MAX_ASPECT_RATIO;
  }
 });

 function discoverIslands (img) {
  logger.debug("\tDiscovering islands ...");
  let colorKey = 0x000001ff,
      islands = [];

  // Discover Islands
  img.forEachPixel ((color, x, y) => {
    if (color === rgb(0, 0, 0)) {
     islands.push(img.islandFloodFill (x, y, rgb(0, 0, 0), colorKey));
     colorKey += 0x100;
    }
  });

  return islands;
 }

 function relocate (img) {
  logger.debug("\tRelocating Islands ...");
  return img;
 }
}


Jimp.prototype.forEachPixel = function (fn) {
 let w = this.bitmap.width,
     h = this.bitmap.height;

 for (let x = 0; x < w; x++) {
  for (let y = 0; y < h; y++) {
   fn(this.getPixelColor(x, y), x, y);
  }
 }
}

Jimp.prototype.islandFloodFill = function (x, y, targetColor, fillColor) {
 let w = this.bitmap.width,
     h = this.bitmap.height,
     q = [],
     p,
     island = {
      landingPoint: {x, y},
      left: x,
      right: x,
      top: y,
      bottom: y
    };

 q.push({x, y});
 while (q.length) {
  p = q.shift();
  if (p.x >= 0 && p.y >= 0 && p.x < w && p.y < h) {
   if (this.getPixelColor(p.x, p.y) === targetColor) {
    island.left   = Math.min(island.left, p.x);
    island.right  = Math.max(island.right, p.x);
    island.top    = Math.min(island.top, p.y);
    island.bottom = Math.max(island.bottom, p.y);
    this.setPixelColor (fillColor, p.x, p.y);

    q.push({x: p.x + 1, y: p.y    });
    q.push({x: p.x - 1, y: p.y    });
    q.push({x: p.x    , y: p.y + 1});
    q.push({x: p.x    , y: p.y - 1});
    q.push({x: p.x + 1, y: p.y + 1});
    q.push({x: p.x - 1, y: p.y - 1});
    q.push({x: p.x - 1, y: p.y + 1});
    q.push({x: p.x + 1, y: p.y - 1});

   }
  }
 }
 return island;
}

function negate (f) {
 return (x) => !f(x)
}
