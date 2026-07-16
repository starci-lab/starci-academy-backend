# Element — Back link (block `BackLink`)

> Element doc NGẮN — hành vi/khi-nào-dùng đầy đủ đã ở [[header]] §3. File này là entry point tra theo tên
> block + API cụ thể.

## Khi nào dùng
- Trang LEAF ("giải/làm/xem-kết-quả 1 item" — challenge solve, submission result, view edit/compose) nơi
  breadcrumb-chain generic dừng giữa chừng (vô nghĩa) → 1 `BackLink` duy nhất thay breadcrumb, đặt vào slot
  `breadcrumb` của `PageHeader`. Trang ĐỌC/duyệt bình thường → dùng `ResponsiveBreadcrumb`/chain thật
  (xem `breadcrumb.md`), KHÔNG `BackLink`.

## Quy tắc
- **API:** `{ label?, target?, onPress }`. Bỏ trống hết → nhãn generic **"Trở lại"** (`common.goBack`);
  truyền `target` → **"Trở lại {target}"** (`common.goBackTo`); truyền `label` → override trọn nhãn (câu legacy
  cụ thể như "Quay lại thử thách"). `onPress` — caller sở hữu routing, block không tự push router.
- **Da: quiet text link (`text-muted`), KHÔNG pill/Button, KHÔNG `text-accent`** — back-link không thuộc 4
  vai accent ([[accent-system]] §2/§4: accent = CTA/đang-chọn/brand/của-tôi, "lùi" không phải 1 trong 4).
- **Hover = mode go-there** ([[hover-style-matches-clickable-nature]]): arrow `ArrowLeftIcon` trượt TRÁI
  (`group-hover:-translate-x-1`) + label UNDERLINE (`group-hover:underline`) — KHÔNG fill nền.
- **1 affordance lùi DUY NHẤT** trên trang leaf — không kèm breadcrumb-chain khác, không thêm action-button
  bên phải cạnh nó.

> Block: `blocks/navigation/BackLink`

## Liên quan
- [[header]] §3 (đầy đủ: khi nào back-link thay breadcrumb, sub-view dùng crumb trung gian thay vì back-link
  riêng) · [[hover-style-matches-clickable-nature]] (mode go-there) · [[accent-system]] (back không nhận
  accent) · `breadcrumb.md`.
