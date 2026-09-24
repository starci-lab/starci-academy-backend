const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const support=__dirname,root=path.join(support,'.claude'),manifestPath=path.resolve(support,'../v25-proof-review-reentry/provisional-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath)),sha=x=>'sha256:'+crypto.createHash('sha256').update(x).digest('hex'),normalized=x=>x.toString().replace(/\r\n/g,'\n');
const head=cp.execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(head!==manifest.baseline)throw Error('candidate base changed');
const backup=path.join(support,'proof-review-integration');fs.mkdirSync(backup,{recursive:true});
const writes=[];
for(const row of manifest.files){
 const file=path.join(root,row.path),ours=fs.readFileSync(file),theirs=fs.readFileSync(row.source),base=cp.execFileSync('git',['-C',root,'show',head+':'+row.path]);
 if(sha(theirs)!==row.after)throw Error('authored file changed '+row.path);
 const stem=row.path.replaceAll('/','_');for(const [tag,bytes] of [['ours',ours],['base',base],['theirs',theirs]])fs.writeFileSync(path.join(backup,stem+'.'+tag),bytes);
 let result;
 if(row.path.startsWith('scripts/')){if(normalized(ours)!==normalized(base))throw Error('unexpected local script change '+row.path);result=theirs;}
 else{
  for(const [tag,bytes] of [['ours',ours],['base',base],['theirs',theirs]])fs.writeFileSync(path.join(backup,stem+'.'+tag+'.lf'),normalized(bytes));
  result=cp.execFileSync('git',['merge-file','-p',...['ours','base','theirs'].map(tag=>path.join(backup,stem+'.'+tag+'.lf'))]);
 }
 writes.push({path:row.path,before:sha(ours),authored:row.after,after:sha(result),result});
}
for(const row of writes)fs.writeFileSync(path.join(root,row.path),row.result);
fs.copyFileSync(manifestPath,path.join(backup,'source-manifest.json'));
const report={baseline:head,status:'provisional integration; await author focused seal',sourceManifestHash:sha(fs.readFileSync(manifestPath)),files:writes.map(({result,...row})=>row)};
fs.writeFileSync(path.join(backup,'applied.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
