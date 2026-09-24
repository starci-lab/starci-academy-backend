import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const home=path.dirname(fileURLToPath(import.meta.url));
const root='D:/Repositories/starci-academy-backend/.claude';
const baseline='8a3e1cdc43298d51b547947fcdbae57b919f855b';
const candidate=path.join(home,'.claude');
const old=path.join(home,'baseline-tree');
const hash=v=>'sha256:'+createHash('sha256').update(v).digest('hex');
const allowed=['INDEX.md','INDEX.vi.md','package.json','operators/workspace-bind/validate.mjs','scripts/plan-history.mjs','scripts/validate-chain.mjs','scripts/validate-request.mjs','scripts/workflow-reentry.spec.mjs','scripts/workspace-checkout.mjs','tests/evidence/20260906-workflow-reentry.md','workflows/README.md','workflows/README.vi.md'];
const walk=(dir,prefix='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const name=prefix+entry.name;if(entry.isSymbolicLink())throw Error('Unexpected candidate symlink: '+name);return entry.isDirectory()?walk(path.join(dir,entry.name),name+'/'):[name];});
const all=new Set([...walk(old),...walk(candidate)]);
const changes=[];
for(const name of [...all].sort()) {
 const a=path.join(old,name),b=path.join(candidate,name);
 const before=fs.existsSync(a)?fs.readFileSync(a):null,after=fs.existsSync(b)?fs.readFileSync(b):null;
 if(before&&after&&before.equals(after))continue;
 if(!allowed.includes(name))throw Error('Unreviewed candidate path: '+name);
 if(!after)throw Error('Unexpected deletion: '+name);
 changes.push({path:name,before:before?hash(before):null,after:hash(after)});
}
if(process.argv[2]!=='seal'){console.log(JSON.stringify({candidate,changes},null,2));process.exit(0);}
const liveHead=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(liveHead!==baseline)throw Error('Live baseline moved');
const log=fs.readFileSync(path.join(home,'full-final.log'),'utf8');
const fullRun=JSON.parse(fs.readFileSync(path.join(home,'full-run.json'),'utf8'));
const lastCount=label=>[...log.matchAll(new RegExp(label+' (\\d+)','g'))].at(-1)?.[1];
if(fullRun.exitCode!==0||fullRun.logHash!==hash(Buffer.from(log))||lastCount('fail')!=='0'||lastCount('skipped')!=='0'||!lastCount('tests'))throw Error('Complete zero-failure zero-skip full proof missing');
for(const change of changes){const live=path.join(root,change.path);if(change.before===null?fs.existsSync(live):!fs.existsSync(live)||hash(fs.readFileSync(live))!==change.before)throw Error('Live ownership changed: '+change.path);}
const manifest={baseline,source:root,candidate,targetVersion:'2.5.0-rc.7',files:changes,fullLogHash:hash(Buffer.from(log)),proof:{full:'full-final.log',historicalNative:'actual-sealed-bind.json',progressNative:'review-progress-order-result.json'}};
fs.writeFileSync(path.join(home,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({sealed:true,paths:changes.length,manifestHash:hash(fs.readFileSync(path.join(home,'manifest.json')))}));

