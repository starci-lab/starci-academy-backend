// node .audits/strip-step-bold.mjs <file.md> ...  — safety-net SAU apply accordion.
// Go bold step-header TRUNG ben trong panel: dong "^**Buoc N — <ten>.** <desc>" -> "<desc>"
// (panel title da la step name; bold trong body la duplicate -> render 2 lan). Idempotent (no-op neu da sach).
// Bat ca "Buoc N" (vi) lan "Step N" (en).
import fs from "node:fs"
let tf = 0, th = 0
for (const f of process.argv.slice(2)) {
    const lines = fs.readFileSync(f, "utf8").split(/\r?\n/)
    let h = 0
    const out = lines.map((l) => {
        const m = l.match(/^\*\*(?:Bước|Step) \d+ —[^*]+?\*\*\s?(.*)$/)
        if (m) { h++; return m[1] }
        return l
    })
    if (h > 0) { fs.writeFileSync(f, out.join("\n")); tf++; th += h }
}
console.log(`strip step-bold: ${th} lines in ${tf} files`)
