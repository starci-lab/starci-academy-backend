const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const candidate=path.join(__dirname,'.claude'),backup=path.join(__dirname,'rebase-rc7'),report=JSON.parse(fs.readFileSync(path.join(backup,'merge-report.json')));
const git=(...args)=>cp.execFileSync('git',['-C',candidate,...args],{windowsHide:true});
const sha=value=>'sha256:'+crypto.createHash('sha256').update(value).digest('hex');
if(git('rev-parse','HEAD').toString().trim()!==report.target)throw Error('candidate is not on exact published RC.7');
for(const item of report.merges)if(sha(fs.readFileSync(path.join(candidate,item.path)))!==item.merged)throw Error('merged file differs: '+item.path);
const upstream=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../v25-workflow-reentry/manifest.json'))),lineEndingOnly=[];
for(const item of upstream.files)if(!report.merges.some(merge=>merge.path===item.path)){
 const bytes=fs.readFileSync(path.join(candidate,item.path)),published=git('show',report.target+':'+item.path);
 if(!bytes.equals(published))throw Error('checkout differs from published bytes: '+item.path);
 if(sha(bytes)!==item.after){
  const original=fs.readFileSync(path.join(upstream.source,item.path));
  if(sha(original)!==item.after||!item.path.endsWith('.md')||original.toString().replaceAll('\r\n','\n')!==bytes.toString())throw Error('unexplained manifest byte difference: '+item.path);
  lineEndingOnly.push({path:item.path,manifestSha256:item.after,publishedGitSha256:sha(bytes)});
 }
}
fs.writeFileSync(path.join(backup,'applied.json'),JSON.stringify({head:report.target,merges:report.merges,checkedUpstreamFiles:upstream.files.length,lineEndingOnly,appliedAt:new Date().toISOString()},null,2)+'\n');
console.log(JSON.stringify({head:report.target,cleanThreeWayMerges:report.merges.length,lineEndingOnly},null,2));
