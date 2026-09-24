import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { renderScope } from './.claude/scripts/scope-presentation.mjs';
const home=import.meta.dirname;
const {chromium}=createRequire(path.resolve(home,'../../.tools/playwright/package.json'))('playwright');
const dist=path.join(home,'parser/node_modules/mermaid/dist');
const server=http.createServer((req,res)=>{
  if(req.url==='/') {res.setHeader('Content-Type','text/html');res.end('<body><main id="diagram"></main><script type="module">import mermaid from "/mermaid/mermaid.esm.min.mjs"; mermaid.initialize({startOnLoad:false,securityLevel:"strict"});window.mermaid=mermaid;</script>');return;}
  const file=path.resolve(dist,decodeURIComponent(req.url.slice('/mermaid/'.length)));
  if(!req.url.startsWith('/mermaid/')||!file.startsWith(dist+path.sep)||!fs.existsSync(file)){res.statusCode=404;res.end();return;}
  res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1800,height:1200}});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.mermaid);
  const evidence='source:contract-and-ownership-review';
  const nodes=['ui','api','service','data','external'].map((kind,i)=>({id:`component-${i}`,kind,label:`${kind} boundary`,owner:`${kind} owner`,role:kind==='external'?null:'app',status:i===4?'unverified':'discovered',evidence:i===4?[]:[evidence]}));
  const discovery={repositories:[{role:'app',repository:'/repo/app'}],impacts:[{role:'app',routes:['/flow'],code:['flow boundary'],evidence:[evidence]}],architecture:{nodes,edges:nodes.slice(1).map((node,i)=>({from:nodes[i].id,to:node.id,label:'requests / persists',status:i===3?'proposed':'discovered',evidence:i===3?[]:[evidence]}))}};
  const results=[];
  for(const variant of ['normal','escaping']) {
    const mission={version:1,language:variant==='normal'?'en':'vi',goal:'Recover a workflow',discovery:structuredClone(discovery)};
    if(variant==='escaping') {
      mission.discovery.architecture.nodes[0].label='UI "quoted" #1 | `code` [locale] tiếng Việt <script> & \\';
      mission.discovery.architecture.edges[0].label='calls "API" | # `edge` Unicode →';
    }
    const preview=renderScope(mission);
    fs.writeFileSync(path.join(home,`preview-${variant}.md`),preview+'\n');
    const graph=preview.match(/```mermaid\n([\s\S]*?)\n```/)[1];
    const measured=await page.evaluate(async({graph,id})=>{
      const parsed=await window.mermaid.parse(graph);
      const result=await window.mermaid.render(id,graph);
      document.querySelector('#diagram').innerHTML=result.svg;
      const svg=document.querySelector('#diagram svg');
      return {diagramType:parsed.diagramType,nodeCount:svg.querySelectorAll('.node').length,edgeCount:svg.querySelectorAll('.flowchart-link').length,labels:[...svg.querySelectorAll('.nodeLabel')].map(n=>n.textContent),svg:result.svg,scriptCount:svg.querySelectorAll('script').length};
    },{graph,id:`proof-${variant}`});
    assert.equal(measured.nodeCount,5); assert.equal(measured.edgeCount,4); assert.equal(measured.scriptCount,0);
    assert.ok(measured.labels.some(label=>label.includes(variant==='normal'?'data owner':'tiếng Việt')));
    fs.writeFileSync(path.join(home,`render-${variant}.svg`),measured.svg);
    await page.screenshot({path:path.join(home,`render-${variant}.png`),fullPage:true});
    const {svg,...summary}=measured;results.push({variant,...summary});
  }
  fs.writeFileSync(path.join(home,'render-proof.json'),JSON.stringify({mermaid:'11.17.2',status:'passed',results},null,2)+'\n');
  console.log(JSON.stringify(results));
} finally {await browser?.close(); await new Promise(resolve=>server.close(resolve));}
