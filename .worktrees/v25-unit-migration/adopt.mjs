import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const home=path.dirname(fileURLToPath(import.meta.url));
const m=JSON.parse(fs.readFileSync(path.join(home,'manifest.json'),'utf8'));
const hash=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
const git=args=>execFileSync('git',['-C',m.source,...args],{encoding:'utf8'}).trim();
const log=fs.readFileSync(path.join(home,'full-final.log'),'utf8');
if(!/pass 442/.test(log)||!/fail 0/.test(log)||!/skipped 0/.test(log)||!/76/.test(log)) throw Error('full zero-skip proof absent');
if(git(['rev-parse','HEAD'])!==m.baseline)throw Error('live HEAD moved');
if(git(['diff','--cached','--name-only']))throw Error('unexpected staged changes');
for(const f of m.files){
 const src=path.resolve(m.candidate,f.path),dst=path.resolve(m.source,f.path);
 if(!src.startsWith(path.resolve(m.candidate)+path.sep)||!dst.startsWith(path.resolve(m.source)+path.sep))throw Error('path escaped');
 const before=fs.existsSync(dst)?hash(fs.readFileSync(dst)):null;
 if(before!==f.before||hash(fs.readFileSync(src))!==f.after)throw Error('hash changed '+f.path);
}
for(const f of m.files) fs.copyFileSync(path.join(m.candidate,f.path),path.join(m.source,f.path));
for(const f of m.files) if(hash(fs.readFileSync(path.join(m.source,f.path)))!==f.after)throw Error('copy mismatch '+f.path);
console.log('Adopted and verified exactly '+m.files.length+' paths; not committed or pushed.');
