// Read-only preview of what migrate-to-bodies.js would produce for one question dir.
//   node preview-migrate.js <questionDirRelativeToDataRoot>
const fs = require('fs')
const path = require('path')

const DATA = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data'
const SEP = '<!-- @starci/seperator -->'
const MOVE = ['prompt', 'givenCode', 'idealAnswer']

const blockRe = (f) => new RegExp(`^# ${f}\\r?\\n${SEP}\\r?\\n([\\s\\S]*?)\\r?\\n${SEP}\\r?\\n?`, 'm')
const readField = (t, f) => (t.match(blockRe(f)) || [null, null])[1]
const dropField = (t, f) => t.replace(blockRe(f), '')
const render = (f, v, eol) => `# ${f}${eol}${SEP}${eol}${v}${eol}${SEP}${eol}`
const heads = (t) => (t.match(new RegExp(`^# ([a-zA-Z][a-zA-Z0-9]*)\\r?\\n(?:${SEP}|## \\d)`, 'gm')) || [])
    .map((s) => s.split('\n')[0].replace('# ', '').trim())

const dir = path.join(DATA, process.argv[2])
const text = fs.readFileSync(path.join(dir, 'en.md'), 'utf8')
const eol = text.includes('\r\n') ? '\r\n' : '\n'
const givenLang = (readField(text, 'givenLang') || '').trim()
const lang = givenLang || 'agnostic'

let body = render('lang', lang, eol)
for (const f of MOVE) {
    const v = readField(text, f)
    if (v !== null) body += render(f, v, eol)
}
let root = text
for (const f of [...MOVE, 'givenLang']) root = dropField(root, f)

console.log('=== ' + process.argv[2] + ' ===')
console.log('root TRUOC :', heads(text).join(' '))
console.log('root SAU   :', heads(root).join(' '))
console.log('body folder: bodies/0-' + lang + '/')
console.log('body fields:', heads(body).join(' '))
console.log('\n--- body en.md (250 ky tu dau) ---')
console.log(body.slice(0, 250))
console.log('\n--- root sau, vung noi (tags -> field ke tiep) ---')
const i = root.indexOf('# tags')
console.log(root.slice(i, i + 160))
