const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.join(__dirname,'.claude'),author=path.resolve(__dirname,'../v25-retry-order'),backup=path.join(__dirname,'retry-order-integration');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const result=JSON.parse(fs.readFileSync(path.join(author,'result.json')));
if(cp.execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==result.baseline)throw Error('unexpected current base');
const expected={'scripts/plan-history.mjs':'ac59319bcefe99114e30c3ee9c6a7c91396bae7a5f3e9e397f62ca2384f1a997','scripts/workflow-reentry.spec.mjs':'2a414aa509aad710e04000de6e65c2d203e68e07002d88974b8b38e7c26c79ef'};
const rows=[];
for(const [ref,hash]of Object.entries(expected)){
 const local=fs.readFileSync(path.join(root,ref)),base=cp.execFileSync('git',['-C',root,'show',result.baseline+':'+ref]),next=fs.readFileSync(path.join(author,'.claude',ref));
 if(!local.equals(base)||sha(next)!==hash||result.files[ref].toLowerCase()!==hash)throw Error('reviewed byte check failed '+ref);
 const kept=path.join(backup,'before',ref);fs.mkdirSync(path.dirname(kept),{recursive:true});fs.writeFileSync(kept,local);rows.push({path:ref,before:sha(local),after:hash});
}
for(const row of rows)fs.copyFileSync(path.join(author,'.claude',row.path),path.join(root,row.path));
for(const ref of ['result.json','retry-order.patch','retry-order-focused.log','retry-order-edits.log'])fs.copyFileSync(path.join(author,ref),path.join(backup,ref));
fs.writeFileSync(path.join(backup,'applied.json'),JSON.stringify({baseline:result.baseline,rows,appliedAt:new Date().toISOString(),approval:'Parent root approved the exact two-file sealed patch.'},null,2)+'\n');
console.log(JSON.stringify({files:rows.length,rows},null,2));
