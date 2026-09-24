import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const home=path.dirname(fileURLToPath(import.meta.url)),candidate=path.join(home,'final-host/.claude');
const support='D:/Repositories/nivo-backend/.worktrees/sessions/20260905155158-nivo-87e4a31b/runtime/support/planner-reentry-order';
const replacement=path.join(path.dirname(support),'business-registry-replace');
const inputs=[support,replacement].map(directory=>({directory,manifest:JSON.parse(fs.readFileSync(path.join(directory,'manifest.json')))}));
const manifest={baseline:inputs[0].manifest.baseline,files:inputs.flatMap(input=>input.manifest.files.map(file=>({...file,directory:input.directory})))};
const hash=value=>'sha256:'+createHash('sha256').update(value).digest('hex');
const allowed=new Set(['scripts/plan-history.mjs','scripts/mission-history.spec.mjs','scripts/session-lock.mjs','scripts/session-lock.spec.mjs','scripts/business-registry.mjs','scripts/business-registry.spec.mjs']);
if(manifest.files.length!==allowed.size)throw Error('Expected complete reviewed repair manifest');
for(const file of manifest.files){if(!allowed.has(file.path))throw Error('Unexpected repair path');const target=path.join(candidate,file.path),source=path.join(file.directory,'.claude',file.path);if(hash(fs.readFileSync(target))!==file.before||hash(fs.readFileSync(source))!==file.after)throw Error('Repair drift: '+file.path);}
for(const file of manifest.files)fs.copyFileSync(path.join(file.directory,'.claude',file.path),path.join(candidate,file.path));
for(const [name,sentence] of [['INDEX.md',' Atomic registry replacement shares bounded Windows retry behavior while preserving the previous head and releasing publication ownership on failure.'],['INDEX.vi.md',' Thay file registry dùng chung cơ chế retry có giới hạn trên Windows, giữ head cũ và giải phóng quyền ghi khi thất bại.']]){const file=path.join(candidate,name);let text=fs.readFileSync(file,'utf8');text=text.replace(/^(2\.5\.0-rc\.14 \(2026-09-07\):[^\r\n]*)/m,'$1'+sentence);fs.writeFileSync(file,text);}
fs.writeFileSync(path.join(home,'final-candidate-adoption.json'),JSON.stringify({baseline:manifest.baseline,files:manifest.files,version:'2.5.0-rc.14',sourceManifestHashes:inputs.map(input=>({directory:input.directory,hash:hash(fs.readFileSync(path.join(input.directory,'manifest.json')))}))},null,2)+'\n',{flag:'wx'});
console.log('Prepared corrected final candidate, not published');
