import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const home='.worktrees/v25-rc11-release',file='.worktrees/v25-goal-architecture/review-manifest.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const bytes=fs.readFileSync(file);
if(sha(bytes)!=='65414a5b0b1dad179749110fae9ad6b713a1a34c1aee77a0d74280eba551da39')throw Error('manifest changed');
const m=JSON.parse(bytes);if(m.baseline!=='5f874f80bac7617c19de75173f951e5e1c80ec8a'||m.status!=='sealed')throw Error('baseline/status');
const pending=m.files.map(f=>{const dest=path.resolve(home,'.claude',f.path);if(!dest.startsWith(path.resolve(home,'.claude')+path.sep))throw Error('path');const old=fs.existsSync(dest)?'sha256:'+sha(fs.readFileSync(dest)):null;const next=fs.readFileSync(f.source);if(old!==f.before||'sha256:'+sha(next)!==f.after)throw Error(f.path);return{dest,next,path:f.path};});
for(const p of pending){fs.mkdirSync(path.dirname(p.dest),{recursive:true});fs.writeFileSync(p.dest,p.next);}
fs.writeFileSync(path.join(home,'diagram-integration.json'),JSON.stringify({manifest:file,digest:sha(bytes),paths:pending.map(p=>p.path),readback:pending.every(p=>sha(fs.readFileSync(p.dest))===sha(p.next))},null,2));console.log('Integrated '+pending.length+' verified diagram paths into isolated release candidate.');
