// ============================================================================
// INTERVIEW CHECKLIST AUDIT — chạy ở session KHÁC cho idx 450–659
// ============================================================================
// Nguồn câu hỏi: .artifacts/interview-audit/_all.json (660 câu, id/kind/course/prompt/ideal — GIT-TRACKED, pull mtp là có).
// ⚠️ MÁY KHÁC: đổi hằng FILE bên dưới cho khớp REPO ROOT máy đó
//    (vd C:\Repositories\ac\starci-academy-backend\.artifacts\interview-audit\_all.json).
//    File này = CÙNG thứ tự với batch 0–309 đã chạy → index 450–660 khớp, KHÔNG regen _all.json (regen có thể đổi order).
//
// CÁCH CHẠY (210 câu > cap 1000 agent nên CHIA 2 LẦN):
//   Workflow({ scriptPath: "D:\\Repositories\\starci-academy-backend\\.claude\\workflows\\interview-audit.js", args: [450, 105] })
//   Workflow({ scriptPath: "D:\\Repositories\\starci-academy-backend\\.claude\\workflows\\interview-audit.js", args: [555, 105] })
//
// SAU MỖI LẦN xong: lấy `result` (mảng {idx,checkpoints,examples,iters,coherent}), lọc null,
//   lưu vào D:\Repositories\starci-academy-backend\.artifacts\interview-audit\results\batch_<start>-<end>.json
//   (json.dump ensure_ascii=False). idx nào null (lỗi StructuredOutput) → ghi vào results\_failed_idx.json để chạy lại.
//
// Mỗi câu ~5.5 agent, ~260K token (phần lớn cache-read → cost thực ~/10). Chỉ dùng Sonnet + Haiku (subagent Claude, 0đ OpenRouter).
// ============================================================================
export const meta = {
  name: 'interview-checkpoint-audit-batch',
  description: 'Batch: per interview Q read from _all.json, Sonnet gen+review tight checkpoints, gen 5 answers, Sonnet+Haiku BATCH-grade all 5 at once, enhance up to 5x if incoherent',
  phases: [
    { title: 'Checkpoints', detail: 'Sonnet gen + review' },
    { title: 'Grade+Enhance', detail: 'gen 5 answers, batch-grade Sonnet+Haiku, enhance loop' },
  ],
}

const FILE = 'D:\\Repositories\\starci-academy-backend\\.artifacts\\interview-audit\\_all.json'
const CP = { type: 'object', properties: { items: { type: 'array', items: { type: 'string' } } }, required: ['items'], additionalProperties: false }
const ANS = { type: 'object', properties: { answers: { type: 'array', items: { type: 'object', properties: { level: { type: 'integer' }, text: { type: 'string' } }, required: ['level', 'text'], additionalProperties: false } } }, required: ['answers'], additionalProperties: false }
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
    const cp0 = await agent(`Đọc file ${FILE}, lấy phần tử index ${idx} (0-based) của mảng JSON — có "prompt" và "ideal" (đáp án chuẩn). Tách "ideal" thành CHECKLIST 5-8 CHECKPOINT ATOMIC: mỗi ý = 1 luận điểm độc lập thí sinh nêu-hoặc-bỏ riêng; GỘP mệnh-đề-con CÙNG 1 checkpoint; CẤM gộp 2 checkpoint bằng "và"; không băm vụn; phủ hết điểm mấu chốt; GIỮ nguyên ngôn ngữ của "ideal". Trả JSON {"items":[...]}`, { model: 'sonnet', schema: CP, phase: 'Checkpoints', label: `gen#${idx}` })
    const cp = await agent(`Đọc ${FILE} index ${idx} (prompt+ideal). REVIEW checklist sau, sửa: ý gộp 2 checkpoint→tách; ý băm/trùng→gộp; thiếu điểm mấu chốt→thêm; giữ 5-8 ý atomic. Checklist: ${JSON.stringify(cp0.items)}. Trả JSON {"items":[...]}`, { model: 'sonnet', schema: CP, phase: 'Checkpoints', label: `rev#${idx}` })
    return { idx, checkpoints: cp.items }
  },
  async (prev) => {
    const idx = prev.idx
    let cps = prev.checkpoints
    let examples = []
    let iters = 0
    for (let iter = 0; iter < 5; iter++) {
      iters = iter + 1
      const ansR = await agent(`Đọc ${FILE} index ${idx} (prompt+ideal). Viết 5 câu trả lời phỏng vấn 5 MỨC dựa đáp án chuẩn: L1 xuất sắc(phủ gần hết), L2 khá(thiếu 1-2), L3 trung bình(~nửa), L4 yếu(1-2 ý hời hợt), L5 kém/lạc đề. Giọng thí sinh NÓI, 2-4 câu/mức. JSON {"answers":[{"level":1,"text":"..."},...]} đủ 5.`, { model: 'sonnet', schema: ANS, phase: 'Grade+Enhance', label: `ans#${idx}.${iter}` })
      const answers = ansR.answers
      const cpsText = cps.map((c, i) => `${i + 1}. ${c}`).join('\n')
      const ansText = answers.map((a) => `[L${a.level}] ${a.text}`).join('\n\n')
      const gq = `CHECKLIST (${cps.length} ý):\n${cpsText}\n\n5 CÂU TRẢ LỜI:\n${ansText}\n\nVới TỪNG câu trả lời (L1..L5), chấm MỖI ý checklist: câu trả lời có THỰC SỰ nêu đúng+đủ ý đó không (paraphrase ok; mơ hồ/thiếu/1 phần=false)? Trả JSON {"results":[{"level":1,"covered":[bool × ${cps.length}]},...]} đủ 5 mức, mỗi "covered" đúng ${cps.length} phần tử.`
      const pair = await parallel([
        () => agent(gq, { model: 'sonnet', schema: BG, phase: 'Grade+Enhance', label: `grS#${idx}.${iter}` }),
        () => agent(gq, { model: 'haiku', schema: BG, phase: 'Grade+Enhance', label: `grH#${idx}.${iter}` }),
      ])
      const sMap = pair[0] ? byLevel(pair[0].results, cps.length) : {}
      const hMap = pair[1] ? byLevel(pair[1].results, cps.length) : {}
      examples = answers.map((a) => ({ level: a.level, text: a.text, sonnet: sMap[a.level] ?? null, haiku: hMap[a.level] ?? null })).sort((x, y) => x.level - y.level)
      if (coherent(examples)) break
      if (iter < 4) {
        const enh = await agent(`Đọc ${FILE} index ${idx} (prompt+ideal). Checklist chấm KHÔNG hợp lý — điểm 5 mức (Sonnet): ${examples.map((e) => 'L' + e.level + '=' + e.sonnet).join(', ')} (kỳ vọng L1≥80, L5≤40, giảm dần). Checklist: ${JSON.stringify(cps)}. SỬA cho ATOMIC + phân biệt rõ để câu tốt phủ nhiều ý, câu kém phủ ít. Giữ 5-8 ý. Trả JSON {"items":[...]}`, { model: 'sonnet', schema: CP, phase: 'Grade+Enhance', label: `enh#${idx}.${iter}` })
        cps = enh.items
      }
    }
    return { idx, checkpoints: cps, examples, iters, coherent: coherent(examples) }
  },
)
return results
