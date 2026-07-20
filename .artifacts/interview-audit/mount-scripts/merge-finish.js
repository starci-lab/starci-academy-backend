// ============================================================================
// MERGE mount-finish-salvage.js output vao .mount (node script THUONG qua Bash).
//
// Nguon du lieu moi cau (idx -> fields):
//   - prompt / givenCode / givenLang:
//       * salvage idx: doc tu _salvage_write.json (pristine, KHONG qua agent).
//       * full idx:    doc tu ket qua workflow (rec.prompt/givenCode/givenLang).
//   - checklist (mang rubric items) + examples (5 muc {level,text,sonnet,haiku}):
//       tu ket qua workflow (RESULT_FILES).
//   - viPrompt (prompt tieng Viet cho vi.md): tu _viprompt.json (idx -> string),
//       sinh boi pass dich EN->VI. Bat buoc co (thay da chot chuan 477).
//
// GHI (theo convention nhom 477 da xong):
//   en.md: # prompt(EN) # givenCode # givenLang # rubric(giu) # checklist(EN) # exampleResults(EN)
//   vi.md: # prompt(VI) # givenCode # givenLang # rubric(giu) # checklist(EN) # exampleResults(EN)
//   (checklist + exampleResults GIU ENGLISH o CA HAI file - dung nhu 477.)
//
// CACH DUNG:
//   node merge-finish.js --dry   (kiem tra truoc)
//   node merge-finish.js         (ghi that)
// ============================================================================
const fs = require('fs')
const path = require('path')

const REPO = 'C:\\Repositories\\ac\\starci-academy-backend'
const MS = path.join(REPO, '.artifacts', 'interview-audit', 'mount-scripts')
const DATA = path.join(REPO, '.mount', 'data')
const TODO = JSON.parse(fs.readFileSync(path.join(MS, '_mount_todo_705_skipped.json'), 'utf8'))
const SALVAGE = JSON.parse(fs.readFileSync(path.join(MS, '_salvage_write.json'), 'utf8'))
const SAL_BY_IDX = Object.fromEntries(SALVAGE.map((e) => [e.idx, e]))
const SEP = '<!-- @starci/seperator -->'

// >>> ket qua workflow da gop + dedupe (228 cau valid: {idx,source,checklist,examples,...}) <<<
const RESULT_FILES = [
  path.join(MS, 'results_final_valid.json'),
]
// idx -> vietnamese prompt (pass dich EN->VI)
const VIPROMPT = fs.existsSync(path.join(MS, '_viprompt.json')) ? JSON.parse(fs.readFileSync(path.join(MS, '_viprompt.json'), 'utf8')) : {}

const DRY_RUN = process.argv[2] === '--dry'
const all = RESULT_FILES.filter((f) => fs.existsSync(f)).flatMap((f) => JSON.parse(fs.readFileSync(f, 'utf8'))).filter(Boolean)

function promptBlock(promptText, code, lang) {
  return `# prompt\r\n${SEP}\r\n${promptText}\r\n${SEP}\r\n# givenCode\r\n${SEP}\r\n${code}\r\n${SEP}\r\n# givenLang\r\n${SEP}\r\n${lang}\r\n${SEP}\r\n# rubric`
}
function checklistBlock(rec) {
  const cpLines = rec.checklist.map((c, i) => `## ${i}\r\n${SEP}\r\n${c}\r\n${SEP}`).join('\r\n')
  const examplesJson = JSON.stringify(rec.examples.map((e) => ({ level: e.level, answer: e.text, sonnet: e.sonnet, haiku: e.haiku })))
  return `# checklist\r\n${cpLines}\r\n\r\n# exampleResults\r\n${SEP}\r\n${examplesJson}\r\n${SEP}\r\n\r\n# followUps`
}

const report = { matched: [], noRecord: [], noSource: [], noViPrompt: [], alreadyHas: [], noRubricHeading: [], dupIdx: [] }
const seen = new Set()

for (const rec of all) {
  if (seen.has(rec.idx)) { report.dupIdx.push(rec.idx); continue }
  seen.add(rec.idx)
  const todoItem = TODO[rec.idx]
  if (!todoItem) { report.noRecord.push(rec.idx); continue }
  const folder = todoItem.folder

  // source of prompt/givenCode/givenLang
  let prompt, code, lang
  if (rec.source === 'full' && rec.prompt) { prompt = rec.prompt; code = rec.givenCode; lang = rec.givenLang }
  else if (SAL_BY_IDX[rec.idx]) { const s = SAL_BY_IDX[rec.idx]; prompt = s.prompt; code = s.givenCode; lang = s.givenLang }
  else { report.noSource.push(rec.idx); continue }

  const viPrompt = VIPROMPT[rec.idx]
  if (!viPrompt) { report.noViPrompt.push(rec.idx); continue }

  const enPath = path.join(DATA, folder, 'en.md')
  const viPath = path.join(DATA, folder, 'vi.md')
  const enText = fs.readFileSync(enPath, 'utf8')
  const viText = fs.readFileSync(viPath, 'utf8')
  if (enText.includes('# prompt') || enText.includes('# checklist')) { report.alreadyHas.push(folder); continue }
  if (!enText.includes('# rubric') || !enText.includes('# followUps') || !viText.includes('# rubric') || !viText.includes('# followUps')) {
    report.noRubricHeading.push(folder); continue
  }

  const cb = checklistBlock(rec)
  const newEn = enText.replace('# rubric', promptBlock(prompt, code, lang)).replace('# followUps', cb)
  const newVi = viText.replace('# rubric', promptBlock(viPrompt, code, lang)).replace('# followUps', cb)

  if (!DRY_RUN) {
    fs.writeFileSync(enPath, newEn, 'utf8')
    fs.writeFileSync(viPath, newVi, 'utf8')
  }
  report.matched.push(folder)
}

console.log('DRY_RUN:', DRY_RUN)
console.log('total result recs:', all.length, '| unique idx:', seen.size)
console.log('matched (written):', report.matched.length)
console.log('noRecord (idx not in todo):', report.noRecord)
console.log('noSource (no prompt/givenCode):', report.noSource)
console.log('noViPrompt (missing vi translation):', report.noViPrompt)
console.log('alreadyHas (skipped):', report.alreadyHas.length)
console.log('noRubricHeading (structural mismatch):', JSON.stringify(report.noRubricHeading))
console.log('dupIdx:', report.dupIdx)
fs.writeFileSync(path.join(MS, '_merge-finish-report.json'), JSON.stringify(report, null, 2), 'utf8')
