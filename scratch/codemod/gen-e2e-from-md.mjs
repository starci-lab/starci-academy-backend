// gen-e2e-from-md.mjs — build each lesson's e2e.json from its existing
// .e2e/<lang>/flow-*.md proof files (rich per-language markdown: commands, real
// output, conclusion). NO re-running of Playwright — render the recorded proofs.
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const modulesRoot = process.argv[2]
    ?? "C:/Repositories/ac/starci-academy-backend/.mount/data/courses/0-fullstack-mastery/modules"

// preferred language order for the E2E tab's filter
const LANG_ORDER = ["typescript", "java", "csharp", "go", "agnostic", "s3-cloud"]
const langRank = (l) => { const i = LANG_ORDER.indexOf(l); return i === -1 ? 99 : i }

const parseFlow = (md, lang, fileName) => {
    const title = (md.match(/^#\s+(.+)$/m)?.[1] ?? fileName.replace(/\.md$/, "")).trim()
    const statusRaw = (md.match(/##\s*Status:\s*(.+)/i)?.[1] ?? "done").trim().toLowerCase()
    const status = /done|pass/.test(statusRaw) ? "passed" : "failed"
    const id = fileName.match(/flow-\d+/)?.[0] ?? fileName.replace(/\.md$/, "")
    return { id, lang, title, status, markdown: md }
}

let total = 0, lessons = 0
const walkModules = () => {
    for (const slot of readdirSync(modulesRoot)) {
        const contents = join(modulesRoot, slot, "contents")
        if (!existsSync(contents)) continue
        for (const lesson of readdirSync(contents)) {
            const e2eDir = join(contents, lesson, ".e2e")
            if (!existsSync(e2eDir) || !statSync(e2eDir).isDirectory()) continue
            const flows = []
            for (const entry of readdirSync(e2eDir)) {
                const langDir = join(e2eDir, entry)
                if (!statSync(langDir).isDirectory()) continue // skip top-level summary.md etc.
                const lang = entry.replace(/^\d+-/, "") // "0-typescript" -> "typescript"
                for (const file of readdirSync(langDir)) {
                    if (!file.endsWith(".md") || !/flow-\d+/.test(file)) continue
                    flows.push(parseFlow(readFileSync(join(langDir, file), "utf8"), lang, file))
                }
            }
            if (flows.length === 0) continue
            flows.sort((a, b) =>
                (langRank(a.lang) - langRank(b.lang)) ||
                a.id.localeCompare(b.id, undefined, { numeric: true }))
            writeFileSync(join(contents, lesson, "e2e.json"), JSON.stringify({ flows }, null, 2))
            const langs = [...new Set(flows.map((f) => f.lang))].join(",")
            console.log(`${slot}/${lesson} :: ${flows.length} flows [${langs}]`)
            total += flows.length; lessons += 1
        }
    }
}
walkModules()
console.log(`\nDONE: ${total} flows across ${lessons} lessons`)
