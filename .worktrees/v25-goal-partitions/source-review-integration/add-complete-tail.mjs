import fs from 'node:fs';
const p='.worktrees/v25-goal-partitions/.claude/scripts/source-review-frontend.spec.mjs';let s=fs.readFileSync(p,'utf8').replace('runSourceReviewLifecycle,revision,forecastOf','runSourceReviewLifecycle,revision,forecastOf,sealForecast');
const marker="test('accepted BE and FE repair";
const helper=`async function sealCompleteSourceForecast(f,source) {
 await sealForecast(f,source);
 const {readContext,retainContext}=await f.load('scripts/mission-history.mjs');
 const state=f.state(),record=readContext(f.session,state.planHistory.active,'plans'),forecast=record.forecast;
 const tail=[[12,'runtime.serve',7],[13,'interface.audit',3],[14,'quality.verify',4],[15,'api.verify',6],[16,'runtime.serve',7],[17,'uat.plan',null],[18,'uat.verify',5],[19,'quality.verify',4],[20,'api.verify',6],[21,'runtime.serve',7],[22,'quality.verify',1]];
 for(const [step,operator,goal] of tail){const cell=step+'/1';forecast.chain.push([cell]);forecast.steps[cell]=operator;forecast.nodes[cell]=cell;forecast.goals[cell]=goal===null?{prerequisite:'18/1'}:{doneWhen:goal};forecast.presets[cell]={};forecast.dependencies[cell]=[];forecast.evidenceDependencies[cell]=[];}
 for(const cell of ['12/1','16/1','21/1'])forecast.presets[cell]={routeKey:state.project+'/be',env:'dev',operation:'serve'};
 for(const cell of ['17/1','18/1'])forecast.presets[cell]={access:'anonymous',fixtures:'none',sourceRoles:'full'};
 const dependencies={'12/1':['4/1'],'13/1':['11/1','12/1'],'14/1':['11/1','13/1'],'15/1':['4/1','12/1'],'16/1':['4/1'],'17/1':['11/1'],'18/1':['11/1','13/1','14/1','17/1'],'19/1':['11/1','13/1','18/1'],'20/1':['4/1','12/1'],'21/1':['4/1'],'22/1':['4/1']};
 for(const [cell,parents] of Object.entries(dependencies)){forecast.dependencies[cell]=parents;forecast.evidenceDependencies[cell]=parents;}
 forecast.handoffs['12/1']='4/1';forecast.handoffs['13/1']='11/1';forecast.handoffs['14/1']='13/1';forecast.handoffs['15/1']='12/1';forecast.handoffs['16/1']='4/1';forecast.handoffs['17/1']='14/1';forecast.handoffs['18/1']='17/1';forecast.handoffs['19/1']='18/1';forecast.handoffs['20/1']='19/1';forecast.handoffs['21/1']='4/1';forecast.handoffs['22/1']='21/1';forecast.fanout['18/1']='units';
 state.chain=forecast.chain;state.steps=forecast.steps;state.planned=Object.fromEntries(Object.entries(forecast.presets).map(([cell,requirements])=>[cell,{requirements}]));record.planned=state.planned;
 const address=await retainContext(f.session,'plans',record);state.planHistory={active:address,revisions:[address]};put(path.join(f.session,'state.json'),state);
}

`;
s=s.replace(marker,helper+marker).replace("const backend=await runSourceReviewLifecycle(t,{createFixture:","const backend=await runSourceReviewLifecycle(t,{seal:sealCompleteSourceForecast,createFixture:");fs.writeFileSync(p,s);
