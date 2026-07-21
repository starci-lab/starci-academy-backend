# Concept — KHÔNG chữ HOA (uppercase) trừ khi thầy duyệt

> Heuristic typography (họ `concepts/*`). Thầy chốt 2026-06-24: "rules không có chữ hoa nào thầy cho phép thì thôi".

## Quy tắc (STRICT)
- **CẤM `uppercase` / `text-transform: uppercase` / ALL-CAPS** trong UI — nhãn, eyebrow, tiêu đề tooltip, section label, chip, badge… để **sentence case / chữ thường** như i18n gốc.
- **Không tự ý viết HOA** (kể cả eyebrow "CHI TIẾT GIÁ", "QUẢNG CÁO", section caps) — chỉ dùng khi **thầy duyệt riêng** cho chỗ đó.
- Phân cấp nhãn phụ → dùng **cỡ nhỏ + muted** (`text-xs text-muted`), KHÔNG dùng uppercase để "ra vẻ label". (Ref [[challenge-section-labeledcard-quiet-eyebrow-icon-once]]: eyebrow câm = nhỏ + mờ, không hoa.)

## Áp đầu (2026-06-24)
- `PriceTag` tooltip title "Chi tiết giá": bỏ `uppercase tracking-wide` → chữ thường. Quét các chỗ `uppercase` khác khi đụng.
