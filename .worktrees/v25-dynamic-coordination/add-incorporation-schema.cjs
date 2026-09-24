const fs=require('node:fs'),root=__dirname+'/.claude/',file='templates/step/state.schema.json';
const s=JSON.parse(fs.readFileSync(root+file));
const address={type:'object',additionalProperties:false,required:['ref','hash'],properties:{ref:{type:'string',pattern:'^runtime/history/incorporations/[a-f0-9]{64}\\.json$'},hash:{type:'string',pattern:'^sha256:[a-f0-9]{64}$'}}};
s.properties.coordination.properties.incorporations={type:'array',items:{type:'object',additionalProperties:false,required:['dependencyId','alias','intent','receipt'],properties:{dependencyId:{type:'string',minLength:1},alias:{enum:['@workspaces/be','@workspaces/fe']},intent:address,receipt:{anyOf:[{type:'null'},address]}}}};
fs.writeFileSync(root+file,JSON.stringify(s,null,2)+'\n');
