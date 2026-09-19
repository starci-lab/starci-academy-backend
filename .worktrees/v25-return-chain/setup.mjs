import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const source=path.resolve('.claude'),support=path.resolve('.worktrees/v25-return-chain');
const request={version:1,sessionId:'20260905155158-nivo-87e4a31b',source,baseline:'6563115c7984fae3e83256e750bc0f51d7cf4f4e',target:'2.5.0-rc.5',authority:'Parent delegated user-authorized immediate runtime repair of successive nested returns.',scope:['Transactional resume admission for a verified waiting ancestor chain','Full successive returned-review lifecycle and refusal regressions'],effects:['isolated candidate and support evidence only'],update:{question:1,home:'resolved-waiting and existing mission busy/plan commit gates',reason:'Existing typed return re-entry is permitted; deleting its source from a busy-check projection breaks the earlier exact successor binding.'}};
if(execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==request.baseline)throw Error('Baseline drift');
fs.writeFileSync(path.join(support,'request.json'),JSON.stringify(request,null,2)+'\n');
for(const key of ['sessionId','baseline','scope','authority'])if(!request[key])throw Error('Invalid request');
for(const relative of execFileSync('git',['-C',source,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean)){const target=path.join(support,'.claude',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(source,relative),target);}
console.log('Request validated; isolated snapshot copied.');
