import fs from 'node:fs';const p='.worktrees/v25-goal-partitions/.claude/scripts/source-review-frontend.spec.mjs';let s=fs.readFileSync(p,'utf8');const from=s.indexOf(' const tail='),to=s.indexOf(' state.chain=forecast.chain;',from);if(from<0||to<0)throw Error('sealer range');s=s.slice(0,from)+` const tail=[[12,'runtime.serve',7],[13,'interface.audit',3],[14,'quality.verify',4],[15,'uat.plan',null],[16,'uat.verify',5]];
 for(const [step,operator,goal] of tail){const cell=step+'/1';forecast.chain.push([cell]);forecast.steps[cell]=operator;forecast.nodes[cell]=cell;forecast.goals[cell]=goal===null?{prerequisite:'16/1'}:{doneWhen:goal};forecast.presets[cell]={};forecast.dependencies[cell]=[];forecast.evidenceDependencies[cell]=[];}
 forecast.presets['12/1']={routeKey:state.project+'/fe',env:'dev',operation:'serve'};
 for(const cell of ['15/1','16/1'])forecast.presets[cell]={access:'anonymous',fixtures:'none',sourceRoles:'full'};
 const dependencies={'12/1':['11/1'],'13/1':['11/1','10/1','12/1'],'14/1':['11/1','13/1'],'15/1':['11/1','14/1'],'16/1':['11/1','10/1','13/1','14/1','15/1','12/1']};
 for(const [cell,parents] of Object.entries(dependencies)){forecast.dependencies[cell]=parents;forecast.evidenceDependencies[cell]=parents;}
 forecast.handoffs['12/1']='11/1';forecast.handoffs['13/1']='11/1';forecast.handoffs['14/1']='13/1';forecast.handoffs['15/1']='14/1';forecast.handoffs['16/1']='15/1';forecast.fanout['16/1']='units';
`+s.slice(to);fs.writeFileSync(p,s);
