import fs from 'node:fs';
import {missionCorrectionBusy as candidateBusy} from './.claude/scripts/session-open.mjs';
import {missionCorrectionBusy as publishedBusy} from '../../.claude/scripts/session-open.mjs';
import {resolvedWaitingAttemptKeys,waitingReviewBinding} from './.claude/scripts/resolved-waiting.mjs';
const root='D:/Repositories/starci-academy-backend/.claude',session='D:/Repositories/nivo-backend/.worktrees/sessions/20260905160512-nivo-ca563924',state=JSON.parse(fs.readFileSync(session+'/state.json'));
await waitingReviewBinding(root,session,state,'16/1');
const projection=structuredClone(state);delete projection.attempts['16/1'];
const original=await resolvedWaitingAttemptKeys(root,session,state),admission=await resolvedWaitingAttemptKeys(root,session,state,{reentry:{source:'16/1'}});
console.log(JSON.stringify({purpose:'read-only original-state and transactional busy comparison; no peer mutation',publishedDeletedProjectionBusy:await publishedBusy(session,projection),originalSettled:[...original.settled],originalErrors:original.errors,candidateOrdinaryBusy:await candidateBusy(session,state),candidateResumeBusy:await candidateBusy(session,state,{waitingReentry:{source:'16/1'}}),transactionOnlyAncestors:[...admission.reentering],transactionSettled:[...admission.settled],transactionErrors:admission.errors,activeSlots:state.workerSlots.length,activeLeases:Object.keys(state.leases).length},null,2));
