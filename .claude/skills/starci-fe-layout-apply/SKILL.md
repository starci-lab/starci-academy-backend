---
name: starci-fe-layout-apply
description: >
  BUILD a queued layout proposal into real FE code for the MAIN StarCi Academy web app
  (`C:\Repositories\starci-academy`). Reads a `fe/proposals/<feature>.proposal.md` (produced + approved by
  `starci-fe-layout-brainstorm`) — the SPEC: flow · shell per surface · zones · state matrix · conversion lens ·
  element-aware block briefs · files-to-touch · verify plan. Builds the STRUCTURE (shell · regions · section
  placement · routing) using the REAL canonical blocks in `fe/components/` (no hand-rolling), verifies tsc/eslint +
  runtime, then marks the proposal ✅ DONE in `fe/proposals/BACKLOG.md` (the backlog) + flips `fe/features/<name>.md` ✅ +
  writes reusable layout rulings back to `fe/`. Can run in a DIFFERENT session from the brainstorm — the backlog is the
  handoff. **Apply = OPUS writes a meticulous impl-spec, then SONNET agents code it; MAY also modify the backend
  (`starci-academy-backend/src`) + `.mount` content data when the feature needs it.** Trigger when the user types
  `/starci-fe-layout-apply <feature|proposal>`, or asks to build/apply a
  queued proposal or "dựng layout đã chốt".

---

# /starci-fe-layout-apply — Build 1 proposal đã chốt thành code thật

Pha **BUILD** (tách khỏi brainstorm). Đọc 1 `proposal.md` đã chốt trong hàng đợi → dựng **STRUCTURE** đúng spec →
verify → đánh **✅ DONE** + flip features. Có thể chạy ở **session khác** với brainstorm (hàng đợi (BACKLOG) là bàn giao).

## Trước khi build
- Mở **`fe/proposals/BACKLOG.md`** (hàng đợi) → chọn 1 proposal **⏳ PENDING** (theo arg, hoặc hỏi thầy nếu nhiều). Đổi status → **🔨 IN-PROGRESS**.
- Đọc **`fe/proposals/<feature>.proposal.md`** = SPEC (flow · shell per surface · zones · state · lens · **block briefs element-aware** · **files to touch** · verify plan). Bám spec.
- Đọc nền liên quan: `fe/{layouts,components,principles}` + prototype bấm-được `fe/prototypes/<feature>.html` (đi luồng để hiểu ý đồ).

## Build — OPUS viết spec siêu kĩ → SONNET code
**Cơ chế (bake):** OPUS (main) đọc proposal + source thật → viết **IMPL-SPEC SIÊU KĨ** (file cần sửa · thay đổi CHÍNH XÁC từng chỗ · shape code · edge case · thứ tự áp) → **author 1 `Workflow`** (deterministic, phase **sonnet**: fan-out/pipeline theo spec — KHÔNG spawn agent lẻ) code ĐÚNG spec → **OPUS VERIFY** (đọc diff + tsc/lint/runtime). **Opus nghĩ (spec), Workflow-sonnet gõ.**
- Dựng theo proposal: **shell per surface + zones + section placement + routing** (route rời vs query-param mode đúng spec; hợp nhất URL scheme sibling).
- Lắp bằng **block THẬT** (block briefs), feature chỉ **GHÉP** — **KHÔNG hand-roll / tự chế primitive**. Block chưa có → tạo theo `fe/components/` (internals → `starci-fe-block-skill`).
- Mọi fetch → **`AsyncContent`**. 1 component = 1 folder `index.tsx`, props discipline.
- **ĐƯỢC sửa BACKEND + DATA nếu cần** (KHÔNG giới hạn FE): proposal cần field/resolver/gate mới → sửa `starci-academy-backend/src`; cần đổi content → sửa `.mount/data`. Spec ghi rõ đụng BE/.mount chỗ nào + **thứ tự (BE trước, FE sau)**.
- **Đụng BE → VERIFY RUNTIME THẬT** (chạy action + đọc log BE), không dừng ở "tsc FE sạch". Phân biệt bug code vs config/env-local. Ref `engineering/fe-change-touching-backend-must-verify-backend-runtime`.

## Verify (bắt buộc trước khi ✅)
- `npx tsc --noEmit` + `npm run lint` sạch.
- **Chạy app soi bằng mắt** theo **verify-plan trong proposal** (đi ma trận state + cả flow); chụp cho thầy. Build xanh ≠ chạy đúng.

## Xong → cập nhật BACKLOG + feedback (làm `fe/` LỰC HƠN)
1. `fe/proposals/BACKLOG.md`: proposal → **✅ DONE** + điền ngày Xong.
2. **Flip `fe/features/<name>.md`** ⚠️→✅ + shell/flow đã build.
3. Ruling layout **TÁI DÙNG** → `fe/layouts/` (thêm/nâng doc + "Áp đầu"). Chỉ ghi khi tái dùng thật, giữ ngắn. KHÔNG `drafts/`.
- Có thể dùng `AskUserQuestion` chốt "ghi ruling nào về fe/" (bấm chọn).

## Ràng (STRICT)
- **Bám SPEC proposal.** Lệch layout so với proposal → **HỎI / quay lại `starci-fe-layout-brainstorm`**, đừng tự đổi layout giữa chừng (brainstorm là nơi quyết, apply là nơi dựng).
- KHÔNG tự chế shell/primitive. KHÔNG đụng trang/tab ngoài scope proposal. Xoá dead code lộ ra (đã confirm không ai import).

## Liên quan
- Nguồn spec: `starci-fe-layout-brainstorm` (chốt → proposal) · block internals: `starci-fe-block-skill` · loading: skill skeleton.
- Hàng đợi: `.claude/fe/proposals/BACKLOG.md` · bản đồ DS: `.claude/fe/README.md`.
