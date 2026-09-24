import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
const support=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const root=path.join(support,'.claude');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function tree(dir,relative='') {
  const out={};
  for(const entry of fs.readdirSync(path.join(dir,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    if(['.git','node_modules'].includes(entry.name))continue;
    const name=relative?relative+'/'+entry.name:entry.name;
    if(entry.isDirectory())Object.assign(out,tree(dir,name));
    else if(entry.isFile())out[name]=hash(fs.readFileSync(path.join(dir,name)));
    else throw Error('Unexpected non-file release entry: '+name);
  }
  return out;
}
const before=tree(root),record={status:'running',startedAt:new Date().toISOString(),baseline:'d4cec1d5613f3d4fc132eaa86ec42827c3bc701b',treeHash:hash(JSON.stringify(before))};
fs.writeFileSync(path.join(support,'release-tested-tree.json'),JSON.stringify(before,null,2)+'\n');
const log=fs.openSync(path.join(support,'release-full.log'),'w');
const environment={...process.env,STARCI_WALK_HOST_ROOT:path.resolve(support,'../..'),npm_config_cache:path.join(support,'npm-cache')};
record.environment={STARCI_WALK_HOST_ROOT:environment.STARCI_WALK_HOST_ROOT,npm_config_cache:environment.npm_config_cache};
const child=spawn(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npm test'],{cwd:root,env:environment,windowsHide:true,stdio:['ignore',log,log]});
record.pid=child.pid;fs.writeFileSync(path.join(support,'release-full-run.json'),JSON.stringify(record,null,2)+'\n');
const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(exitCode,signal)=>resolve({exitCode,signal}));});
fs.closeSync(log);
Object.assign(record,{status:'complete',endedAt:new Date().toISOString(),...result,testedTreeUnchanged:JSON.stringify(tree(root))===JSON.stringify(before)});
fs.writeFileSync(path.join(support,'release-full-run.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify(record));process.exitCode=result.exitCode||(!record.testedTreeUnchanged?1:0);

