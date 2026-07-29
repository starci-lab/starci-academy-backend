# S5 — Output + đề xuất batch (STOP)

Ghi report → `$FE_SOURCE/.artifacts/audits/primitives-canon-audit-<date>.md` (bảng A/B/C/D từ S4 + neo journal workflow cho per-primitive detail).

**Report-only — KHÔNG sửa code.** Đây là BẢN ĐỒ để thầy chọn batch.

## Cách BATCH apply (lane khác, thầy chốt từng cái)
- **Refactor compose / §6 fold** (HIGH) → dựng/mở rộng foundational TRƯỚC (vd thêm `iconOnly` vào base Button), rồi **workflow fix** family (mỗi member 1 agent compose, verify eslint). Làm nhóm HIGH TRƯỚC.
- **spacing / icon-ownership** (cơ học, N primitive) → codemod hoặc 1 workflow sweep.
- **1 primitive lẻ khó** → `starci-fe-story-fix-block-{plan,apply}` (plan→duyệt→apply).

## LƯU Ý xuyên suốt
- **Storybook-first**: mọi fix ở PORT (`.storybook`); **src-sync là bước SAU** (đừng lẫn vào audit/fix port).
- **Nền chung file phải sửa TRƯỚC, tuần tự** (vd base Button `iconOnly`) rồi mới fan-out các consumer (parallel an toàn vì đọc-only nền + ghi file riêng).
- Verify sau workflow: eslint (agent tự chạy own-files) + **tsc TOÀN CỤC do parent chạy 1 lần** (bắt lỗi cross-file agent không thấy).
