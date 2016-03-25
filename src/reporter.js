
'use strict';

let config     = require('../config.json'),
    logger     = require('winston'),
    fs         = require('fs'),
    path       = require('path');

const START_TIME = new Date().getTime();

module.exports = {
 writeHtml
};

/* Output the string */
function writeHtml (solvedText) {
 logger.debug("Writing report ...");
 return new Promise((resolve) => {
  const REPORT_FILE = path.join(__dirname, '\\..\\report\\output.html');

  var html = getReportHtml (solvedText, new Date().getTime() - START_TIME);
  fs.writeFile(REPORT_FILE, html, resolve);
 });
}

/* Return the html string for the cracktcha report */
function getReportHtml (solvedText, timeElapsed) {
 var elements = [];
 elements.push(`<h1>Processed Captcha:</h1>`);
 elements.push(`<img src="./output.png"/>`);
 elements.push(`<h1>Solved Text: ${solvedText}</h1>`);
 elements.push(`<h1>Time Elapsed: ${timeElapsed}ms</h1>`);

 // Ensure that LivePage chrome extension will notice a html change
 elements.push(`<p style="display:none;">${Math.random()}</p>`);
 return elements.join('\n');
}
