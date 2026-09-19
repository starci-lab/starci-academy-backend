import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const source=path.resolve(root,'../..');
const product=path.join(root,'nivo-agentos');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const index=read(path.join(product,'index.json'));
const inside=(base,rel)=>{
 if(typeof rel!=='string'||path.isAbsolute(rel)||rel.includes('\\')||rel.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Unsafe relative reference: '+rel);
 const p=path.resolve(base,rel);const r=path.relative(base,p);
 if(r.startsWith('..')||path.isAbsolute(r))throw Error('Reference escapes bank');
 return p;
};
const cards=index.workflows.map(item=>({file:inside(product,item.path),...read(inside(product,item.path))}));
const evidence=read(path.join(product,'evidence.json'));
const states=new Set(['draft','ready','blocked','running','done','cancelled']);
const errors=[];
const byId=new Map();
const evidenceIds=new Set(evidence.evidence.map(e=>e.id));
const operators=new Set(fs.readdirSync(path.join(source,'.claude/operators'),{withFileTypes:true}).filter(e=>e.isDirectory()).flatMap(e=>{const p=path.join(source,'.claude/operators',e.name,'operator.json');return fs.existsSync(p)?[read(p).id]:[];}));
function validate(){
 for(const c of cards){
  if(byId.has(c.id))errors.push('Duplicate id '+c.id);byId.set(c.id,c);
  if(!/^AG-\d{3}$/.test(c.id)||!states.has(c.status)||c.schemaVersion!==1)errors.push('Invalid identity/status '+c.id);
  if(!index.workflows.some(x=>x.id===c.id&&inside(product,x.path)===c.file))errors.push('Index identity mismatch '+c.id);
  if(index.retiredDraftIds.includes(c.id))errors.push('Retired id reused '+c.id);
  if(c.project!=='nivo'||c.scope!=='agentos'||JSON.stringify(c.modules)!==JSON.stringify(['chatbot','accounting']))errors.push('Scope changed '+c.id);
  for(const key of ['title','why'])if(typeof c[key]!=='string'||!c[key].trim())errors.push('Missing '+key+' '+c.id);
  for(const key of ['acceptance','evidenceRefs','dependsOn','testTargets','decisionQuestions'])if(!Array.isArray(c[key]))errors.push('Invalid '+key+' '+c.id);
  if(!c.acceptance?.length||!c.evidenceRefs?.length)errors.push('Missing acceptance/evidence '+c.id);
  for(const r of c.evidenceRefs??[])if(!evidenceIds.has(r))errors.push('Unknown evidence '+c.id+' '+r);
  for(const t of c.testTargets??[])if(!fs.existsSync(inside(evidence.bindings.be.path,t)))errors.push('Missing proposed test '+c.id+' '+t);
  const goals=c.goalDraft?.doneWhen??[];
  const missionSchema=read(path.join(source,'.claude/templates/step/state.schema.json')).properties.mission.properties;
  for(const k of ['goal','language','sourceRef']){
   const v=c.goalDraft?.[k],s=missionSchema[k];
   if(typeof v!=='string'||v.length<(s.minLength??0)||v.length>(s.maxLength??Infinity))errors.push('Invalid goal draft '+k+' '+c.id);
  }
  for(const k of ['includes','excludes']){
   const v=c.goalDraft?.[k],s=missionSchema[k];
   if(!Array.isArray(v)||v.length<(s.minItems??0)||v.length>(s.maxItems??Infinity)||v.some(x=>typeof x!=='string'||x.length<(s.items.minLength??0)||x.length>(s.items.maxLength??Infinity)))errors.push('Invalid goal draft '+k+' '+c.id);
  }
  if(!goals.length||goals.length>8)errors.push('Invalid goal size '+c.id);
  for(const g of goals)if(!operators.has(g.producedBy)||typeof g.evidence!=='string'||g.evidence.length>200)errors.push('Invalid runtime producer '+c.id);
  if(c.goalDraft?.goal!==c.title||c.execution?.deriveChainAtActivation!==true)errors.push('Draft/activation contract mismatch '+c.id);
  if(c.choices||c.chain||c.requestHashes)errors.push('Bank carries runtime authority '+c.id);
  if(['running','done'].includes(c.status)&&!c.activation?.sessionId)errors.push('No actual session '+c.id);
  if(c.status==='done'){
   if(!c.activation?.completedAt||!c.activation?.receiptRefs?.length)errors.push('No completion receipts '+c.id);
   for(const r of c.activation?.receiptRefs??[])if(!fs.existsSync(inside(source,r)))errors.push('Missing completion receipt '+c.id+' '+r);
  }
 }
 const visiting=new Set(),visited=new Set();
 const visit=id=>{if(visiting.has(id)){errors.push('Dependency cycle '+id);return;}if(visited.has(id))return;visiting.add(id);const c=byId.get(id);for(const dep of c?.dependsOn??[]){if(!byId.has(dep))errors.push('Missing dependency '+id+' '+dep);else {if(c.status==='ready'&&byId.get(dep).status!=='done')errors.push('Ready without completed dependency '+id+' '+dep);visit(dep);}}visiting.delete(id);visited.add(id);};
 for(const c of cards)visit(c.id);
 for(const e of evidence.evidence){if(!fs.existsSync(e.path))errors.push('Missing evidence file '+e.id);if(!/^sha256:[a-f0-9]{64}$/.test(e.sha256))errors.push('Invalid evidence hash '+e.id);}
 return errors;
}
const command=process.argv[2]??'list';
validate();
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
if(command==='validate')console.log(`Bank valid: ${cards.length} scoped drafts, ${evidence.evidence.length} evidence references, acyclic dependencies, current operator IDs. This is not a runtime session verdict.`);
else if(command==='list')for(const c of cards)console.log(`${c.id} ${c.priority} ${c.status.padEnd(7)} ${c.title}${c.dependsOn.length?' [after '+c.dependsOn.join(', ')+']':''}`);
else if(command==='brief'){
 const c=byId.get(process.argv[3]);if(!c)throw Error('Unknown workflow id');
 console.log(fs.readFileSync(path.join(path.dirname(c.file),'BRIEF.md'),'utf8'));
 console.log(JSON.stringify({goalDraft:c.goalDraft,decisionQuestions:c.decisionQuestions,evidenceRefs:c.evidenceRefs,testTargets:c.testTargets},null,2));
}else if(command==='freshness'){
 const stale=evidence.evidence.filter(e=>'sha256:'+createHash('sha256').update(fs.readFileSync(e.path)).digest('hex')!==e.sha256);
 for(const e of stale)console.log('CHANGED '+e.id);
 console.log(`${evidence.evidence.length-stale.length}/${evidence.evidence.length} evidence files unchanged. Rebind Git heads and runtime separately at activation.`);
 if(stale.length)process.exitCode=1;
}else throw Error('Usage: bank.mjs list|validate|brief AG-NNN|freshness');
