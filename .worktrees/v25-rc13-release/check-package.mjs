import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const home=path.dirname(fileURLToPath(import.meta.url));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const pack=JSON.parse(fs.readFileSync(path.join(home,'package.json.log'),'utf8'))[0];
for(const file of pack.files){
 const expected=fs.readFileSync(path.join(home,'.claude',file.path));
 const actual=fs.readFileSync(path.join(home,'package-check/package',file.path));
 if(hash(expected)!==hash(actual))throw Error('Packed file mismatch: '+file.path);
}
const install=JSON.parse(fs.readFileSync(path.join(home,'installed/.claude/.starci-skills.json')));
if(install.version!=='2.5.0-rc.13')throw Error('Installed version differs');
for(const file of Object.keys(install.files)){
 const expected=fs.readFileSync(path.join(home,'package-check/package',file));
 const actual=fs.readFileSync(path.join(home,'installed/.claude',file));
 if(hash(expected)!==hash(actual))throw Error('Installed file mismatch: '+file);
}
const result={matches:true,version:install.version,packedFiles:pack.files.length,installedFilesChecked:Object.keys(install.files).length,archiveSha256:hash(fs.readFileSync(path.join(home,pack.filename))),fullSuiteStatus:'separate run-1/result.json; publication not established'};
fs.writeFileSync(path.join(home,'package-readback.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
