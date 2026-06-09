import { chromium } from "playwright-core"
const b = await chromium.launch({ channel:"chrome", headless:true })
const p = await b.newPage({ viewport:{width:760,height:620} })
await p.goto("file:///C:/Repositories/ac/starci-academy-backend/scratch/pixel/farm.html",{waitUntil:"networkidle"})
// populate a nice demo state
await p.evaluate(()=>{
  const set=(x,y,fn)=>fn(cells[y*COLS+x]);
  // till a block
  for(let y=0;y<4;y++)for(let x=0;x<6;x++) set(x,y,c=>c.tilled=true);
  set(1,1,c=>{c.crop={stage:0,grow:0}});
  set(2,1,c=>{c.crop={stage:1,grow:0};c.wet=true});
  set(3,1,c=>{c.crop={stage:2,grow:0}});
  set(1,2,c=>{c.crop={stage:1,grow:0}}); set(2,2,c=>{c.crop={stage:2,grow:0}});
  set(4,1,c=>{c.crop={stage:2,grow:0}}); set(3,2,c=>{c.wet=true});
  coins=40; document.getElementById('coins').textContent=coins; draw();
})
await p.waitForTimeout(400)
await p.screenshot({ path:"farm-screenshot.png" })
await b.close(); console.log("ok")
