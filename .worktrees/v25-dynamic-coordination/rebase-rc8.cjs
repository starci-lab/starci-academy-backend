const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.join(__dirname,'.claude'),backup=path.join(__dirname,'rebase-rc8'),base='886c1cafea34f0782881b9297f62a8742f30ba36',target='7e13c6b02622b3c06a6ed04eedd418749ad00215';
const git=(...args)=>cp.execFileSync('git',['-C',root,...args],{windowsHide:true,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});
const sha=bytes=>'sha256:'+crypto.createHash('sha256').update(bytes).digest('hex');
const write=(file,bytes)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);};
if(git('rev-parse','HEAD').toString().trim()!==base)throw Error('unexpected candidate base');
if(fs.existsSync(path.join(backup,'applied.json')))throw Error('rebase already applied');
const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../v25-proof-review-reentry/release-manifest.json')));
const changed=git('diff','--name-only',base,target).toString().trim().split('\n').sort();
if(JSON.stringify(changed)!==JSON.stringify(manifest.files.map(row=>row.path).sort()))throw Error('published release differs from eight-path manifest');
const rows=[];
for(const entry of manifest.files){
 const ref=entry.path,file=path.join(root,ref),ours=fs.existsSync(file)?fs.readFileSync(file):null,theirs=git('show',target+':'+ref);
 let before=null;try{before=git('show',base+':'+ref);}catch{}
 const authored=fs.readFileSync(entry.source);
 if(sha(authored)!==entry.after||authored.toString().replace(/\r\n/g,'\n')!==theirs.toString().replace(/\r\n/g,'\n'))throw Error('published author proof differs '+ref);
 for(const [side,bytes] of [['ours',ours],['base',before],['upstream',theirs]])if(bytes)write(path.join(backup,side,ref),bytes);
 let merged;
 if(!ours)merged=theirs;
 else if(!before)throw Error('new published path collides with local file '+ref);
 else if(ref==='package.json'){
  const old=JSON.parse(before),a=JSON.parse(ours),b=JSON.parse(theirs);
  for(const key of new Set([...Object.keys(old),...Object.keys(b)]))if(!['version','files'].includes(key)&&JSON.stringify(old[key])!==JSON.stringify(b[key]))throw Error('unexpected upstream package field '+key);
  a.version='2.5.0-rc.9';a.files=[...new Set([...a.files,...b.files])];merged=Buffer.from(JSON.stringify(a,null,2)+'\n');
 }else if(ref==='INDEX.md'||ref==='INDEX.vi.md'){
  const upstream=theirs.toString(),line=upstream.split(/\r?\n/).find(line=>line.startsWith('2.5.0-rc.8 ('));
  if(!line)throw Error('missing RC8 lineage');
  const text=ours.toString();if(!text.startsWith('# StarCi Skills 2.5.0-rc.9'))throw Error('candidate version not RC9');
  merged=Buffer.from(text.replace(/2\.5\.0-rc\.7 \(/,line+'\n\n2.5.0-rc.7 ('));
 }else{
  const output=cp.spawnSync('git',['merge-file','-p',path.join(backup,'ours',ref),path.join(backup,'base',ref),path.join(backup,'upstream',ref)],{windowsHide:true,maxBuffer:64*1024*1024});
  if(output.status!==0)throw Error('unresolved three-way merge '+ref+'\n'+output.stdout+'\n'+output.stderr);
  merged=output.stdout;
 }
 write(path.join(backup,'merged',ref),merged);rows.push({path:ref,before:before?sha(before):null,ours:ours?sha(ours):null,upstream:sha(theirs),merged:sha(merged)});
}
write(path.join(backup,'release-manifest.json'),fs.readFileSync(path.resolve(__dirname,'../v25-proof-review-reentry/release-manifest.json')));
write(path.join(backup,'merge-report.json'),JSON.stringify({base,target,rows},null,2)+'\n');
for(const row of rows){const file=path.join(root,row.path);if(row.ours&&sha(fs.readFileSync(file))!==row.ours)throw Error('local file changed '+row.path);if(row.before)write(file,fs.readFileSync(path.join(backup,'base',row.path)));}
try{process.stdout.write(git('merge','--ff-only',target));}
catch(error){for(const row of rows)if(row.ours)write(path.join(root,row.path),fs.readFileSync(path.join(backup,'ours',row.path)));throw error;}
for(const row of rows)write(path.join(root,row.path),fs.readFileSync(path.join(backup,'merged',row.path)));
if(git('rev-parse','HEAD').toString().trim()!==target)throw Error('target head not applied');
write(path.join(backup,'applied.json'),JSON.stringify({base,head:target,rows,appliedAt:new Date().toISOString()},null,2)+'\n');
console.log(JSON.stringify({head:target,paths:rows.length,version:JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version},null,2));
