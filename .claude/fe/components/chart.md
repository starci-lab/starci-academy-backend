# Element — Chart (trend over time: `recharts` `BarChart`)

> Element doc cho biểu đồ XU HƯỚNG THEO THỜI GIAN (N điểm dữ liệu, mỗi điểm 1 mốc thời gian) — khác `meter.md`
> (tiến độ tới 1 mục tiêu tại 1 thời điểm) và `metric.md` (số tĩnh không có trục thời gian).

## Quy tắc — DÙNG `recharts`, KHÔNG hand-roll `<div>` height-percent bars

- **Từng có 2 lần hand-roll "sparkline" bằng `<div style={{height: pct%}}>` xếp cạnh nhau** (`FlashcardQuizStats`,
  rồi copy sang `FlashcardReviewStats`) — thầy chỉ ra (2026-07-09): *"cái này có vô nghĩa quá không, xu hướng này
  là cái gì đây? dùng recharts vẽ chart dc không"*. Hand-roll bar không có trục/tooltip/label → không đọc được
  GIÁ TRỊ THẬT của từng điểm, chỉ là "hình khối trang trí" — đúng là vô nghĩa.
- **`recharts` đã là dependency có sẵn** (`AiUsageHistory` dùng từ trước cho biểu đồ chi tiêu/ngày) — dùng lại
  NGAY, đừng hand-roll lần nữa. Cấu trúc chuẩn (copy từ `AiUsageHistory`, áp lại ở `FlashcardReviewStats`):

```tsx
<div className="h-44 w-full text-accent">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-divider" vertical={false} />
      <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
      <Tooltip cursor={{ fill: "currentColor", opacity: 0.08 }} formatter={(value) => [`${value} ...`, ""]} />
      <Bar dataKey="value" fill="currentColor" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
```

- **Theming qua `currentColor`, KHÔNG hardcode hex** — wrapper `div` đặt `text-accent` (hoặc token khác), mọi
  `stroke`/`fill` bên trong đọc `currentColor`; `CartesianGrid` đọc màu qua class `text-divider` riêng (grid nhạt
  hơn bar chính) — giữ theme sáng/tối tự động, không cần biến thể riêng.
- **Trục ẩn line (`axisLine={false}` + `tickLine={false}`), chỉ giữ tick label** — chart đọc "nhẹ" (KHÔNG khung
  đậm bao quanh như chart mặc định của thư viện).
- **`Tooltip.formatter`** LUÔN trả nhãn có ĐƠN VỊ ("12 thẻ", "5 credits") — không để số trần khi hover, đọc mơ hồ.
- Bọc trong `LabeledCard` (label = tên trục/ý nghĩa của trend), height cố định `h-44` (đủ đọc, không chiếm quá
  nhiều màn hình cho 1 sparkline phụ).

## Khi nào KHÔNG cần chart thật
- N ≤ 2-3 điểm dữ liệu / không có trục thời gian rõ ràng → dùng `StatPair`/`MetricCard` (`metric.md`) thay vì ép
  vào 1 chart trống trải.

> Block: `recharts` (`BarChart`/`ResponsiveContainer`/`CartesianGrid`/`XAxis`/`YAxis`/`Tooltip`/`Bar`), áp đầu
> `AiUsageHistory` (chi tiêu/ngày) + `FlashcardReviewStats` (số thẻ đã ôn/phiên).

## Liên quan
- `meter.md` (tiến độ tới mục tiêu, không phải chuỗi-theo-thời-gian) · `metric.md` (số tĩnh, không trục thời
  gian) · `list.md` (khi trend đi kèm 1 list breakdown bên dưới — vd "theo bộ thẻ" — xem §"Nguyên tắc chọn
  block": list click-được → `SurfaceListCard`, không hand-roll `<div>` row).
