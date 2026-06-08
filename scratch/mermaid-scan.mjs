// Mermaid render-faithfulness scanner.
//
// Extracts every ```mermaid block from a course's markdown and renders each with
// the EXACT mermaid version + config the frontend uses (mermaid 11.14,
// securityLevel: "strict", mermaid.render()), so a failure here == a failure on
// the lesson page. Pure validation: it reports, it does not mutate content.
//
// Usage:
//   node scratch/mermaid-scan.mjs [courseRelPath]
// Default course: .mount/data/courses/0-fullstack-mastery

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { createServer } from "node:http"
import { join, extname, relative } from "node:path"
import { pathToFileURL } from "node:url"

// --- config ------------------------------------------------------------------
const REPO = process.cwd()
const COURSE = process.argv[2] ?? ".mount/data/courses/0-fullstack-mastery"
const COURSE_DIR = join(REPO, COURSE)
// FE-pinned mermaid dist (single source of truth for what actually renders).
const MERMAID_DIST = join(REPO, "..", "..", "starci-academy", "node_modules", "mermaid", "dist")
const REPORT = join(REPO, "scratch", "mermaid-report.json")

if (!existsSync(MERMAID_DIST)) {
    console.error(`mermaid dist not found at ${MERMAID_DIST}`)
    process.exit(1)
}

// --- 1. walk + extract mermaid blocks ---------------------------------------
/** Recursively collect every .md file under dir. */
function walk(dir) {
    const out = []
    for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        const st = statSync(p)
        if (st.isDirectory()) out.push(...walk(p))
        // Only vi.md / en.md are rendered on the lesson page; research.md, test.md,
        // proof.md etc. are authoring artifacts the FE never renders.
        else if (name === "vi.md" || name === "en.md") out.push(p)
    }
    return out
}

/** Pull each fenced mermaid block out of a markdown string, with 1-based start line. */
function extractBlocks(text) {
    const lines = text.split(/\r?\n/)
    const blocks = []
    let inBlock = false
    let startLine = 0
    let buf = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!inBlock && /^\s*```mermaid\s*$/.test(line)) {
            inBlock = true
            startLine = i + 1
            buf = []
            continue
        }
        if (inBlock && /^\s*```\s*$/.test(line)) {
            inBlock = false
            blocks.push({ line: startLine, code: buf.join("\n") })
            continue
        }
        if (inBlock) buf.push(line)
    }
    return blocks
}

const files = walk(COURSE_DIR)
const work = []
for (const file of files) {
    const text = readFileSync(file, "utf8")
    for (const b of extractBlocks(text)) {
        work.push({ file: relative(REPO, file), line: b.line, code: b.code })
    }
}
console.log(`Found ${work.length} mermaid blocks in ${files.length} markdown files under ${COURSE}`)
if (work.length === 0) process.exit(0)

// --- 2. static server for the FE mermaid bundle ------------------------------
const MIME = { ".mjs": "text/javascript", ".js": "text/javascript", ".html": "text/html" }
const INDEX = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script type="module">
import mermaid from "./mermaid.esm.min.mjs"
window.mermaid = mermaid
window.__mermaidReady = true
</script></body></html>`

const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0])
    if (url === "/" || url === "/index.html") {
        res.writeHead(200, { "content-type": "text/html" })
        res.end(INDEX)
        return
    }
    const p = join(MERMAID_DIST, url)
    if (!p.startsWith(MERMAID_DIST) || !existsSync(p)) {
        res.writeHead(404)
        res.end("not found")
        return
    }
    res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" })
    res.end(readFileSync(p))
})
const PORT = 7333
await new Promise((r) => server.listen(PORT, r))

// --- 3. drive chromium, render each block ------------------------------------
const { chromium } = await import("playwright")
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const consoleErrors = []
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "load" })
await page.waitForFunction(() => window.__mermaidReady === true, { timeout: 30000 })
await page.evaluate(() => {
    window.mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" })
})

const results = []
for (let i = 0; i < work.length; i++) {
    const w = work[i]
    const r = await page.evaluate(async ({ code, id }) => {
        try {
            // Faithful to FE: parse + render with the same engine/config.
            await window.mermaid.parse(code)
            await window.mermaid.render("scan-" + id, code)
            return { ok: true }
        } catch (e) {
            return { ok: false, error: String(e && e.message ? e.message : e) }
        }
    }, { code: w.code, id: i })
    results.push({ ...w, ...r })
    if (!r.ok) console.log(`FAIL ${w.file}:${w.line}  ${r.error.split("\n")[0].slice(0, 120)}`)
    if ((i + 1) % 100 === 0) console.log(`...${i + 1}/${work.length}`)
}

await browser.close()
await new Promise((r) => server.close(r))

// --- 4. report ---------------------------------------------------------------
const fails = results.filter((r) => !r.ok)
/** First non-empty token of a mermaid block ~= diagram type. */
function diagramType(code) {
    for (const ln of code.split(/\r?\n/)) {
        const t = ln.trim()
        if (t && !t.startsWith("%%")) return t.split(/\s/)[0]
    }
    return "(empty)"
}
const byType = {}
for (const f of fails) {
    const t = diagramType(f.code)
    byType[t] = (byType[t] ?? 0) + 1
}
const byError = {}
for (const f of fails) {
    const key = f.error.split("\n")[0].slice(0, 80)
    byError[key] = (byError[key] ?? 0) + 1
}

writeFileSync(REPORT, JSON.stringify({ total: results.length, failed: fails.length, fails, byType, byError }, null, 2))

console.log("\n================ SUMMARY ================")
console.log(`total blocks : ${results.length}`)
console.log(`failed       : ${fails.length}`)
console.log("\nfailures by diagram type:")
for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${t}`)
console.log("\nfailures by error message:")
for (const [e, n] of Object.entries(byError).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${e}`)
console.log(`\nfull report -> ${relative(REPO, REPORT)}`)
