import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const home=path.dirname(fileURLToPath(import.meta.url));
const candidate=path.join(home,'candidate');
const support='D:/Repositories/nivo-backend/.worktrees/sessions/20260905155158-nivo-87e4a31b/runtime/support/planner-reentry-order';
const manifest=JSON.parse(fs.readFileSync(path.join(support,'manifest.json')));
const sha=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
for(const file of manifest.files){
 const target=path.join(candidate,file.path),source=path.join(support,'.claude',file.path);
 if(sha(fs.readFileSync(target))!==file.before||sha(fs.readFileSync(source))!==file.after)throw Error('Candidate hash drift: '+file.path);
 fs.copyFileSync(source,target);
}
const pkg=JSON.parse(fs.readFileSync(path.join(candidate,'package.json')));
if(pkg.version!=='2.5.0-rc.13')throw Error('Unexpected version');
pkg.version='2.5.0-rc.14';fs.writeFileSync(path.join(candidate,'package.json'),JSON.stringify(pkg,null,2)+'\n');
for(const [name,note] of [
 ['INDEX.md','2.5.0-rc.14 (2026-09-07): resuming a sealed parallel owner preserves unopened independent work and splits mixed successor groups before dependent consumers; both real workflow previews retain prior evidence without ledger mutation.'],
 ['INDEX.vi.md','2.5.0-rc.14 (2026-09-07): tiếp tục một nhánh song song đã niêm phong giữ phần việc độc lập chưa chạy và tách nhóm kế tiếp hỗn hợp trước các nhánh phụ thuộc; preview trên hai workflow thực giữ nguyên bằng chứng và ledger.']
]){
 const file=path.join(candidate,name);let text=fs.readFileSync(file,'utf8');
 text=text.replace('# StarCi Skills 2.5.0-rc.13','# StarCi Skills 2.5.0-rc.14');
 const marker='2.5.0-rc.13 (2026-09-07):';if(!text.includes(marker))throw Error('Missing lineage');
 text=text.replace(marker,note+'\n\n'+marker);fs.writeFileSync(file,text);
}
fs.writeFileSync(path.join(home,'candidate-adoption.json'),JSON.stringify({baseline:manifest.baseline,files:manifest.files,version:pkg.version,review:'Root inspected generic implementation, regressions, and both actual read-only previews. New public commit/open remains pending after publication.'},null,2)+'\n',{flag:'wx'});
console.log('Prepared RC14 candidate; no live adoption.');
