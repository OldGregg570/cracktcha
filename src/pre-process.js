'use strict';

let jimp = require('jimp'),
    rgb = (r, g, b) => jimp.rgbaToInt(r, g, b, 255),
    logger = require('winston');

module.exports = {
 binarize
}

function binarize (img) {
 const BINARIZATION_THRESHOLD = 0xe0000000;
 logger.debug(`Binarizing Img with the following threshold: ${BINARIZATION_THRESHOLD} ...`);

 //img.gaussian(1);
 return new Promise((resolve) => {
  // Binarize
  var w = img.bitmap.width,
      h = img.bitmap.height;

  for (let x = 0; x < w; x++) {
   for (let y = 0; y < h; y++) {
    var c = img.getPixelColor(x, y) > BINARIZATION_THRESHOLD ? rgb(0, 0, 0) : rgb(255, 255, 255);
    img.setPixelColor(c, x, y);
   }
  }
  resolve(img);
 });
}
