// capture-e2e.mjs — run a lesson's Playwright suite with the JSON reporter and
// emit a structured e2e.json (flows[] with title/description/status/logs) for the
// platform's "E2E" tab. Usage:
//   node capture-e2e.mjs <playwrightDir> <outFile> [lang] [BE_PORT] [FE_PORT] [extraEnv...]
// Reads the spec file header comment as the flow description.
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join, resolve } from "node:path"

const [pwDirArg, outFile, lang = "agnostic", bePort, fePort] = process.argv.slice(2)
const pwDir = pwDirArg ? resolve(pwDirArg) : pwDirArg
if (!pwDir || !outFile) {
    console.error("usage: node capture-e2e.mjs <playwrightDir> <outFile> [lang] [BE_PORT] [FE_PORT]")
    process.exit(1)
}

// PLAYWRIGHT_JSON_OUTPUT_NAME must be a name relative to the playwright cwd to
// land predictably (absolute cross-OS paths don't resolve reliably).
const reportName = "_e2e-report.json"
const reportFile = join(pwDir, reportName)
const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportName }
if (bePort) env.BE_PORT = bePort
if (fePort) env.FE_PORT = fePort

// Run Playwright with the JSON reporter writing to a file. Playwright exits
// non-zero on any failure but still writes the report.
try {
    execSync("npx playwright test --reporter=json", {
        cwd: pwDir, env, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "ignore", "inherit"],
    })
} catch { /* failures still produce the report file */ }

if (!existsSync(reportFile)) {
    console.error("no JSON report produced at", reportFile)
    process.exit(1)
}
const report = JSON.parse(readFileSync(reportFile, "utf8"))

// Pull a one-line description from the spec file's leading block comment.
const describeFromSpec = (specFile) => {
    try {
        if (!specFile) return ""
        // report's file is relative to testDir (./scripts) — try a few resolutions.
        const cands = [join(pwDir, "scripts", specFile), join(pwDir, specFile), specFile]
        const p = cands.find((c) => existsSync(c))
        if (!p) return ""
        const src = readFileSync(p, "utf8")
        const m = src.match(/\/\*\*?([\s\S]*?)\*\//)
        if (!m) return ""
        return m[1].split("\n").map((l) => l.replace(/^\s*\*?\s?/, "").trim())
            .filter(Boolean).join(" ").replace(/^Flow\s*\d+\s*[—-]\s*/i, "").slice(0, 300)
    } catch { return "" }
}

const flows = []
const walk = (suite, specFile) => {
    const file = suite.file ?? specFile
    for (const spec of suite.specs ?? []) {
        const test = spec.tests?.[0]
        const result = test?.results?.[0]
        const logs = []
        for (const e of result?.stdout ?? []) {
            const t = (typeof e === "string" ? e : e.text ?? "").trimEnd()
            if (t) logs.push(t)
        }
        flows.push({
            id: (file?.match(/flow-\d+/)?.[0]) ?? spec.title.match(/flow\s*\d+/i)?.[0]?.replace(/\s+/, "-").toLowerCase() ?? "flow",
            title: spec.title,
            description: describeFromSpec(file),
            lang,
            status: spec.ok ? "passed" : "failed",
            durationMs: result?.duration ?? 0,
            logs,
        })
    }
    for (const child of suite.suites ?? []) walk(child, specFile)
}
for (const suite of report.suites ?? []) walk(suite)

// dedupe (configs with chromium+head projects yield the same flow twice)
const seen = new Set()
const unique = flows.filter((f) => {
    const k = `${f.id}::${f.lang}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
})
flows.length = 0
flows.push(...unique)

// stable order by flow id
flows.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))

writeFileSync(outFile, JSON.stringify({ flows }, null, 2))
console.log(`e2e.json: ${flows.length} flows (${flows.filter((f) => f.status === "passed").length} passed) -> ${outFile}`)
for (const f of flows) console.log(`  ${f.status === "passed" ? "OK" : "XX"} ${f.id} "${f.title}" logs=${f.logs.length}`)
