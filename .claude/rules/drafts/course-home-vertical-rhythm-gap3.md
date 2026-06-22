# Draft — Course-home: continue PHẲNG (không card) + 2 vùng (gap-6 chia, gap-3 trong) (2026-06-21)

- File/§ đích khi `/merge`: `main.md` §8 spacing + §3/§6 (card/surface) + cập nhật [[three-tier-page-layout]].
- Bối cảnh: trang Học phần (`/learn` → `CourseContents`). Ban đầu khối "Tiếp tục + tiến độ" bọc trong `Card`
  (surface fill) và mọi khối xếp `gap-6`. Thầy chốt qua 2 feedback: *"cho gap-3 thôi"* rồi *"cái card cam bỏ được
  không… màu đỏ là gap-6 nhé"*.

## Luật (STRICT)
- **Khối "Tiếp tục học + tiến độ" để PHẲNG, KHÔNG bọc `Card`.** Nó là hành động chính + meter, đặt thẳng trên nền
  trang (flat), không cần surface frame riêng. Bọc card = thêm vanity/“hộp trong hộp”. (Ref §3 flat; restraint.)
- **Course-home chia 2 VÙNG, ngăn nhau bằng `gap-6`; TRONG mỗi vùng các phần tử `gap-3`:**
  - **Vùng A — định danh + hành động:** breadcrumb · title (H3) · khối continue+progress (flat). Cụm `gap-3`.
  - **Vùng B — duyệt nội dung:** ô search · cây index (accordion). Cụm `gap-3`.
  - Giữa A và B = **`gap-6`** (ranh giới 2 chức năng: "đang ở đâu / làm gì tiếp" vs "duyệt toàn bộ").
- **Quy tắc tổng quát rút ra (đính chính nhịp dọc):** `gap-6` chỉ dùng để **chia 2 vùng KHÁC chức năng**; mọi phần
  tử **cùng 1 vùng** = `gap-3`. ĐỪNG rải `gap-6` đều cho mọi khối xếp dọc (thưa), cũng đừng ép tất cả về `gap-3`
  (mất ranh giới vùng). Gom thành cụm `gap-3` rồi để `gap-6` ở đúng 1 đường chia.
- **Skeleton mirror cùng cấu trúc/nhịp** (gap-6 chia, gap-3 trong) để không nhảy layout.
