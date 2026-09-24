import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const home=path.dirname(fileURLToPath(import.meta.url));
const support='D:/Repositories/nivo-backend/.worktrees/sessions/20260905155158-nivo-87e4a31b/runtime/support/art-installed-doctor';
const ref=path.join(support,'provisional-manifest.json'),bytes=fs.readFileSync(ref),sha=b=>createHash('sha256').update(b).digest('hex');
if(sha(bytes)!=='2d343b70d9f16b15324e0036ec32a7b33cd06df51fdf480a5bff2797139a4337')throw Error('Manifest changed');
const manifest=JSON.parse(bytes),tested=JSON.parse(fs.readFileSync(path.join(home,'integrated-run-1/tested-tree.json'))),delta=new Map(manifest.files.map(f=>[f.path,f]));
for(const [name,digest] of Object.entries(tested)){
 const change=delta.get(name),actual=sha(fs.readFileSync(path.join(manifest.candidate,name)));
 if(change ? change.before!=='sha256:'+digest||change.after!=='sha256:'+actual : actual!==digest)throw Error('Unexpected candidate delta '+name);
}
for(const proof of [manifest.proof.installerFocused,manifest.proof.packedInstalledTargeted])if(proof.exitCode!==0||'sha256:'+sha(fs.readFileSync(path.join(support,proof.ref)))!==proof.sha256)throw Error('Focused proof changed');
let script=fs.readFileSync(path.join(home,'adopt-verified-candidate.mjs'),'utf8');
script=script.replace("candidate=path.join(home,'host/.claude')",'candidate='+JSON.stringify(manifest.candidate));
const old="for(const[name,digest]of Object.entries(tested))if(sha(fs.readFileSync(path.join(candidate,name)))!==digest)throw Error('Tested candidate changed '+name);";
if(!script.includes(old))throw Error('Adoption guard unexpected');
script=script.replace(old,'const delta='+JSON.stringify(Object.fromEntries(manifest.files.map(f=>[f.path,f.after.slice(7)])))+";for(const[name,digest]of Object.entries(tested))if(sha(fs.readFileSync(path.join(candidate,name)))!==(delta[name]??digest))throw Error('Verified candidate changed '+name);");
script=script.replace("'art-combined-fixture/combined-fixture-manifest.json'","'art-combined-fixture/combined-fixture-manifest.json','art-installed-doctor/provisional-manifest.json'");
script=script.replace("test:result,at:","baseSourceTest:result,packagingDeltaProof:'packaging-publication-basis.json',installedDoctor:'failed; user explicitly deferred skills test failures to TODO.md',at:");
fs.writeFileSync(path.join(home,'adopt-authorized-candidate.mjs'),script,{flag:'wx'});
fs.writeFileSync(path.join(home,'packaging-publication-basis.json'),JSON.stringify({at:new Date().toISOString(),manifest:ref,delta:manifest.files,focusedProof:manifest.proof,installedDoctorActual:JSON.parse(fs.readFileSync(path.join(support,'packed-proof-2/result.json'))),authority:'User explicitly instructed: op fail also record and ignore, no more testing, record in TODO.md.',todo:'D:/Repositories/nivo-backend/.worktrees/sessions/20260905155158-nivo-87e4a31b/TODO.md',claimsFullDoctorPass:false,claimsProductUatPass:false},null,2),{flag:'wx'});
console.log('Prepared exact candidate adoption with disclosed user-deferred skills failures');
