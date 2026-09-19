import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const support=fileURLToPath(new URL('./',import.meta.url)),root=fileURLToPath(new URL('./.claude',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['-C',root,...args],{windowsHide:true,encoding:'utf8'});
const names=git('diff','--name-only').trim().split('\n').filter(Boolean),patch=git('diff','--binary');
writeFileSync(new URL('./source-review.patch',import.meta.url),patch);
const logs=['source-review-regression.log','source-review-neighbor.log','source-review-final.log','source-review-order.log','source-review-priority-final.log'];
const priorityLog=readFileSync(new URL('./'+logs[4],import.meta.url),'utf8');
if(!/tests 1/.test(priorityLog)||!/pass 1/.test(priorityLog)||!/fail 0/.test(priorityLog)) throw Error('Final priority regression is not green');
const manifest={version:1,baseline:git('rev-parse','HEAD').trim(),candidate:root,request:{ref:'request.json',sha256:sha(readFileSync(new URL('./request.json',import.meta.url)))},
  status:'focused implementation complete; integration owner supplies actual FE and partition lifecycle proof',
  files:names.map(file=>({file,sha256:sha(readFileSync(new URL('./.claude/'+file,import.meta.url)))})),
  patch:{ref:'source-review.patch',sha256:sha(patch)},
  tests:[{command:'node --test scripts/source-review.spec.mjs scripts/producer-import.spec.mjs scripts/workflow-reentry.spec.mjs',passed:55,failed:0,skipped:0,durationMs:260048.5093,log:logs[0]},
    {command:'node --test scripts/plan-history.spec.mjs scripts/plan-edit.spec.mjs scripts/plan-repair.spec.mjs scripts/workflow-coordination-history.spec.mjs scripts/workflow-coordination-rebind.spec.mjs',passed:16,failed:0,skipped:0,durationMs:33698.865,log:logs[1]},
    {command:'node --test --test-name-pattern="accepted source → real red review" scripts/source-review.spec.mjs',passed:1,failed:0,skipped:0,durationMs:132263.0943,log:logs[2]},
    {command:'node --test --test-name-pattern="accepted source → real red review" scripts/source-review.spec.mjs',passed:1,failed:0,skipped:0,durationMs:137453.855,log:logs[3],coverage:'Includes independent pending uat.plan, source-repair insertion priority, full projected chain validation and the complete source/import/authority lifecycle after the first scheduling fix.'},
    {command:'node --test --test-name-pattern="accepted source → real red review" scripts/source-review.spec.mjs',passed:1,failed:0,skipped:0,durationMs:Number(priorityLog.match(/duration_ms ([\d.]+)/)[1]),log:logs[4],coverage:'Review and repair each receive the first fresh coordinate despite unopened rows before later retained executions; actual dependency ordering, full authored chain validation, normal source commit and original/current import proof remain intact.'}],
  testSnapshots:{beforeSchedulingFix:{helperSha256:'a4aeca5063532fafc90c0e8bafe69060f770ba83f7a40a295e5b133214a044d4',logs:logs.slice(0,3)},afterFrontierFix:{helperSha256:'df7de8e380dd26b9e032464cd62d3c210e0f91ac59d7411d35d0eacc80a55810',logs:[logs[3]]},afterPendingPriorityFix:{helperSha256:sha(readFileSync(new URL('./.claude/scripts/source-review.mjs',import.meta.url))),logs:[logs[4]]}},
  rejectedFixtureProbe:{ref:'source-review-priority.log',sha256:sha(readFileSync(new URL('./source-review-priority.log',import.meta.url))),reason:'Both new priority assertions passed; constructed tail omitted quality before uat.plan and was refused by unchanged Next law. Corrected only fixture row arrangement before the final proof.'},
  logs:logs.map(ref=>({ref,sha256:sha(readFileSync(new URL('./'+ref,import.meta.url)))})),checks:['git diff --check passed','No live runtime or product changes','No version changes or commits/publication'],
  integration:['Astra owns source-review-frontend.spec.mjs genuine BE→FE composition','Join sourceReviewCoverage pending/retiredSources to goalPartitionCoverage and goalLedger','Retain partitions and closed obligation membership on source repair successor']};
const bytes=JSON.stringify(manifest,null,2)+'\n';writeFileSync(new URL('./review-manifest.json',import.meta.url),bytes);console.log(JSON.stringify({manifest: support+'review-manifest.json',sha256:sha(bytes),patchSha256:sha(patch),files:names.length}));
