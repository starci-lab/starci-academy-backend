import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const home = path.dirname(fileURLToPath(import.meta.url));
const packHome = path.join(home, 'merged-clean-package');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const pack = JSON.parse(fs.readFileSync(path.join(packHome, 'pack.json'), 'utf8').replace(/^\uFEFF/, ''))[0];
for (const file of pack.files) {
  const expected = fs.readFileSync(path.join(home, 'merged-index', file.path));
  const actual = fs.readFileSync(path.join(packHome, 'package', file.path));
  if (hash(expected) !== hash(actual)) throw Error('Archive differs: ' + file.path);
}
const install = JSON.parse(fs.readFileSync(path.join(packHome, 'installed/.claude/.starci-skills.json')));
for (const file of Object.keys(install.files)) {
  if (hash(fs.readFileSync(path.join(packHome, 'package', file))) !== hash(fs.readFileSync(path.join(packHome, 'installed/.claude', file)))) throw Error('Install differs: ' + file);
}
const proof = {
  indexTree: '51f0b0fc00f832cec56fec4619143ef0253e3916',
  version: install.version,
  packedFiles: pack.files.length,
  installedFiles: Object.keys(install.files).length,
  archiveSha256: hash(fs.readFileSync(path.join(packHome, pack.filename))),
  matches: true,
  fullSuite: 'Separate live process 92206; this package check does not establish test completion or publication.'
};
fs.writeFileSync(path.join(packHome, 'readback.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify(proof));
