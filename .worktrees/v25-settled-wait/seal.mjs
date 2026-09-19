import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const live='D:/Repositories/starci-academy-backend/.claude', candidate=path.resolve('.claude'),sha=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['-C',live,...args],{encoding:'utf8',windowsHide:true}).trim();
const baseline='8d9b530924521ca0b5933440fb61c68804886013';
if(git('rev-parse','HEAD')!==baseline)throw Error('Live HEAD drift: do not overwrite');
const tracked=git('ls-files','-z').split('\0').filter(Boolean),paths=new Set(tracked),files=[];
function scan(directory,prefix=''){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const relative=prefix+entry.name;if(entry.isSymbolicLink())throw Error('Unexpected candidate symlink: '+relative);if(entry.isDirectory())scan(path.join(directory,entry.name),relative+'/');else paths.add(relative);}}
scan(candidate);
const inventory=[];
for(const relative of [...paths].sort()){
 if(['knowledge/findings/core.jsonl','knowledge/findings/starci.jsonl'].includes(relative))continue;
 const a=path.join(live,relative),b=path.join(candidate,relative),before=fs.existsSync(a)?sha(fs.readFileSync(a)):null,after=fs.existsSync(b)?sha(fs.readFileSync(b)):null;
 if(after)inventory.push({path:relative,hash:after});
 if(before!==after)files.push({path:relative,before,after});
}
const output={version:1,target:'2.5.0-rc.4',baseline,source:live,candidate,generatedAt:new Date().toISOString(),status:'candidate awaiting final test exit and publisher review',files,deleted:files.filter(item=>!item.after).map(item=>item.path),treeHash:sha(JSON.stringify(inventory)),inventory,proof:{full:'full-final.log',focused:'focused-release.log',related:'focused-final.log',actualPreview:'actual-readonly.json',actualPreviewResult:'published busy=true, candidate busy=false; settled26 and zero proof errors, workers and leases',hostDependency:'Candidate host .tools/playwright is a junction to Source/.tools/playwright; no installation or shared runtime mutation'}};
fs.writeFileSync('manifest-draft.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({files:files.length,deleted:output.deleted,treeHash:output.treeHash,paths:files.map(item=>item.path)},null,2));
