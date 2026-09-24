import fs from 'node:fs';import path from 'node:path';import cp from 'node:child_process';import crypto from 'node:crypto';
const source='D:/Repositories/starci-academy-backend',support=path.join(source,'.worktrees/v25-goal-partitions'),area=path.join(support,'rebase-rc9'),candidate=path.join(support,'.claude');
const baseline='550cb449468780902bae1d12099cd0969790f523',old='7e13c6b02622b3c06a6ed04eedd418749ad00215';const sha=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(support,'review-manifest.json')));for(const f of manifest.files)if(sha(fs.readFileSync(path.join(candidate,f.path)))!==f.after)throw Error('candidate drift '+f.path);
fs.mkdirSync(area,{recursive:true});const request={parentRequest:path.join(support,'request.json'),baseline,authority:'Root directed exact published RC.9 rebase and isolated RC.10 integration with separately reviewed source-review patch; preserve prior manifests and all accepted peer history.',scope:['Isolated candidate and support only','No live, peer or product writes','No publication'],status:'preparation'};fs.writeFileSync(path.join(area,'request.json'),JSON.stringify(request,null,2)+'\n');JSON.parse(fs.readFileSync(path.join(area,'request.json')));
const prior=path.join(area,'prior-tree');if(fs.existsSync(prior))throw Error('prior snapshot already exists');fs.cpSync(candidate,prior,{recursive:true});
const git=args=>cp.execFileSync('git',['-C',path.join(source,'.claude'),...args],{maxBuffer:32*1024*1024});git(['archive','--format=zip','--output='+path.join(area,'rc9.zip'),baseline]);
const report=[];for(const f of manifest.files){const local=fs.readFileSync(path.join(prior,f.path));let base=f.before===null?null:git(['show',old+':'+f.path]);if(f.category.includes('reviewed-RC9-input'))base=fs.readFileSync(path.join(source,'.worktrees/v25-retry-order/.claude',f.path));let remote=null;try{remote=git(['show',baseline+':'+f.path]);}catch{}
const store=(kind,bytes)=>{const p=path.join(area,kind,f.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes);return p;};let result,method,status=0;
if(base&&local.equals(base)){result=remote;method='unchanged-pending-input';}
else if(remote&&base&&remote.equals(base)){result=local;method='partition-only';}
else if(!base&&!remote){result=local;method='new-partition-file';}
else if(remote&&local.equals(remote)){result=remote;method='already-published';}
else {const lp=store('local',local),bp=store('base',base??Buffer.alloc(0)),rp=store('remote',remote??Buffer.alloc(0));const run=cp.spawnSync('git',['merge-file','--stdout',lp,bp,rp],{maxBuffer:8*1024*1024});status=run.status;result=run.stdout;method='three-way';}
if(result)store('merged',result);report.push({path:f.path,before:remote?sha(remote):null,prior:sha(local),after:result?sha(result):null,method,status});}
fs.writeFileSync(path.join(area,'merge-report.json'),JSON.stringify({baseline,priorManifestSha256:sha(fs.readFileSync(path.join(support,'review-manifest.json'))),files:report},null,2)+'\n');console.log(JSON.stringify(report,null,2));
