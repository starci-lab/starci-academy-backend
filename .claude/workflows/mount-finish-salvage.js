// ============================================================================
// MOUNT FINISH (SALVAGE) — hoan tat 228 cau debug/review/optimize THIEU prompt+givenCode
// ============================================================================
// KHAC voi mount-author-and-grade.js (chay lai TU DAU): script nay TAN DUNG cache.
// 198/228 cau da co san prompt+givenCode (Opus brief + Sonnet write da chay o 2 run cu
// wf_379053a1 / wf_5b35739d, harvest ra _salvage_write.json) -> CHI can answer+grade.
// 30 cau con lai (khong salvage duoc) -> full pipeline brief->write->answer->grade.
//
// args = { salvage: [ {idx,prompt,givenCode,givenLang,folder,course,kind,bank}, ... ],
//          full:    [ {idx,folder,course,kind,bank}, ... ] }
//   - salvage[]: answer+grade only (prompt/givenCode INLINE tu args, khong doc lai).
//   - full[]:    brief(Opus)->write(Sonnet)->answer->grade.
// Ket qua: mang {idx, source, prompt, givenCode, givenLang, checklist, examples, coherent}.
// Merge bang merge-author-grade.js (doc mang nay). Chia batch nho de tranh session-limit.
// ============================================================================
export const meta = {
  name: 'mount-finish-salvage',
  description: 'Finish 228 debug/review/optimize questions: salvaged (answer+grade only) + missing (full pipeline)',
  phases: [
    { title: 'Brief', detail: 'Opus reverse-engineers scenario/code (full-pipeline items only)' },
    { title: 'Write', detail: 'Sonnet writes prompt+givenCode (full-pipeline items only)' },
    { title: 'Answer+Grade', detail: '5 leveled answers, Sonnet+Haiku batch-grade vs rubric' },
  ],
}

const ROOT = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\'
const SALVAGE_DIR = 'C:\\Repositories\\ac\\starci-academy-backend\\.artifacts\\interview-audit\\mount-scripts\\_salvage\\'
const enPath = (folder) => ROOT + folder.replace(/\//g, '\\') + '\\en.md'
const salPath = (idx) => SALVAGE_DIR + 'idx_' + idx + '.json'

const BRIEF = { type: 'object', properties: { scenario: { type: 'string' }, codeOutline: { type: 'string' }, language: { type: 'string' } }, required: ['scenario', 'codeOutline', 'language'], additionalProperties: false }
const WRITE = { type: 'object', properties: { prompt: { type: 'string' }, givenCode: { type: 'string' }, givenLang: { type: 'string' } }, required: ['prompt', 'givenCode', 'givenLang'], additionalProperties: false }
const ANS = { type: 'object', properties: { answers: { type: 'array', items: { type: 'object', properties: { level: { type: 'integer' }, text: { type: 'string' } }, required: ['level', 'text'], additionalProperties: false } } }, required: ['answers'], additionalProperties: false }
const RUB = { type: 'object', properties: { items: { type: 'array', items: { type: 'string' } } }, required: ['items'], additionalProperties: false }
const BG = { type: 'object', properties: { results: { type: 'array', items: { type: 'object', properties: { level: { type: 'integer' }, covered: { type: 'array', items: { type: 'boolean' } } }, required: ['level', 'covered'], additionalProperties: false } } }, required: ['results'], additionalProperties: false }

function scoreVec(covered) { const n = covered.length; return n ? Math.round(100 * covered.filter(Boolean).length / n) : 0 }
function byLevel(results, cpLen) { const m = {}; for (const r of results) if (r.covered && r.covered.length === cpLen) m[r.level] = scoreVec(r.covered); return m }
function coherent(ex) {
  const s = ex.map((e) => e.sonnet)
  if (s.length < 5) return false
  if (s[0] < 80) return false
  if (s[s.length - 1] > 40) return false
  for (let i = 1; i < s.length; i++) if (s[i] > s[i - 1] + 12) return false
  return true
}

// answer + grade against the existing # rubric — shared by both paths.
// `q` = { idx, folder, fromFile } | { idx, folder, prompt, givenCode, givenLang }.
//  - fromFile=true: answer agent READS _salvage/idx_N.json (tiny) for prompt+givenCode+givenLang.
//  - else: prompt/givenCode/givenLang embedded inline (full-pipeline write output).
async function answerAndGrade(q) {
  const rubR = await agent(`Doc file en.md tai duong dan ${enPath(q.folder)}, lay "# rubric". Tra JSON {"items":[...]} voi moi phan tu = 1 rubric item (giu nguyen text, ke ca tag [technical]/[problemSolving]/[communication]/[testing] o dau neu co).`, { model: 'haiku', schema: RUB, phase: 'Answer+Grade', label: `rubric#${q.idx}` })
  // ROBUSTNESS: Haiku sometimes double-encodes -> items = ['{"items":[...]}'] (a single
  // stringified-JSON element). Unwrap so cps holds the real rubric items and cpsLen is
  // correct for grading (a wrong cpsLen makes byLevel drop every grade -> null scores).
  let cps = rubR.items
  if (cps.length === 1 && typeof cps[0] === 'string' && cps[0].includes('"items"')) {
    try { const inner = JSON.parse(cps[0]); if (Array.isArray(inner.items) && inner.items.length > 1) cps = inner.items } catch (_e) { /* keep as-is */ }
  }
  const rubricBlock = `Rubric cham (${cps.length} y):\n${cps.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
  const codeSrc = q.fromFile
    ? `Doc file JSON ${salPath(q.idx)} (nho, ~2KB) - no chua {"prompt","givenCode","givenLang"} cua 1 cau phong van kind=debug/review/optimize. Dung "prompt" lam cau hoi, "givenCode"/"givenLang" lam code cho thi sinh.`
    : `Cau hoi (kind=debug/review/optimize): "${q.prompt}"\n\nGiven code:\n\`\`\`${q.givenLang}\n${q.givenCode}\n\`\`\``
  const ansR = await agent(`${codeSrc}\n\n${rubricBlock}\n\nViet 5 CAU TRA LOI ung vien 5 MUC dua tren rubric: L1 xuat sac(neu dung gan het cac diem rubric, giong senior engineer that, THAM CHIEU DUNG code), L2 kha(thieu 1-2 diem), L3 trung binh(~nua), L4 yeu(1-2 diem hoi hot), L5 kem/lac de(khong thay van de gi trong code, hoac hieu sai hoan toan). Giong ung vien NOI khi tra loi phong van, 3-6 cau/muc.\n\nQUAN TRONG: Viet cau tra loi bang TIENG ANH (English) - toan bo "text" phai la English, KHONG dung tieng Viet (de dong bo voi cac cau da co, exampleResults luon la English o ca en.md lan vi.md). Tra JSON {"answers":[{"level":1,"text":"<English>"},...]} du 5.`, { model: 'sonnet', schema: ANS, phase: 'Answer+Grade', label: `ans#${q.idx}` })
  const cpsText = cps.map((c, i) => `${i + 1}. ${c}`).join('\n')
  const ansText = ansR.answers.map((a) => `[L${a.level}] ${a.text}`).join('\n\n')
  const gq = `CHECKLIST tu # rubric (${cps.length} y):\n${cpsText}\n\n5 CAU TRA LOI UNG VIEN:\n${ansText}\n\nVoi TUNG cau tra loi (L1..L5), cham MOI y checklist: cau tra loi co THUC SU neu dung+du y do khong (paraphrase ok; mo ho/thieu/1 phan=false)? Tra JSON {"results":[{"level":1,"covered":[bool x ${cps.length}]},...]} du 5 muc.`
  const pair = await parallel([
    () => agent(gq, { model: 'sonnet', schema: BG, phase: 'Answer+Grade', label: `grS#${q.idx}` }),
    () => agent(gq, { model: 'haiku', schema: BG, phase: 'Answer+Grade', label: `grH#${q.idx}` }),
  ])
  const sMap = pair[0] ? byLevel(pair[0].results, cps.length) : {}
  const hMap = pair[1] ? byLevel(pair[1].results, cps.length) : {}
  // Guarantee non-null scores: if one grader returned a wrong-length covered array for a
  // level (byLevel dropped it), fall back to the other grader's score for that level.
  const examples = ansR.answers.map((a) => {
    let s = sMap[a.level] ?? null, h = hMap[a.level] ?? null
    if (s === null && h !== null) s = h
    if (h === null && s !== null) h = s
    return { level: a.level, text: a.text, sonnet: s, haiku: h }
  }).sort((x, y) => x.level - y.level)
  return { checklist: cps, examples, coherent: coherent(examples) }
}

const A = typeof args === 'string' ? JSON.parse(args) : args
const salvage = A.salvage || []
const full = A.full || []
log(`salvage=${salvage.length} full=${full.length}`)

// SALVAGE path: prompt+givenCode already authored (read from _salvage/idx_N.json by the
// answer agent) -> answer+grade only. Result carries checklist/examples; merge pulls
// prompt/givenCode/givenLang straight from _salvage_write.json by idx.
const salResults = await parallel(salvage.map((e) => async () => {
  const g = await answerAndGrade({ idx: e.idx, folder: e.folder, fromFile: true })
  return { idx: e.idx, source: 'salvage', folder: e.folder, ...g }
}))

// FULL path: brief -> write -> answer -> grade.
const fullResults = await pipeline(full,
  async (e) => {
    const brief = await agent(`Doc file en.md tai duong dan ${enPath(e.folder)} - day la 1 cau mock-interview kind=${e.kind} NHUNG THIEU field "# prompt" va "# givenCode" (bi loi khi author, chi con "# rubric"/"# tags"/"# followUps"/"# hints"/"# keywords"). Doc ky "# rubric" (moi diem cham rat cu the, co the nhac ten bien/class/co che ro rang), "# tags", "# hints", "# followUps" - CHUNG mo ta 1 tinh huong code CU THE ma rubric dang cham. Nhiem vu: dung nguoc (reverse-engineer) ra: (1) tinh huong/boi canh ngan (2) code outline mo ta cau truc code can viet (bang loi, KHONG phai code that) de khop chinh xac voi tung diem rubric - vd neu rubric nhac ten bien cu the thi outline phai dung dung ten do (3) ngon ngu/framework phu hop (dua theo rubric nhac Nest/Spring/ASP.NET/Go). Tra JSON {"scenario":"...", "codeOutline":"...", "language":"..."}`, { model: 'opus', schema: BRIEF, phase: 'Brief', label: `brief#${e.idx}` })
    return { e, brief }
  },
  async (prev) => {
    const { e, brief } = prev
    const write = await agent(`Doc file en.md tai duong dan ${enPath(e.folder)} - lay "# kind" (${e.kind}), "# rubric" (diem cham), "# tags", "# hints", "# followUps", "# keywords", "# tier" that ky. Ban brief da co: tinh huong="${brief.scenario}", code outline="${brief.codeOutline}", ngon ngu="${brief.language}". Nhiem vu: VIET THAT 2 field con thieu:\n(1) "# prompt" - cau hoi phong van hoan chinh (2-4 cau), dung giong interviewer dua de cho thi sinh, khop dung voi "# kind" (debug=tim bug dua tren code loi; review=doc-review code cho gop y; optimize=toi uu code cham).\n(2) "# givenCode" - CODE THAT (khong phai outline) khop CHINH XAC voi tung diem trong "# rubric" (moi bien/class/co che rubric nhac phai xuat hien dung trong code). Ngon ngu = ${brief.language}. Code du dai de the hien dung bug/van de rubric mo ta, khong thua khong thieu.\nTra JSON {"prompt":"...", "givenCode":"...", "givenLang":"typescript|java|csharp|go"}`, { model: 'sonnet', schema: WRITE, phase: 'Write', label: `write#${e.idx}` })
    return { e, write }
  },
  async (prev) => {
    const { e, write } = prev
    const q = { idx: e.idx, prompt: write.prompt, givenCode: write.givenCode, givenLang: write.givenLang, folder: e.folder }
    const g = await answerAndGrade(q)
    return { idx: e.idx, source: 'full', prompt: write.prompt, givenCode: write.givenCode, givenLang: write.givenLang, folder: e.folder, ...g }
  },
)

return [...salResults.filter(Boolean), ...fullResults.filter(Boolean)]
