# Draft — Thiết kế theo DỮ LIỆU THẬT có sẵn: cover null / ít item → text-first + featured anchor, KHÔNG image-grid (2026-06-21)

- File/§ đích khi `/merge`: `main.md` §1/§14 (grounded-in-data heuristics) + `starci-ui.rules` (list/index patterns).
- Bối cảnh: redesign trang `/blog`. FE cũ render **lưới image-card** trong khi MỌI seed post có `coverImageUrl = null`
  và chỉ ~2 bài → ra "hộp rỗng buồn", lưới 2 cột mỏng dính. (Ref: Vercel blog = text-first không cover; Stripe blog =
  image-forward + author photo — pattern KHÔNG hợp vì ta không có ảnh/tác giả.)

## Luật (STRICT)
- **Thiết kế cho dữ liệu HIỆN CÓ, không cho schema lý tưởng.** Field TỒN TẠI trong schema (vd `coverImageUrl`) nhưng
  content luôn `null` ⇒ **KHÔNG được phụ thuộc** vào nó. Layout phải đẹp khi field vắng; chỉ dùng nó **cơ hội** (render
  khi có, bỏ qua khi không). Trước khi chọn pattern, soi seed data thật + entity nullable — đừng vẽ UI cho ảnh/tác giả
  /tag/search mà BE-DB không cấp.
- **Cover null / nội dung text-only ⇒ TEXT-FIRST (typography gánh layout), KHÔNG image-grid.** Lưới card dựa ảnh mà ảnh
  null = hộp rỗng. Dùng danh sách/àng chữ, tương phản + whitespace + scale cỡ chữ làm phân cấp (ref Vercel blog,
  Smashing typographic hierarchy).
- **Ít item (early-stage) ⇒ thêm 1 "featured anchor" để trang không trống.** 1 điểm nhấn editorial (bài mới nhất, to,
  typographic) + danh sách text bên dưới → đẹp cả khi 2 bài lẫn 50 bài. ĐỪNG chọn pattern "section theo nhóm/pillar"
  khi đa số nhóm còn RỖNG (5/6 pillar trống = trông hỏng) — đó là shape v2 sau khi content phủ đủ.
- **Đừng bịa dữ liệu cho UI:** không có count từ BE → đừng nhồi "n bài" vào filter chip; không có author → không byline.
  Chip/nhãn chỉ phản ánh field thật (`category · publishedAt · readingMinutes · isPremium`).
- **Tận dụng field đã có nhưng FE bỏ phí** thay vì thêm BE: `isPremium` (list payload) → tag "Members"; `sourceUrl` →
  nút GitHub; `blogPosts(category)` → strip "More in {pillar}" (related, không cần API mới).
- Repo FE thật: `D:\Repositories\starci-academy` (branch `final-mvp`). Trang: `src/components/layouts/blog/{BlogList,BlogPost}`.
  Brainstorm đầy đủ: `blog/UX-BRAINSTORM.md`.
