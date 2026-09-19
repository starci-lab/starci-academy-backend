import fs from 'node:fs';
import {missionCorrectionBusy as candidateBusy} from './.claude/scripts/session-open.mjs';
import {missionCorrectionBusy as publishedBusy} from '../../.claude/scripts/session-open.mjs';
import {resolvedWaitingAttemptKeys} from './.claude/scripts/resolved-waiting.mjs';
const session='D:/Repositories/nivo-backend/.worktrees/sessions/20260905-nivo-accounting-01a07247',state=JSON.parse(fs.readFileSync(session+'/state.json'));
const resolved=await resolvedWaitingAttemptKeys('D:/Repositories/starci-academy-backend/.claude',session,state);
console.log(JSON.stringify({purpose:'read-only busy predicate comparison; no commit or lease',publishedBusy:await publishedBusy(session,state),candidateBusy:await candidateBusy(session,state),settled:[...resolved.settled],proofErrors:resolved.errors,activeSlots:state.workerSlots.length,activeLeases:Object.keys(state.leases).length},null,2));
