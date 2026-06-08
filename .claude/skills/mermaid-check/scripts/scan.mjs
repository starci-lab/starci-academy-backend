// FE-faithful mermaid validator.
//
// Renders every ```mermaid block in a course's rendered markdown (vi.md / en.md)
// with the EXACT engine the frontend uses — mermaid pinned in the FE node_modules,
// securityLevel: "strict", mermaid.render() — so a failure here == a broken
// diagram on the lesson page. Pure validation: reports, never mutates content.
//
// Usage (from backend repo root):
//   node .claude/skills/mermaid-check/scripts/scan.mjs [courseRelPath]
// Default course: .mount/data/courses/0-fullstack-mastery
//
// Output: console summary (grouped by diagram type + error) + JSON report at
// scratch/mermaid-report.json with every failing {file, line, code, error}.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs"
import { createServer } from "node:http"
import { join, extname, relative, dirname } from "node:path"

const REPO = process.cwd()
const COURSE = process.argv[2] ?? ".mount/data/courses/0-fullstack-mastery"
const COURSE_DIR = join(REPO, COURSE)

// FE-pinned mermaid dist == single source of truth for what actually renders.
// Try the known FE repo locations; first hit wins.
const FE_CANDIDATES = [
    join(REPO, "..", "..", "starci-academy", "node_modules", "mermaid", "dist"),
    join(REPO, "..", "starci-academy", "node_modules", "mermaid", "dist"),
    "C:/Repositories/starci-academy/node_modules/mermaid/dist",
]
const MERMAID_DIST = FE_CANDIDATES.find((p) => existsSync(join(p, "mermaid.esm.min.mjs")))
if (!MERMAID_DIST) {
    console.error("Could not find FE mermaid dist. Run `pnpm i` in the frontend repo, or edit FE_CANDIDATES.")
    process.exit(1)
}
if (!existsSync(COURSE_DIR)) {
    console.error(`Course not found: ${COURSE_DIR}`)
    process.exit(1)
}

// --- 1. walk + extract mermaid blocks (only rendered files: vi.md / en.md) ----
function walk(dir) {
    const out = []
    for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) out.push(...walk(p))
        else if (name === "vi.md" || name === "en.md") out.push(p)
    }
    return out
}

function extractBlocks(text) {
    const lines = text.split(/\r?\n/)
    const blocks = []
    let inBlock = false, startLine = 0, buf = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!inBlock && /^\s*```mermaid\s*$/.test(line)) { inBlock = true; startLine = i + 1; buf = []; continue }
        if (inBlock && /^\s*```\s*$/.test(line)) { inBlock = false; blocks.push({ line: startLine, code: buf.join("\n") }); continue }
        if (inBlock) buf.push(line)
    }
    return blocks
}

const work = []
const files = walk(COURSE_DIR)
for (const file of files) {
    for (const b of extractBlocks(readFileSync(file, "utf8"))) {
        work.push({ file: relative(REPO, file), line: b.line, code: b.code })
    }
}
console.log(`Found ${work.length} mermaid blocks in ${files.length} rendered files under ${COURSE}`)
console.log(`Using FE mermaid dist: ${MERMAID_DIST}`)
if (work.length === 0) process.exit(0)

// --- 2. static server for the FE mermaid bundle (no writes into node_modules) --
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
    if (!p.startsWith(MERMAID_DIST) || !existsSync(p)) { res.writeHead(404); res.end("not found"); return }
    res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" }); res.end(readFileSync(p))
})
const PORT = 7333
await new Promise((r) => server.listen(PORT, r))

// --- 3. drive chromium (playwright), render each block ------------------------
const { chromium } = await import("playwright")
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "load" })
await page.waitForFunction(() => window.__mermaidReady === true, { timeout: 30000 })
// Match the FE renderer config exactly.
await page.evaluate(() => window.mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" }))

const results = []
for (let i = 0; i < work.length; i++) {
    const w = work[i]
    const r = await page.evaluate(async ({ code, id }) => {
        try { await window.mermaid.parse(code); await window.mermaid.render("scan-" + id, code); return { ok: true } }
        catch (e) { return { ok: false, error: String(e && e.message ? e.message : e) } }
    }, { code: w.code, id: i })
    results.push({ ...w, ...r })
    if (!r.ok) console.log(`FAIL ${w.file}:${w.line}  ${r.error.split("\n")[0].slice(0, 120)}`)
    if ((i + 1) % 100 === 0) console.log(`...${i + 1}/${work.length}`)
}
await browser.close()
await new Promise((r) => server.close(r))

// --- 4. report ---------------------------------------------------------------
const fails = results.filter((r) => !r.ok)
function diagramType(code) {
    for (const ln of code.split(/\r?\n/)) { const t = ln.trim(); if (t && !t.startsWith("%%")) return t.split(/\s/)[0] }
    return "(empty)"
}
const byType = {}, byError = {}
for (const f of fails) {
    const t = diagramType(f.code); byType[t] = (byType[t] ?? 0) + 1
    const k = f.error.split("\n")[0].slice(0, 80); byError[k] = (byError[k] ?? 0) + 1
}
const REPORT = join(REPO, "scratch", "mermaid-report.json")
mkdirSync(dirname(REPORT), { recursive: true })
writeFileSync(REPORT, JSON.stringify({ total: results.length, failed: fails.length, fails, byType, byError }, null, 2))

console.log("\n================ SUMMARY ================")
console.log(`total blocks : ${results.length}`)
console.log(`failed       : ${fails.length}`)
if (fails.length) {
    console.log("\nfailures by diagram type:")
    for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${t}`)
    console.log("\nfailures by error message:")
    for (const [e, n] of Object.entries(byError).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${e}`)
}
console.log(`\nfull report -> ${relative(REPO, REPORT)}`)
process.exit(fails.length ? 1 : 0)
