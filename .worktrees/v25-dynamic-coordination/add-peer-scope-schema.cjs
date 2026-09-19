const fs=require('node:fs'),root=__dirname+'/.claude/';
const file='templates/kinds/goal-discovery.schema.json',schema=JSON.parse(fs.readFileSync(root+file));
schema.properties.impacts.items.properties.producer={type:'object',additionalProperties:false,required:['sessionId','impactId','mission'],properties:{sessionId:{type:'string',pattern:'^(?!central-runtime$)(?!.*\\.\\.)[a-z0-9][a-z0-9.-]{0,127}$'},impactId:{type:'string',minLength:1},mission:{type:'object',additionalProperties:false,required:['ref','hash'],properties:{ref:{type:'string',pattern:'^runtime/history/missions/[a-f0-9]{64}\\.json$'},hash:{type:'string',pattern:'^sha256:[a-f0-9]{64}$'}}}}};
fs.writeFileSync(root+file,JSON.stringify(schema,null,2)+'\n');
const promptFile='resources/orchestrator.json',policy=JSON.parse(fs.readFileSync(root+promptFile));
policy.agent.prompt += ' After an accepted waiting parent receives its accepted matched nested result, the orchestrator runs node scripts/worker-slots.mjs resume <parent-branch> <workerId> <ranProfile> and confirms acquisition before the author edits parent outputs; the accepted waiting bytes stay intact until this existing transition succeeds.';
fs.writeFileSync(root+promptFile,JSON.stringify(policy,null,2)+'\n');
