import { createServer } from "node:http"
import { readFileSync, existsSync } from "node:fs"
import { join, extname } from "node:path"
const REPO = process.cwd()
const MERMAID_DIST = join(REPO, "..", "..", "starci-academy", "node_modules", "mermaid", "dist")
const MIME = { ".mjs": "text/javascript", ".js": "text/javascript", ".html": "text/html" }
const INDEX = `<!doctype html><html><head><meta charset="utf-8"></head><body><script type="module">import mermaid from "./mermaid.esm.min.mjs";window.mermaid=mermaid;window.__r=true</script></body></html>`
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0])
  if (url === "/" || url === "/index.html") { res.writeHead(200, {"content-type":"text/html"}); res.end(INDEX); return }
  const p = join(MERMAID_DIST, url)
  if (!p.startsWith(MERMAID_DIST) || !existsSync(p)) { res.writeHead(404); res.end("404"); return }
  res.writeHead(200, {"content-type": MIME[extname(p)] ?? "application/octet-stream"}); res.end(readFileSync(p))
})
await new Promise(r => server.listen(7335, r))
const { chromium } = await import("playwright")
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto("http://localhost:7335/", { waitUntil: "load" })
await page.waitForFunction(() => window.__r === true, { timeout: 30000 })
await page.evaluate(() => window.mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" }))
const lines = [
  "sequenceDiagram",
  "    participant LOOP as setInterval TTL/3",
  "    participant APP as NestJS bootstrap",
  "    participant V as Vault",
  "    participant CFG as ConfigService",
  "",
  "    APP->>V: approleLogin(role_id, secret_id)",
  "    V-->>APP: client_token (TTL 1h)",
  "    APP->>V: GET secret/data/db",
  "    V-->>APP: password=...",
  "    APP->>CFG: set secrets via process.env",
  "    LOOP->>APP: trigger refresh",
  "    APP->>V: approleLogin + GET secret/data/db",
  "    V-->>APP: password=... (rotated)",
  "    APP->>CFG: update secrets",
]
for (let n = 8; n <= lines.length; n++) {
  const code = lines.slice(0, n).join("\n")
  const r = await page.evaluate(async ({ code }) => {
    try { await window.mermaid.parse(code); return { ok: true } } catch (e) { return { ok: false, error: String(e.message||e).split("\n")[0] } }
  }, { code })
  console.log((r.ok ? "OK  " : "FAIL") + " 1.." + n + "  last=[" + lines[n-1].trim() + "]" + (r.ok ? "" : "  " + r.error))
}
await browser.close(); await new Promise(r => server.close(r))
