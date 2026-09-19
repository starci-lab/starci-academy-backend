import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sha=value=>'sha256:'+createHash('sha256').update(value).digest('hex');
const manifest=JSON.parse(fs.readFileSync('manifest-draft.json','utf8'));
const log=fs.readFileSync('full-final.log','utf8');
if(!/tests 440\b/.test(log)||!/pass 440\b/.test(log)||!/fail 0\b/.test(log)||!/docs:check ok.*76/.test(log))throw Error('Full proof not complete');
if(manifest.treeHash!=='sha256:daed5e17602fc14a1085e317e882d5e69d283010d0ccdbb27ededfa78979f57d')throw Error('Candidate changed during final tests');
manifest.status='sealed candidate; exact-tree npm test exited 0; guarded publisher adoption pending';
manifest.sealedAt=new Date().toISOString();
manifest.proof={
 full:{path:'full-final.log',exitCode:0,tests:440,pass:440,fail:0,skip:0,generatedDocs:76},
 focused:{path:'focused-first.log',exitCode:0,tests:9,pass:9,fail:0,skip:0,note:'Final production code: full successive-return lifecycle, RC.4 lifecycle retained, tampering and ownership refusals.'},
 package:{path:'pack-dry-run.json',exitCode:0,fileCount:JSON.parse(fs.readFileSync('pack-dry-run.json','utf8').replace(/^\uFEFF/,''))[0].files.length,note:'npm pack --dry-run, no publication; repository evidence note is not runtime-linked.'},
 actualReadOnly:{path:'actual-readonly.json',publishedDeletedProjectionBusy:true,candidateOrdinaryBusy:true,candidateResumeBusy:false,transactionOnlyAncestors:['16/1','15/1'],settled:[],errors:[],activeSlots:0,activeLeases:0,note:'Read-only exported API comparison on actual Chatbot state; no peer mutation.'},
 hostDependency:'Candidate host .tools/playwright junction to Source/.tools/playwright; no shared runtime installation or mutation.',
};
manifest.proofHashes=Object.fromEntries(['full-final.log','focused-first.log','pack-dry-run.json','actual-readonly.json','chatbot-resume-flags.json'].map(file=>[file,sha(fs.readFileSync(file))]));
fs.writeFileSync('manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({manifestHash:sha(fs.readFileSync('manifest.json')),treeHash:manifest.treeHash,paths:manifest.files.map(file=>file.path),deleted:manifest.deleted},null,2));
