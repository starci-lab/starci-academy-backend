# Concept — KHÔNG emoji trong UI

> Heuristic (họ `concepts/*`). Thầy chốt 2026-06-24: bỏ emoji cờ/quả-địa-cầu khỏi nhãn công tắc tiền tệ.

## Quy tắc (STRICT)
- **KHÔNG dùng emoji trong text/nhãn UI sản phẩm** (label, tab, button, chip, i18n string, heading…). Emoji render lệch theo OS/font, trông thiếu chuyên nghiệp, không theo design system. Vd nhãn tiền tệ để "Trong nước · VND" / "Quốc tế · USD", KHÔNG "🇻🇳 …" / "🌐 …".
- **Cần biểu tượng → dùng ICON phosphor** (`@phosphor-icons/react`, `*Icon`) đặt cạnh text, KHÔNG emoji. Icon theo token màu/size của hệ, nhất quán. (Vd cần cờ/quốc tế → `GlobeIcon`; nhưng cân nhắc có THẬT cần icon không — nhiều khi chữ là đủ.)
- **i18n string KHÔNG chứa emoji.** Giữ message thuần chữ; trang trí (icon) là việc của component, không nhét vào bản dịch.

## Áp đầu (2026-06-24)
- `PaymentModal` công tắc tiền tệ: bỏ `🇻🇳`/`🌐` khỏi `payment.currency.{vnd,usd}` (vi + en) → chỉ còn chữ. Ref [[payment-currency-toggle-and-price-breakdown]].
