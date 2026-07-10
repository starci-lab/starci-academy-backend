// Clear V1 tàn tích: xoá top-level section # body / # codeExplaining / # codeImplementations
// khỏi file content-ROOT (vi.md/en.md). Theo dõi @starci/seperator + @starci/jsonb để
// KHÔNG nhầm `#` trong code-fence / value verbatim là heading (mirror ExtractJsonFromMd grammar).
// Thêm # verified nếu thiếu (đẩy content sang nhánh V2). DRY mặc định; APPLY=1 để ghi.
const fs = require("fs")
const SEP = /^\s*<!--\s*@starci\/seperator\s*-->\s*$/
const JSONB = /^\s*<!--\s*@starci\/jsonb\s*-->\s*$/
const REMOVE = new Set(["body", "codeExplaining", "codeImplementations", "references"])
const VERIFIED_DATE = "2026-06-14"

function transform(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/)
  let sepOpen = false, jsonbOpen = false
  const headers = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (SEP.test(l)) { sepOpen = !sepOpen; continue }
    if (JSONB.test(l)) { jsonbOpen = !jsonbOpen; continue }
    if (!sepOpen && !jsonbOpen && /^#\s+\S/.test(l) && !l.startsWith("##")) {
      const m = l.match(/^#\s+(.+?)\s*$/)
      headers.push({ idx: i, key: m[1] })
    }
  }
  const sections = headers.map((h, j) => ({
    key: h.key, start: h.idx, end: j + 1 < headers.length ? headers[j + 1].idx : lines.length,
  }))
  const firstStart = sections.length ? sections[0].start : lines.length
  const out = [...lines.slice(0, firstStart)]
  const removed = []
  let hasVerified = false
  for (const s of sections) {
    if (REMOVE.has(s.key)) { removed.push(s.key); continue }
    if (s.key === "verified") hasVerified = true
    out.push(...lines.slice(s.start, s.end))
  }
  let addedVerified = false
  if (!hasVerified) {
    // append # verified ở cuối (an toàn — section order không bắt buộc)
    while (out.length && out[out.length - 1].trim() === "") out.pop()
    out.push("# verified", SEP_LINE, VERIFIED_DATE, SEP_LINE)
    addedVerified = true
  }
  return { text: out.join("\n"), removed, addedVerified, keys: sections.map((s) => s.key) }
}
const SEP_LINE = "<!-- @starci/seperator -->"

const files = process.argv.slice(2)
const APPLY = process.env.APPLY === "1"
let nChanged = 0, nVerified = 0
for (const f of files) {
  const orig = fs.readFileSync(f, "utf8")
  const r = transform(orig)
  const changed = r.removed.length || r.addedVerified
  if (changed) { nChanged++; if (r.addedVerified) nVerified++ }
  if (!APPLY) {
    if (files.length <= 5) {
      console.log(`\n### ${f}`)
      console.log("  keys:", r.keys.join(", "))
      console.log("  removed:", r.removed.join(", ") || "(none)", "| +verified:", r.addedVerified)
    }
  } else if (changed) {
    fs.writeFileSync(f, r.text)
  }
}
if (APPLY) console.log(`APPLIED: ${nChanged} files changed (${nVerified} got +verified)`)
else console.log(`\nDRY: ${nChanged}/${files.length} files would change (${nVerified} +verified)`)
