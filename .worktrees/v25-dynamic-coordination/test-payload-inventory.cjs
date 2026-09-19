const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.join(__dirname,'.claude'),sha=x=>'sha256:'+crypto.createHash('sha256').update(x).digest('hex');
const git=(...args)=>cp.execFileSync('git',['-C',root,...args],{maxBuffer:64*1024*1024}).toString();
const refs=[...new Set([...git('ls-files','-z').split('\0'),...git('ls-files','--others','--exclude-standard','-z').split('\0')].filter(Boolean))].sort();
const files=refs.map(ref=>{const file=path.join(root,ref);if(!fs.lstatSync(file).isFile())throw Error('unexpected linked/non-file payload '+ref);return{path:ref,hash:sha(fs.readFileSync(file))};});
const record={head:git('rev-parse','HEAD').trim(),files,fingerprint:sha(JSON.stringify(files))};
const mode=process.argv[2];
if(mode==='before')fs.writeFileSync(path.join(__dirname,'tested-payload-before.json'),JSON.stringify(record,null,2)+'\n');
else if(mode==='after'){
 const before=JSON.parse(fs.readFileSync(path.join(__dirname,'tested-payload-before.json')));
 if(JSON.stringify(before)!==JSON.stringify(record))throw Error('candidate payload changed while complete proof/tests were running');
 fs.writeFileSync(path.join(__dirname,'tested-payload-after.json'),JSON.stringify(record,null,2)+'\n');
}else throw Error('choose before or after');
console.log(JSON.stringify({mode,head:record.head,files:files.length,fingerprint:record.fingerprint}));
