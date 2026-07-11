// node .claude/docs/debold.mjs <dir> [<dir> ...]
// Go bo ** quanh inline-code va URL trong prose markdown (rule terminology-bold.md §3B: cam bold quanh code).
// Bao ve code fence (```...```) — KHONG dung chu ben trong. Idempotent, an toan chay nhieu lan.
import fs from "node:fs"
import path from "node:path"

const files = []
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith(".md")) files.push(p)
  }
}
for (const r of process.argv.slice(2)) walk(r)

let tf = 0, th = 0
for (const f of files) {
  const s = fs.readFileSync(f, "utf8")
  const parts = s.split(/(```[\s\S]*?```)/g)
  let h = 0
  const o = parts.map((g) =>
    g.startsWith("```")
      ? g
      : g
        .replace(/\*\*(`[^`]+`)\*\*/g, (_, x) => { h++; return x })
        .replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g, (_, x) => { h++; return x })
  ).join("")
  if (h > 0) { fs.writeFileSync(f, o); tf++; th += h }
}
console.log(`de-bold: ${th} chops in ${tf} files`)
