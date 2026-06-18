---
name: merge
description: >
  Audit pending FE rule drafts and fold them into the stable rule files for the MAIN StarCi Academy
  web app at `C:\Repositories\starci-academy`. Reads every `.claude/rules/drafts/*.md`, distributes
  each into the right home (general mindset/law → `main.md`; element-specific styling →
  `starci-<element>.md`), reconciles conflicts (newer wins), then deletes the merged drafts. Run ONLY
  when the user types `/merge`. Do NOT auto-merge during normal `/fe` work.
---

# /merge — Audit & fold FE rule drafts into the SSOT

Repo: **`C:\Repositories\starci-academy`**, rules at `.claude/rules/`. Trigger: user types `/merge`.

## Khi nào
CHỈ khi thầy gõ `/merge`. Trong lúc làm `/fe` bình thường, feedback/rule mới chỉ **GHI vào `drafts/`** —
KHÔNG gộp. `/merge` là bước có chủ đích để dọn drafts vào file chính.

## Quy trình
1. **Liệt kê** `.claude/rules/drafts/*.md` (bỏ `README.md`). Không có draft nào → báo "sạch, không có gì để merge" và dừng.
2. **Đọc HẾT** main.md + 6 `starci-<element>.md` + từng draft. Hiểu mỗi draft sửa cái gì.
3. **Phân loại từng draft → file đích:**
   - Mindset / luật chung / token / spacing / kiến trúc / engineering / heuristics → **`main.md`** (đúng §).
   - Styling/anatomy 1 element cụ thể (button/card/chip/dropdown/popover/tooltip) → **`starci-<element>.md`**.
   - Element MỚI chưa có file → tạo `starci-<element>.md` mới + thêm 1 dòng vào bảng index §13 của main.md.
4. **Fold + reconcile:** chèn luật vào đúng §/file; nếu mâu thuẫn luật cũ → **draft (mới) THẮNG**, sửa luật cũ cho khớp
   (đừng để 2 luật đá nhau). Giữ giọng STRICT, ngắn; **dedup** (đừng lặp ý đã có); kèm nguyên nhân gốc + cách đúng.
5. **No drift:** nếu draft mô tả thay đổi code, grep nhanh xác nhận code đã khớp (hoặc note "code chưa làm" rõ ràng).
6. **Xoá** mọi draft đã gộp (giữ `drafts/README.md`). 
7. **Báo cáo:** mỗi draft → gộp vào file/§ nào, có sửa luật cũ gì, draft nào còn giữ (nếu chưa rõ, hỏi thầy thay vì đoán).

## Nguyên tắc
- KHÔNG mất thông tin: mọi ý trong draft phải có nhà trong file chính (hoặc hỏi nếu mơ hồ).
- KHÔNG tự ý thêm luật ngoài drafts. `/merge` chỉ DI CHUYỂN + RECONCILE, không sáng tác.
- Sau merge: file chính là SSOT mới; `drafts/` trống (trừ README).
- Cập nhật memory liên quan nếu luật vừa gộp làm 1 memory cũ thành stale ([[feedback-always-update-mindset]]).
