import {readFileSync,writeFileSync} from 'node:fs';
const file=new URL('./.claude/scripts/workflow-interface-fixture.mjs',import.meta.url);
let text=readFileSync(file,'utf8');
for(const [from,to] of [["'Name the existing action Transform.'",'description'],["'Make the existing action label explicit.'",'description'],['all presentation values and behavior are unchanged.','verify the source change recorded above.']]) {
  if(!text.includes(from)) throw Error('missing expected fixture description');
  text=text.replace(from,to);
}
writeFileSync(file,text);
