import { chromium } from "playwright-core"
const [url, out, sel] = process.argv.slice(2)
const b = await chromium.launch({ channel: "chrome", headless: true })
const p = await b.newPage({ viewport: { width: 1280, height: 760 } })
try {
  await p.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
  if (sel) await p.waitForSelector(sel, { timeout: 20000 })
  await p.waitForTimeout(800)
  await p.screenshot({ path: out, fullPage: false })
  console.log("snap ok:", out)
} catch (e) { console.error("snap fail:", e.message); await p.screenshot({ path: out }).catch(()=>{}) }
finally { await b.close() }
