import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const support = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(support, '.claude');
const request = JSON.parse(fs.readFileSync(path.join(support, 'request.json')));
const label = process.argv[2] || 'run-1';
if (!/^run-[1-9][0-9]*$/.test(label)) throw Error('Invalid run label');
const output = path.join(support, label);
fs.mkdirSync(output);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function tree(relative = '') {
  const result = {};
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Object.assign(result, tree(name));
    else if (entry.isFile()) result[name] = hash(fs.readFileSync(path.join(root, name)));
    else throw Error(`Unexpected non-file: ${name}`);
  }
  return result;
}
const before = tree();
const record = { status:'running', baseline:request.baseline, startedAt:new Date().toISOString(), treeHash:hash(JSON.stringify(before)), runnerPid:process.pid };
fs.writeFileSync(path.join(output,'tested-tree.json'), JSON.stringify(before,null,2)+'\n');
const save = () => fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(record,null,2)+'\n');
save();
const log = fs.openSync(path.join(output,'full.log'),'wx');
const env = {...process.env, STARCI_WALK_HOST_ROOT:path.resolve(support,'../..'), npm_config_cache:path.join(support,'npm-cache')};
const child = spawn(process.env.ComSpec || 'cmd.exe',['/d','/s','/c','npm test'],{cwd:root,env,windowsHide:true,stdio:['ignore',log,log]});
record.pid=child.pid; save();
const result = await new Promise(resolve => {
  child.once('error',error=>resolve({exitCode:1,error:error.message}));
  child.once('exit',(exitCode,signal)=>resolve({exitCode,signal}));
});
fs.closeSync(log);
Object.assign(record,{status:'complete',endedAt:new Date().toISOString(),...result,testedTreeUnchanged:JSON.stringify(tree())===JSON.stringify(before)});
save();
console.log(JSON.stringify(record));
process.exitCode=record.exitCode || (record.testedTreeUnchanged?0:1);
