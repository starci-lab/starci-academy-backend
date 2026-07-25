// ============================================================================
// CA B step 1 — remove the root-level # prompt / # givenCode / # givenLang that were
// written by mistake onto the 228 debug/review/optimize questions.
//
// Those questions carry the REAL content per language under bodies/<lang>/ (prompt +
// givenCode + idealAnswer, all 4 langs, authored before this session). The root is meant
// to be the agnostic fallback and stay EMPTY for a full-4-body code question — the parser
// maps a missing root prompt to "" (toRequiredString(merged.prompt, "")) and leaves
// givenCode/givenLang null, so stripping them is safe for seeding.
//
// Only touches the 228 question ROOT en.md/vi.md. Never descends into bodies/.
//
//   node strip-root-fields.js --dry
//   node strip-root-fields.js
// ============================================================================
const fs = require('fs')
const path = require('path')

const REPO = 'C:\\Repositories\\ac\\starci-academy-backend'
const MS = path.join(REPO, '.artifacts', 'interview-audit', 'mount-scripts')
const DATA = path.join(REPO, '.mount', 'data')
const TODO = JSON.parse(fs.readFileSync(path.join(MS, '_mount_todo_705_skipped.json'), 'utf8'))
const DRY = process.argv[2] === '--dry'
const FIELDS = ['prompt', 'givenCode', 'givenLang']

// Matches "# field\n<sep>\n ...body... \n<sep>\n" including the trailing newline.
function stripField(text, field) {
    const re = new RegExp(
        `^# ${field}\\r?\\n<!-- @starci/seperator -->\\r?\\n[\\s\\S]*?\\r?\\n<!-- @starci/seperator -->\\r?\\n`,
        'm',
    )
    return text.replace(re, '')
}

const report = { changed: [], noBodies: [], missingFile: [], unchanged: [] }

for (const entry of TODO) {
    const dir = path.join(DATA, entry.folder)
    // guard: only strip where the real content genuinely lives in bodies/
    if (!fs.existsSync(path.join(dir, 'bodies'))) { report.noBodies.push(entry.folder); continue }

    let touched = false
    for (const file of ['en.md', 'vi.md']) {
        const p = path.join(dir, file)
        if (!fs.existsSync(p)) { report.missingFile.push(`${entry.folder}/${file}`); continue }
        const before = fs.readFileSync(p, 'utf8')
        let after = before
        for (const f of FIELDS) after = stripField(after, f)
        if (after !== before) {
            if (!DRY) fs.writeFileSync(p, after, 'utf8')
            touched = true
        }
    }
    (touched ? report.changed : report.unchanged).push(entry.folder)
}

console.log('DRY:', DRY)
console.log('changed:', report.changed.length)
console.log('unchanged (nothing to strip):', report.unchanged.length)
console.log('noBodies (SKIPPED - would have been unsafe):', report.noBodies.length, report.noBodies.slice(0, 5))
console.log('missingFile:', report.missingFile.length, report.missingFile.slice(0, 5))
