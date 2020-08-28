'use strict';

const { parse, verify } = require('..');
const path = require('path');
const { readFileSync } = require('fs');

const xml = readFileSync(path.join(__dirname, '../reports/1110779471-20200721.rtf.sgn'), 'utf-8');
const xmldoc = parse(xml);
const isVerified = verify(xmldoc);
console.log('result:', isVerified);
