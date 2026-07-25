// ============================================================================
// CA A — move the flat mock-interview questions' content down into bodies/<N>-<lang>/,
// mirroring how lesson content authors `bodies/0-agnostic/` and how the 228 code
// questions already author `bodies/{0-typescript,1-java,2-csharp,3-go}/`.
//
// MOVED into the body:  # prompt, # givenCode, # idealAnswer  (+ a new # lang)
// STAYS at the root:    sortIndex isPremium family tier kind tags diagram
//                       rubric|rubricByTier checklist exampleResults followUps hints keywords
//
// The body's `# lang` carries the code language so the FE can still syntax-highlight:
//   - a question with # givenLang  -> folder 0-<givenLang> (hcl / yaml / typescript / ...)
//   - a question without code      -> folder 0-agnostic
// The root's # givenLang field is consumed by that (bodies carry `lang`, not `givenLang`).
// Either way the question ends up with exactly ONE body, which the draw treats as
// "language fixed by the question, always eligible" (see the draw service spec).
//
// PARSING SAFETY: question content embeds shell/YAML/Terraform comment lines that look
// exactly like DSL headings (`# NAME  ENDPOINTS  AGE`). A real field heading is always
// followed immediately by the separator, so anchor on that — never on `^# \w+` alone.
//
//   node migrate-to-bodies.js --dry
//   node migrate-to-bodies.js
// ============================================================================
const fs = require('fs')
const path = require('path')

const REPO = 'C:\\Repositories\\ac\\starci-academy-backend'
const DATA = path.join(REPO, '.mount', 'data')
const SEP = '<!-- @starci/seperator -->'
const DRY = process.argv[2] === '--dry'

const MOVE = ['prompt', 'givenCode', 'idealAnswer']

/** Matches one single-value field block: `# name` + separator + body + separator. */
function blockRe(field) {
    return new RegExp(
        `^# ${field}\\r?\\n${SEP}\\r?\\n([\\s\\S]*?)\\r?\\n${SEP}\\r?\\n?`,
        'm',
    )
}

/** Reads a single-value field's inner text, or null when the field is absent. */
function readField(text, field) {
    const match = text.match(blockRe(field))
    return match ? match[1] : null
}

/** Drops a single-value field block from the text. */
function dropField(text, field) {
    return text.replace(blockRe(field), '')
}

/** Renders one single-value field block. */
function renderField(field, value, eol) {
    return `# ${field}${eol}${SEP}${eol}${value}${eol}${SEP}${eol}`
}

function walkQuestionDirs() {
    const out = []
    for (const course of fs.readdirSync(path.join(DATA, 'courses'))) {
        const banks = path.join(DATA, 'courses', course, 'mock-interview')
        if (!fs.existsSync(banks)) continue
        for (const bank of fs.readdirSync(banks)) {
            const questions = path.join(banks, bank, 'questions')
            if (!fs.existsSync(questions)) continue
            for (const q of fs.readdirSync(questions)) {
                const dir = path.join(questions, q)
                if (fs.statSync(dir).isDirectory()) out.push(dir)
            }
        }
    }
    return out
}

const report = {
    moved: [], skippedHasBodies: [], skippedNoPrompt: [], langs: {},
}

for (const dir of walkQuestionDirs()) {
    if (fs.existsSync(path.join(dir, 'bodies'))) { report.skippedHasBodies.push(dir); continue }

    const enPath = path.join(dir, 'en.md')
    if (!fs.existsSync(enPath)) continue
    const enText = fs.readFileSync(enPath, 'utf8')
    if (readField(enText, 'prompt') === null) { report.skippedNoPrompt.push(dir); continue }

    // the language label is authored once (en side) and shared by both locales
    const givenLang = (readField(enText, 'givenLang') || '').trim()
    const lang = givenLang || 'agnostic'
    const folder = `0-${lang}`
    report.langs[lang] = (report.langs[lang] || 0) + 1

    for (const file of ['en.md', 'vi.md']) {
        const p = path.join(dir, file)
        if (!fs.existsSync(p)) continue
        const text = fs.readFileSync(p, 'utf8')
        const eol = text.includes('\r\n') ? '\r\n' : '\n'

        // body: # lang first, then the moved fields in the 4-track body's order
        let body = renderField('lang', lang, eol)
        for (const field of MOVE) {
            const value = readField(text, field)
            if (value !== null) body += renderField(field, value, eol)
        }

        // root: drop everything that moved, plus the now-redundant givenLang
        let root = text
        for (const field of [...MOVE, 'givenLang']) root = dropField(root, field)

        if (!DRY) {
            const bodyDir = path.join(dir, 'bodies', folder)
            fs.mkdirSync(bodyDir, { recursive: true })
            fs.writeFileSync(path.join(bodyDir, file), body, 'utf8')
            fs.writeFileSync(p, root, 'utf8')
        }
    }
    report.moved.push(dir)
}

console.log('DRY:', DRY)
console.log('moved:', report.moved.length)
console.log('skipped (already has bodies/):', report.skippedHasBodies.length)
console.log('skipped (no # prompt):', report.skippedNoPrompt.length, report.skippedNoPrompt.slice(0, 5))
console.log('body folder distribution:')
for (const [lang, n] of Object.entries(report.langs).sort((a, b) => b[1] - a[1])) {
    console.log(`  0-${lang}: ${n}`)
}
