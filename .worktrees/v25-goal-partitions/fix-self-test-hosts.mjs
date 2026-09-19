import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const area=path.dirname(fileURLToPath(import.meta.url)),root=path.join(area,'.claude');
for(const operator of ['data-seed','identity-provision','uat-verify']) {
 const file=path.join(root,'operators',operator,'self-test.mjs'),text=fs.readFileSync(file,'utf8');
 const start=text.indexOf('const HOST = mkdtempSync('),end=text.indexOf('const onHost = { hostRoot: HOST };',start)+'const onHost = { hostRoot: HOST };'.length;
 if(start<0||end<start)throw Error('Missing owned host block: '+operator);
 const host=text.slice(start,end),removed=text.slice(0,start)+text.slice(end),before=removed.indexOf('async function expectValid(');
 const result=(removed.slice(0,before)+'// Every baseline and mutation uses this declared disposable host, including the first case.\n'+host+'\n\n'+removed.slice(before)).replaceAll('options = {}','options = onHost');
 const backup=path.join(area,'self-test-host-before',operator+'.mjs');fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,text);fs.writeFileSync(file,result);
}
