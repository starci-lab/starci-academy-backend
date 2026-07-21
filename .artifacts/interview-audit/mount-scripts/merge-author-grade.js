// ============================================================================
// MERGE mount-author-and-grade.js output vao .mount (node script THUONG, chay qua Bash,
// KHONG phai Workflow script - can fs/path that).
//
// CACH DUNG:
//   1. Chay xong Workflow mount-author-and-grade.js, luu KET QUA (mang tra ve tu `result`)
//      thanh 1 file JSON, vd .artifacts/interview-audit/mount-scripts/results_0-113.json
//      (mang cac object {idx, prompt, givenCode, givenLang, checklist, examples, coherent}).
//   2. Sua RESULT_FILES ben duoi tro dung (P)cac file ket qua da luu.
//   3. Chay: node merge-author-grade.js --dry   (kiem tra truoc)
//            node merge-author-grade.js          (ghi that)
//
// Field order chen vao (theo README bank, file hien tai chi co
//   sortIndex/isPremium/family/tier/kind/tags/rubric/followUps/hints/keywords):
//   # tags -> [CHEN: # prompt -> # givenCode -> # givenLang] -> # rubric (giu nguyen)
//   -> [CHEN: # checklist -> # exampleResults] -> # followUps
// ============================================================================
const fs = require('fs')
const path = require('path')

const REPO = 'C:\\Repositories\\ac\\starci-academy-backend'
const DATA = path.join(REPO, '.mount', 'data')
const TODO = JSON.parse(fs.readFileSync(path.join(REPO, '.artifacts', 'interview-audit', 'mount-scripts', '_mount_todo_705_skipped.json'), 'utf8'))
const SEP = '<!-- @starci/seperator -->'

// >>> SUA DANH SACH NAY cho khop file ket qua da luu <<<
const RESULT_FILES = [
  // path.join(REPO, '.artifacts', 'interview-audit', 'mount-scripts', 'results_0-113.json'),
  // path.join(REPO, '.artifacts', 'interview-audit', 'mount-scripts', 'results_114-227.json'),
]

const DRY_RUN = process.argv[2] === '--dry'
const all = RESULT_FILES.flatMap((f) => JSON.parse(fs.readFileSync(f, 'utf8'))).filter(Boolean)

function buildPromptBlock(rec) {
  return `# prompt\r\n${SEP}\r\n${rec.prompt}\r\n${SEP}\r\n# givenCode\r\n${SEP}\r\n${rec.givenCode}\r\n${SEP}\r\n# givenLang\r\n${SEP}\r\n${rec.givenLang}\r\n${SEP}\r\n# rubric`
}
function buildChecklistBlock(rec) {
  const cpLines = rec.checklist.map((c, i) => `## ${i}\r\n${SEP}\r\n${c}\r\n${SEP}`).join('\r\n')
  const examplesJson = JSON.stringify(rec.examples.map((e) => ({ level: e.level, answer: e.text, sonnet: e.sonnet, haiku: e.haiku })))
  return `# checklist\r\n${cpLines}\r\n\r\n# exampleResults\r\n${SEP}\r\n${examplesJson}\r\n${SEP}\r\n\r\n# followUps`
}

const report = { matched: [], noRecord: [], alreadyHas: [], noRubricHeading: [] }

for (const rec of all) {
  const todoItem = TODO[rec.idx]
  if (!todoItem) { report.noRecord.push(rec.idx); continue }
  const folder = todoItem.folder

  const enPath = path.join(DATA, folder, 'en.md')
  const viPath = path.join(DATA, folder, 'vi.md')
  let enText = fs.readFileSync(enPath, 'utf8')
  let viText = fs.readFileSync(viPath, 'utf8')
  if (enText.includes('# prompt') || enText.includes('# checklist')) { report.alreadyHas.push(folder); continue }
  if (!enText.includes('# rubric') || !enText.includes('# followUps') || !viText.includes('# rubric') || !viText.includes('# followUps')) {
    report.noRubricHeading.push(folder); continue
  }

  const promptBlock = buildPromptBlock(rec)
  const checklistBlock = buildChecklistBlock(rec)
  // insert prompt+givenCode+givenLang BEFORE "# rubric", then checklist+exampleResults
  // AFTER the rubric section (i.e. right before "# followUps").
  const newEn = enText.replace('# rubric', promptBlock).replace('# followUps', checklistBlock)
  const newVi = viText.replace('# rubric', promptBlock).replace('# followUps', checklistBlock)

  if (!DRY_RUN) {
    fs.writeFileSync(enPath, newEn, 'utf8')
    fs.writeFileSync(viPath, newVi, 'utf8')
  }
  report.matched.push(folder)
}

console.log('matched (written):', report.matched.length)
console.log('noRecord (idx not in todo list, PROBLEM):', report.noRecord)
console.log('alreadyHas (skipped, already has prompt/checklist):', report.alreadyHas.length)
console.log('noRubricHeading (PROBLEM - structural mismatch):', JSON.stringify(report.noRubricHeading))
fs.writeFileSync(path.join(REPO, '.artifacts', 'interview-audit', 'mount-scripts', '_merge-author-grade-report.json'), JSON.stringify(report, null, 2), 'utf8')
