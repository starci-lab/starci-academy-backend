import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import crypto from 'node:crypto';
const source='D:/Repositories/starci-academy-backend';
const support=path.join(source,'.worktrees/v25-goal-partitions');
const candidate=path.join(support,'.claude');
const baseline='7e13c6b02622b3c06a6ed04eedd418749ad00215';
const sha=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
const git=(args)=>cp.execFileSync('git',['-C',path.join(source,'.claude'),...args],{maxBuffer:20*1024*1024});
const tracked=git(['ls-tree','-rz','--name-only',baseline]).toString().split('\0').filter(Boolean);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const paths=new Set([...tracked,...walk(candidate).map(p=>path.relative(candidate,p).replaceAll('\\','/'))]);
const files=[],deleted=[];
for(const p of [...paths].sort()){
 const full=path.join(candidate,p),before=tracked.includes(p)?sha(git(['show',baseline+':'+p])):null;
 if(!fs.existsSync(full)){deleted.push(p);continue;}
 const after=sha(fs.readFileSync(full));if(after===before)continue;
 files.push({path:p,before,after,category:p==='scripts/workflow-reentry.spec.mjs'?'reviewed-RC9-input':p.startsWith('docs/')?'generated':p==='scripts/plan-history.mjs'?'authored-plus-reviewed-RC9-input':'authored'});
}
const result={status:'ready-for-review-not-release',baseline,candidate,request:'request.json',pendingBaseline:{target:'final published RC.9 before release',files:[{path:'scripts/plan-history.mjs',sha256:'sha256:ac59319bcefe99114e30c3ee9c6a7c91396bae7a5f3e9e397f62ca2384f1a997'},{path:'scripts/workflow-reentry.spec.mjs',sha256:'sha256:2a414aa509aad710e04000de6e65c2d203e68e07002d88974b8b38e7c26c79ef'}]},files,deleted,proof:{affected:{exitCode:0,tests:11,passed:11,failed:0,skipped:0,log:'affected-final.log',logSha256:sha(fs.readFileSync(path.join(support,'affected-final.log')))},templates:{templates:35,documents:178},briefs:{operators:27,byteBudget:3072},docs:{files:76,exitCode:0},fullSuite:null,packageInstall:null},limits:['No live runtime, peer ledger, product source or publication mutation.','19 seed units use actual current invocation acceptance and isolated JSON fixture storage, not product UAT.','UAT tier test accepts the actual plan; it does not claim browser verification.','Coordinator partition proof selection fixtures are selection tests; native workflow.verify integration requires final RC.9 rebase and combined validation.']};
fs.writeFileSync(path.join(support,'review-manifest.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({manifestSha256:sha(fs.readFileSync(path.join(support,'review-manifest.json'))),files:files.map(f=>({path:f.path,category:f.category})),deleted},null,2));
