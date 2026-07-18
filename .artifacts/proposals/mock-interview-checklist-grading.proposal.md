# Proposal — Chấm mock-interview bằng CHECKLIST grounded (thay "AI tự brainstorm")

> Status: ⏳ PENDING · Trigger: thầy 2026-07-18 — *"triển khai phỏng vấn thử với đáp án = RAG hơn là để AI tự brainstorm"*. Đã qua ~7 vòng thực nghiệm (curl OpenRouter thẳng, không qua tier) để chốt config. Đây là bàn giao BUILD.

## 1. Vấn đề (đã xác nhận bằng code + đo)
Chấm mock-interview hiện tại (`grade-mock-interview-session-grading.service.ts`):
- **theory**: chấm coverage theo `idealAnswer` authored → OK, grounded.
- **reasoning / scenario / design**: prompt ghi "OPEN rubric, no correct answer" → **model TỰ nghĩ chuẩn** (design có excerpt RAG làm context nhưng vẫn tự tổng hợp). Đây là "AI tự brainstorm".
- **Đo được:** để 32b tự cho điểm 0–100 → **rộng tay trung bình +15đ** (câu tệ nhất +38) + **dao động ±10–33** dù temp 0.

## 2. Giải pháp đã VERIFY: CHECKLIST grounded + điểm tính code
Tách `idealAnswer` (curate sẵn) thành **checklist các ý chính**; model chỉ phán **từng ý phủ/không** (việc nó làm giỏi — item-agree ~95%); **điểm = số-ý-phủ ÷ tổng, tính bằng code** (không để model bịa số).

**Bằng chứng (10-random + 5-câu nhiều vòng):**
- FULL idealAnswer → **100% trên 10/10 câu, deterministic** (không phạt oan câu đầy đủ).
- Partial → chấm thấp đúng, **hết rộng tay** (mean ~44 thay vì +15 lệch).
- Checklist **6–8 checkpoint cân bằng** + `gemini-3.1-flash-lite` → **spread 0 ở 4/5 câu**, per-ý đúng ~95%, over-credit khép (Q2 +38→~+14).
- Rẻ: **~$0.0003/câu**.

## 3. Config CHỐT (đừng đổi khi build)
- **Checklist = 6–8 CHECKPOINT cân bằng.** Gen prompt: cap 5–8 ý; mỗi ý = 1 checkpoint độc lập; **GỘP mệnh-đề-con cùng checkpoint** (vd "record có field level/message/timestamp" = 1 ý); **chỉ TÁCH khi 2 checkpoint thật sự độc lập**; **CẤM gộp 2 checkpoint khác nhau bằng "và"**. (Đã kiểm: quá gộp→rộng tay; quá băm 20–32 ý→loạn lại. 6–8 là sweet-spot.)
- **Gen model = Sonnet** (extraction từ idealAnswer đã curate, KHÔNG cần Opus) → **thầy DUYỆT/sửa** checklist trước khi lưu (bước người-trong-vòng, bắt các ý gộp/thừa).
- **Chấm model = `gemini-3.1-flash-lite`** (catalog category **Economy**, task **Grading** — không cần Balanced/Premium; test chứng minh Economy đủ). 2.5-flash-lite cũng chạy nhưng 3.1 chuẩn hơn.
- **Điểm = phủ/tổng trong code.** Câu sát ngưỡng → chấm **3 lần lấy majority mỗi ý** (khử flip hiếm như Q2).

## 4. Kiến trúc build (BE-nặng)
**A. Lưu checklist (author-time):**
- Entity interview (`mock-interview*.entity.ts` + `mock-interview-lang.entity.ts`): thêm cột **`checklist` (jsonb, `string[]`)** — per-question (và per-lang nếu idealAnswer per-lang). Migration additive (ADD COLUMN nullable) — an toàn, không enum.
- **Job gen offline:** duyệt bank → câu nào có `idealAnswer` mà CHƯA có `checklist` → gọi Sonnet (prompt §3) sinh 6–8 ý → lưu `checklist` (trạng thái "chờ duyệt"). Chạy 1 lần + khi thêm câu mới.
- **Màn thầy duyệt** (admin): xem/sửa/chốt checklist per-câu (tách ý gộp, bỏ ý thừa). Đơn giản: list + textarea per-ý.

**B. Đổi grading (grade-time):**
- `resolveSeedGroundings`: kèm `checklist` của mỗi câu (đã có `idealAnswer`, thêm field).
- `grade-mock-interview-session-prompt.service.ts`: câu **reasoning/scenario/design** (hiện "open rubric") → đổi sang **coverage per-ý theo checklist**: model trả `{items:[{n,covered}]}` cho từng câu; **KHÔNG cho model tự ra điểm phase**.
- Handler: **điểm mỗi câu = phủ/tổng × max** tính trong code (thay điểm model tự bịa). theory giữ nguyên (đã grounded). design không có seed-question per-câu → cần checklist ở cấp prompt/phase (xem §6).
- Gọi qua `AiInvokeService.run({ task: Grading, floor: Economy })` — **không curl tay như test**; catalog thêm `gemini-3.1-flash-lite` (category economy, supportedTasks grading).

**C. Fallback:** câu chưa có checklist duyệt → tạm giữ rubric cũ (không vỡ), log để gen bù.

## 5. Files to touch
- Entity: `mock-interview.entity.ts` (+`checklist`) · `mock-interview-lang.entity.ts` (+`checklist` per-lang) + migration.
- Seeder/parser: đọc `# checklist` từ `.mount` nếu author tay được (optional) — hoặc chỉ sinh qua job.
- Job + admin duyệt: `scripts/gen-interview-checklists.ts` (Sonnet) + 1 mutation/màn duyệt.
- Grading: `grade-mock-interview-session-prompt.service.ts` (prompt per-ý) · `grade-mock-interview-session-grading.service.ts` (điểm tính code) · `resolveSeedGroundings` (kèm checklist).
- Catalog: `.mount/data/ai-models/` thêm `gemini-3.1-flash-lite` (economy, grading).

## 6. Chờ thầy chốt
1. **design mode** không có seed-question per-câu (chấm theo prompt tổng + 5-phase) — checklist gắn vào ĐÂU? (đề xuất: gen checklist cho cả prompt design, chấm coverage theo đó thay 5-phase-tự-phán; hoặc giữ 5-phase cho design, chỉ áp checklist cho qna reasoning/scenario). → cần quyết.
2. Gen checklist **per-lang** (mỗi ngôn ngữ 1 checklist vì idealAnswer khác) hay **1 checklist agnostic** (đa số ý là khái niệm, không phụ thuộc lang)? (đề xuất: agnostic trừ câu code-specific.)
3. Màn duyệt: làm UI admin, hay tạm thầy sửa thẳng file/DB rồi UI sau?
4. Build 1 lượt hay chia phase (Phase 1: entity+job+gen+chấm qna reasoning/scenario · Phase 2: design + màn duyệt)?

## 7. Chi phí / tác động
- Grading rẻ hơn hoặc bằng hiện tại (Economy, ~$0.0003/câu, 1 call/câu).
- Deterministic → điểm ổn định giữa các lần (hết than "sao chấm khác").
- KHÔNG cần RAG-live/Qdrant cho phần này (đáp án = idealAnswer authored, cách 2 đã chốt thay vì grade-time RAG). RAG chỉ cần nếu sau muốn gen checklist cho câu CHƯA có idealAnswer — ngoài scope hiện tại.
