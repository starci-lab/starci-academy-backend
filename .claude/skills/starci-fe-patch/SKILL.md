---
name: starci-fe-patch
description: >
  Quét code FE của app chính (`$FE_SOURCE`, branch mtp) còn viết theo CONVENTION CŨ — pattern đã
  bị `.claude/patterns/fe` (code-style FORCE) hoặc `.claude/fe` (design rules) ĐÍNH CHÍNH sau đó — rồi patch lên chuẩn
  hiện hành. Đây là rule DRIFT theo thời gian (code đúng lúc viết, rule đổi sau), KHÔNG phải tìm code trùng hay bug
  logic. ĐỌC: `.claude/patterns/fe` + `.claude/fe` (read-only, tín hiệu "Đính chính"/nhiều mốc "CHỐT") + source thật
  trong scope. GHI: patch nhỏ cơ học sửa NGAY same-session (kèm story `news` nếu block đổi hình hài); patch lớn queue
  proposal vào `.artifacts/proposals/` (trong SOURCE FE) chờ apply-skill build — TUYỆT ĐỐI không ghi `.claude/`.
  Quy trình: grep-GATE deterministic tìm marker đính chính → fan-out reader rẻ xác nhận call-site thật còn dùng
  pattern cũ (neo file:line, không đoán) → rank + patch spec. Trigger khi user gõ `/starci-fe-patch [scope]`, hoặc
  nói "patch code cũ lên chuẩn mới · sync code với rule đã đổi · dọn convention cũ · chỗ nào còn viết kiểu cũ".
---

# /starci-fe-patch — Đồng bộ code FE theo rule ĐÃ ĐỔI

Code **đúng lúc được viết, nhưng rule đã đổi sau đó** — canon có "Đính chính" hoặc mốc CHỐT mới hơn mà code chưa theo
kịp. Skill này tìm và vá đúng loại lệch đó. Không phải consolidate (code trùng), không phải quality-audit (i18n/a11y),
không phải block-brainstorm (thiết kế mới).

## Nguồn — đọc/ghi ở đâu (STRICT)
- **ĐỌC rule (read-only):** `.claude/patterns/fe` (code-style FORCE — import, naming, hook, component shape) +
  `.claude/fe` (design rules 3-trục — [[methodology/three-axis]]). **KHÔNG GHI `.claude/` trong vòng lặp.**
- **ĐỌC state:** `.artifacts/states` (fe-sync giữ, git-diff incremental) — biết block/story hiện có, KHỎI rescan `src/`.
- **GHI:** code trong `$FE_SOURCE\src` (patch nhỏ) · `.artifacts/proposals/` (patch lớn, PENDING).
- **KHÔNG search web. KHÔNG lục git log/blame để tự suy "cái nào cũ hơn"** — chỉ tin cái DOC tự ghi là đã đổi.
  Nghi rule NÊN đổi nhưng doc chưa ghi → việc của brainstorm, DỪNG hỏi thầy.

## Scope (arg)
`all` (toàn app) · `component <tên>` · `page/feature <route|tên>` · `pattern <tên rule>`. Rộng → fan-out reader per
nhóm rule đã đổi.

## Quy trình
1. **GATE deterministic (grep, không cần model):** grep marker đính chính trong `.claude/patterns/fe` + `.claude/fe`:
   - `Đính chính` — doc tự ghi "trước nói X, giờ đúng Y" → trích ngay **(signature CŨ grep được · ruling MỚI · file doc)**.
   - **≥2 mốc `CHỐT <ngày>` cùng chủ đề trong 1 file** — mốc SAU thắng, mốc TRƯỚC là legacy.
   Ra "sổ rule đã đổi" cứng TRƯỚC khi đụng source.
2. **Xác nhận call-site thật (fan-out reader rẻ):** với mỗi signature cũ, grep SOURCE trong scope → đọc quanh match,
   confirm THẬT là dùng-theo-ruling-cũ (không phải trùng tên tình cờ / đã sửa còn sót comment). Neo `file:line`.
3. **Patch-list ngầm (đầy đủ, nền):** gom theo RULE (1 rule → N call-site), rank theo *số call-site × mức lộ diện
   visual*. Ghi HẾT trong đầu/scratch — KHÔNG đổ hết ra duyệt.
4. **Trình 3-5 rule/lần:** rule nào đổi (trích đúng câu đính chính) · bao nhiêu call-site · patch cụ thể. **STOP chờ
   thầy duyệt** ([[analyze-and-approve-before-editing]] — phân tích trước, không sửa ngay).
5. **Patch khi duyệt:**
   - **Nhỏ/cơ học** (đổi prop/class/tên component/import path, ≤ vài call-site, không đổi ý nghĩa) → sửa NGAY
     same-session, tuân `.claude/patterns/fe`, verify `tsc --noEmit` + eslint. Block đổi hình hài nhìn thấy được →
     đẩy STORY `tags: ['news']` + caption "Chờ duyệt" lên Storybook cho thầy soi — **KHÔNG tự ghi `.artifacts/states`**
     (fe-sync ghi sau).
   - **Lớn** (đổi cấu trúc, rải nhiều feature, cần quyết định thêm) → ghi `.artifacts/proposals/patch-<scope>.proposal.md`
     + 1 dòng PENDING vào backlog proposals, để apply-skill build — không tự ôm.
6. **Grep lại signature cũ sau patch** — sạch hẳn khỏi scope mới đánh ✅; patch nửa vời còn sót = chưa xong.

## ★ Luật-hoá sau patch ([[methodology/enforcement]])
Patch tay = INTERIM. Mỗi rule cơ học patch xong, hỏi *"máy giữ được không?"* — chưa có dòng tương ứng trong
[[enforcement/lint-candidates]] thì log đề xuất 1 dòng (pattern cũ · cơ chế make-illegal/lint/story) để
`starci-fe-enforce` build; pattern đã lên lint ✅ thì GỠ khỏi phạm vi patch-thủ-công, đừng audit lại.

## Ràng (STRICT)
- CHỈ patch theo rule doc **tự ghi là đổi** — không nâng cấp theo "gu" riêng.
- Mọi finding neo file:line thật + trích đúng câu đính chính. Không đoán.
- Tự phản biện trước khi trình/✅: call-site có thật theo ruling cũ không? còn sót chỗ nào không?
- Không ghi `.claude/` · không đụng `.storybook/{main.ts,preview.tsx}` · không browser-verify Storybook (thầy tự soi).

## Liên quan
Patch cần layout mới → `starci-fe-layout-apply` · gói trong 1 block → `starci-fe-block-apply` · rule CHƯA ghi doc,
thầy vừa nói mồm → `starci-fe-ui-feedback` (intake) · doc tự nó bệnh (link chết/stale) → `starci-doc-audit` ·
biến rule thành máy → `starci-fe-enforce`. Hàng đợi chung: `.artifacts/proposals/`.
