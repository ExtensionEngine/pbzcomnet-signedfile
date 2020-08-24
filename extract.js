#!/usr/bin/env node

'use strict';

const decompress = require('decompress');

module.exports = extract;

/**
 * Extract balance report from signed XML envelope
 * @param {import('elementtree').ElementTree} xmldoc XML document
 * @returns {Promise<Buffer>} extracted payload
 *
 * @example
 * const { extract, parse } = require('@extensionengine/pbzcomnet-signedfile');
 * const { readFileSync } = require('fs');
 *
 * const xml = readFileSync('./reports/1110779471-20200721.rtf.sgn', 'utf-8');
 * const xmldoc = parse(xml);
 * extract(xmldoc).then(buffer => console.log('payload:\n', buffer.toString()));
 */
function extract(xmldoc) {
  const zippedFile = Buffer.from(findtext('./File', xmldoc), 'base64');
  return unzip(zippedFile);
}

if (require.main === module) {
  (function () {
    const { parse } = require('elementtree');
    const path = require('path');
    const { promisify } = require('util');
    const { readFileSync, writeFile } = require('fs');

    const writeFileAsync = promisify(writeFile);

    const [sourcePath] = process.argv.slice(2);

    if (!sourcePath) {
      console.error('Error: Source path not provided!');
      process.exit(1);
    }

    const xml = readFileSync(sourcePath, 'utf-8');
    const xmldoc = parse(xml);

    extract(xmldoc)
      .catch(err => {
        console.error('Error: Failed to extract:', sourcePath, err.stack);
        process.exit(1);
      })
      .then(payload => {
        const dirname = path.dirname(sourcePath);
        const filename = path.basename(sourcePath, '.sgn');
        const destPath = path.join(dirname, filename);
        return writeFileAsync(destPath, payload).then(() => destPath);
      })
      .then(filepath => console.log('Payload extracted:', filepath));
  }());
}

function unzip(buffer) {
  return decompress(buffer).then(files => {
    const [file] = files;
    return file.data;
  });
}

function findtext(selector, xmldoc) {
  const text = xmldoc.findtext(selector);
  return text && text.trim();
}
