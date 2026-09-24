const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const candidate=path.join(__dirname,'.claude'),backup=path.join(__dirname,'rebase-rc7');
const base='8a3e1cdc43298d51b547947fcdbae57b919f855b',target='886c1cafea34f0782881b9297f62a8742f30ba36';
const git=(...args)=>cp.execFileSync('git',['-C',candidate,...args],{windowsHide:true});
const sha=value=>'sha256:'+crypto.createHash('sha256').update(value).digest('hex');
const put=(file,bytes)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);};
if(git('rev-parse','HEAD').toString().trim()!==base)throw Error('unexpected candidate base');
if(git('diff','--cached','--name-only').length)throw Error('candidate index must remain untouched');
if(fs.existsSync(backup))throw Error('backup already exists; inspect retained result before retry');
const modified=git('diff','--name-only','-z').toString().split('\0').filter(Boolean);
const others=git('ls-files','--others','--exclude-standard','-z').toString().split('\0').filter(Boolean);
for(const file of [...modified,...others])put(path.join(backup,'ours',file),fs.readFileSync(path.join(candidate,file)));
put(path.join(backup,'candidate.patch'),git('diff','--binary'));
const upstream=git('diff','--name-only','-z',base,target).toString().split('\0').filter(Boolean),merges=[],conflicts=[];
for(const file of upstream.filter(file=>modified.includes(file))){
 const ours=fs.readFileSync(path.join(candidate,file)),before=git('show',base+':'+file),theirs=git('show',target+':'+file);
 const oursFile=path.join(backup,'ours',file),baseFile=path.join(backup,'base',file),theirsFile=path.join(backup,'upstream',file);
 put(baseFile,before);put(theirsFile,theirs);
 const result=cp.spawnSync('git',['merge-file','-p',oursFile,baseFile,theirsFile],{windowsHide:true,maxBuffer:8*1024*1024});
 if(![0,1].includes(result.status))throw Error(result.stderr.toString());
 put(path.join(backup,'merged',file),result.stdout);
 merges.push({path:file,base:sha(before),ours:sha(ours),upstream:sha(theirs),merged:sha(result.stdout),conflict:result.status!==0});
 if(result.status)conflicts.push(file);
}
put(path.join(backup,'merge-report.json'),JSON.stringify({base,target,modified,others,upstream,merges,conflicts},null,2)+'\n');
console.log(JSON.stringify({backup,conflicts,merges:merges.map(item=>item.path)},null,2));
