import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./.claude-rc11', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const local = ref => new URL('./' + ref, import.meta.url);
const git = (...args) => execFileSync('git', ['-C', root, ...args], { windowsHide: true, encoding: 'utf8' });
const baseline = git('rev-parse', 'HEAD').trim();
if (baseline !== '5f874f80bac7617c19de75173f951e5e1c80ec8a') throw Error('Unexpected release baseline');
const retirementLog = process.argv[2];
if (!retirementLog || /[\\/]/.test(retirementLog)) throw Error('Pass the retirement log basename');
const focusedLogs = ['unit-successor-rc11-final.log', retirementLog, 'unit-successor-partitions-rc11.log'];
const tests = focusedLogs.map((ref, index) => {
  const text = readFileSync(local(ref), 'utf8');
  const number = key => Number(text.match(new RegExp('(?:^|\\n)[^\\n]*?\\b' + key + ' ([\\d.]+)'))?.[1]);
  const counts = { passed: number('pass'), failed: number('fail'), skipped: number('skipped'), durationMs: number('duration_ms') };
  if (counts.passed !== 1 || counts.failed !== 0 || counts.skipped !== 0 || !Number.isFinite(counts.durationMs)) throw Error('Focused lifecycle is not green: ' + ref);
  return { command: 'node --test scripts/' + ['unit-successor.spec.mjs', 'unit-successor-review.spec.mjs', 'goal-partitions.spec.mjs'][index], ...counts, log: ref };
});
const docs = readFileSync(local('unit-successor-docs-rc11.log'), 'utf8');
if (!docs.includes('docs:check ok — 76 generated files match the tree')) throw Error('Docs check incomplete');
const probe = JSON.parse(readFileSync(local('native-unit-rc11.log'), 'utf8'));
if (probe.error !== null || probe.admission.length || !probe.preserved || probe.verifiedFiles !== 18 || probe.inventoryBefore !== probe.inventoryAfter) throw Error('Native read-only proof incomplete');
git('diff', '--check');
const files = git('diff', '--name-only').trim().split('\n').filter(Boolean);
const expected = ['INDEX.md', 'INDEX.vi.md', 'package.json', 'scripts/goal-partitions.mjs', 'scripts/plan-history.mjs', 'scripts/unit-successor-fixture.mjs', 'scripts/unit-successor-review.spec.mjs', 'scripts/unit-successor.spec.mjs', 'tests/evidence/20260907-unit-successor-reentry.md', 'workflows/README.md', 'workflows/README.vi.md'];
if (JSON.stringify([...files].sort()) !== JSON.stringify(expected.sort())) throw Error('Candidate file inventory is incomplete or outside scope');
const patch = git('diff', '--binary');
writeFileSync(local('unit-successor-rc11.patch'), patch);
const helperSha256 = sha(readFileSync(new URL('./.claude-rc11/scripts/plan-history.mjs', import.meta.url)));
const partitionSha256 = sha(readFileSync(new URL('./.claude-rc11/scripts/goal-partitions.mjs', import.meta.url)));
const beforeDiagnosticJoin = 'caa63f77331c56afe0ac51b26c341deddf2911e8e8cfa16a670b4d34acc94bdb';
const logs = [...focusedLogs, 'unit-successor-docs-rc11.log', 'native-unit-rc11.log', 'unit-successor-rc11.log'];
const manifest = {
  version: 1, baseline, candidate: root,
  request: { ref: 'request-rc11.json', sha256: sha(readFileSync(local('request-rc11.json'))) },
  packageVersion: JSON.parse(readFileSync(new URL('./.claude-rc11/package.json', import.meta.url))).version,
  status: 'Focused RC11 candidate ready for root full-suite, package review and publication decision.',
  files: files.map(file => ({ file, sha256: sha(readFileSync(new URL('./.claude-rc11/' + file, import.meta.url))) })),
  patch: { ref: 'unit-successor-rc11.patch', sha256: sha(patch) },
  tests: tests.map((test, index) => ({ ...test, helperSha256: index ? helperSha256 : beforeDiagnosticJoin, ...(index ? { partitionSha256 } : { snapshot: 'Current-delivery guard included; before the separate diagnostic partition-admission join.' }) })),
  coverage: [
    'Actual current architecture, independent critique, accepted backend unit plan and public fanout; two real failed source commits then one accepted retry, normal consumer open, retained old unit edge and immutable original receipts.',
    'Failed, pending, ambiguous, cyclic, altered-unit, altered-operator, altered-plan-input and changed-proof lineages refuse, including lookup from their terminal coordinate.',
    'Ordinary nonretry unit proof is admitted before review; a genuine pending review and an accepted executed red quality diagnostic withhold fresh unit credit, historical accepted proof remains readable, and only the genuine fresh source repair admits the consumer.',
    'A genuine typed read-only diagnostic may inspect its accepted member before full delivery; ordinary quality still requires the entire set, malformed diagnostic inputs/method/effects refuse, and the existing nineteen-member accepted partition lifecycle remains enforced.'
  ],
  docs: { command: 'npm run docs:check', generatedFiles: 76, log: 'unit-successor-docs-rc11.log' },
  nativeProbe: { script: 'probe-native-rc11.mjs', scriptSha256: sha(readFileSync(local('probe-native-rc11.mjs'))), log: 'native-unit-rc11.log', helperSha256: beforeDiagnosticJoin, result: probe, limit: 'Read-only admission observation only, before the separate diagnostic partition-admission join. No native writes, execution or acceptance, and no dispatch authorization for the subsequently superseded request.' },
  preservedFailedRun: { log: 'unit-successor-rc11.log', result: '0/1: a deliberately malformed retry graph was correctly refused by GOAL_PARTITION_UNBOUND; the test assertion omitted that exact existing code. The final rerun includes it without changing production.' },
  logs: logs.map(ref => ({ ref, sha256: sha(readFileSync(local(ref))) })),
  checks: ['Exact published RC10 baseline', 'git diff --check passed', 'No live/native/product edits', 'No commits or publication'],
  remaining: ['Root full suite on the final candidate', 'Root package and release verification']
};
const bytes = JSON.stringify(manifest, null, 2) + '\n';
writeFileSync(local('review-manifest-rc11.json'), bytes);
console.log(JSON.stringify({ manifestSha256: sha(bytes), patchSha256: sha(patch), helperSha256, files: files.length, tests }));
