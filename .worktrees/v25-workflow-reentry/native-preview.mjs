import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {previewRevision} from '../../.claude/scripts/plan-history.mjs';
const root='D:/Repositories/starci-academy-backend/.claude';
const home=new URL('./',import.meta.url);
const cases=[
 {name:'accounting',session:'D:/Repositories/nivo-backend/.worktrees/sessions/20260905-nivo-accounting-01a07247',flags:{edit:{kind:'retry',cell:'34/1',correction:'source-history',revision:'8d9b3575b328febe2fa5e08fd762f44764591b9e'}}},
 {name:'chatbot',session:'D:/Repositories/nivo-backend/.worktrees/sessions/20260905160512-nivo-ca563924',flags:{edit:{kind:'retry',cell:'19/1',rebind:{source:'12/1',writeRoots:['apps/agentos-controlplane/src/chatbot','apps/agentos-controlplane/src/config.ts','apps/agentos-controlplane/src/instance-db','src/modules/bussiness/agentos-chatbot','apps/agentos-controlplane/src/module-runtime/chatbot-runtime-projection.service.ts','src/modules/platform/databases/postgresql/primary/migrations/1790989400000-chatbot-dispatch-settlement.ts']}}}}
];
const hash=x=>'sha256:'+createHash('sha256').update(x).digest('hex');
const results=[];
for(const item of cases){
 const stateRef=item.session+'/state.json',before=fs.readFileSync(stateRef);
 const result={name:item.name,session:item.session,flags:item.flags,stateBefore:hash(before)};
 try{const preview=await previewRevision(root,item.session,item.flags);result.previewHash=preview.previewHash;result.ok=true;fs.writeFileSync(new URL(item.name+'-preview.json',home),JSON.stringify(preview,null,2)+'\n');}catch(error){result.ok=false;result.error=error.message;}
 result.stateAfter=hash(fs.readFileSync(stateRef));result.stateUnchanged=result.stateBefore===result.stateAfter;
 fs.writeFileSync(new URL(item.name+'-flags.json',home),JSON.stringify(item.flags,null,2)+'\n');results.push(result);
}
fs.writeFileSync(new URL('native-preview-result.json',home),JSON.stringify({observedAt:new Date().toISOString(),kind:'read-only native preview, no forecast commit or attempt opened',results},null,2)+'\n');
console.log(JSON.stringify(results.map(({name,ok,error,previewHash,stateUnchanged})=>({name,ok,error,previewHash,stateUnchanged})),null,2));
if(results.some(x=>!x.ok||!x.stateUnchanged))process.exitCode=1;
