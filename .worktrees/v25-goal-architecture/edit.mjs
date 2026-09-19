import fs from 'node:fs';
import path from 'node:path';
const root = path.join(import.meta.dirname, '.claude');
const file = name => path.join(root, name);
const read = name => fs.readFileSync(file(name), 'utf8');
const put = (name, value) => fs.writeFileSync(file(name), value);
const schema = JSON.parse(read('templates/kinds/goal-discovery.schema.json'));
const text = {type:'string', minLength:1, maxLength:1000};
const nullable = {anyOf:[text,{type:'null'}]};
const id = {type:'string',pattern:'^[a-z][a-z0-9-]*$',maxLength:64};
const evidence = {type:'array', uniqueItems:true, items:text};
const status = {enum:['discovered','proposed','unverified']};
schema.properties.architecture = {
  type:'object', additionalProperties:false, required:['nodes','edges'],
  properties:{
    nodes:{type:'array',minItems:1,items:{type:'object',additionalProperties:false,
      required:['id','kind','label','owner','role','status','evidence'],properties:{
        id, kind:{enum:['ui','api','service','data','external']}, label:text,
        owner:nullable,role:nullable,status,evidence}}},
    edges:{type:'array',items:{type:'object',additionalProperties:false,
      required:['from','to','label','status','evidence'],properties:{from:id,to:id,label:text,status,evidence}}}
  }
};
put('templates/kinds/goal-discovery.schema.json',JSON.stringify(schema,null,2)+'\n');
let source=read('scripts/mission-scope.mjs');
source=source.replace("import { readFileSync } from 'node:fs';", "import { readFileSync } from 'node:fs';\nimport { architectureErrors } from './scope-architecture.mjs';");
source=source.replace('const discovery = mission.discovery;','const discovery = mission.discovery;\n  errors.push(...architectureErrors(discovery, root));');
put('scripts/mission-scope.mjs',source);
source=read('scripts/scope-presentation.mjs');
source=source.replace("import { missionAt } from './mission-history.mjs';", "import { missionAt } from './mission-history.mjs';\nimport { renderArchitecture } from './scope-architecture.mjs';");
source=source.replace("    '', 'Workflow forecast: planned", "    '', renderArchitecture(mission.discovery, mission.language),\n    '', 'Workflow forecast: planned");
put('scripts/scope-presentation.mjs',source);
const interaction=JSON.parse(read('resources/interaction.json'));
interaction.scopePresentation.rule += ' Render the architecture sketch from discovery.architecture beside this table on initial confirmation and material feedback, following workflows/discovery.md. Absent architecture is visibly unresolved, not inferred from repository roles.';
put('resources/interaction.json',JSON.stringify(interaction,null,2)+'\n');
