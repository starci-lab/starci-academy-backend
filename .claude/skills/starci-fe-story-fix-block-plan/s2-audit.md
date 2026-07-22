# S2 — Audit (NHÌN/ĐO từng leaf)

Mở story :6006, chấm **từng leaf** theo 7 chiều. Màu/phân-lớp phải NHÌN render hoặc ĐO DOM — CẤM đọc class.

1. **Màu §2/§2d** — đúng 1 thứ nổi/vùng? meta chìm? cùng info-type dùng CÙNG element (khác chỉ TONE)? đếm điểm nổi (>2 = cờ)?
2. **Surface §1** — ngoài shadow / nested border · không double-fill · radius đúng (card 3xl, media 2xl).
3. **Text** — phân cấp title nổi → meta muted · neo trái.
4. **§4 element-ownership** — consumer truyền icon/children TRẦN (primitive tự lo size) chưa, hay vá `size-*`/màu ở call-site?
5. ⭐ **Spacing** (SOURCE-first) — thang `0 · 2 · 3 · 6 · 8` theo QUAN HỆ: dính/no-gap `0` (vd khối giá xếp sát) · cụm-con `2` · trong-khối `3` · giữa-khối `6` · vùng-rộng `8`; ngoại lệ tên header→content `10`, landing `16`, divider-trong-card `3`. **Card padding = `p-3`** (KHÔNG `px-4 py-3`). Cờ: giá trị NGOÀI thang (`1/1.5/4/5/7/9`), gap rải đều (thưa) hay ép hết `3` (mất ranh giới), chọn sai nấc theo quan hệ.
6. **Anatomy ĐÚNG LEAF (U1)** — anatomy mỗi leaf chỉ kể part LEAF ĐÓ render (loaded KHÔNG kể Skeleton/Error); dư/thiếu đều lỗi; part gắn `tier`. **Cụm ≥2 element ĐỒNG VAI (vd 2 nút CTA) = 1 GROUP** → `ButtonGroup · nút chính + nút phụ`, KHÔNG `Button ×2` (group sở hữu gap con). Chưa có primitive group → missing-primitive (S3).
7. **Matrix `variant / scenario / state`** — **variant** = prop-driven form · **scenario = SHAPE** (part nào render — anatomy khác nhau; tách theo SHAPE, KHÔNG theo tone) · **state** = cùng shape khác data/tone/lifecycle. Liệt kê ô còn THIẾU/SAI.

→ Mỗi phát hiện = 1 dòng: `[✅/⚠️/❌] vùng — lý do neo §principle`. Không có luật phủ → ghi *đề xuất luật mới*, KHÔNG tự chế.
