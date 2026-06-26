# Concept — KIỂU hover khớp BẢN CHẤT của target: go-there→underline · user→opacity · stay-here→fill

> Heuristic (họ `concepts/*`). Bổ sung [[interactive-needs-hover]] (MỌI interactive cần hover) — luật này nói **hover KIỂU GÌ**. Rút từ TopLearners (user → opacity) + course row (nav → underline, không fill); thầy chốt 2026-06-25: *"hover bg đổi màu chỉ áp dụng cho accordion thôi"*.

## Quy tắc (STRICT)
- **Hover affordance phải phủ ĐÚNG vùng click + hợp BẢN CHẤT HÀNH ĐỘNG — không một-cỡ-cho-tất-cả.** Trục phân loại = *hành động này GO-THERE (điều hướng đi) hay STAY-HERE (mở/chọn tại chỗ)?* + *target gồm gì?*. 3 mode:

  1. **GO-THERE = LINK điều hướng → underline TITLE** (`group-hover:underline`), KHÔNG fill. Gồm cả: (a) link chữ thuần (vd "Nổi bật tuần này", post title); (b) **cả-dòng-click điều hướng tới X** (vd course row → trang khóa, dù bấm đâu trong dòng cũng đi) — vẫn **underline nhãn**, bọc `group`, KHÔNG tô nền cả dòng. Cả dòng click được ≠ được tô nền; nó là 1 link → underline.
  2. **USER = avatar + tên (1 cụm, link → profile) → opacity mờ CẢ CỤM** (`transition-opacity hover:opacity-60`), style **plain text** (`text-foreground no-underline`). Vì user = ẢNH + CHỮ → chỉ opacity mới mờ ĐỀU cả hai; underline chỉ ăn chữ (avatar trơ) = sai; fill cả dòng cũng sai. Canonical = `reuseable/LeagueRow` identity.
  3. **STAY-HERE = ACCORDION / SELECT-tại-chỗ → fill nền** (`hover:bg-default` = da accordion surface). Chỉ cho: accordion trigger (mở/gập), hoặc row "chọn-tại-chỗ" mang **da accordion** (vd payment method — chọn cổng, không rời surface). Thầy: **"hover bg đổi màu chỉ áp dụng cho accordion thôi"** → fill = đặc quyền của accordion(-skin), KHÔNG dùng cho nav row.

- **Bẫy hay gặp:** "cả dòng click được" → tưởng phải fill. SAI. Hỏi *click xong đi ĐÂU?*: điều hướng SANG trang khác (nav) → **underline** (mode 1); mở/chọn TẠI CHỖ (accordion/select) → **fill** (mode 3). Course/lesson/post row = nav → underline. (Đính chính bản trước ghi "course row = fill".)

- **Style "link" của user/nav KHÔNG để màu link/underline mặc định.** HeroUI `Link` mặc định `text-link` + `:hover underline` (unlayered). User identity ép `text-foreground no-underline` (chỉ opacity). Nav row giữ chữ thường + chỉ `group-hover:underline` title khi hover (không phải link xanh/hồng gạch-chân thường trực).

## Impl block
- `SurfaceListCardItem` / `SurfaceListCardRow` có prop **`hover: "fill" | "underline"`** (default `fill`). `underline` → row thành `group` (KHÔNG fill), feature tự `group-hover:underline` title. `fill` → `hover:bg-default` (accordion skin, cho select/payment). Style ở block; feature chọn mode.

## Áp đầu (2026-06-25)
- `TopLearners`: user `<Link>` → `text-foreground no-underline transition-opacity hover:opacity-60` + tên `<span>` plain. Mirror `LeagueRow`.
- `CourseRow` (dashboard Khóa học): `SurfaceListCardItem hover="underline"` + title `group-hover:underline` (bỏ fill). Thầy: *"cái này cũng underline được không, hover bg chỉ cho accordion thôi"*.
- Trending title = underline (mode 1). Payment method row = fill (mode 3, select-tại-chỗ). Ref [[surfacelistcard-item-interactive-and-uniform-count-drop]].
