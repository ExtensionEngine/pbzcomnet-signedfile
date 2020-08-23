'use strict';

const { extract, parse } = require('..');
const { readFileSync } = require('fs');

const xml = readFileSync('./reports/1110779471-20200721.rtf.sgn', 'utf-8');
const xmldoc = parse(xml);
extract(xmldoc).then(buffer => console.log('payload:\n', buffer.toString()));
