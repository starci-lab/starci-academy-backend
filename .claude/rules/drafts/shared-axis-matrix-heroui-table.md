# Draft — N item chia chung 1 TRỤC (tier/giai đoạn/tiêu chí) → ma trận HeroUI Table (trục hiện 1 LẦN), KHÔNG lặp ladder ở từng card (2026-06-26)

- File/§ đích khi `/merge`: `elements/` (table) hoặc `concepts/` + liên quan [[landing-render-track-not-course-catalog]] · [[concepts/card]] (không lặp) · [[single-source-render]] · [[tabscard-two-secondary-groups]].
- Bối cảnh: landing section "Lộ trình" ("Ba lộ trình. Một tư duy.") — 3 track (FS/SD/DevOps) mỗi card lặp lại CÙNG 1 ladder 4 tầng (FOUNDATION→INTERMEDIATE→ADVANCED→APPLICATION). Mắt thấy 3× cùng 1 thang → nặng + "một tư duy" bị NÓI chứ không được THẤY. Thầy: *"dùng heroui table"*.

## Luật (STRICT)
- **Khi N item chia sẻ CHUNG 1 trục (cùng bộ cột: tier/giai đoạn/tiêu chí so sánh) → render MA TRẬN, trục chung làm CỘT hiện ĐÚNG 1 LẦN; mỗi item 1 HÀNG.** ĐỪNG lặp lại cái scaffold chung (ladder/tier list) trong từng card — lặp = nhiễu + che mất thông điệp "chung 1 cấu trúc". Ma trận BIẾN cái chung thành trục thị giác (cột) → đọc ra ngay "cùng tư duy, khác nội dung". Cùng họ [[single-source-render]] (1 thứ chung = render 1 chỗ) + [[concepts/card]] (đừng lặp khối).
- **Ma trận = HeroUI `Table` (v3 compound), KHÔNG tự dựng grid div.** Cấu trúc: `<Table variant="primary"><Table.ScrollContainer><Table.Content aria-label><Table.Header><Table.Column isRowHeader>…</Table.Header><Table.Body><Table.Row><Table.Cell>…</Table.Body></Table.Content></Table.ScrollContainer></Table>`. Cột ĐẦU bắt buộc `isRowHeader` (React Aria). `Table.ScrollContainer` lo overflow ngang trên mobile (khỏi tự xử responsive). Canonical trong repo: `MarkdownContent/MarkdownTableParts.tsx`.
- **Cột header = nhãn trục chung** (lấy 1 lần, vd `TIERS[firstItem].map(label)`); cell thân = giá trị của item tại trục đó. Cột đầu (row-header) = identity của item (icon + tên + meta + CTA).
- **Khi nào KHÔNG dùng ma trận:** item KHÔNG chia chung trục (mỗi cái cấu trúc khác) → card thường. Trục chung nhưng chỉ 1–2 item → card cũng được. Ma trận hợp khi **≥3 item × cùng bộ cột** (so sánh/đối chiếu là mục tiêu).
- **Phân biệt với `TabsCard`/`SegmentedControl`** (chọn 1-trong-N) — ma trận là HIỂN THỊ so sánh nhiều item cùng lúc, không phải bộ chọn.

## Áp đầu (2026-06-26)
- `Landing` section "Lộ trình": 3 card lặp ladder → **HeroUI Table** (cột = 4 tầng hiện 1 lần; 3 hàng = 3 track; cột đầu = icon+title+"23 module · 20 hệ thống"+"Vào khóa →" ra course thật). Bỏ `tag`/`desc` per-card (topic theo cột gánh nội dung). i18n thêm `landing.courses.systems` ("20 hệ thống"/"20 systems"). Số "20 hệ thống" = capstone THẬT (FS/SD/DevOps đều 20 milestone — grounded). Hết lặp, "một tư duy" thành trục cột.
- **Nợ:** module/capstone count vẫn hardcode i18n — BE có `enrollmentCount`/`milestones` thật, có thể BE-driven sau (xem brainstorm). Mobile = scroll ngang của Table (chấp nhận); nếu muốn stack card riêng mobile thì thêm `md:` switch sau.
- Doc brainstorm: `features/landing/Landing/TRACKS-SECTION-UX-BRAINSTORM.md` (3 hướng A/B/C — chốt A; widget mockup đã vẽ).
