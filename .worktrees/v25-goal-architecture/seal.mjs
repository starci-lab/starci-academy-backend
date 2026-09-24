import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const home=import.meta.dirname,root=path.join(home,'.claude');
const sha=bytes=>'sha256:'+crypto.createHash('sha256').update(bytes).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root});
const baseline=git(['rev-parse','HEAD']).toString().trim();
if(baseline!=='5f874f80bac7617c19de75173f951e5e1c80ec8a')throw Error('baseline changed');
const names=[...new Set([...git(['diff','--name-only']).toString().trim().split('\n'),...git(['ls-files','--others','--exclude-standard']).toString().trim().split('\n')])].filter(Boolean).sort();
const files=names.map(ref=>{let before=null;try{before=sha(git(['show',`HEAD:${ref}`]));}catch{}return{path:ref,before,after:sha(fs.readFileSync(path.join(root,ref))),source:path.join(root,ref).replaceAll('\\','/')};});
if(files.length!==9)throw Error('unexpected inventory');
const proofRefs=['scope-final.log','checks-final.log','checks-final.json','render-proof.json','render-proof.log','render-normal.svg','render-normal.png','render-escaping.svg','render-escaping.png'];
const manifest={status:'sealed',baseline,candidate:root.replaceAll('\\','/'),request:sha(fs.readFileSync(path.join(home,'request.json'))),files,deleted:[],generated:[],
  proof:{focused:{exitCode:0,passed:11,failed:0,skipped:0,log:'scope-final.log'},mermaid:{version:'11.17.2',exitCode:0,rendered:2,nodesPerGraph:5,edgesPerGraph:4,scriptElements:0,record:'render-proof.json'},checks:{resources:'pass',templates:'35 templates, 178 documents',citations:'44 prefixes, 261 rules, 114 files',generatedDocs:76,whitespace:'pass',log:'checks-final.log'},fullSuite:'not run; root owns combined release verification',priorFailure:'scope-related.log preserved: 7/8 passed before embedded discovery projection was updated; final parity and peer tests are green'},
  artifacts:proofRefs.map(ref=>({path:ref,sha256:sha(fs.readFileSync(path.join(home,ref)))})),
  limits:['Discovery citations record reviewed statements, not implementation or product UAT proof.','No live runtime, native ledger or product source mutation.','Optional additive discovery shape; no version bump or publication in this candidate.','Mermaid is a pinned support-only parser/render dependency, not a runtime package dependency.']};
const bytes=JSON.stringify(manifest,null,2)+'\n';fs.writeFileSync(path.join(home,'review-manifest.json'),bytes);
console.log(JSON.stringify({status:manifest.status,files:files.length,manifestSha256:sha(bytes)},null,2));
