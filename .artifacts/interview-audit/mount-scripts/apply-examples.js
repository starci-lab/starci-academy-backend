// ============================================================================
// Rewrite `# exampleResults` for the 228 questions whose old ones answered a fabricated
// prompt/givenCode.
//
// The score is NOT taken from the model. Each answer was written to cover a specific set
// of checkpoints (decided in build_example_inputs.py), so the score is recomputed here
// from those checkpoints' bands using the same rule the grader applies at runtime —
// sum the covered bands, cap at 60 when a critical one was missed. Text and score
// therefore cannot disagree, which is exactly what the previous pipeline got wrong.
//
//   node apply-examples.js <written.json> --dry
//   node apply-examples.js <written.json>
// ============================================================================
const fs = require('fs')
const path = require('path')

const REPO = 'C:\\Repositories\\ac\\starci-academy-backend'
const MS = path.join(REPO, '.artifacts', 'interview-audit', 'mount-scripts')
const DATA = path.join(REPO, '.mount', 'data')
const SEP = '<!-- @starci/seperator -->'
const CRITICAL_MISS_SCORE_CAP = 60

const RESULT = process.argv[2]
const DRY = process.argv[3] === '--dry'

/** Reads the nested `# checklist` block back into structured checkpoints. */
function checkpointsOf(text) {
    const block = text.match(
        new RegExp(`^# checklist\\r?\\n([\\s\\S]*?)(?=^# [a-zA-Z][a-zA-Z0-9]*\\r?\\n(?:${SEP}|## \\d))`, 'm'),
    )
    if (!block) return []
    return block[1].split(/^## \d+\s*$/m).slice(1).map((chunk) => {
        const field = (name) => {
            const m = chunk.match(new RegExp(`### ${name}\\r?\\n${SEP}\\r?\\n([\\s\\S]*?)\\r?\\n${SEP}`))
            return m ? m[1].trim() : null
        }
        return {
            critical: field('critical') === 'true',
            scoreBand: Number(field('scoreBand') ?? 0),
        }
    })
}

/** Same arithmetic as MockInterviewGradingService.scoreFromCheckpoints. */
function scoreFor(points, covered) {
    const hit = new Set(covered.filter((i) => i >= 0 && i < points.length))
    const raw = points.reduce((sum, p, i) => (hit.has(i) ? sum + p.scoreBand : sum), 0)
    const missedCritical = points.some((p, i) => p.critical && !hit.has(i))
    return Math.max(0, Math.min(100, missedCritical ? Math.min(raw, CRITICAL_MISS_SCORE_CAP) : raw))
}

const EXAMPLES_BLOCK = new RegExp(
    `^# exampleResults\\r?\\n[\\s\\S]*?(?=^# [a-zA-Z][a-zA-Z0-9]*\\r?\\n(?:${SEP}|## \\d))`, 'm',
)

// coverage decided at build time — keyed by folder
const coverageByFolder = new Map()
for (const f of fs.readdirSync(path.join(MS, '_example_inputs'))) {
    const item = JSON.parse(fs.readFileSync(path.join(MS, '_example_inputs', f), 'utf8'))
    coverageByFolder.set(item.folder, item.coverage)
}

const written = new Map()
for (const batch of JSON.parse(fs.readFileSync(RESULT, 'utf8')).filter(Boolean)) {
    for (const q of batch.questions ?? []) written.set(q.folder, q.answers)
}

const report = { ok: [], badCount: [], noCoverage: [], noBlock: [], nonMonotonic: [], vietnamese: [] }
const VN = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỹ]/gi

for (const [folder, answers] of written) {
    if (!Array.isArray(answers) || answers.length !== 5) { report.badCount.push(folder); continue }
    const coverage = coverageByFolder.get(folder)
    if (!coverage) { report.noCoverage.push(folder); continue }

    const enPath = path.join(DATA, folder, 'en.md')
    const enText = fs.readFileSync(enPath, 'utf8')
    const points = checkpointsOf(enText)
    if (points.length === 0) { report.noBlock.push(folder); continue }

    const scores = coverage.map((covered) => scoreFor(points, covered))
    if (scores.some((s, i) => i > 0 && s > scores[i - 1])) { report.nonMonotonic.push(folder); continue }
    if (answers.some((a) => (a.match(VN) ?? []).length > 5)) { report.vietnamese.push(folder); continue }

    const rows = answers.map((answer, i) => ({
        level: i + 1,
        answer: answer.trim(),
        sonnet: scores[i],
        haiku: scores[i],
    }))

    for (const file of ['en.md', 'vi.md']) {
        const p = path.join(DATA, folder, file)
        if (!fs.existsSync(p)) continue
        const before = fs.readFileSync(p, 'utf8')
        if (!EXAMPLES_BLOCK.test(before)) continue
        const eol = before.includes('\r\n') ? '\r\n' : '\n'
        const block = `# exampleResults${eol}${SEP}${eol}${JSON.stringify(rows)}${eol}${SEP}${eol}${eol}`
        const after = before.replace(EXAMPLES_BLOCK, block)
        if (after !== before && !DRY) fs.writeFileSync(p, after, 'utf8')
    }
    report.ok.push(folder)
}

console.log('DRY:', DRY)
console.log('written by model:', written.size)
console.log('applied:', report.ok.length)
console.log('answers !== 5 (SKIPPED):', report.badCount.length, report.badCount.slice(0, 3))
console.log('no coverage on file:', report.noCoverage.length)
console.log('no checklist block:', report.noBlock.length)
console.log('non-monotonic ladder (SKIPPED):', report.nonMonotonic.length, report.nonMonotonic.slice(0, 3))
console.log('Vietnamese leaked into answers (SKIPPED):', report.vietnamese.length, report.vietnamese.slice(0, 3))
