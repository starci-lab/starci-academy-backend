import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {acceptedUnitDependency,planAdmissionErrors} from './.claude-rc11/scripts/plan-history.mjs';
const root=fileURLToPath(new URL('./.claude-rc11',import.meta.url));
const session=process.argv[2],consumer=process.argv[3]??'40/1';
const read=file=>JSON.parse(readFileSync(file,'utf8'));
const state=read(path.join(session,'state.json'));
const plan=read(path.join(session,state.planHistory.active.ref));
const refs=['state.json',...state.planHistory.revisions.map(item=>item.ref),...['34','35','39'].flatMap(step=>[`step-${step}/parallel-1/request/request.json`,`step-${step}/parallel-1/response/response.json`])];
const hash=ref=>createHash('sha256').update(readFileSync(path.join(session,ref))).digest('hex');
const before=Object.fromEntries(refs.map(ref=>[ref,hash(ref)]));
const resolved=[];let error=null,admission=null;
try {
  for(const dependency of plan.forecast.units[consumer].dependsOn) resolved.push({dependency,proof:await acceptedUnitDependency(root,session,state,dependency)});
  const [step,parallel]=consumer.split('/');
  admission=await planAdmissionErrors(root,session,state,read(path.join(session,`step-${step}/parallel-${parallel}/request/request.json`)));
} catch(failure) {error=failure.stack;}
const after=Object.fromEntries(refs.map(ref=>[ref,hash(ref)]));
const preserved=refs.every(ref=>before[ref]===after[ref]);
const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
console.log(JSON.stringify({sessionId:state.id,consumer,active:state.planHistory.active,resolved,admission,error,preserved,verifiedFiles:refs.length,inventoryBefore:fingerprint(before),inventoryAfter:fingerprint(after)},null,2));
if(error||admission?.length||!preserved)process.exitCode=1;
