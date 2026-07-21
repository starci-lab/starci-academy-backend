// Apply dich-ep edits from mount-fix-dichep.js result to vi.md files.
// Usage: node apply-dichep.js <result.json> [--dry]
// result.json = [{file, edits:[{find,replace,term,reason}]}]
// Safety: a `find` is applied ONLY if it occurs EXACTLY once in the file (unique) and
//   differs from replace. Non-unique / not-found -> skipped + logged.
const fs = require('fs')
const path = require('path')
const REPO = 'C:\\Repositories\\ac\\starci-academy-backend'
const RESULT = process.argv[2]
const DRY = process.argv.includes('--dry')
if (!RESULT) { console.error('need result.json'); process.exit(1) }
const data = JSON.parse(fs.readFileSync(RESULT, 'utf8')).filter(Boolean)

let applied = 0, skippedNF = 0, skippedDup = 0, noop = 0, filesChanged = 0
const log = []
for (const rec of data) {
  if (!rec.edits || !rec.edits.length) continue
  const abs = path.join(REPO, rec.file.replace(/\//g, path.sep))
  if (!fs.existsSync(abs)) { log.push(`MISSING ${rec.file}`); continue }
  let text = fs.readFileSync(abs, 'utf8')
  let changed = false
  for (const ed of rec.edits) {
    // Enforce PLAIN TEXT (no bold): strip any ** the agent may have added around terms,
    // and drop any hallucinated closing tags. Keep replace as plain prose.
    ed.replace = ed.replace.replace(/\*\*/g, '').replace(/<\/?\w+>/g, '')
    if (ed.find === ed.replace) { noop++; continue }
    const n = text.split(ed.find).length - 1
    if (n === 0) { skippedNF++; log.push(`NOTFOUND [${ed.term}] ${rec.file} :: ${ed.find.slice(0, 60)}`); continue }
    if (n > 1) { skippedDup++; log.push(`DUP(${n}) [${ed.term}] ${rec.file} :: ${ed.find.slice(0, 60)}`); continue }
    text = text.replace(ed.find, ed.replace)
    applied++; changed = true
    log.push(`OK [${ed.term}] ${rec.file}`)
  }
  if (changed) { filesChanged++; if (!DRY) fs.writeFileSync(abs, text, 'utf8') }
}
console.log(`DRY=${DRY} | applied=${applied} filesChanged=${filesChanged} noop=${noop} skippedNotFound=${skippedNF} skippedDup=${skippedDup}`)
log.forEach((l) => console.log('  ' + l))
fs.writeFileSync(path.join(REPO, '.artifacts', 'interview-audit', 'mount-scripts', '_dichep-apply-log.txt'), log.join('\n'), 'utf8')
