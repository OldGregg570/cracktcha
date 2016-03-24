'use strict';

let path       = require('path'),
    logger     = require('winston'),
    jimp       = require('jimp'),
    fs         = require('fs');

const TESSERACT_DIR          = 'C:\\tesseract',
      OUT_FILE               = path.join(TESSERACT_DIR, 'output.png'),
      WHITELIST_CHARS        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      REPORT_CAPTCHA_SCALE   = 3,

      // Test Captchas
      TEST_CAPTCHA_LOCAL = {
       solution: "PLFERW", url: path.join(__dirname, "..", "input.png")
      },
      TEST_CAPTCHA_WEB   = {
       solution: "JGGBVC", url: "https://www.reddit.com/captcha/Y1GE8H32Q5SOTi9QWGlfHwevrfNSZMyd.png"
      },
      TEST_CAPTCHA = TEST_CAPTCHA_LOCAL;

var start = new Date().getTime();

new OCR (WHITELIST_CHARS).then((ocr) => {
 getCaptcha().then((captcha) => {
  jimp.read(captcha)
      .then(processImg)
      .then(writeImg)
      .then(ocr.recognize)
      .then(writeReport)
      .then(done);
 });
});

function done () {
 console.log("done!");
}

function getCaptcha() {
 return new Promise((resolve) => {
  resolve(TEST_CAPTCHA.url);
 });
}

/* Apply pre-processing to the image before attempting OCR */
function processImg (img) {

 // Alpha should always be 100%
 var rgb = (r, g, b) => jimp.rgbaToInt(r, g, b, 255);
 const BINARIZATION_THRESHOLD = 0xdddddd00;

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


/* Write the processed image to our output dir */
function writeImg (img) {
 return new Promise ((resolve) => {
  img.write(OUT_FILE, resolve)
     .scale(REPORT_CAPTCHA_SCALE)
     .write(path.join(__dirname, '/../output.png'));
 });
}

/* Wrapper for tesseract */
function OCR (whitelistChars) {
 let tesseract  = require('node-tesseract'),
     instance = { recognize: recognize };

 return new Promise ((resolve) => {
  const WHITELIST_FILE = TESSERACT_DIR + '\\tessdata\\configs\\letters';

  let whitelist = `tessedit_char_whitelist ${WHITELIST_CHARS}`;
  fs.writeFile (WHITELIST_FILE, whitelist, () => {
   resolve(instance);
  });
 });

 /* Run OCR on the final image */
 function recognize (e, d) {
  const MODE_WORDS = 8,
        OCR_CONFIG = { psm: MODE_WORDS,  config: 'letters' };

  return new Promise((resolve) => {
   tesseract.process(OUT_FILE, OCR_CONFIG, (e, text) => {
    resolve(text);
   });
  });
 }
}

/* Output the string */
function writeReport (solvedText) {
 return new Promise((resolve) => {
  const REPORT_FILE = path.join(__dirname, '/../output.html');

  var html = getReportHtml (OUT_FILE, solvedText, 0);
  fs.writeFile(REPORT_FILE, html, resolve);
 });
}

function getReportHtml (outFile, solvedText, timeElapsed) {
 var elements = [];
 elements.push(`<h1>Processed Captcha (${REPORT_CAPTCHA_SCALE}x Size):</h1>`);
 elements.push(`<img src="./output.png"/>`);
 elements.push(`<h1>Solved Text: ${solvedText}</h1>`);
 elements.push(`<h1>Actual Solution: ${TEST_CAPTCHA.solution}</h1>`);
 elements.push(`<h1>Time Elapsed: ${new Date().getTime() - start}ms</h1>`);
 elements.push(`<p style="display:none;">${Math.random()}</p>`);
 return elements.join('\n');
}
