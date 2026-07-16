---
name: starci-fe-audit-sweep
description: >
  Audit — và (tuỳ chọn) FIX — MỘT TẬP LỚN surface cùng lúc (mọi modal · mọi drawer · mọi page · mọi feature-component)
  bằng FAN-OUT workflow, tạo bản-đồ-sống `audit.md` per-surface + INDEX + theme xuyên suốt. KHÁC hẳn cặp
  `layout-brainstorm/apply` (1 flow/lần) và `block-brainstorm/apply` (1 block/lần): skill này cho quy mô N-surface
  (10→100+), là cái đóng thành quy trình từ việc đã chứng minh chạy được (137 modal/drawer fix + 89 feature-sweep
  2026-07-14). Mỗi surface = 1 agent Sonnet đọc source + 3-axis canon → ghi `.claude/fe/audits/<cat>/<slug>.audit.md`
  (trạng thái 3 trục + bảng findings + Status ⏳/✅/❌); rồi tổng hợp INDEX (stats + severity + theme A–F); rồi (tuỳ)
  fan-out FIX per-folder (skip shared-file/i18n-key/mock-BE/kiến-trúc) → verify tsc+lint gộp → sync canon. Trục-1 cơ học
  đã lint-gate ([[enforcement]]) nên audit tập trung TRỤC 2/3 (judgment). Trigger khi thầy nói "audit hết modal/drawer/
  page/feature", "quét + sửa N surface", "sweep component", "bản đồ UX toàn app".
---

# /starci-fe-audit-sweep — Quét (+sửa) N surface bằng fan-out

Quy mô LỚN, cơ học-hoá. Dùng khi phải soi/sửa **cả một lớp surface** (mọi modal, mọi feature-component…), không phải 1
cái. Đây là quy trình đóng từ việc đã làm thật — không phải thử nghiệm.

> Khung 3-trục ([[methodology/three-axis]]): audit **TRỤC 2** (block cho data) + **TRỤC 3** (shell/state/CTA) — vì
> **TRỤC 1 cơ học đã do lint gánh** ([[methodology/enforcement]]), chỉ note trục-1 khi egregious. Pattern trục-1 lặp
> lại phát hiện trong sweep → đẩy vào `fe/enforcement/lint-candidates.md` cho `starci-fe-enforce`, KHÔNG sửa tay từng chỗ.

## Khi nào audit-sweep vs skill khác
- **1 flow/trang** → `layout-brainstorm`+`apply`. **1 block** → `block-brainstorm`+`apply`. **Rule đã-ghi lệch rải rác** → `ui-patch`.
- **CẢ MỘT LỚP** (N surface, N≥~8) cần bản-đồ sống + fix hàng loạt → **skill này**.

## Quy trình

### 1. Khoanh UNIT + enumerate
Chọn đơn vị surface (folder modal/drawer, page.tsx, feature-component depth-2). `glob`/`find` ra danh sách → sinh cặp
`path|slug` (slug duy nhất, dot-separated). Phân loại thin-wrapper vs substantial nếu là page (thin → real surface ở
feature-component, ghi con trỏ, đừng audit sâu page.tsx).

### 2. Fan-out AUDIT (1 agent/surface)
`Workflow` parallel, mỗi agent (Sonnet, effort low):
- Đọc source folder (index.tsx + subcomponent) + `fe/axis-2-biz-ui/RULES.md` + `axis-3-layout/RULES.md` (+ axis-1 chỉ khi egregious).
- Ghi `.claude/fe/audits/<cat>/<slug>.audit.md` theo **TEMPLATE** (dưới). CONCRETE: file:line + rule. Trục sạch → ghi "sạch", KHÔNG bịa.
- Return `{slug, findingCount, topSeverity, summary}` (schema) để tổng hợp.
- **READ-ONLY** trên app (chỉ WRITE audit.md).

### 3. Tổng hợp INDEX
Parse kết quả (script node đọc file `.output`) → `audits/<cat>/INDEX.md`: tổng finding · severity breakdown · **theme xuyên suốt** (gom finding lặp: hand-roll→SurfaceListCard, isPending-no-spinner, thiếu AsyncContent…) · bảng high+medium actionable · con trỏ per-file. Theme = chỗ ROI cao nhất để fix gom.

### 4. (TUỲ) Fan-out FIX (1 agent/surface)
Chỉ khi thầy muốn sửa. Mỗi agent đọc audit của mình + source, áp mỗi finding ⏳:
- **APPLY** nếu contained trong folder: hand-roll→block canonical · isPending kèm `{isPending?<Spinner/>:<Icon/>}` · wrap AsyncContent (nếu hook có isLoading/error) · skeleton mirror · Callout/EmptyState/UserCell swap.
- **SKIP** (⏳ + note) nếu: đụng file SHARED ngoài folder · cần i18n key MỚI · **mock-data→nối BE** · destructive-confirm cần modal · audit ghi "hỏi thầy" · risky. **Khi nghi ngờ → SKIP.**
- Update Status ✅/⏳ trong audit.md. KHÔNG chạy tsc/lint (gộp sau). KHÔNG git.

### 5. Verify GỘP + sync
Sau fix: chạy **tsc + lint 1 LẦN** trên cả app → fix straggler (thường vài lỗi type do block-swap). Gom danh sách SKIP (shared-file / i18n / mock-BE) làm backlog coordinated pass. Sync `audits/` → canon (additive, [[feedback-canon-multisession-fetch-before-write]]) + push private.

## TEMPLATE `audit.md` (STRICT)
```
# Audit — <Name> (<type>)
> Source: `src/…`. <bối cảnh loại>. Scan <ngày>.
## Trạng thái 3 trục
- **Trục 2 (block cho data):** <✅/⚠️ N lệch>
- **Trục 3 (layout/state/CTA):** <✅/⚠️ N lệch>
- **Trục 1:** lint-gated (egregious: <none/…>)
## Findings — đề xuất (thầy feedback: ✅/❌/⏳)
| # | Trục | Vấn đề | Call-site (file:line) | Fix đề xuất | Severity | Status |
## Ghi chú
```

## Ràng an toàn (STRICT — học từ thực chiến)
- **Per-folder isolation:** mỗi fix-agent CHỈ sửa folder của mình → 0 đua ghi file giữa agent. Fix đụng file shared = SKIP.
- **KHÔNG song song 2 workflow ghi file TRÙNG** (vd gravity-migrate + fractional-fix cùng file) → tuần tự.
- **Verify GỘP 1 lần**, đừng tsc/lint mỗi agent (thrash + báo nhầm file đang sửa dở).
- **Args truyền array** cho Workflow, nhưng script phải guard `typeof args==='string'→JSON.parse` (harness đôi khi stringify).
- Slug duy nhất; nếu agent tự đặt tên file lệch → glob theo tên surface khi map.

## ★ Tự phản biện TRƯỚC khi trình
Sweep xong tự hỏi: INDEX có nêu ĐÚNG theme ROI-cao không (hay chỉ liệt kê phẳng)? Có surface nào agent chấm "clean" mà thực ra chưa đọc hết subcomponent? Fix có SKIP đúng (không tự chế BE/i18n)? Trục-1 lặp đã đẩy lint-candidate chưa (đừng sửa tay cái máy nên gánh)?

## Bàn giao / liên quan
- Pattern trục-1 lặp phát hiện → **`starci-fe-enforce`** (biến thành rule máy). · Fix 1 surface phức tạp → `layout-apply`/`block-apply`.
- Canon: `fe/audits/` (bản đồ) · `fe/enforcement/` · `fe/methodology/{three-axis,enforcement}.md`.
