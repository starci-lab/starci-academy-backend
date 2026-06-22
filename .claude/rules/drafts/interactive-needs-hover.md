# Draft — Mọi interactive element PHẢI có hover state (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (interaction states) + `main.md` §14 heuristics.
- Bối cảnh: hàng summary "Cài đặt chấm điểm" (mở drawer) ban đầu không có affordance hover → trông như text tĩnh,
  user không biết bấm được.

## Luật (STRICT)
- **Triết lý (thầy chốt): TẤT CẢ interactive element đều phải có hover state + `cursor-pointer`.** Bất cứ thứ gì
  bấm/mở/điều-hướng được — button, row mở drawer, link, chip bấm — phải có phản hồi hover VÀ con trỏ tay
  (`cursor-pointer`; `<button>` native KHÔNG tự có cursor pointer → phải thêm). Không có hover/cursor = trông như
  tĩnh = lỗi UX.
- **Hover phải kích bằng CẢ element, không phải chỉ chữ.** Bọc element bằng `group`, hiệu ứng trên con đặt
  `group-hover:*` → di chuột vào BẤT KỲ ĐÂU trong element đều trigger (không bắt user trỏ trúng chữ). CẤM đặt
  `hover:*` trực tiếp lên mỗi text con (chỉ hover khi trúng text — sai).
- **Hàng/khối đóng vai LINK → hover = underline nhãn**, KHÔNG đổi màu cả khối. Pattern: bọc khối bằng `group`, nhãn
  chính `group-hover:underline`. Phần **read-only/preview bên cạnh** (vd "TypeScript · main" + caret) giữ `text-muted`,
  **không đổi màu** khi hover (nó không phải cái user bấm vào — chỉ là hiển thị trạng thái).
- **Caret/meta của row** đặt bên phải (`justify-between`), tách khỏi nhãn bằng gap (≥`gap-2`), KHÔNG dính sát.
- **Gap trong card:** nhóm field liên quan (input + hàng cài đặt của nó) = **`gap-3`** (related content trong card),
  CTA/action tách ra **`gap-6`** (section khác). Đừng để cả card `gap-6` đều tăm tắp — input↔hàng-cài-đặt mà gap-6
  là quá xa (chúng là 1 nhóm config). Ref: [[three-tier-page-layout]] + gap rule (3 related / 6 different).
