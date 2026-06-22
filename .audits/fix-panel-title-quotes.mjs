// node .audits/fix-panel-title-quotes.mjs <file.md> ...  — safety-net SAU accordion.
// remark-directive dung " lam delimiter cho attribute -> title chua inner " hoac \" -> VO directive (panel
// thanh TEXT, render ra raw ":::panel"). Doi MOI inner quote trong title thanh ' (single). Idempotent.
import fs from "node:fs"
let tf = 0, th = 0
for (const f of process.argv.slice(2)) {
    const lines = fs.readFileSync(f, "utf8").split(/\r?\n/)
    let h = 0
    const out = lines.map((l) => {
        const m = l.match(/^(:{3,}panel\{title=")(.*)("\}\s*)$/)
        if (!m) return l
        const inner = m[2]
        if (!/["\\]/.test(inner)) return l
        const fixed = inner.replace(/\\"/g, "'").replace(/"/g, "'")
        if (fixed === inner) return l
        h++
        return m[1] + fixed + m[3]
    })
    if (h > 0) { fs.writeFileSync(f, out.join("\n")); tf++; th += h }
}
console.log(`fix panel-title quotes: ${th} titles in ${tf} files`)
