---
name: starci-fe-consolidate-components-apply
description: >
  APPLY half of the consolidate pair (sibling of `starci-fe-consolidate-components-scan`). Reads a CONSOLIDATION
  PROPOSAL from `fe/proposals/` (produced by the scan half) — the duplicate clusters + target block (reuse existing or
  extract new) + call-sites + files-to-touch — then CONSOLIDATES: OPUS writes the exact extraction spec, SONNET creates/
  reuses the canonical `fe/components/` block and replaces EVERY call-site, then verify tsc/eslint + preview. Marks the
  proposal ✅ DONE in the backlog, **RECORDS the result to MEMORY** (how many clusters gom, block created/reused,
  call-sites replaced — for future cross-reference + reuse), and PUSHES per the canon rule (private always, public when
  business-clean). Can run in a different session from the scan. Trigger when the user types
  `/starci-fe-consolidate-components-apply <proposal|scope>`, or asks to "chốt gom component · apply consolidation · gộp
  component đã chốt".
---

# /starci-fe-consolidate-components-apply — CHỐT gom component (proposal → block, ghi memory)

Nửa APPLY. Đọc 1 consolidation proposal đã chốt → gom về block canonical → verify → ✅ DONE + ghi memory + push.

## Trước khi build
- Mở **`fe/proposals/BACKLOG.md`** → chọn 1 `consolidate-<scope>` **⏳ PENDING** → đổi **🔨 IN-PROGRESS**.
- Đọc **`fe/proposals/consolidate-<scope>.proposal.md`** (spec: cụm trùng · block đích · call-sites · files-to-touch). Bám spec.

## Build — OPUS viết spec trích → SONNET code
**Cơ chế:** OPUS đọc proposal + source thật → **IMPL-SPEC SIÊU KĨ** (block mới/tái dùng · thay CHÍNH XÁC từng call-site · thứ tự) → **author 1 `Workflow`** (deterministic, phase **sonnet**: pipeline mỗi cụm/call-site — KHÔNG agent lẻ) code đúng spec → **OPUS VERIFY**.
- **Block đích:** tái dùng → thay duplicate bằng block sẵn có; mới → trích **1 folder `index.tsx`**, props `WithClassNames`, element-aware, **KHÔNG hand-roll** (theo `fe/components/` + `starci-fe-block-brainstorm`).
- **Thay MỌI call-site** trong proposal (đừng bỏ sót → còn duplicate = gom nửa vời). Xoá code trùng cũ.
- Được sửa BE/.mount nếu block gom cần (hiếm).

## Verify (trước ✅)
- `npx tsc --noEmit` + `npm run lint` sạch. **Preview** các trang có call-site đã thay → không vỡ. Chụp.
- **★ Tự phản biện TRƯỚC khi ✅ (bắt buộc — `.claude/fe/principles/self-critique-before-presenting.md`):** gom nửa vời (còn 1 call-site chưa thay) = còn duplicate. **Grep lại signature cũ trong scope** để xác nhận đã thay HẾT, đừng tin "đã thay mọi call-site" theo lời kể. Hỏi thẳng *"còn call-site nào tôi bỏ sót · block gom có phá behavior chỗ nào không?"* trước khi đánh DONE.

## Xong → BACKLOG + MEMORY + push
1. `fe/proposals/BACKLOG.md`: proposal → **✅ DONE** + ngày. Đánh **✅ 3 cụm vừa gom** trong `fe/proposals/consolidate-<scope>.plan.md` (plan ngầm) → re-scan tự lấy 3 cụm ⬜ tiếp.
2. **GHI MEMORY (bắt buộc):** *đã gom N cụm · block [tên] tạo/tái dùng · M call-sites thay · scope.* → để **lần sau đối chiếu, không gom lại + tái dùng** (rule always-update-mindset).
3. Nếu tạo/đổi block canon → cập nhật `fe/components/<block>.md`.
4. **PUSH:** sửa canon → **private ngay**; sạch business → **public** (rule `.claude/CANON.md`).

## Ràng
- Bám SPEC proposal — muốn gom khác → quay lại `starci-fe-consolidate-components-scan`. Chỉ gom thật-sự-trùng (ngữ nghĩa > hình).

## Liên quan
- Nguồn proposal → `starci-fe-consolidate-components-scan` · block build → `starci-fe-block-apply` · rà sau gom → `starci-doc-audit` · hàng đợi `fe/proposals/BACKLOG.md`.
