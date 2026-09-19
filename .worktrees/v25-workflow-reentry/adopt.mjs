import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const home=path.dirname(fileURLToPath(import.meta.url));
const hash=x=>'sha256:'+createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(path.join(home,'manifest.json'));
if(hash(bytes)!=='sha256:8e04dc58258a703b8a2ea7ea23d2e1443568abaad587e2afa117116e6fe0fff2')throw Error('Reviewed manifest changed');
const manifest=JSON.parse(bytes);
if(execFileSync('git',['-C',manifest.source,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==manifest.baseline)throw Error('Live HEAD moved');
const entries=manifest.files.map(item=>{const live=path.resolve(manifest.source,item.path),candidate=path.resolve(manifest.candidate,item.path);for(const [base,file]of[[manifest.source,live],[manifest.candidate,candidate]])if(!file.toLowerCase().startsWith(path.resolve(base).toLowerCase()+path.sep))throw Error('Escaping target');const proposed=fs.readFileSync(candidate);if(hash(proposed)!==item.after)throw Error('Candidate changed '+item.path);if(item.before===null?fs.existsSync(live):!fs.existsSync(live)||hash(fs.readFileSync(live))!==item.before)throw Error('Live changed '+item.path);return{...item,live,proposed};});
for(const entry of entries){fs.mkdirSync(path.dirname(entry.live),{recursive:true});fs.writeFileSync(entry.live,entry.proposed);}
for(const entry of entries)if(hash(fs.readFileSync(entry.live))!==entry.after)throw Error('Readback mismatch '+entry.path);
fs.writeFileSync(path.join(home,'adoption.json'),JSON.stringify({adoptedAt:new Date().toISOString(),baseline:manifest.baseline,manifestHash:hash(bytes),paths:entries.map(x=>x.path),readback:true},null,2)+'\n');
console.log('Adopted and read back exactly '+entries.length+' reviewed paths. No Git publication yet.');
