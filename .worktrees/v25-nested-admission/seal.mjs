import {readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const support=import.meta.dirname,candidate=path.join(support,'.claude'),live=path.resolve(support,'../../.claude');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=async(dir,prefix='')=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(async e=>e.isDirectory()?files(path.join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]))).flat();
const ignored=['knowledge/findings/core.jsonl','knowledge/findings/starci.jsonl'];
const inventory=[];for(const file of (await files(candidate)).sort())inventory.push({path:file,sha256:hash(await readFile(path.join(candidate,file)))});
const baseline=execFileSync('git',['-C',live,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(baseline!=='3d15e85da4b46301ed77796d03296dbf843ac071')throw Error('Live baseline drift; review before sealing');
const changes=[];for(const item of inventory){if(ignored.includes(item.path))continue;let before=null;try{before=hash(await readFile(path.join(live,item.path)));}catch(error){if(error.code!=='ENOENT')throw error;}if(before!==item.sha256)changes.push({path:item.path,beforeSha256:before,afterSha256:item.sha256});}
const tracked=execFileSync('git',['-C',live,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean),set=new Set(inventory.map(x=>x.path));
const deleted=tracked.filter(file=>!set.has(file)&&!ignored.includes(file));if(deleted.length)throw Error('Unexpected missing tracked candidate files: '+deleted.join(', '));
const manifest={version:1,target:'2.5.0-rc.2',baseline,candidate,live,createdAt:new Date().toISOString(),changes,deleted,excluded:ignored,inventorySha256:hash(JSON.stringify(inventory)),inventory,proof:{focused:'combined-focused.log',full:'full-final.log',actualReadOnly:'actual-candidate-repro-final.log',fullResult:{exitCode:0,tests:436,pass:436,fail:0,skipped:0,generatedDocs:76},limits:['No live or peer-ledger writes.','Existing Source Playwright installation is exposed to the candidate host by a validated junction.','Earlier failed logs are preserved; final full-suite results must be read from full-final.log.']}};
await writeFile(path.join(support,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({changed:changes.length,deleted:deleted.length,files:inventory.length,manifestSha256:hash(await readFile(path.join(support,'manifest.json'))),paths:changes.map(x=>x.path)},null,2));
