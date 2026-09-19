import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const home=path.dirname(fileURLToPath(import.meta.url)), source=path.join(home,'../host/.claude'),packed=path.join(home,'unpacked/package'),installed=path.join(home,'install-host/.claude');
const hash=b=>createHash('sha256').update(b).digest('hex');
const pack=JSON.parse(fs.readFileSync(path.join(home,'pack.json'),'utf8').replace(/^\uFEFF/,''))[0];
for(const f of pack.files)if(!fs.readFileSync(path.join(source,f.path)).equals(fs.readFileSync(path.join(packed,f.path))))throw Error('Packed bytes differ '+f.path);
const manifest=JSON.parse(fs.readFileSync(path.join(installed,'.starci-skills.json')));
for(const [name,digest] of Object.entries(manifest.files)){
 const actual=fs.readFileSync(path.join(installed,name));
 if(!actual.equals(fs.readFileSync(path.join(packed,name))))throw Error('Installed bytes differ '+name);
 if(hash(actual.toString('utf8').replace(/\r\n/g,'\n'))!==digest)throw Error('Installer manifest mismatch '+name);
}
const result={version:manifest.version,packedFiles:pack.files.length,installedFiles:Object.keys(manifest.files).length,archiveSha256:hash(fs.readFileSync(path.join(home,pack.filename))),exactPayloadAndInstalledBytes:true,manifestVerifiedUsingInstallerLFNormalization:true,fullSuite:'pending integrated-run-1',published:false};
fs.writeFileSync(path.join(home,'readback.json'),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
