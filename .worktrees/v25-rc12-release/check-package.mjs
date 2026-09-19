import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const home='.worktrees/v25-rc12-release',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const pack=JSON.parse(fs.readFileSync(path.join(home,'release-pack-final.log'),'utf8'))[0];
for(const f of pack.files){const a=fs.readFileSync(path.join(home,'.claude',f.path)),b=fs.readFileSync(path.join(home,'package-check/package',f.path));if(hash(a)!==hash(b))throw Error('pack mismatch '+f.path);}
const installed=JSON.parse(fs.readFileSync(path.join(home,'installed/.claude/.starci-skills.json')));const files=Object.keys(installed.files);
for(const file of files){const a=fs.readFileSync(path.join(home,'installed/.claude',file)),b=fs.readFileSync(path.join(home,'package-check/package',file));if(hash(a)!==hash(b))throw Error('install mismatch '+file);}
const result={matches:true,packedFiles:pack.files.length,installedFilesChecked:files.length,archiveSha256:hash(fs.readFileSync(path.join(home,pack.filename)))};fs.writeFileSync(path.join(home,'root-package-readback.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
