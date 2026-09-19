import {readFileSync,writeFileSync,readdirSync,lstatSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const support=path.dirname(fileURLToPath(import.meta.url)),candidate=path.join(support,'.claude'),source='D:/Repositories/starci-academy-backend/.claude';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['-C',source,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
const baselineHead='711cc59a625243602b5778f12a43313f528a9764';
const liveHead=git('rev-parse','HEAD').trim();if(liveHead!==baselineHead)throw Error('Live HEAD drift; review before sealing');
const tracked=git('ls-tree','-r','--name-only',baselineHead).trim().split('\n');
const candidateFiles=[];
function walk(directory){for(const name of readdirSync(directory)){const file=path.join(directory,name),stat=lstatSync(file);if(stat.isSymbolicLink())throw Error('Candidate contains an unreviewed symlink');if(stat.isDirectory())walk(file);else if(stat.isFile())candidateFiles.push(path.relative(candidate,file).replaceAll('\\','/'));}}
walk(candidate);candidateFiles.sort();
const preserved=['knowledge/findings/core.jsonl','knowledge/findings/starci.jsonl'];
const testedHashes=Object.fromEntries(candidateFiles.map(file=>[file,sha(readFileSync(path.join(candidate,file)))]));
const changes=[];
for(const file of [...new Set([...tracked,...candidateFiles])].sort()){
 if(preserved.includes(file))continue;
 const before=existsSync(path.join(source,file))?sha(readFileSync(path.join(source,file))):null;
 const after=testedHashes[file]??null;
 if(before!==after)changes.push({path:file,before,after,operation:after===null?'delete':before===null?'add':'modify'});
}
const result={status:'pending-full-suite',version:'2.4.3',baselineHead,liveHead,source,candidate,files:changes,deletions:changes.filter(file=>file.operation==='delete').map(file=>file.path),preservedLivePaths:preserved,concurrentFixesPreserved:[{path:'scripts/workspace-portable.mjs',sha256:testedHashes['scripts/workspace-portable.mjs'],reason:'Published 2.4.2 lazy schema loading copied exactly.'}],candidateFiles:testedHashes,candidateTreeHash:sha(JSON.stringify(testedHashes)),proofs:{fullSuite:'full-test-release.log',focused:'retention-migration-focused.log',restatement:'restatement-e2e.log',revisions:'revision-focused-final.log',realForecasts:'actual-dependency-forecast.json',hostBrowser:'Candidate host .tools/playwright junction resolves to existing Source .tools/playwright; no reinstall.'}};
writeFileSync(path.join(support,'manifest.pending.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,files:changes.length,additions:changes.filter(file=>file.operation==='add').length,deletions:result.deletions,candidateFiles:candidateFiles.length,candidateTreeHash:result.candidateTreeHash}));
