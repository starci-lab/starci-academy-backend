// Read-only progress-comparator probe. The supplied native request and state are never written.
// Only counts, equality facts and SHA256 fingerprints are printed; request content is not logged.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { attemptProgressErrors } from './.claude/scripts/validate-request.mjs';

const [session, cell] = process.argv.slice(2);
assert.ok(path.isAbsolute(session ?? ''));
assert.match(cell ?? '', /^[1-9][0-9]*\/[1-9][0-9]*$/);
const [step, parallel] = cell.split('/');
const stateFile = path.join(session, 'state.json');
const requestFile = path.join(session, `step-${step}/parallel-${parallel}/request/request.json`);
const stateBytes = fs.readFileSync(stateFile), requestBytes = fs.readFileSync(requestFile);
const state = JSON.parse(stateBytes), source = JSON.parse(requestBytes), retry = structuredClone(source);
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
retry.step = Math.max(...Object.keys(state.attempts).map(key => Number(key.split('/')[0]))) + 1;
retry.attempt = { ...retry.attempt, id: 'readonly-retry-progress-probe', number: source.attempt.number + 1, previous: source.attempt.id, kind: 'retry' };
retry.resume = null;
const unchanged = await attemptProgressErrors(session, state, retry);
retry.contexts.reverse(); retry.environment.reads.reverse();
const reordered = await attemptProgressErrors(session, state, retry);
assert.deepEqual(fs.readFileSync(stateFile), stateBytes, 'native state bytes remain unchanged');
assert.deepEqual(fs.readFileSync(requestFile), requestBytes, 'native request bytes remain unchanged');
console.log(JSON.stringify({ observedAt: new Date().toISOString(), kind: 'read-only comparator probe; no preview, commit, open or execution',
  sourceCell: cell, sourceStatus: state.attempts[cell].status, contexts: source.contexts.length, reads: source.environment.reads.length,
  sourceStateHash: digest(stateBytes), sourceRequestHash: digest(requestBytes), stateAndRequestUnchanged: true,
  changedOnlyContextAndReadOrder: true, unchangedErrorCount: unchanged.length, reorderedErrorCount: reordered.length }, null, 2));
