import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const home=import.meta.dirname,root=path.join(home,'.claude'),donor=path.resolve(home,'../v25-prior-waits/.claude');
const sha=bytes=>'sha256:'+crypto.createHash('sha256').update(bytes).digest('hex');
const original=fs.readFileSync(path.join(donor,'scripts/nested-return.spec.mjs'),'utf8');
const updated=fs.readFileSync(path.join(root,'scripts/nested-return.spec.mjs'),'utf8');
const helper=fs.readFileSync(path.join(root,'scripts/nested-return-fixture.mjs'),'utf8');
const start=original.indexOf('async function fixture('),end=original.indexOf('\nasync function replacementLifecycle');
if(helper.slice(helper.indexOf('export async function fixture(')).replace('export async function fixture(','async function fixture(')!==original.slice(start,end))throw Error('fixture body changed');
if(updated.slice(updated.indexOf('\nasync function replacementLifecycle'))!==original.slice(end))throw Error('original tests changed');
const log=fs.readFileSync(path.join(home,'lifecycle-final.log'),'utf8');
if(!/tests 1/.test(log)||!/pass 1/.test(log)||!/fail 0/.test(log)||!/skipped 0/.test(log))throw Error('test not green');
const names=['scripts/nested-return.spec.mjs','scripts/nested-return-fixture.mjs','scripts/prior-mission-waits.spec.mjs'];
const files=names.map(ref=>({path:ref,before:fs.existsSync(path.join(donor,ref))?sha(fs.readFileSync(path.join(donor,ref))):null,after:sha(fs.readFileSync(path.join(root,ref))),source:path.join(root,ref).replaceAll('\\','/')}));
const prerequisites=['scripts/resolved-waiting.mjs','scripts/session-open.mjs','scripts/session-correction.spec.mjs'].map(ref=>{
 const hash=sha(fs.readFileSync(path.join(donor,ref)));if(hash!==sha(fs.readFileSync(path.join(root,ref))))throw Error('production prerequisite changed');return{path:ref,sha256:hash};
});
const manifest={status:'sealed',baseline:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files,deleted:[],prerequisites,
 proof:{exitCode:0,passed:1,failed:0,skipped:0,log:'lifecycle-final.log',logSha256:sha(log),originalFixtureBody:'byte-identical except export keyword',existingTests:'byte-identical after fixture extraction',publicLifecycle:['accepted3 returned ->4 returned ->5 returned ->6 fresh KEEP','current waiting attempts still block mission correction before terminal acceptance','official corrected + as-stated scope confirmation','old3/4/5 waits retired, never settled or reentering','tampered4 response refuses; original exact bytes restored','official corrected-scope preview and commit','plan history validation empty errors','current goal ledger has zero achieved entries','all3/4/5/6 parent request+response bytes unchanged']},
 limits:['Synthetic runtime lifecycle regression, not product UAT.','No native ledger or live runtime writes.','No production delta; requires the exact root prior-waits patch listed above.','Full combined suite belongs to root after integration.']};
const bytes=JSON.stringify(manifest,null,2)+'\n';fs.writeFileSync(path.join(home,'review-manifest.json'),bytes);console.log(sha(bytes));
