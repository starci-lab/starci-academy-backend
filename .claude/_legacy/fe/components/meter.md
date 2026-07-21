# Element — Meter / Progress bar (`ProgressMeter`, `SegmentBar`)

> Element doc cho THANH TIẾN ĐỘ (1 giá trị tới 1 mốc, hoặc N phần chia sẻ 1 tổng). Đây là API/da của component;
> QUY TẮC KHI NÀO 1 meter được phép rỗng/mặc định target đã chốt ở [[meter-tracks-out-of-box-default-target]]
> + [[progress-block-growing-quantity-headline-not-vanity-strip]] — đọc 2 file đó trước khi thiết kế 1 meter
> mới, file này chỉ tả 2 BLOCK render.

## `ProgressMeter` (`blocks/stats/ProgressMeter`) — 1 thanh, 1 giá trị/1 mốc
- `{ value, max=100, label?, showValue?, color?: "accent"|"success"|"warning"|"danger" }`. Top-row (label +
  `%` bo tròn) CHỈ render khi có `label` HOẶC `showValue` — không chèn hàng trống.
- **`color` mặc định `accent`; đổi sang `success`/`warning`/`danger` khi CHÍNH GIÁ TRỊ mang nghĩa semantic**
  (vd điểm số theo ngưỡng đạt/cận/chưa) — KHÔNG đổi color tuỳ hứng trang trí.
- `max` guard `<= 0` → fallback `1` (tránh `NaN`/`Infinity`); `%` luôn `Math.round`.
- `aria-label` = `label` khi là string, else fallback `"Progress"` — luôn truyền `label` string để a11y tốt.
- **1 THANH TẠI 1 THỜI ĐIỂM cho 1 cụm** — đừng lặp `ProgressMeter` cho MỌI item/group cùng lúc trong 1 list.
  Ref [[one-progress-bar-at-a-time]] (dead-link tên gọi — nội dung thật sống ở [[list]] §5d: group mở = 1
  thanh, group gập = chỉ "n/m" muted).
- **`target?` + `targetLabel?` — MỐC mục tiêu trên track, render qua sub-component `ProgressMeterTargetMark` (CHỐT 2026-07-18):**
  meter có mốc "coi như đạt" (vd 85% retention, 80% coverage, pass-bar 70) → truyền `target` (+ `targetLabel` ngắn
  như `"85%"`). Marker tách **component riêng** `blocks/stats/ProgressMeter/TargetMark` (thầy: *"màu đỏ tách thành
  component riêng"*), KHÔNG vẽ tay overlay trong meter. Anchor = **pill dọc `w-1 h-5 rounded` + `bg-surface` +
  `border border-default` hairline** (thầy chốt cỡ + màu; KHÔNG `w-px bg-foreground/40` như bản cũ) — pill cao hơn
  bar (`h-5` vs track `h-1`) nên đọc như 1 "khấc mốc", `bg-surface` cắt sạch qua fill/track bất kể band màu, hairline
  để nổi trên track sáng + trong vùng overshoot (nằm trên `bg-surface` của card). Center dọc `top-1/2 -translate-y-1/2`,
  center ngang `-translate-x-1/2` tại `target/max %`. **Chống overlap:** khi có `targetLabel`, meter thêm `mt-5` chừa
  chỗ label nổi → cao hơn 1 tí, label KHÔNG đè caption phía trên (thầy: *"component này cao hơn 1 tí tránh overlap với
  text"* — ca `VerdictHeroCard` review, label "85%" đè "Tỷ lệ nhớ…"). Áp: 3 hero `VerdictHeroCard` (review/quiz/interview).
  - **Đính chính (2026-07-18, cùng ngày):** (1) **màu pill = `bg-accent`, KHÔNG `bg-surface`** (thầy đảo: *"để màu accent
    được k?"*) — mốc mục tiêu là 1 tông brand trung tính, tách khỏi band màu-giá-trị của fill (danger/warning/success),
    đọc là "vạch cần chạm" chứ không phải 1 giá trị nữa; accent solid đủ nổi → bỏ luôn hairline `border-default`.
    (2) **Center nấc ĐÚNG trên track:** bản đầu pill lệch LÊN trên (thầy: *"nấc này ở giữa"*) vì `.relative` cao bằng BOX
    của `ProgressBar` (> track `h-1`) nên `top-1/2` rơi phía trên vạch. Fix: khi có target, hàng bar ép `flex h-5 items-center`
    (bằng chiều cao pill) + bar bọc `<div className="w-full">` → pill `h-5` trùng đúng tâm track.

## `SegmentBar` (`blocks/stats/SegmentBar`) — 1 thanh chia N MÀU theo tỉ lệ (GitHub-style)
- `{ segments: {key,label,value,color?}[], ariaLabel, max?, hideLegend? }`. Track `bg-default` (KHÔNG
  `bg-muted` — remainder/track phải nhạt, đúng [[progress-block-growing-quantity-headline-not-vanity-strip]]).
- **2 CHẾ ĐỘ theo `max`:** truyền `max` → width = `value/max` thật (có phần dư trống = "progress" — vd N/M
  task xong); bỏ `max` → width = share-of-each-other, LUÔN lấp đủ 100% (mix bar thuần tỉ lệ, vd phân bố ngôn
  ngữ). Chọn đúng ý nghĩa — đừng để pure-mix bar trông như progress có phần dư.
- Màu mặc định theo `PALETTE` (accent→success→warning→danger→muted) khi segment không truyền `color` riêng.
- Legend built-in (`dot + label · value`) dưới bar — tắt bằng `hideLegend` khi dùng `Legend` (`metric.md`)
  tách riêng cho nhiều bar chung 1 thang.
- `role="img"` + `aria-label` trên chính track — segment không đọc riêng lẻ cho screen reader (đọc gộp qua
  `ariaLabel` mô tả tổng).

## `CourseProgressBar` (`blocks/stats/CourseProgressBar`) — N dimension KHÁC ĐƠN VỊ, làn bằng nhau (CHỐT 2026-07-14)
- **Khi nào KHÔNG dùng `SegmentBar` mà dùng cái này:** các "phần" muốn gộp chung 1 bar là **đại lượng khác
  đơn vị, chênh lệch quy mô lớn** (vd course progress: content/challenge/milestone — content_total=87 vs
  challenge_total=329 vs milestone_total=100). `SegmentBar` chia width theo tỉ lệ value/shared-total →
  dimension nhỏ (content) bị nén dưới 1px, trình duyệt vỡ hình thành mấy chấm rời rạc thay vì 1 bar liền.
- **API:** `{ dims: {key,label,completed,total,color?}[], ariaLabel, hideLegend? }`. `total <= 0` → dimension
  đó KHÔNG render lane (không phải lane rỗng 0-width).
- **Cấu trúc:** **1 track LIỀN `bg-default`** (giữ đúng [[progress-block-growing-quantity-headline-not-vanity-strip]]
  — track vẫn nhạt, KHÔNG đổi tone) chia thành **N lane RỘNG BẰNG NHAU** (`flex-1` mỗi lane, không phải
  theo tỉ lệ total) — mỗi lane tự fill theo tỉ lệ `completed/total` CỦA RIÊNG NÓ (vẫn honest, không thổi
  phồng so với tổng của chính dimension đó). Lane cách nhau bằng **`border-l border-default`** (viền mảnh,
  KHÔNG phải `gap`) — giữ track đọc LIỀN 1 khối; dùng `gap` (khoảng hở để lộ nền trang) làm track vỡ thành
  từng pill cô lập khi tỉ lệ fill thấp (nền lane hoà vào nền trang qua khoảng hở).
- **Đính chính trong-phiên (2026-07-14):** bản đầu dùng `gap-0.5` + mỗi lane tự `rounded-full bg-default`
  riêng — TRÔNG ĐÚNG trên giấy (mỗi lane vẫn có track riêng) nhưng THỰC TẾ vỡ y hệt lỗi ban đầu vì lane
  không có gì phân biệt với nền trang khi phần fill quá nhỏ (chỉ còn 1 chấm màu nổi, phần track "rỗng" của
  lane biến mất thị giác). Fix: bỏ gap, dùng `border-l` để track luôn đọc liền mạch bất kể tỉ lệ fill.
- Legend/màu mặc định giống `SegmentBar` (dot + label · completed, `PALETTE` accent→success→warning...).
- Áp đầu: `CourseRow` (dashboard "Khóa học của tôi") + `OverviewCourses` (public profile) — trước đó cả 2 tự
  chế `max = tổng 3 total` đưa vào `SegmentBar`, y hệt lỗi, đã hợp nhất về 1 block này.

> Block: `blocks/stats/{ProgressMeter,SegmentBar,CourseProgressBar}`

## Liên quan
- [[meter-tracks-out-of-box-default-target]] (meter phải chạy out-of-box, không rỗng chờ config) ·
  [[progress-block-growing-quantity-headline-not-vanity-strip]] (track nhạt = `--default`, không `--muted`;
  1 meter có nghĩa > N số ngang hàng) · `metric.md` (số tĩnh, không progress) · [[list]] §5d (1 thanh/lúc
  trong list).
