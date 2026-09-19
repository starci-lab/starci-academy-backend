import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const release = path.dirname(fileURLToPath(import.meta.url));
const destination = path.join(release, '.claude');
const request = JSON.parse(fs.readFileSync(path.join(release, 'request.json')));
const support = path.resolve(process.argv[2]);
const label = process.argv[3];
if (!/^[a-z0-9-]+$/.test(label)) throw Error('Invalid integration label');
const manifestName = process.argv[4] || 'manifest.json';
if (!/^[a-z-]+\.json$/.test(manifestName)) throw Error('Invalid manifest name');
const manifestBytes = fs.readFileSync(path.join(support, manifestName));
const manifest = JSON.parse(manifestBytes);
if (manifest.baseline !== request.baseline) throw Error('Baseline mismatch');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const normalize = value => typeof value === 'string' ? value.replace(/^sha256:/,'') : value;
const files = manifest.files.map(item => {
  if (path.isAbsolute(item.path) || item.path.split(/[\\/]/).some(x => !x || x === '..' || x === '.')) throw Error('Unsafe path');
  const source = path.join(support, '.claude', item.path);
  const target = path.join(destination, item.path);
  const bytes = fs.readFileSync(source);
  if (hash(bytes) !== normalize(item.after)) throw Error(`Candidate drift: ${item.path}`);
  const before = fs.existsSync(target) ? hash(fs.readFileSync(target)) : null;
  if (before !== normalize(item.before)) throw Error(`Destination drift: ${item.path}`);
  return { ...item, source, target, bytes };
});
for (const file of files) {
  fs.mkdirSync(path.dirname(file.target), { recursive: true });
  fs.writeFileSync(file.target, file.bytes);
  if (hash(fs.readFileSync(file.target)) !== normalize(file.after)) throw Error(`Readback mismatch: ${file.path}`);
}
const record = { baseline: request.baseline, manifestHash: hash(manifestBytes), files: manifest.files, integratedAt: new Date().toISOString(), published: false };
fs.writeFileSync(path.join(release, `${label}-integration.json`), JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ label, files: files.length, manifestHash: record.manifestHash, published: false }));
