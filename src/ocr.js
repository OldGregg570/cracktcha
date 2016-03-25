'use strict';

let tesseract  = require('node-tesseract'),
    config     = require('../config.json'),
    logger     = require('winston'),
    fs         = require('fs');

module.exports = OCR;

function OCR (outFile, whitelistChars) {
 logger.debug('OCR Init ...');

 return new Promise ((resolve) => {

  const WHITELIST_FILE = config.tesseractDir + '\\tessdata\\configs\\letters';
  logger.debug('\tWriting Char Whitelist Tesseract Config ...');

  let whitelist = `tessedit_char_whitelist ${whitelistChars}`;
  fs.writeFile (WHITELIST_FILE, whitelist, () => {
   logger.debug(`\tWhitelist written to "${WHITELIST_FILE}"`);
   resolve({ recognize });
  });
 });

 /* Run OCR on the final image */
 function recognize (e, d) {
  const MODE_WORDS = 8,
        OCR_CONFIG = { psm: MODE_WORDS,  config: 'letters' };
  logger.debug("Running OCR ...");
  return new Promise((resolve) => {
   tesseract.process(outFile, OCR_CONFIG, (e, text) => {
    resolve(text);
   });
  });
 }
}
