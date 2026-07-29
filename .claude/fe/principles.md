# ⛔ FILE NÀY ĐÃ CHẾT — 2026-07-29. Đây là BẢN ĐỒ CHUYỂN HƯỚNG, không phải canon.

> **Đừng đọc file này để lấy luật. Đừng thêm luật mới vào đây.**
>
> Nội dung cũ (1 408 dòng) đã rã hết sang `principles/` và `rules/`. Bản gốc vẫn nằm trong git
> nếu cần tra sử:
>
> ```bash
> git show 34006466b:.claude/fe/principles.md
> ```
>
> File được giữ lại dưới dạng bản đồ **chỉ vì còn 86 chỗ trong canon và skill trỏ vào nó**. Xoá
> thẳng sẽ để lại 86 link chết, trong đó 10 file là SKILL mà agent nạp lúc chạy. Khi mọi tham
> chiếu đã chuyển sang địa chỉ mới thì file này mới được xoá.

---

## Vì sao phải giết nó

Ba lý do đo được, không phải ý kiến:

1. **Nó nói NGƯỢC code hiện tại.** `§12a` liệt `Typography.{Xs,Sm,Base,Lg}` là mẫu ĐÚNG, trong
   khi namespace đã bị `check-no-namespace.mjs` **cấm hẳn**. `§5a` chốt caret điều hướng
   `size-3` cố định, trong khi **5/5 call-site sống** đều là `size-4` + `weight="bold"`.
2. **Nó trích sai chính nguồn nó viện dẫn.** `§9d` nói Tier A "luôn `bold`" và dẫn
   `PricingCard:108` + `MetricCard:67` làm bằng chứng — đọc lại hai file đó thì cả hai đang là
   `semibold`.
3. **Nó dài tới mức không ai đọc hết**, nên luật trong đó không được thi hành, chỉ được trích
   lẻ tẻ. Đó đúng là bệnh mà bộ `principles/` sinh ra để chữa: mỗi trục một file ngắn, nạp đúng
   cái đang cần thay vì nạp tất cả.

---

## Bản đồ: § cũ nằm ở đâu bây giờ

### Sang `principles/<trục>/` — các câu "CHỌN GIÁ TRỊ NÀO"

| § cũ | Nội dung | Địa chỉ mới |
|---|---|---|
| `§10` `§10a` `§10b` | thang khoảng cách, ai sở hữu seam, ma trận quan hệ | [`principles/seam/`](principles/seam/context.md) |
| `§10b` (padding) `§10c` | lề trong, thang token | [`principles/inset/`](principles/inset/context.md) |
| `§9b` `§9c` `§9d` | cỡ chữ, độ đậm, hệ 4 tier A-D và ngoại lệ Modal | [`principles/text/`](principles/text/context.md) |
| `§9a` `§9a.1` | màu chữ, phép thử hai lớp | [`principles/color/`](principles/color/context.md) |
| `§2` `§2a` `§2b` `§2c` `§2d` | thang nổi-chìm `muted → accent → chip → button`, luật chip | [`principles/prominence/`](principles/prominence/context.md) |
| `§15` `§15a`-`§15d` | variant nút, mô hình 4 tầng, ghost so với tertiary | [`principles/button/`](principles/button/context.md) |
| `§5` `§5⃣0` `§5a` `§5b` `§5c` | bộ icon, size theo vị trí, weight theo size, icon quốc dân | [`principles/icon/`](principles/icon/context.md) |
| `§6c` (`parseInlineCode`) | ba tầng markdown: title · richtext nhỏ · bài viết | [`principles/markdown/`](principles/markdown/context.md) |
| `§13` `§13a`-`§13d` `§13z` | chọn khung, chiều phụ thuộc frame lên atom | [`principles/frame/`](principles/frame/context.md) |
| `§12c` `§12g.0` `§12g.0a` | ai sở hữu skeleton, hình shimmer, vị trí nhánh so với hook | [`principles/skeleton/`](principles/skeleton/context.md) |
| `§1` `§1a` `§1b` `§4a` | surface lồng surface, bán kính đồng tâm | [`principles/surface/`](principles/surface/context.md) |
| `§7` `§7a` `§7b` | phản hồi khi bấm: scale · ripple · underline, ROW khác CARD | [`principles/press/`](principles/press/context.md) |
| `§3` | căn lề chữ và căn vị trí khối | [`principles/reading-flow/`](principles/reading-flow/context.md) |
| *(rải rác, chưa từng có mục riêng)* | rỗng · lỗi · đang tải | [`principles/async/`](principles/async/context.md) |
| `§12a` `§13a` (namespace) | đặt tên component · story · type · file | [`principles/naming/`](principles/naming/context.md) |

### Sang `rules/` — các câu "ĐÚNG hay SAI"

| § cũ | Nội dung | Địa chỉ mới |
|---|---|---|
| `§0` | `.storybook` là bản vẽ, `src` là công trình. Ai được ghi vào đâu | [`rules/0-boundary.md`](rules/0-boundary.md) |
| `§6` `§6a.1` `§6c` `§11` | tách cây, ai import ai, cây anatomy | [`rules/1-decompose.md`](rules/1-decompose.md) |
| `§14` `§12f` | leaf hay state, ai sở hữu state | [`rules/2-leaf-states.md`](rules/2-leaf-states.md) |
| `§12b` `§12d` `§12e` `§13c` | hợp đồng prop của atom, cấm `children`, `variant` và `size` là hai trục | [`rules/3-shape-tier.md`](rules/3-shape-tier.md) |
| `§12a` `§13a` | khuôn file, đặt tên, bỏ namespace, dao gác | [`rules/4-organization.md`](rules/4-organization.md) |

---

## Ba luật đã SỬA khi rã, đừng chép lại bản cũ

| Luật trong bản cũ | Sự thật đo được 2026-07-29 | Đã ghi ở |
|---|---|---|
| namespace `Typography.{Xs,Sm}` là mẫu ĐÚNG | namespace bị `check-no-namespace.mjs` cấm hẳn, đã flatten hết | `principles/naming/` · `rules/4` §3b |
| caret điều hướng `size-3` cố định | 5/5 call-site sống dùng `size-4` + `weight="bold"`; `size-3` chỉ còn ở `_legacy` | `principles/icon/` §4 |
| Tier A "luôn `bold`" | 2/4 neo mà chính nó dẫn ra đang là `semibold` — chưa chốt lại | `principles/text/` (đánh dấu chờ thầy) |

---

## Bắt đầu từ đâu

Đọc [`principles/INDEX.md`](principles/INDEX.md) — nó ngắn có chủ đích, và có bảng
"đang phân vân về gì thì mở file nào". Nạp file đó mỗi lượt; chỉ mở trục nào đang chạm tới.
