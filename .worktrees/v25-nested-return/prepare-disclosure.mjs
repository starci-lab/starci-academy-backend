import fs from 'node:fs';
import path from 'node:path';
import {scopeHash} from './.claude/scripts/mission-scope.mjs';
const session='D:/Repositories/nivo-backend/.worktrees/sessions/20260905-nivo-accounting-01a07247', state=JSON.parse(fs.readFileSync(path.join(session,'state.json')));
const item=cell=>({cell,attemptId:state.attempts[cell].id,requestHash:state.requestHashes[cell],evidenceFingerprint:state.attempts[cell].evidenceManifest.fingerprint});
const draft={version:1,identity:{sessionId:state.id,missionVersion:state.mission.version,scopeHash:scopeHash(state.mission),parent:item('26/1'),child:item('26/1/critique')},disposition:'fresh-review-required',reason:'The owning reviewer disclosed an estimated observation timestamp. Retain the original accepted evidence and this disclosure; collect a fresh independent review before architecture completion.',sourceRef:null};
fs.writeFileSync('accounting-disclosure-draft.json',JSON.stringify(draft,null,2)+'\n');
console.log(JSON.stringify(draft,null,2));
