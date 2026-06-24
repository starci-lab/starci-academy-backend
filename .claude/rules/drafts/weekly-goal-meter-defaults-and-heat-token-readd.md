# Draft — Goal/progress meter có DEFAULT target (chạy out-of-box) + re-add `--heat-*` token (heatmap mất màu) (2026-06-25)

- File/§ đích khi `/merge`: `concepts/` (meter/progress) + **đính chính/nhắc lại** [[heatmap-trong-la-bug-token-khong-redesign]] + [[progress-block-growing-quantity-headline-not-vanity-strip]].
- Bối cảnh: dashboard. Thầy: *"hoạt động học mất màu"* (heatmap trắng) + *"thêm progress line để track tiến độ"* + *"có học thì progress có chạy chứ?"* → chốt **thêm target mặc định**.

## Luật 1 — Goal/progress meter phải TRACK OUT-OF-BOX (default target), không để rỗng chờ config
- **Meter "tiến độ tới mục tiêu" (weekly goal, KPI…) KHÔNG được rỗng/đứng im chỉ vì user CHƯA tự đặt target.** Đặt **default target hợp lý** → có hoạt động là bar chạy ngay (current/target), user vẫn override được qua "Sửa". Trống-chờ-config = user tưởng "hỏng/không chạy" (thầy: *"có học thì progress có chạy chứ?"*).
- **Logic chuẩn:** `current` = hoạt động THẬT (BE tính, tăng khi học); `target` = mục tiêu (custom HOẶC default); `percent = current/target`. `effectiveTarget = item.target ?? DEFAULT[key]` → bar + display (`current/target`) + composite (summary %) đều dùng effective → nhất quán + luôn chạy.
- **Default đặt ở đâu:** lý tưởng BE (single source → editor "Sửa" cũng thấy). Tạm FE-only (`DEFAULT_KPI_TARGETS` trong feature `map.tsx`) cho nhanh — chấp nhận editor hiện trống tới khi user set (dashboard vẫn chạy default). Ghi nợ: BE nên expose default để đồng bộ editor.
- **Bar render reliable = div thường** (`h-1.5 rounded-full bg-default` track + `bg-accent` fill `style=width:%`), KHÔNG phụ thuộc HeroUI `ProgressBar` compound (đỡ rủi ro style không ăn theo ngữ cảnh). Luôn render (track + fill), fill `min(current/target,1)*100%`.

## Luật 2 — Heatmap/element "mất màu" = token CSS BIẾN MẤT → re-add, đừng redesign (nhắc lại)
- `--heat-0..4` (globals.css, dùng bởi `ContributionCalendarView` qua `bg-[var(--heat-N)]`) **lại bị mất** khỏi globals.css (regression — globals bị rewrite/parallel-edit) → heatmap trắng. **Re-add** vào CẢ light (`:root,.light…`) LẪN dark (`.dark,[data-theme=dark]`) block (ramp pink hue 354, `--heat-0 = var(--default)` track rỗng → 1→4 tăng dần). Đúng họ [[heatmap-trong-la-bug-token-khong-redesign]] (nghi bug token trước khi redesign). ⚠️ Token này hay bị mất khi globals bị động vào — kiểm `grep --heat src/app/globals.css` (phải = 10: 5 light + 5 dark).
- Tailwind v4: `bg-[var(--heat-N)]` arbitrary → chỉ cần `--heat-N` định nghĩa ở `:root`/`.dark`, KHÔNG cần khai trong `@theme`.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `globals.css`: re-add `--heat-0..4` (light + dark). `WeeklyGoals` + `map.tsx`: `DEFAULT_KPI_TARGETS` (lessons 5·studyDays 5·challenges 3·coding 3·flashcards 20); effective target cho bar/display/composite; bar custom div (bỏ HeroUI ProgressBar); summary luôn hiện %; item gap-2→**gap-3**. tsc/eslint sạch.
