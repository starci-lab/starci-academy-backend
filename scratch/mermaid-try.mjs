// Render candidate mermaid strings against the FE engine (11.14 + strict) and
// report ok/error — used to verify a fix BEFORE patching it into content.
import { createServer } from "node:http"
import { readFileSync, existsSync } from "node:fs"
import { join, extname } from "node:path"

const REPO = process.cwd()
const MERMAID_DIST = join(REPO, "..", "..", "starci-academy", "node_modules", "mermaid", "dist")
const MIME = { ".mjs": "text/javascript", ".js": "text/javascript", ".html": "text/html" }
const INDEX = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script type="module">
import mermaid from "./mermaid.esm.min.mjs"
window.mermaid = mermaid
window.__mermaidReady = true
</script></body></html>`

const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0])
    if (url === "/" || url === "/index.html") { res.writeHead(200, { "content-type": "text/html" }); res.end(INDEX); return }
    const p = join(MERMAID_DIST, url)
    if (!p.startsWith(MERMAID_DIST) || !existsSync(p)) { res.writeHead(404); res.end("404"); return }
    res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" }); res.end(readFileSync(p))
})
await new Promise((r) => server.listen(7334, r))

const { chromium } = await import("playwright")
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto("http://localhost:7334/", { waitUntil: "load" })
await page.waitForFunction(() => window.__mermaidReady === true, { timeout: 30000 })
await page.evaluate(() => window.mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" }))

// Candidate fixes ------------------------------------------------------------
const CANDIDATES = {
    "vault-bisect-noalias": `sequenceDiagram
    participant LOOP
    participant APP
    participant V
    participant CFG

    APP->>V: approleLogin(role_id, secret_id)
    V-->>APP: client_token TTL 1h
    APP->>V: GET secret/data/db
    V-->>APP: password=...
    APP->>CFG: set secrets via process.env
    LOOP->>APP: trigger refresh
    APP->>V: approleLogin + GET secret/data/db
    V-->>APP: password=... (rotated)
    APP->>CFG: update secrets`,
    "vault-bisect-noslash": `sequenceDiagram
    participant LOOP as setInterval TTL over 3
    participant APP as NestJS bootstrap
    participant V as Vault
    participant CFG as ConfigService

    APP->>V: approleLogin(role_id, secret_id)
    V-->>APP: client_token TTL 1h
    APP->>V: GET secret data db
    V-->>APP: password value
    APP->>CFG: set secrets via process env
    LOOP->>APP: trigger refresh
    APP->>V: approleLogin then GET secret data db
    V-->>APP: password value rotated
    APP->>CFG: update secrets`,
    "vault-bisect-firsthalf": `sequenceDiagram
    participant LOOP as setInterval TTL/3
    participant APP as NestJS bootstrap
    participant V as Vault
    participant CFG as ConfigService

    APP->>V: approleLogin(role_id, secret_id)
    V-->>APP: client_token (TTL 1h)`,

    "zustand-fix2": `flowchart TD
    Click((Click +1 / -1 / reset))
    subgraph Browser ["Browser — Vite app"]
        direction TB
        Store{"Zustand store (module singleton)\\ncount + actions\\nrenderCountA / renderCountB"}
        Display["CounterDisplay\\nsubscribe (s) => s.count"]
        Panel["ActionPanel\\nsubscribe (s) => s.increment / decrement / reset"]
        Store -->|count changes → Object.is differs → notify| Display
        Store -.->|action ref stable → Object.is equal → NO notify| Panel
        Panel -->|call action → set| Store
    end
    Click --> Panel`,

    "m9-java-fix": `flowchart TD
    Client((Client))
    API["ingest-api :3000"]
    Client -->|POST /payments| API

    subgraph Redis ["Redis (job queue backing store)"]
        direction TB
        PQ["payments:queue (sorted set by priority)"]
        DLQ["payments:dlq (list)"]
    end

    API -->|ZADD score=priority| PQ

    PQ -->|Scheduled ZPopMin: smallest score first| W["PaymentService worker thread"]
    W -->|exhausted attempts still failing — LPush| DLQ`,

    "m19-java-fix": `graph TD
    DEV["Developer push → main"]
    GHA["GitHub Actions\\nmvn package → *.jar"]
    SCP["SCP app.jar → droplet"]
    SYS["systemctl restart app-java"]
    NGINX["nginx (port 443)\\nLet's Encrypt cert"]
    APP["app-java process\\n(port 8080)"]
    CLIENT["curl https://domain/"]

    DEV --> GHA
    GHA --> SCP
    SCP --> SYS
    SYS --> APP
    CLIENT --> NGINX
    NGINX -->|proxy_pass 127.0.0.1:8080| APP`,

    "research-fix": `flowchart LR
  Client --POST /videos/compress--> ingest-api
  ingest-api --queue.add jobId--> Redis(waiting/active/completed)
  Redis --pull job--> VideoProcessor
  VideoProcessor --result+progress--> Redis
  Client --GET /jobs/:id--> Redis state`,
}

for (const [name, code] of Object.entries(CANDIDATES)) {
    const r = await page.evaluate(async ({ code, id }) => {
        try { await window.mermaid.parse(code); await window.mermaid.render("t-" + id, code); return { ok: true } }
        catch (e) { return { ok: false, error: String(e && e.message ? e.message : e).split("\n").slice(0, 4).join(" | ") } }
    }, { code, id: name })
    console.log((r.ok ? "OK   " : "FAIL ") + name + (r.ok ? "" : "  -> " + r.error))
}

await browser.close()
await new Promise((r) => server.close(r))
