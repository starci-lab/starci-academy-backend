import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const home=path.dirname(fileURLToPath(import.meta.url)),candidate=path.join(home,'.claude'),source=path.resolve(home,'../../.claude');
const sha=bytes=>'sha256:'+crypto.createHash('sha256').update(bytes).digest('hex');
const read=name=>JSON.parse(fs.readFileSync(path.join(home,name),'utf8'));
function scan(root,relative=''){
 const result={};
 for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(['.git','node_modules'].includes(entry.name))continue;
  const name=relative?relative+'/'+entry.name:entry.name;
  if(entry.isDirectory())Object.assign(result,scan(root,name));
  else if(entry.isFile())result[name]=sha(fs.readFileSync(path.join(root,name)));
  else throw Error('Unsupported entry '+name);
 }
 return result;
}
const request=read('request.json'),run=read('run-1/result.json'),tested=read('run-1/tested-tree.json');
if(run.status!=='complete'||run.exitCode!==0||run.testedTreeUnchanged!==true)throw Error('Full suite not completed green on an unchanged tree');
const after=scan(candidate),before=scan(path.join(home,'release-baseline'));
if(Object.keys(after).length!==Object.keys(tested).length||Object.keys(after).some(name=>after[name]!=='sha256:'+tested[name]))throw Error('Tested tree drift');
const log=fs.readFileSync(path.join(home,'run-1/full.log'),'utf8');
const counts=Object.fromEntries([...log.matchAll(/^(?:ℹ|#) (tests|pass|fail|skipped) (\d+)/gm)].map(match=>[match[1],Number(match[2])]));
if(!counts.tests||counts.tests!==counts.pass||counts.fail!==0||counts.skipped!==0||!log.includes('76 generated files match the tree'))throw Error('Full counts/docs not passed');
const packed=read('package.json.log')[0],packProof=read('package-readback.json');
if(!packProof.matches||packProof.packedFiles!==packed.files.length||!packProof.installedFilesChecked||sha(fs.readFileSync(path.join(home,packed.filename)))!=='sha256:'+packProof.archiveSha256)throw Error('Package proof mismatch');
if(!fs.readFileSync(path.join(home,'doctor.log'),'utf8').includes('doctor: the installed tree validates'))throw Error('Installed doctor not passed');
if(execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim()!==request.baseline)throw Error('Live baseline moved');
if(Object.keys(before).some(name=>!after[name]))throw Error('Unexpected deletion');
const files=Object.keys(after).filter(name=>after[name]!==before[name]).map(name=>{
 if(name.startsWith('knowledge/findings/'))throw Error('Unrelated findings change');
 const live=path.join(source,name),baseline=path.join(home,'release-baseline',name);
 const liveBytes=fs.existsSync(live)?fs.readFileSync(live):null;
 if(before[name]){
  if(!liveBytes||liveBytes.toString('utf8').replace(/\r\n/g,'\n')!==fs.readFileSync(baseline,'utf8').replace(/\r\n/g,'\n'))throw Error('Uncommitted live change: '+name);
 }else if(liveBytes)throw Error('Untracked live collision: '+name);
 return{path:name,before:liveBytes?sha(liveBytes):null,after:after[name]};
});
const artifact=name=>({path:name,sha256:sha(fs.readFileSync(path.join(home,name)))});
const manifest={status:'sealed',baseline:request.baseline,version:JSON.parse(fs.readFileSync(path.join(candidate,'package.json'))).version,candidate,files,deleted:[],proof:{run:{...run,...counts,log:artifact('run-1/full.log')},package:{...packProof,install:artifact('install.log'),doctor:artifact('doctor.log')},integration:[read('business-integration.json'),read('restatement-integration.json')]},limitations:['Runtime proof does not establish product API, PG16 or browser UAT completion.','No production deployment.']};
const bytes=JSON.stringify(manifest,null,2)+'\n';fs.writeFileSync(path.join(home,'release-manifest.json'),bytes,{flag:'wx'});
console.log(JSON.stringify({manifestHash:sha(bytes),files:files.length,version:manifest.version,tests:counts.tests}));
