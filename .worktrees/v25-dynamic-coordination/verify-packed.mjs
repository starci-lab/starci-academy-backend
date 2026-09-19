import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const support=import.meta.dirname,candidate=path.join(support,'.claude');
const packed=path.join(support,'release-artifacts/unpacked/package'),installed=path.join(support,'release-artifacts/installed/.claude');
const sha=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const metadata=JSON.parse(readFileSync(path.join(support,'pack-final.json'),'utf8').replace(/^\uFEFF/,''));
assert.equal(metadata.length,1);
const pkg=JSON.parse(readFileSync(path.join(packed,'package.json')));
assert.equal(pkg.version,'2.5.0-rc.9');
assert.equal(JSON.parse(readFileSync(path.join(candidate,'package.json'))).version,pkg.version);
const tarball=readFileSync(path.join(support,'release-artifacts',metadata[0].filename));
assert.equal('sha512-'+createHash('sha512').update(tarball).digest('base64'),metadata[0].integrity);
assert.equal(createHash('sha1').update(tarball).digest('hex'),metadata[0].shasum);
const packageFiles=[];
for(const entry of metadata[0].files){
 const ref=entry.path;assert.ok(!path.isAbsolute(ref)&&!ref.split('/').includes('..'));
 const original=path.join(candidate,ref),unpacked=path.join(packed,ref);
 assert.ok(lstatSync(original).isFile()&&lstatSync(unpacked).isFile(),ref+' must be regular package content');
 const bytes=readFileSync(unpacked);assert.equal(bytes.length,entry.size);assert.deepEqual(bytes,readFileSync(original),ref+' package bytes differ from tested candidate');
 packageFiles.push({path:ref,hash:sha(bytes)});
}
const {PAYLOAD}=await import(pathToFileURL(path.join(packed,'bin/starci-skills.mjs')).href);
const installedFiles=[];
function verify(ref){
 const original=path.join(packed,ref),target=path.join(installed,ref);
 assert.ok(existsSync(target),ref+' missing from installed payload');
 const stat=lstatSync(original);assert.ok(!stat.isSymbolicLink(),ref+' unexpected package link');
 if(stat.isDirectory()){
  const names=readdirSync(original).sort();assert.deepEqual(readdirSync(target).sort(),names,ref+' installed directory differs');
  for(const name of names)verify(path.posix.join(ref,name));
 }else{
  assert.ok(stat.isFile()&&lstatSync(target).isFile());const bytes=readFileSync(original);assert.deepEqual(readFileSync(target),bytes,ref+' installed bytes differ');
  installedFiles.push({path:ref,hash:sha(bytes)});
 }
}
for(const ref of PAYLOAD)verify(ref);
const record={version:pkg.version,tarball:metadata[0].filename,tarballHash:sha(tarball),packageFiles,installedFiles,checkedAt:new Date().toISOString()};
writeFileSync(path.join(support,'packed-inventory.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({version:pkg.version,packageFiles:packageFiles.length,installedFiles:installedFiles.length,tarballHash:record.tarballHash},null,2));
