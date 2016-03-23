'use strict';

let path = require('path'),
    logger = require('winston'),
    tesseract = require('node-tesseract'),
    jimp = require('jimp'),
    fs = require('fs');

const MODE_WORDS      = 8,
      TESSERACT_DIR   = 'C:\\tesseract',
      WHITELIST_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      WHITELIST_FILE  = TESSERACT_DIR + '\\tessdata\\configs\\letters';

var outdir = path.join(TESSERACT_DIR, 'output.png'),
    inputImage = path.join(__dirname, "..", "input.png");

processImg(inputImage)
     .then(setWhitelistChars)
     .then(recognize)
     .then(logger.info);

/* Read the input image */
function processImg (imgPath) {
 return new Promise((resolve) => {
  jimp.read(imgPath).then((img) => {
    img.write(outdir, resolve);
  }).catch(logger.error);
});
}

/* Write the whitelist characters to a tesseract config file */
function setWhitelistChars () {
 return new Promise ((resolve) => {
  let whitelist = `tessedit_char_whitelist ${WHITELIST_CHARS}`;
  fs.writeFile (WHITELIST_FILE, whitelist, resolve);
 });
}

/* Process the final image */
function recognize (e, d) {
 return new Promise((resolve) => {
  let options = { psm: MODE_WORDS,  config: 'letters' };
  tesseract.process(outdir, options, (e, text) => {
   resolve(text);
  });
 });
}
