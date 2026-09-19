import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const home=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/,''));
const live='D:/Repositories/starci-academy-backend/.claude';
const candidate=path.join(home,'.claude');
const baseline='335b401b19ec6759dfb70ef96b2bf1cd5aca9b3e';
const git=args=>execFileSync('git',['-C',live,...args],{encoding:'utf8'}).trim();
const hash=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const files=['INDEX.md','INDEX.vi.md','package.json','operators/backend-plan/validate.mjs','scripts/migration-contract.mjs','scripts/backend-unit-projection.spec.mjs','tests/evidence/20260906-unit-migration-projection.md'];
if(git(['rev-parse','HEAD'])!==baseline)throw Error('live baseline moved');
const tracked=git(['ls-tree','-r','--name-only',baseline]).split('\n');
for(const name of tracked){
 const original=execFileSync('git',['-C',live,'show',`${baseline}:${name}`],{maxBuffer:64*1024*1024});
 const changed=!fs.readFileSync(path.join(candidate,name)).equals(original);
 if(changed&&!files.includes(name))throw Error('unexpected candidate change: '+name);
}
const entries=files.map(name=>({path:name,before:fs.existsSync(path.join(live,name))?hash(fs.readFileSync(path.join(live,name))):null,after:hash(fs.readFileSync(path.join(candidate,name)))}));
const manifest={baseline,source:live,candidate,target:'2.5.0-rc.6',files:entries,deleted:[],treeHash:hash(Buffer.from(JSON.stringify(entries))),proof:{full:'full-final.log',actual:'actual-probe.json',pack:'pack.log'}};
fs.writeFileSync(path.join(home,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({paths:entries.length,hash:hash(fs.readFileSync(path.join(home,'manifest.json')))}));
