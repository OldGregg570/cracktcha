'use strict';

let path     = require('path'),
    logger   = require('winston'),
    jimp     = require('jimp'),
    fs       = require('fs'),
    prep     = require('./pre-process.js'),
    config   = require('../config.json'),
    OCR      = require('./ocr.js'),
    reporter = require('./reporter.js');

logger.level = process.argv[2] === '--debug' ? 'debug' : 'info';

const OUT_FILE             = path.join(config.tesseractDir, 'output.png'),
      WHITELIST_CHARS      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      REPORT_CAPTCHA_SCALE = 3,
      TEST_CAPTCHA         = config.testCaptchaLocal;

new OCR(OUT_FILE, WHITELIST_CHARS).then((ocrInstance) => {
 getCaptcha()
   .then(jimp.read)
   .then(prep.scale)
   .then(prep.binarize)
   .then(prep.filterNoise)
   .then(writeImg)
   .then(ocrInstance.recognize)
   .then(reporter.writeHtml)
   .then(done);
});

/* Called once everything is done */
function done () {
 logger.debug("done!");
}

/* Return a url for the captcha to solve */
function getCaptcha() {
 return new Promise((resolve) => {
  logger.debug('Getting CAPTCHA ...');
  resolve(TEST_CAPTCHA.url);
 });
}

/* Write the processed image to our output dir */
function writeImg (img) {
 logger.debug('Writing Img ...');
 return new Promise ((resolve) => {
  img.write(OUT_FILE, resolve)
     .write(path.join(__dirname, '\\..\\report\\output.png'));
 });
}
