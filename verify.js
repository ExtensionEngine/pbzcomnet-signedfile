'use strict';

const forge = require('node-forge');

const CRLF = '\r\n';

module.exports = verify;

/**
 * Verify signed XML envelope containing balance report
 * @param {import('elementtree').ElementTree} xmldoc XML document
 * @returns {boolean} verification result
 *
 * @example
 * const { parse, verify } = require('@extensionengine/pbzcomnet-signedfile');
 * const { readFileSync } = require('fs');
 *
 * const xml = readFileSync('./reports/1110779471-20200721.rtf.sgn', 'utf-8');
 * const xmldoc = parse(xml);
 * const isVerified = verify(xmldoc);
 * console.log('result:', isVerified);
 */
function verify(xmldoc) {
  const certificate = hex2bytes(findtext('./Signer/Certificate', xmldoc));
  const signature = hex2bytes(findtext('./Signer/Sign', xmldoc));
  const timestamp = findtext('./TimeStamp', xmldoc);
  const zippedFile = findtext('./File', xmldoc);

  const payload = createPayload(timestamp, zippedFile);
  const hash = sha1(payload);
  const cert = certificateFromDer(certificate);
  return cert.publicKey.verify(hash, signature);
}

function createPayload(timestamp, zippedFile) {
  return [
    '<TimeStamp>',
    timestamp,
    '</TimeStamp>',
    '<File compress="zip" encoding="base64">',
    '<![CDATA[',
    zippedFile,
    ']]>',
    '</File>'
  ].join(CRLF);
}

if (require.main === module) {
  (function () {
    const { parse } = require('elementtree');
    const { readFileSync } = require('fs');

    const [sourcePath] = process.argv.slice(2);

    if (!sourcePath) {
      console.error('Error: Source path not provided!');
      process.exit(1);
    }

    const xml = readFileSync(sourcePath, 'utf-8');
    const xmldoc = parse(xml);
    const isVerified = verify(xmldoc);

    if (!isVerified) {
      console.error('Error: Fail to verify:', sourcePath);
      process.exit(1);
    }

    console.log('File verified successfully:', sourcePath);
  }());
}

function certificateFromDer(bytes) {
  const buffer = new forge.util.ByteBuffer(bytes);
  return forge.pki.certificateFromAsn1(forge.asn1.fromDer(buffer));
}

function hex2bytes(str) {
  return forge.util.binary.hex.decode(str);
}

function sha1(payload) {
  return forge.sha1.create().update(payload).digest().bytes();
}

function findtext(selector, xmldoc) {
  const text = xmldoc.findtext(selector);
  return text && text.trim();
}
