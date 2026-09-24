import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const home = path.dirname(fileURLToPath(import.meta.url));
const [candidateArg, label] = process.argv.slice(2);
if (!candidateArg || !/^integrated-run-[1-9][0-9]*$/.test(label ?? '')) throw Error('Supply candidate directory and new integrated-run-N label');
const candidate = path.resolve(candidateArg);
const source = path.resolve(home, '../..');
const output = path.join(home, label);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function scan(relative = '') {
  const files = {};
  for (const entry of fs.readdirSync(path.join(candidate, relative), { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const name = relative ? relative + '/' + entry.name : entry.name;
    if (entry.isDirectory()) Object.assign(files, scan(name));
    else if (entry.isFile()) files[name] = hash(fs.readFileSync(path.join(candidate, name)));
    else throw Error('Unsupported entry: ' + name);
  }
  return files;
}
if (!fs.existsSync(path.join(source, '.tools/playwright/node_modules/playwright/package.json'))) throw Error('Declared host Playwright is absent');
fs.mkdirSync(output);
const before = scan();
fs.writeFileSync(path.join(output, 'tested-tree.json'), JSON.stringify(before, null, 2) + '\n');
const record = { status: 'running', candidate, startedAt: new Date().toISOString(), runnerPid: process.pid, playwrightHost: source, treeHash: hash(JSON.stringify(before)) };
const save = () => fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(record, null, 2) + '\n');
const log = fs.openSync(path.join(output, 'full.log'), 'wx');
const child = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm test'], {
  cwd: candidate, windowsHide: true, stdio: ['ignore', log, log],
  env: { ...process.env, STARCI_WALK_HOST_ROOT: source }
});
record.childPid = child.pid;
save();
const terminal = await new Promise(resolve => {
  child.once('error', error => resolve({ exitCode: 1, error: error.message }));
  child.once('exit', (exitCode, signal) => resolve({ exitCode, signal }));
});
fs.closeSync(log);
Object.assign(record, terminal, { status: 'complete', endedAt: new Date().toISOString(), testedTreeUnchanged: JSON.stringify(before) === JSON.stringify(scan()) });
save();
console.log(JSON.stringify(record));
process.exitCode = record.exitCode || (record.testedTreeUnchanged ? 0 : 1);
