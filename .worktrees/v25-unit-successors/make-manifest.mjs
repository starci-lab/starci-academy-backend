import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./.claude',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['-C',root,...args],{windowsHide:true,encoding:'utf8'});
const log=readFileSync(new URL('./unit-successor-final.log',import.meta.url),'utf8');
if(!/pass 1/.test(log)||!/fail 0/.test(log)||!/skipped 0/.test(log))throw Error('Final focused lifecycle is not green');
const files=git('diff','--name-only').trim().split('\n').filter(Boolean),patch=git('diff','--binary');
writeFileSync(new URL('./unit-successor.patch',import.meta.url),patch);
const logs=['unit-successor-final.log','unit-successor-neighbor.log','native-unit-probe.log','native-unit-final.log'];
const manifest={version:1,baseline:git('rev-parse','HEAD').trim(),candidate:root,
request:{ref:'request.json',sha256:sha(readFileSync(new URL('./request.json',import.meta.url)))},
status:'Focused post-RC10 patch ready for review; rebase and source-review current-delivery guard integration remain before publication.',
files:files.map(file=>({file,sha256:sha(readFileSync(new URL('./.claude/'+file,import.meta.url)))})),
patch:{ref:'unit-successor.patch',sha256:sha(patch)},
tests:[{command:'node --test scripts/unit-successor.spec.mjs',passed:1,failed:0,skipped:0,durationMs:Number(log.match(/duration_ms ([\d.]+)/)[1]),log:logs[0],helperSha256:'d4d206fee2a4eb78386376306d68504ce23ab9c89810eed9386eca95daf80542',coverage:'Genuine current bind, confirmed architecture and independent critique, accepted backend plan and public unit expansion; two actual red source commits, changed real methods, public typed retries, matched source commit, current consumer open, exact history retention and pending/failed/cycle/duplicate/unit/input/operator/seal negatives.'},
{command:'node --test scripts/workflow-reentry.spec.mjs scripts/plan-edit.spec.mjs scripts/plan-history.spec.mjs',passed:15,failed:0,skipped:0,durationMs:394130.5671,log:logs[1],helperSha256:'2b3a64d6712f2b91978f65711673b02d207226f946511cea5b526e55ec374118',coverage:'Initial extracted retry guard and unit successor snapshot; final D4D lineage strengthening has the focused lifecycle and native proof above.'}],
nativeProbe:{script:'probe-native.mjs',scriptSha256:sha(readFileSync(new URL('./probe-native.mjs',import.meta.url))),log:logs[3],helperSha256:'d4d206fee2a4eb78386376306d68504ce23ab9c89810eed9386eca95daf80542',result:JSON.parse(readFileSync(new URL('./native-unit-final.log',import.meta.url),'utf8')),limit:'Read-only unit and plan admission proof; it does not execute or accept the next native source operator.'},
logs:logs.map(ref=>({ref,sha256:sha(readFileSync(new URL('./'+ref,import.meta.url)))})),
checks:['node --check passed','git diff --check passed','No live/native/product changes','No frozen RC10 changes','No version changes, commits or publication'],
remaining:['Rebase onto published RC10 after root completes its frozen release','Join the existing fresh producer delivery retirement guard and prove a current unit dependency remains blocked by source review']};
const bytes=JSON.stringify(manifest,null,2)+'\n';writeFileSync(new URL('./review-manifest.json',import.meta.url),bytes);
console.log(JSON.stringify({manifestSha256:sha(bytes),patchSha256:sha(patch),files:files.length}));
