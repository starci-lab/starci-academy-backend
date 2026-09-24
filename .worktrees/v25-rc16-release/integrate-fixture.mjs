import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const home=path.dirname(fileURLToPath(import.meta.url));
const ref='D:/Repositories/nivo-backend/.worktrees/sessions/20260905155158-nivo-87e4a31b/runtime/support/art-combined-fixture/combined-fixture-manifest.json';
const bytes=fs.readFileSync(ref), hash=b=>createHash('sha256').update(b).digest('hex');
if(hash(bytes)!=='6644c6b26a1009d3247df54c696c60b3280b26361fec17776761f9b089c2a592')throw Error('Manifest changed');
const m=JSON.parse(bytes), target=path.join(home,'host/.claude');
for(const f of m.files){
 const dest=path.join(target,f.path), source=path.join(m.candidate,f.path);
 if((fs.existsSync(dest)?'sha256:'+hash(fs.readFileSync(dest)):null)!==f.before)throw Error('Baseline mismatch '+f.path);
 if('sha256:'+hash(fs.readFileSync(source))!==f.after)throw Error('Candidate mismatch '+f.path);
}
for(const p of Object.values(m.proof))if(p.exitCode!==0||'sha256:'+hash(fs.readFileSync(path.join(path.dirname(ref),p.ref)))!==p.sha256)throw Error('Proof mismatch');
for(const f of m.files)fs.copyFileSync(path.join(m.candidate,f.path),path.join(target,f.path));
const adopt=path.join(home,'adopt-verified-candidate.mjs'),text=fs.readFileSync(adopt,'utf8');
if(!text.includes("'architecture-cli-cycle/manifest.json'"))throw Error('Unexpected adoption script');
fs.writeFileSync(adopt,text.replace("'architecture-cli-cycle/manifest.json'","'architecture-cli-cycle/manifest.json','art-combined-fixture/combined-fixture-manifest.json'"));
fs.writeFileSync(path.join(home,'fixture-adoption.json'),JSON.stringify({at:new Date().toISOString(),manifest:ref,files:m.files,proof:m.proof,published:false},null,2),{flag:'wx'});
console.log('Integrated four verified fixture paths; live runtime unchanged');
