import fs from 'node:fs';
import { createHash } from 'node:crypto';
const sha = value => 'sha256:' + createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(fs.readFileSync('manifest-draft.json', 'utf8'));
const log = fs.readFileSync('full-final.log', 'utf8');
if (!/tests 439\b/.test(log) || !/pass 439\b/.test(log) || !/fail 0\b/.test(log) || !/docs:check/.test(log) || !/76/.test(log)) throw Error('Full proof summary not complete');
if (manifest.treeHash !== 'sha256:62f8fa2c584182868e713490f5441e7b5a7c3a1f43dd52b81d9643fe318f3880') throw Error('Candidate changed during final test');
manifest.status = 'sealed candidate; final exact-tree npm test exited 0; publisher adoption pending';
manifest.sealedAt = new Date().toISOString();
manifest.proof = {
  full: { path: 'full-final.log', exitCode: 0, tests: 439, pass: 439, fail: 0, skip: 0, generatedDocs: 76 },
  focused: { path: 'focused-release.log', tests: 8, pass: 8, fail: 0, note: 'Final production code including exactly-one-successor guard.' },
  related: { path: 'focused-final.log', tests: 22, pass: 22, fail: 0, note: 'Broader focused set before final early exactly-one-successor guard; final full suite covers that final delta.' },
  package: { path: 'pack-dry-run.json', exitCode: 0, fileCount: JSON.parse(fs.readFileSync('pack-dry-run.json', 'utf8').replace(/^\uFEFF/, ''))[0].files.length, note: 'npm pack --dry-run; no publication. Repository-only evidence note is not runtime-linked.' },
  actualReadOnly: { path: 'actual-readonly.json', publishedBusy: true, candidateBusy: false, settled: ['26/1'], proofErrors: [], activeSlots: 0, activeLeases: 0 },
  actualCli: { path: 'actual-preview-before.log', localExitCode: 1, localLimitation: 'Sandbox read-only Git identity verification refused. No trust setting or peer state changed.', publisherIndependentResult: 'Root reports official live Source preview exited 0 on full host with unchanged preview hash b270a14754c3ed9a6d05a7c5307d8e63a1db943cc516cf5b0f03b041546b893e.' },
  hostDependency: 'Candidate host .tools/playwright junction points to Source/.tools/playwright; no installation or shared runtime mutation.',
};
manifest.proofHashes = Object.fromEntries(['full-final.log', 'focused-release.log', 'focused-final.log', 'pack-dry-run.json', 'actual-readonly.json', 'actual-preview-before.log'].map(file => [file, sha(fs.readFileSync(file))]));
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ manifestHash: sha(fs.readFileSync('manifest.json')), treeHash: manifest.treeHash, changedPaths: manifest.files.map(file => file.path), deleted: manifest.deleted }, null, 2));
