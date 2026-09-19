import fs from 'node:fs';
import path from 'node:path';
const root=path.join(import.meta.dirname,'.claude');
const file=path.join(root,'templates/step/state.schema.json');
let text=fs.readFileSync(file,'utf8');
const start=text.indexOf('"discovery": {')+'"discovery": '.length;
if(start<20)throw Error('discovery missing');
let depth=0,quoted=false,escaped=false,end;
for(let i=start;i<text.length;i++){
  const c=text[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){end=i+1;break;}
}
const schema=JSON.parse(fs.readFileSync(path.join(root,'templates/kinds/goal-discovery.schema.json'),'utf8'));delete schema.$id;
const block=JSON.stringify(schema,null,2).split('\n').map((line,i)=>i?'        '+line:line).join('\n');
const value=JSON.parse(text);value.properties.mission.properties.discovery=schema;
text=text.slice(0,start)+block+text.slice(end);
if(JSON.stringify(JSON.parse(text))!==JSON.stringify(value))throw Error('unrelated schema change');
fs.writeFileSync(file,text);
