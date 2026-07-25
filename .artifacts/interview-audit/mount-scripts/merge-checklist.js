// ============================================================================
// CA B step 2 (apply) — replace the # checklist block on the 228 questions with the
// rebuilt one (mount-rebuild-checklist.js output).
//
// The old block was a verbatim copy of # rubric (grading-criteria genre + [technical]
// tags) derived from a prompt that was authored by mistake at the question root. The new
// one is coverage-checkpoint genre, grounded in the REAL bodies/<lang> content.
//
// Written to BOTH en.md and vi.md in English — matching the existing convention
// (# checklist / # exampleResults stay English in both locales; only # prompt is
// translated).
//
//   node merge-checklist.js <result.json> --dry
//   node merge-checklist.js <result.json>
// ============================================================================
const fs = require('fs')
const path = require('path')

const REPO = 'C:\\Repositories\\ac\\starci-academy-backend'
const DATA = path.join(REPO, '.mount', 'data')
const SEP = '<!-- @starci/seperator -->'

const RESULT = process.argv[2]
const DRY = process.argv[3] === '--dry'
const records = JSON.parse(fs.readFileSync(RESULT, 'utf8')).filter(Boolean)

/** Renders the checklist items as the `## N` + separator block the schema uses. */
function renderChecklist(items) {
    const body = items.map((item, index) => `## ${index}\r\n${SEP}\r\n${item}\r\n${SEP}`).join('\r\n')
    return `# checklist\r\n${body}\r\n`
}

// Replaces "# checklist ... " up to (not including) the next top-level "# field" heading.
const CHECKLIST_BLOCK = /^# checklist\r?\n[\s\S]*?(?=^# [a-zA-Z])/m

const report = { changed: [], noChecklist: [], missing: [], empty: [] }

for (const rec of records) {
    if (!Array.isArray(rec.checklist) || rec.checklist.length < 3) { report.empty.push(rec.idx); continue }
    const block = renderChecklist(rec.checklist)
    let touched = false
    for (const file of ['en.md', 'vi.md']) {
        const p = path.join(DATA, rec.folder, file)
        if (!fs.existsSync(p)) { report.missing.push(`${rec.folder}/${file}`); continue }
        const before = fs.readFileSync(p, 'utf8')
        if (!CHECKLIST_BLOCK.test(before)) { report.noChecklist.push(`${rec.folder}/${file}`); continue }
        const after = before.replace(CHECKLIST_BLOCK, block)
        if (after !== before) {
            if (!DRY) fs.writeFileSync(p, after, 'utf8')
            touched = true
        }
    }
    if (touched) report.changed.push(rec.folder)
}

console.log('DRY:', DRY)
console.log('records:', records.length)
console.log('changed:', report.changed.length)
console.log('empty/too-short checklist (SKIPPED):', report.empty.length, report.empty.slice(0, 10))
console.log('no # checklist block found:', report.noChecklist.length, report.noChecklist.slice(0, 5))
console.log('missing file:', report.missing.length, report.missing.slice(0, 5))
