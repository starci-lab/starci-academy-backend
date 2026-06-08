// snap.mjs <url> <outPath> — screenshot a running page using installed Chrome.
import { chromium } from "playwright-core"
const [url, out] = process.argv.slice(2)
if (!url || !out) { console.error("usage: node snap.mjs <url> <outPath>"); process.exit(1) }
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(1200) // let HeroUI/animations settle
  await page.screenshot({ path: out, fullPage: true })
  console.log("snap ok:", out)
} catch (e) {
  console.error("snap fail:", url, e.message)
  await page.screenshot({ path: out }).catch(() => {})
} finally {
  await browser.close()
}
