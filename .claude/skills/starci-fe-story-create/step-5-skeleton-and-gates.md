# B5 — SKELETON + CỔNG

> **Trục nạp:** [`skeleton`](../../fe/principles/skeleton/context.md)
> **Phạm vi:** cả màn, một lần, sau khi mọi component đã qua B3 và B4.

`skeleton` đứng cuối **có chủ ý**: shimmer là **soi gương một hình**, nên hình phải chốt xong
trước. Viết skeleton lúc hình chưa ổn định là cách sinh ra bug sống nhiều tháng.

---

## VÀO

Mọi component đã qua B3 và B4, hình đã chốt.

## LÀM

**1. Ai sở hữu hình thì sở hữu skeleton của hình đó.** Không dựng một component `XxxLoading`
riêng — `isSkeleton` là cờ chảy xuống, sống cùng chỗ với hình thật.

**2. Skeleton phải giữ ĐÚNG footprint của hình thật.** Sai footprint thì lúc dữ liệu về, màn
**nhảy** — mà đó chính là thứ skeleton sinh ra để chặn. Đo cả hai trạng thái rồi so:

```js
el.getBoundingClientRect()   // đo lúc isSkeleton, rồi đo lúc có dữ liệu
```

**3. Skeleton phải vẽ đủ mọi HÌNH mà prop của nó sinh ra.** Component có hai hình (ví dụ có nhãn
và chỉ-icon) thì leaf skeleton phải có mặt đủ hai, không chỉ hình mặc định.

**4. ⚠️ Bẫy thẻ lồng nhau — đã cắn thật.** Khung nào nhận `title`/`description` mà **render
chúng vào thẻ đoạn văn** thì không được nhét một thẻ khối vào đó. Neo `TrialEnrollBanner`
2026-07-29: skeleton chép nguyên từ block khác, mang theo `<div>` nằm trong `<p>` — **lỗi
hydration thật**, sống nhiều tháng vì chưa từng có leaf skeleton nào render nó ra.

🧭 Khung không có `isSkeleton` của riêng nó thì **gọi thẳng atom bên dưới** (atom thường có), chứ
đừng tự dựng thanh shimmer rồi truyền vào slot chữ của khung.

**5. Chạy đủ cổng.** Không bỏ cổng nào vì "chắc không liên quan":

```bash
npx tsc --noEmit
node scripts/check-no-namespace.mjs && node scripts/check-story-ids.mjs && node scripts/check-seams.mjs && node scripts/check-inline-types.mjs && node scripts/check-padding.mjs && node scripts/check-one-instance-per-state.mjs && node scripts/check-member-as-state.mjs && node scripts/check-orphan-parts.mjs && node scripts/check-passthrough-block.mjs && node scripts/check-deps-coverage.mjs
npx eslint .storybook
```

⚠️ `check-story-coverage.mjs` là cổng thứ 11 và **đang chết** — đừng chạy, đừng sửa cho xanh.
Nó đòi bản vẽ soi gương công trình, đo 2026-07-29 báo thiếu 162/162 nên không mang tin gì.

**6. Restart Storybook** vì watcher Windows kẹt khi **thêm** file story, rồi xác nhận đúng bộ
leaf đã lên index:

```bash
curl -s http://localhost:6006/index.json
```

⚠️ Sau restart mà tab cũ vẫn báo lỗi khớp code **trước khi sửa** ⇒ đó là chunk HMR ôi, không
phải bug. **Mở tab MỚI**, đừng navigate lại tab cũ.

## CỔNG ĐO

- Footprint skeleton khớp footprint thật, **đo hai lần rồi so**, không ước lượng.
- `tsc` sạch · 10/10 cổng xanh · eslint 0 error.
- `index.json` có đủ bộ leaf mong đợi.
- Console của story không có lỗi hydration.

## RA

Ghi mục cuối vào `session.md`: cây đã dựng · file đã tạo · số đo DOM trước/sau · cổng xanh ·
**cái gì CHƯA làm và vì sao**.

Mục cuối cùng là mục quan trọng nhất — thứ cố ý không làm mà không ghi lại thì lần sau không ai
biết là cố ý.

## DỪNG KHI

⛔ Trình thầy rồi **chờ**. Thầy muốn sửa gì ⇒ mở `starci-fe-story-feedback-start` trên màn này.
Thầy gọi xong ⇒ chạy `starci-fe-story-feedback-end` để chốt sổ và cập nhật canon nếu cần.

Dừng sớm hơn nếu:

- Footprint skeleton lệch hình thật mà **sửa mãi không khớp** ⇒ thường là hình thật chưa ổn
  định. Quay lại B3/B4 thay vì ép skeleton chạy theo.
- Cổng đỏ ở chỗ **không liên quan tới màn đang dựng** ⇒ báo, đừng sửa lan sang phạm vi khác.
