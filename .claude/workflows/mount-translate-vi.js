// ============================================================================
// TRANSLATE prompt EN->VI cho vi.md cua 228 cau debug/review/optimize.
// Convention nhom 477: vi.md # prompt = TIENG VIET; # givenCode/checklist/exampleResults
// giu English. Workflow nay chi dich # prompt.
//
// TUAN THU rule dich: .claude/docs/rules/terminology-bold.md (authority DUY NHAT, ap cho
//   # prompt mock-interview - xem principle translation-standard-all-content-types.md).
//   -> Model Sonnet (rule §0/§8 bat buoc doc-hieu tot, CAM map mu Haiku).
//   -> 3 loai tu: L1 pho thong = DICH sang VN tu nhien; L2 English nen tang (lifecycle,
//      request, response, scope, container, provider, controller, service, interceptor,
//      middleware, payload, endpoint, config, handler, instance...) = GIU English inline
//      plain; L3 jargon (dependency injection, IoC container, edge case, idempotent,
//      eventual consistency, sharding, throughput, race condition...) = GIU English inline;
//      L4 code/dinh danh (CacheInterceptor, req.user, Promise.all, geoadd, least_conn) =
//      GIU nguyen. -> vi DU DAU. -> polysemy doc context (source code GIU English; "phan
//      manh" != sharding). Giong 477: hoi thoai interviewer, KHONG bold ram trong prompt.
//
// args = [ {idx}, ... ]  (prompt tieng Anh doc tu _prompts/idx_<N>.json - file nho).
// Ket qua: [{idx, viPrompt}]. Gop thanh _viprompt.json (idx->string) cho merge-finish.js.
// ============================================================================
export const meta = {
  name: 'mount-translate-vi',
  description: 'Translate English interview prompts to Vietnamese per terminology-bold.md (Sonnet)',
  phases: [{ title: 'Translate', detail: 'Sonnet translates each prompt EN->VI per rules' }],
}

const PROMPTS_DIR = 'C:\\Repositories\\ac\\starci-academy-backend\\.artifacts\\interview-audit\\mount-scripts\\_prompts\\'
const VIP = { type: 'object', properties: { viPrompt: { type: 'string' } }, required: ['viPrompt'], additionalProperties: false }

const RULES = `Ban DICH cau hoi phong van ky thuat tu TIENG ANH sang TIENG VIET, theo rule terminology cua StarCi (authority: terminology-bold.md). Cau hoi la kind=debug/review/optimize - interviewer dua tinh huong code cho thi sinh.

QUY TAC PHAN LOAI TU (doc context ca cum, KHONG map mu):
- Loai 1 (pho thong, khong chuyen nganh): DICH sang tieng Viet tu nhien, nghia doi thuong (available->"san sang", layer->"tang", flow->"luong", boundary module->"ranh gioi", record->"ban ghi"). KHONG bold.
- Loai 2 (English nen tang, dich ra nghe guong): GIU nguyen tieng Anh, inline plain, KHONG bold. Vi du: lifecycle, event, request, response, scope, container, provider, module, controller, service, pipe, guard, interceptor, middleware, transport, log, instance, payload, endpoint, config, handler, stack trace, cache, cache key, TTL, event loop.
- Loai 3 (jargon chuyen sau/named concept): GIU tieng Anh, inline plain (theo giong 477, KHONG bold ram trong prompt). Vi du: dependency injection, IoC container, edge case, single source of truth, idempotent, eventual consistency, sharding, throughput, race condition, round-robin, least connections, fail-open/fail-closed, worker thread, event loop blocking.
- Loai 4 (code/dinh danh/literal/ten API/ten bien/ten class/lenh): GIU NGUYEN y het ban goc, KHONG dich, KHONG doi. Vi du: CacheInterceptor, req.user, Promise.all, geoadd, GEOADD, least_conn, @CacheTTL, findById, /users/me, POST, JWT, crypto.createHash. Neu ban goc dat trong backtick thi giu backtick; neu ban goc plain thi giu plain.

POLYSEMY (context quyet dinh): "source code" -> GIU "source code" (khong dich "ma nguon"). "phan manh" != sharding - doc context. "container" IoC -> giu "container"; Docker container -> "container Docker".

YEU CAU OUTPUT:
- Tieng Viet DU DAU (khong thieu dau), ngu phap tu nhien, dung giong interviewer nguoi Viet dat cau hoi (KHONG dich word-for-word tu tieng Anh).
- GIU y nghia + tinh huong y het ban goc, khong them/bot chi tiet ky thuat.
- KHONG dich ep Loai 2/3 sang tieng Viet; KHONG dich token code Loai 4.
- Do dai tuong duong ban goc. KHONG bold ram (theo giong prompt 477 - term English de plain inline).`

const A = typeof args === 'string' ? JSON.parse(args) : args

const results = await parallel(A.map((e) => async () => {
  const vi = await agent(`${RULES}\n\nDoc file JSON ${PROMPTS_DIR}idx_${e.idx}.json (nho) - no chua {"prompt":"..."} = cau hoi tieng Anh can dich. Tra JSON {"viPrompt":"<cau hoi tieng Viet, dung rule tren>"}.`, { model: 'sonnet', schema: VIP, phase: 'Translate', label: `vi#${e.idx}` })
  return { idx: e.idx, viPrompt: vi.viPrompt }
}))

return results.filter(Boolean)
