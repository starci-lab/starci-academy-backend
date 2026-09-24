const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const candidate=path.join(__dirname,'.claude'),backup=path.join(__dirname,'rebase-rc7'),report=JSON.parse(fs.readFileSync(path.join(backup,'merge-report.json')));
const git=(...args)=>cp.execFileSync('git',['-C',candidate,...args],{windowsHide:true});
const sha=value=>'sha256:'+crypto.createHash('sha256').update(value).digest('hex');
if(report.conflicts.length)throw Error('unresolved merge conflicts');
if(git('rev-parse','HEAD').toString().trim()!==report.base)throw Error('candidate head changed');
for(const item of report.merges){if(sha(fs.readFileSync(path.join(candidate,item.path)))!==item.ours)throw Error('working file changed after backup: '+item.path);if(sha(fs.readFileSync(path.join(backup,'merged',item.path)))!==item.merged)throw Error('merged file changed: '+item.path);}
for(const item of report.merges)fs.writeFileSync(path.join(candidate,item.path),fs.readFileSync(path.join(backup,'base',item.path)));
try{process.stdout.write(git('merge','--ff-only',report.target));}
catch(error){for(const item of report.merges)fs.writeFileSync(path.join(candidate,item.path),fs.readFileSync(path.join(backup,'ours',item.path)));throw error;}
for(const item of report.merges)fs.writeFileSync(path.join(candidate,item.path),fs.readFileSync(path.join(backup,'merged',item.path)));
const upstream=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../v25-workflow-reentry/manifest.json')));
for(const item of upstream.files)if(!report.merges.some(merge=>merge.path===item.path)&&sha(fs.readFileSync(path.join(candidate,item.path)))!==item.after)throw Error('upstream manifest mismatch: '+item.path);
fs.writeFileSync(path.join(backup,'applied.json'),JSON.stringify({head:report.target,merges:report.merges,checkedUpstreamFiles:upstream.files.length,appliedAt:new Date().toISOString()},null,2)+'\n');
console.log('Applied exact RC.7 with retained automatic three-way merges.');
