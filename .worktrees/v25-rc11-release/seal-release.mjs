import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const home=path.dirname(fileURLToPath(import.meta.url)),root=path.join(home,'.claude');
const sha=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
function scan(dir,p=''){return Object.fromEntries(fs.readdirSync(path.join(dir,p),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>{const rel=p?p+'/'+e.name:e.name;if(e.isDirectory())return Object.entries(scan(dir,rel));if(!e.isFile())throw Error('Unsupported entry '+rel);return [[rel,sha(fs.readFileSync(path.join(dir,rel)))]];}));}
const read=n=>JSON.parse(fs.readFileSync(path.join(home,n),'utf8'));
const before=scan(path.join(home,'release-baseline')),after=scan(root),tested=read('release-tested-tree.json'),run=read('release-full-run.json');
if(run.status!=='complete'||run.exitCode!==0||run.testedTreeUnchanged!==true)throw Error('Full test not complete/green/unchanged');
if(Object.keys(after).length!==Object.keys(tested).length||Object.keys(after).some(f=>after[f]!==`sha256:${tested[f]}`))throw Error('Tested tree drift');
const log=fs.readFileSync(path.join(home,'release-full.log'),'utf8');
const counts=Object.fromEntries([...log.matchAll(/^(?:ℹ|#) (tests|pass|fail|skipped) (\d+)/gm)].map(m=>[m[1],Number(m[2])]));
if(!counts.tests||counts.pass!==counts.tests||counts.fail!==0||counts.skipped!==0||!log.includes('76 generated files match the tree'))throw Error('Release counts/docs failed');
const pack=read('release-pack-final.log')[0],readback=read('root-package-readback.json');
if(readback.matches!==true||readback.packedFiles!==pack.files.length||readback.installedFilesChecked<1||sha(fs.readFileSync(path.join(home,pack.filename)))!==`sha256:${readback.archiveSha256.toLowerCase()}`)throw Error('Package readback failed');
if(!fs.readFileSync(path.join(home,'release-doctor.log'),'utf8').includes('doctor: the installed tree validates'))throw Error('Doctor failed');
const files=Object.keys(after).filter(f=>after[f]!==before[f]).map(f=>({path:f,before:before[f]??null,after:after[f]}));
if(files.some(f=>f.path.startsWith('knowledge/findings/'))||Object.keys(before).some(f=>!after[f]))throw Error('Unrelated findings or deletion');
const artifact=n=>({path:n,sha256:sha(fs.readFileSync(path.join(home,n)))});
const manifest={status:'sealed',baseline:'5f874f80bac7617c19de75173f951e5e1c80ec8a',version:JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version,candidate:root,files,deleted:[],proof:{full:{...run,...counts,log:artifact('release-full.log')},package:{...readback,pack:artifact('release-pack-final.log'),install:artifact('release-install-final.log'),doctor:artifact('release-doctor.log')},integration:read('integration.json')},limitations:['Runtime regressions and diagram render proof do not prove product API/PG16/UAT or storage recovery.','No production deployment.']};
const bytes=JSON.stringify(manifest,null,2)+'\n';fs.writeFileSync(path.join(home,'release-manifest.json'),bytes);console.log(JSON.stringify({sha256:sha(bytes),paths:files.length,version:manifest.version}));
