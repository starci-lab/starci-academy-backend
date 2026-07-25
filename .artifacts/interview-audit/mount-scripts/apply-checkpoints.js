// ============================================================================
// Rewrite `# checklist` into the nested DSL, folding in the classifier's output.
//
//   # checklist
//   ## 0
//   ### text        <sep> … <sep>
//   ### dimension   <sep> technical <sep>
//   ### critical    <sep> true <sep>
//   ### scoreBand   <sep> 25 <sep>
//
// scoreBand is computed HERE, not asked of the model: a question's bands must total
// exactly 100, and that invariant is cheaper and safer to guarantee in code than to
// validate-and-retry against a model. A critical checkpoint is worth 1.5x a normal one;
// bands are floored, and the leftover from rounding lands on the largest band so the sum
// is exactly 100 by construction.
//
//   node apply-checkpoints.js <classified.json> --dry
//   node apply-checkpoints.js <classified.json>
// ============================================================================
const fs = require('fs')
const path = require('path')

const DATA = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data'
const SEP = '<!-- @starci/seperator -->'
const RESULT = process.argv[2]
const DRY = process.argv[3] === '--dry'

const CRITICAL_MULTIPLIER = 1.5

/** Splits 100 points across the checkpoints, weighting critical ones higher. */
function scoreBands(checkpoints) {
    const weights = checkpoints.map((c) => (c.critical ? CRITICAL_MULTIPLIER : 1))
    const total = weights.reduce((sum, w) => sum + w, 0)
    const bands = weights.map((w) => Math.floor((w / total) * 100))
    // Flooring leaves 0..n-1 points unallocated. Spread them one each across the
    // checkpoints with the largest fractional part (critical ones first on a tie), rather
    // than repeatedly topping up whichever band is currently biggest — that would pile the
    // whole remainder onto a single checkpoint and make it outweigh its equally-critical
    // peers for no authored reason.
    let remainder = 100 - bands.reduce((sum, b) => sum + b, 0)
    const order = weights
        .map((w, index) => ({
            index,
            fraction: (w / total) * 100 - Math.floor((w / total) * 100),
            weight: w,
        }))
        .sort((left, right) => (right.fraction - left.fraction) || (right.weight - left.weight))
    for (let i = 0; remainder > 0; i++, remainder--) {
        bands[order[i % order.length].index] += 1
    }
    return bands
}

/** Reads the `# checklist` block's `## N` values (separator-anchored, code-safe). */
function readChecklist(text) {
    const block = text.match(
        new RegExp(`^# checklist\\r?\\n([\\s\\S]*?)(?=^# [a-zA-Z][a-zA-Z0-9]*\\r?\\n(?:${SEP}|## \\d))`, 'm'),
    )
    if (!block) return null
    return [...block[1].matchAll(new RegExp(`${SEP}\\s*\\n([\\s\\S]*?)\\n${SEP}`, 'g'))].map((m) => m[1].trim())
}

function renderChecklist(rows, eol) {
    const body = rows.map((row, index) => [
        `## ${index}`,
        `### text`, SEP, row.text, SEP,
        `### dimension`, SEP, row.dimension, SEP,
        `### critical`, SEP, String(row.critical), SEP,
        `### scoreBand`, SEP, String(row.scoreBand), SEP,
    ].join(eol)).join(eol)
    return `# checklist${eol}${body}${eol}`
}

const CHECKLIST_BLOCK = new RegExp(
    `^# checklist\\r?\\n[\\s\\S]*?(?=^# [a-zA-Z][a-zA-Z0-9]*\\r?\\n(?:${SEP}|## \\d))`, 'm',
)

const byFolder = new Map()
for (const batch of JSON.parse(fs.readFileSync(RESULT, 'utf8')).filter(Boolean)) {
    for (const q of batch.questions ?? []) byFolder.set(q.folder, q.checkpoints)
}

const report = { written: [], countMismatch: [], noBlock: [], missing: [], sums: new Set() }

for (const [folder, labels] of byFolder) {
    const enPath = path.join(DATA, folder, 'en.md')
    if (!fs.existsSync(enPath)) { report.missing.push(folder); continue }
    const enText = fs.readFileSync(enPath, 'utf8')
    const texts = readChecklist(enText)
    if (!texts) { report.noBlock.push(folder); continue }
    // the classifier must return one label per checkpoint, in order — anything else and we
    // cannot trust the alignment, so skip rather than mislabel
    if (texts.length !== labels.length) {
        report.countMismatch.push(`${folder} (${texts.length} vs ${labels.length})`)
        continue
    }

    const bands = scoreBands(labels)
    const rows = texts.map((text, i) => ({
        text,
        dimension: labels[i].dimension,
        critical: labels[i].critical,
        scoreBand: bands[i],
    }))
    report.sums.add(bands.reduce((a, b) => a + b, 0))

    let touched = false
    for (const file of ['en.md', 'vi.md']) {
        const p = path.join(DATA, folder, file)
        if (!fs.existsSync(p)) continue
        const before = fs.readFileSync(p, 'utf8')
        if (!CHECKLIST_BLOCK.test(before)) continue
        const eol = before.includes('\r\n') ? '\r\n' : '\n'
        const after = before.replace(CHECKLIST_BLOCK, renderChecklist(rows, eol))
        if (after !== before) {
            if (!DRY) fs.writeFileSync(p, after, 'utf8')
            touched = true
        }
    }
    if (touched) report.written.push(folder)
}

console.log('DRY:', DRY)
console.log('classified questions:', byFolder.size)
console.log('written:', report.written.length)
console.log('count mismatch (SKIPPED):', report.countMismatch.length, report.countMismatch.slice(0, 5))
console.log('no # checklist block:', report.noBlock.length)
console.log('missing en.md:', report.missing.length)
console.log('distinct scoreBand sums (must be exactly {100}):', [...report.sums])
