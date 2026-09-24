import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const home=path.dirname(fileURLToPath(import.meta.url)),candidate=path.join(home,'verified-host/.claude');
const live='D:/Repositories/starci-academy-backend/.claude';
const expected='22490eb85dedcd0894b59c648cac2b8b37b419af';
const hash=value=>createHash('sha256').update(value).digest('hex');
function git(...args){const r=spawnSync('git',['-C',live,...args],{maxBuffer:40*1024*1024});if(r.status!==0)throw Error(r.stderr.toString());return r.stdout;}
const result=JSON.parse(fs.readFileSync(path.join(home,'integrated-run-3/result.json')));
if(result.status!=='complete'||result.exitCode!==0||result.testedTreeUnchanged!==true)throw Error('Full unchanged-candidate suite has not passed');
if(git('rev-parse','HEAD').toString().trim()!==expected)throw Error('Live baseline moved; reconcile before adoption');
const tested=JSON.parse(fs.readFileSync(path.join(home,'integrated-run-3/tested-tree.json')));
for(const [name,digest] of Object.entries(tested))if(hash(fs.readFileSync(path.join(candidate,name)))!==digest)throw Error('Candidate changed after test: '+name);
const allowed=new Set(['INDEX.md','INDEX.vi.md','package.json','scripts/plan-history.mjs','scripts/mission-history.spec.mjs','scripts/session-lock.mjs','scripts/session-lock.spec.mjs','scripts/business-registry.mjs','scripts/business-registry.spec.mjs','scripts/v22-runtime.spec.mjs']);
const changes=[];
for(const name of git('ls-files','-z').toString().split('\0').filter(Boolean)){
 const file=path.join(candidate,name);if(!fs.existsSync(file))throw Error('Candidate missing tracked file: '+name);
 const baseline=git('show',expected+':'+name),after=fs.readFileSync(file);
 if(hash(baseline)===hash(after))continue;
 if(!allowed.has(name))throw Error('Unexpected candidate change: '+name);
 const clean=spawnSync('git',['-C',live,'diff','--quiet',expected,'--',name]);
 if(clean.status!==0)throw Error('Live file changed concurrently: '+name);
 changes.push({path:name,before:hash(baseline),after:hash(after)});
}
if(changes.length!==allowed.size)throw Error('Expected exact reviewed ten-file delta');
for(const change of changes)fs.copyFileSync(path.join(candidate,change.path),path.join(live,change.path));
fs.writeFileSync(path.join(home,'live-adoption.json'),JSON.stringify({baseline:expected,changes,test:result,at:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({adopted:changes.map(change=>change.path),published:false}));
