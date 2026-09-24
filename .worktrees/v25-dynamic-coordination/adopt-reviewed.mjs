import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const home = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(home, '../../.claude');
const candidate = path.join(home, '.claude');
const [manifestName, expectedHash] = process.argv.slice(2);
const hash = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const fail = message => { throw Error(message); };
if (!manifestName || path.basename(manifestName) !== manifestName || !/^sha256:[a-f0-9]{64}$/.test(expectedHash ?? '')) fail('Supply the reviewed local manifest name and exact digest.');
const bytes = fs.readFileSync(path.join(home, manifestName));
if (hash(bytes) !== expectedHash) fail('Reviewed manifest changed.');
const manifest = JSON.parse(bytes);
if (manifest.status !== 'sealed') fail('Only a sealed final release manifest may be adopted.');
if (manifest.deleted?.length || !Array.isArray(manifest.files) || !manifest.files.length) fail('This adoption permits only explicit file additions and replacements.');
const head = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim();
if (head !== manifest.baseline) fail('Live baseline moved.');
const names = new Set();
const entries = manifest.files.map(item => {
  if (typeof item.path !== 'string' || names.has(item.path.toLowerCase()) || item.path.startsWith('knowledge/findings/')) fail('Duplicate or unrelated publication path.');
  names.add(item.path.toLowerCase());
  const resolve = base => {
    const target = path.resolve(base, item.path);
    if (!target.toLowerCase().startsWith(base.toLowerCase() + path.sep)) fail('Path escaped the reviewed tree.');
    return target;
  };
  const live = resolve(source), proposed = fs.readFileSync(resolve(candidate));
  if (hash(proposed) !== item.after) fail(`Candidate changed: ${item.path}`);
  const original = fs.existsSync(live) ? fs.readFileSync(live) : null;
  if ((original === null ? null : hash(original)) !== item.before) fail(`Live file changed: ${item.path}`);
  return { ...item, live, proposed, original };
});
for (const entry of entries) {
  if (entry.original !== null) {
    const backup = path.join(home, 'adoption-originals', entry.path);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, entry.original, { flag: 'wx' });
  }
}
for (const entry of entries) {
  fs.mkdirSync(path.dirname(entry.live), { recursive: true });
  fs.writeFileSync(entry.live, entry.proposed);
}
for (const entry of entries) if (hash(fs.readFileSync(entry.live)) !== entry.after) fail(`Readback failed: ${entry.path}`);
fs.writeFileSync(path.join(home, 'adoption.json'), JSON.stringify({ baseline: head, manifest: manifestName, manifestHash: expectedHash, adoptedAt: new Date().toISOString(), paths: entries.map(entry => entry.path), readback: true, published: false }, null, 2) + '\n');
console.log(`Adopted and read back ${entries.length} reviewed paths; Git publication still required.`);
