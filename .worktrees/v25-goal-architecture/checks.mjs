import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const home=import.meta.dirname,root=path.join(home,'.claude');
const commands=[['--test','scripts/scope-presentation.spec.mjs'],['scripts/validate-resources.mjs'],['scripts/validate-templates.mjs'],['scripts/validate-knowledge-citations.mjs'],['docs/scripts/generate-docs.mjs','--check']];
const checks=[];let log='';
for(const args of commands){const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});log+=`node ${args.join(' ')}\n${r.stdout}${r.stderr}\n`;checks.push({args,exitCode:r.status});if(r.status!==0)break;}
fs.writeFileSync(path.join(home,'checks-final.log'),log);
fs.writeFileSync(path.join(home,'checks-final.json'),JSON.stringify(checks,null,2)+'\n');
console.log(log);if(checks.length!==commands.length||checks.some(c=>c.exitCode!==0))process.exitCode=1;
