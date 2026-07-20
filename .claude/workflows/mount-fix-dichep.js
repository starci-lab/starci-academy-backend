// ============================================================================
// FIX DICH-EP trong vi.md mock-interview (existing content) theo terminology-bold.md.
// Moi file bi flag -> 1 Sonnet doc CONTEXT, chi sua dich-ep Loai 2/3 RO RANG, tra edit
// co cau truc {find,replace} (find = substring CHINH XAC trong vi.md) -> apply qua node.
//
// args = [ {file}, ... ]  (repo-rel path toi vi.md).
// Ket qua: [{file, edits:[{find,replace,term,reason}]}].
// ============================================================================
export const meta = {
  name: 'mount-fix-dichep',
  description: 'Fix forced-translation (dich-ep) of English terms in mock-interview vi.md per terminology-bold.md',
  phases: [{ title: 'Fix', detail: 'Sonnet reads context, returns structured term edits' }],
}

const REPO = 'C:\\Repositories\\ac\\starci-academy-backend\\'
const EDITS = { type: 'object', properties: { edits: { type: 'array', items: { type: 'object', properties: { find: { type: 'string' }, replace: { type: 'string' }, term: { type: 'string' }, reason: { type: 'string' } }, required: ['find', 'replace', 'term', 'reason'], additionalProperties: false } } }, required: ['edits'], additionalProperties: false }

const RULE = `Ban SUA loi DICH-EP (forced translation) trong 1 file vi.md cua ngan hang cau mock-interview StarCi, theo rule terminology-bold.md.

NGUYEN TAC (rule §1, §5):
- Loai 2 (English nen tang) va Loai 3 (jargon chuyen sau) PHAI giu tieng Anh, KHONG dich ra tieng Viet. Vi du dich-ep CAN SUA:
  * "thông lượng" -> throughput
  * "điểm cuối" -> endpoint
  * "tải trọng" -> payload
  * "bộ nhớ đệm" -> cache
  * "đồ thị phụ thuộc" -> dependency graph
  * "tiêm phụ thuộc" -> dependency injection
  * "nhất quán cuối cùng" -> eventual consistency
  * "nguồn chân lý duy nhất" / "nguồn sự thật duy nhất" -> single source of truth
  * "phần mềm trung gian" -> middleware
  * "bộ xử lý" (khi = handler) -> handler
  * "trường hợp biên" -> edge case
- KHI SUA: thay cum tieng Viet bang term English, chinh lai NGU PHAP cau cho muot (bo "một", "các", gioi tu thua neu can). Giu nguyen phan con lai cua cau.

CAM (rule §5 - dung sua nham false-positive, doc CONTEXT):
- "thời gian sống" khi la van mo ta ("khung thời gian sống của key", "vòng đời") -> GIU, day KHONG phai term (cau da co "TTL" rieng roi). CHI sua neu no dung THAY cho chu "TTL" nhu 1 term.
- "phân mảnh" thuong = fragment/split hop le -> GIU (KHONG doi thanh sharding tru khi context ro la sharding).
- "hàng đợi" = queue, "phiên bản" = version, "cân bằng tải" = load balancing, "tranh chấp" = contention: la tieng Viet CHAP NHAN DUOC -> GIU, KHONG sua.
- Chi sua khi CHAC CHAN la dich-ep Loai 2/3; con phan van thi BO QUA.

CHI sua trong noi dung field prompt/idealAnswer/rubric/followUps/hints (van xuoi). KHONG dua chu vao trong code fence hay inline code.`

const A = typeof args === 'string' ? JSON.parse(args) : args

const results = await parallel(A.map((e) => async () => {
  const enFile = e.file.replace(/vi\.md$/, 'en.md')
  const r = await agent(`${RULE}\n\nDoc file vi.md: ${REPO}${e.file.replace(/\//g, '\\')}\n(Tham chieu ban goc English de doi chieu term: ${REPO}${enFile.replace(/\//g, '\\')})\n\nTim MOI cho dich-ep Loai 2/3 RO RANG trong vi.md (theo rule tren, doc context ky). Voi moi cho, tra 1 edit:\n- "find": doan text CHINH XAC (copy nguyen van, du dai de DUY NHAT trong file, ~5-15 tu) chua cum dich-ep.\n- "replace": doan do sau khi thay term VN bang English + chinh ngu phap muot.\n- "term": cap "vn -> en" (vd "thông lượng -> throughput").\n- "reason": 1 cau ngan vi sao.\nNeu KHONG co cho nao chac chan dich-ep, tra {"edits":[]}. Tra JSON {"edits":[...]}.`, { model: 'sonnet', schema: EDITS, phase: 'Fix', label: `fix:${e.file.split('/mock-interview/')[1] || e.file}` })
  return { file: e.file, edits: r.edits }
}))

return results.filter(Boolean)
