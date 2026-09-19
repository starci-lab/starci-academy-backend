const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'.claude'),file=path.join(root,'templates/step/state.schema.json');
const state=JSON.parse(fs.readFileSync(file)),canonical=JSON.parse(fs.readFileSync(path.join(root,'templates/kinds/goal-discovery.schema.json')));
delete canonical.$id;
state.properties.mission.properties.discovery=canonical;
fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');
