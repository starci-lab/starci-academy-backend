// ============================================================================
// MOUNT AUTHOR+GRADE — bu prompt+givenCode con thieu (228 cau kind=debug/review/optimize)
// ============================================================================
// Boi canh: .mount/data co 985 cau mock-interview (fullstack 345 + SD 360 + devops 280).
// 477 cau da co san prompt+idealAnswer -> DA AUDIT CHECKLIST XONG, DA GHI VAO .mount (khong
// can dong lai). Con lai 228 cau (kind debug/review/optimize) THIEU ca "# prompt" lan
// "# givenCode" tu luc author (chi con "# rubric" da gan nhan 4-chieu [technical]/
// [problemSolving]/[communication]/[testing]).
//
// Workflow nay AUTHOR BU prompt+givenCode (dung nguoc tu rubric qua Opus brief -> Sonnet viet),
// roi sinh 5 muc tra loi + cham coverage (Sonnet+Haiku) de xac nhan noi dung author ra thuc su
// "cham duoc". KHONG dung DB/id-mapping - source la file .mount/data that (doc qua field
// "folder" trong _mount_todo_705_skipped.json), ghi lai CHINH file do (khong the ghi nham).
//
// Nguon cau hoi: .artifacts/interview-audit/mount-scripts/_mount_todo_705_skipped.json
//   (228 entry {folder, course, bank, kind} - GIT-TRACKED, pull mtp la co).
// MAY KHAC: doi hang FILE + ROOT ben duoi cho khop REPO ROOT may do.
//
// CACH CHAY (228 cau, ~6 agent/cau -> ~1368 agent > cap 1000, CHIA 2 LAN):
//   Workflow({ scriptPath: ".claude/workflows/mount-author-and-grade.js", args: [0, 114] })
//   Workflow({ scriptPath: ".claude/workflows/mount-author-and-grade.js", args: [114, 114] })
// (co the chay song song 2 workflow, hoac chia nho hon ~50-60/lan neu he rate-limit).
//
// SAU KHI XONG: lay `result` (mang {idx, prompt, givenCode, givenLang, checklist, examples,
//   coherent}), merge vao .mount bang .claude/workflows/../.artifacts/interview-audit/
//   mount-scripts/merge-author-grade.js (xem file do de biet cach dung - node script thuong,
//   KHONG phai Workflow script, chay qua Bash).
//
// Field order khi merge (theo README bank): # tags -> # prompt -> # givenCode -> # givenLang
//   -> # rubric (giu nguyen) -> # checklist (MOI) -> # exampleResults (MOI) -> # followUps.
// ============================================================================
export const meta = {
  name: 'mount-author-and-grade',
  description: 'Full chain per question (kind=debug/review/optimize missing prompt+givenCode): Opus brief -> Sonnet write prompt+givenCode -> 5-level answers -> grade against existing rubric',
  phases: [
    { title: 'Brief', detail: 'Opus reverse-engineers scenario/code shape from rubric' },
    { title: 'Write', detail: 'Sonnet writes prompt + givenCode matching the brief' },
    { title: 'Answer+Grade', detail: '5 leveled answers, Sonnet+Haiku batch-grade vs rubric' },
  ],
}

const FILE = 'C:\\Repositories\\ac\\starci-academy-backend\\.artifacts\\interview-audit\\mount-scripts\\_mount_todo_705_skipped.json'
const ROOT = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\'

const BRIEF = { type: 'object', properties: { scenario: { type: 'string' }, codeOutline: { type: 'string' }, language: { type: 'string' } }, required: ['scenario', 'codeOutline', 'language'], additionalProperties: false }
const WRITE = { type: 'object', properties: { prompt: { type: 'string' }, givenCode: { type: 'string' }, givenLang: { type: 'string' } }, required: ['prompt', 'givenCode', 'givenLang'], additionalProperties: false }
const ANS = { type: 'object', properties: { answers: { type: 'array', items: { type: 'object', properties: { level: { type: 'integer' }, text: { type: 'string' } }, required: ['level', 'text'], additionalProperties: false } } }, required: ['answers'], additionalProperties: false }
const RUB = { type: 'object', properties: { items: { type: 'array', items: { type: 'string' } } }, required: ['items'], additionalProperties: false }
const BG = { type: 'object', properties: { results: { type: 'array', items: { type: 'object', properties: { level: { type: 'integer' }, covered: { type: 'array', items: { type: 'boolean' } } }, required: ['level', 'covered'], additionalProperties: false } } }, required: ['results'], additionalProperties: false }

function scoreVec(covered) { const n = covered.length; return n ? Math.round(100 * covered.filter(Boolean).length / n) : 0 }
function coherent(ex) {
  const s = ex.map((e) => e.sonnet)
  if (s.length < 5) return false
  if (s[0] < 80) return false
  if (s[s.length - 1] > 40) return false
  for (let i = 1; i < s.length; i++) if (s[i] > s[i - 1] + 12) return false
  return true
}
function byLevel(results, cpLen) {
  const m = {}
  for (const r of results) if (r.covered && r.covered.length === cpLen) m[r.level] = scoreVec(r.covered)
  return m
}

const A = typeof args === 'string' ? JSON.parse(args) : args
const start = A[0], count = A[1]
const indices = Array.from({ length: count }, (_unused, i) => start + i)

const results = await pipeline(indices,
  async (idx) => {
    const brief = await agent(`Doc file ${FILE}, lay phan tu index ${idx}, lay field "folder". Doc file en.md tai duong dan ${ROOT}+folder (doi / thanh \\)+\\en.md - day la 1 cau mock-interview kind=debug/review/optimize NHUNG THIEU field "# prompt" va "# givenCode" (bi loi khi author, chi con "# rubric"/"# tags"/"# followUps"/"# hints"/"# keywords"). Doc ky "# rubric" (moi diem cham rat cu the, co the nhac ten bien/class/co che ro rang), "# tags", "# hints", "# followUps" - CHUNG mo ta 1 tinh huong code CU THE ma rubric dang cham. Nhiem vu: dung nguoc (reverse-engineer) ra: (1) tinh huong/boi canh ngan (2) code outline mo ta cau truc code can viet (bang loi, KHONG phai code that) de khop chinh xac voi tung diem rubric - vd neu rubric nhac ten bien cu the thi outline phai dung dung ten do (3) ngon ngu/framework phu hop (dua theo rubric nhac Nest/Spring/ASP.NET/Go). Tra JSON {"scenario":"...", "codeOutline":"...", "language":"..."}`, { model: 'opus', schema: BRIEF, phase: 'Brief', label: `brief#${idx}` })
    return { idx, brief }
  },
  async (prev) => {
    const idx = prev.idx
    const write = await agent(`Doc file ${FILE}, lay phan tu index ${idx}, lay field "folder". Doc file en.md tai duong dan ${ROOT}+folder (doi / thanh \\)+\\en.md - lay "# kind" (debug|review|optimize), "# rubric" (diem cham), "# tags", "# hints", "# followUps", "# keywords", "# tier" that ky. Ban brief da co: tinh huong="${prev.brief.scenario}", code outline="${prev.brief.codeOutline}", ngon ngu="${prev.brief.language}". Nhiem vu: VIET THAT 2 field con thieu:\n(1) "# prompt" - cau hoi phong van hoan chinh (2-4 cau), dung giong interviewer dua de cho thi sinh, khop dung voi "# kind" doc duoc (debug=tim bug dua tren code loi; review=doc-review code cho gop y; optimize=toi uu code cham).\n(2) "# givenCode" - CODE THAT (khong phai outline) khop CHINH XAC voi tung diem trong "# rubric" (moi bien/class/co che rubric nhac phai xuat hien dung trong code). Ngon ngu = ${prev.brief.language}. Code du dai de the hien dung bug/van de rubric mo ta, khong thua khong thieu.\nTra JSON {"prompt":"...", "givenCode":"...", "givenLang":"typescript|java|csharp|go"}`, { model: 'sonnet', schema: WRITE, phase: 'Write', label: `write#${idx}` })
    return { idx, brief: prev.brief, written: write }
  },
  async (prev) => {
    const idx = prev.idx
    const rubR = await agent(`Doc file ${FILE}, lay phan tu index ${idx}, lay field "folder". Doc file en.md tai duong dan ${ROOT}+folder (doi / thanh \\)+\\en.md, lay "# rubric". Tra JSON {"items":[...]} voi moi phan tu = 1 rubric item (giu nguyen text, ke ca tag [technical]/[problemSolving]/... o dau neu co).`, { model: 'haiku', schema: RUB, phase: 'Answer+Grade', label: `rubric#${idx}` })
    const cps = rubR.items
    const ansR = await agent(`Cau hoi (kind=debug/review/optimize): "${prev.written.prompt}"\n\nGiven code:\n\`\`\`${prev.written.givenLang}\n${prev.written.givenCode}\n\`\`\`\n\nRubric cham (${cps.length} y):\n${cps.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nViet 5 CAU TRA LOI ung vien 5 MUC dua tren rubric: L1 xuat sac(neu dung gan het cac diem rubric, giong senior engineer that, THAM CHIEU DUNG code o tren), L2 kha(thieu 1-2 diem), L3 trung binh(~nua), L4 yeu(1-2 diem hoi hot), L5 kem/lac de(khong thay van de gi trong code, hoac hieu sai hoan toan). Giong ung vien NOI khi tra loi phong van, 3-6 cau/muc. Tra JSON {"answers":[{"level":1,"text":"..."},...]} du 5.`, { model: 'sonnet', schema: ANS, phase: 'Answer+Grade', label: `ans#${idx}` })
    const cpsText = cps.map((c, i) => `${i + 1}. ${c}`).join('\n')
    const ansText = ansR.answers.map((a) => `[L${a.level}] ${a.text}`).join('\n\n')
    const gq = `CHECKLIST tu # rubric (${cps.length} y):\n${cpsText}\n\n5 CAU TRA LOI UNG VIEN:\n${ansText}\n\nVoi TUNG cau tra loi (L1..L5), cham MOI y checklist: cau tra loi co THUC SU neu dung+du y do khong (paraphrase ok; mo ho/thieu/1 phan=false)? Tra JSON {"results":[{"level":1,"covered":[bool x ${cps.length}]},...]} du 5 muc.`
    const pair = await parallel([
      () => agent(gq, { model: 'sonnet', schema: BG, phase: 'Answer+Grade', label: `grS#${idx}` }),
      () => agent(gq, { model: 'haiku', schema: BG, phase: 'Answer+Grade', label: `grH#${idx}` }),
    ])
    const sMap = pair[0] ? byLevel(pair[0].results, cps.length) : {}
    const hMap = pair[1] ? byLevel(pair[1].results, cps.length) : {}
    const examples = ansR.answers.map((a) => ({ level: a.level, text: a.text, sonnet: sMap[a.level] ?? null, haiku: hMap[a.level] ?? null })).sort((x, y) => x.level - y.level)
    return { idx, prompt: prev.written.prompt, givenCode: prev.written.givenCode, givenLang: prev.written.givenLang, checklist: cps, examples, coherent: coherent(examples) }
  },
)
return results
