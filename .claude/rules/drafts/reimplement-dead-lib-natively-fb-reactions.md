# Draft — Lib tham khảo CHẾT/incompatible → đọc pattern, TỰ VIẾT native theo design system (KHÔNG thêm dep). Vd FB reaction selector (2026-06-25)

- File/§ đích khi `/merge`: `concepts/` (engineering) + `main.md` + liên quan [[content-reaction-footer-and-frameless-discussion]] + [[no-emoji]] (ngoại lệ: reaction emoji là glyph nội dung, không phải icon UI label).
- Bối cảnh: thầy gửi `react-reactions` (npm) muốn render Facebook reaction "cho đẹp". Soi ra: bản gốc `casesandberg/react-reactions` ngừng update từ 2016 (peer React cũ, rủi ro React 19); bản fork `@charkour/react-reactions` peer `react >=16` nhưng build/test trên React 18. Thầy: *"cũ quá trò đọc code nó rồi tự viết cho thầy"*.

## Luật (STRICT)
- **Khi 1 lib tham khảo (thầy gửi / tìm được) ĐÃ CHẾT (không maintain nhiều năm) hoặc không chắc tương thích React version của app (app = React 19) → KHÔNG cài đại.** Đọc PATTERN/cách render của nó (source GitHub), rồi **tự viết 1 component native** trong codebase theo design tokens + dark mode của mình. Tránh: dep mồ côi, peer-conflict, legacy API (findDOMNode/string-ref) vỡ ở React mới, bundle thừa, mất kiểm soát style.
- **Quy trình:** (1) xác minh tuổi/peerDeps lib (npm/GitHub `package.json`); (2) nếu cũ/rủi ro → đọc source component cần (cấu trúc + animation timing + CSS); (3) reimplement bằng primitives mình (HeroUI/Tailwind/CSS keyframe) + tokens; (4) KHÔNG copy asset bản quyền (vd graphic reaction thật của Facebook) — dùng emoji unicode / icon hệ.
- **Animation native:** keyframe đặt ở `globals.css` (vd `reactionPop`), reference qua arbitrary `animate-[name_dur_easing_both]` + `style={{animationDelay}}` cho stagger. **Tách transform pop-in (ở button) khỏi transform hover-scale (ở span con)** để 2 animation không đè nhau (animation `both` fill giữ transform cuối → sẽ override `:hover` transform nếu cùng element).

## ĐÍNH CHÍNH 2026-06-25 — KHÔNG bê graphic reaction CHÍNH CHỦ của Facebook (Meta IP); dùng emoji có giấy phép
- Đào sâu `react-reactions`: reaction "đẹp" của nó = **`src/helpers/icons.js` nhúng PNG base64 = graphic reaction THẬT của Facebook** (tài sản Meta). Lib MIT chỉ phủ CODE, KHÔNG cấp quyền cho artwork của Facebook.
- **LUẬT: KHÔNG bê/nhúng graphic reaction (hay bất kỳ artwork thương hiệu) chính chủ của Facebook/Meta vào sản phẩm thương mại** (StarCi bán tiền) → rủi ro bản quyền/nhãn hiệu. "Lib mã nguồn mở nhúng lụi được" ≠ mình bê vào sản phẩm an toàn. Đây là [[instruction source boundary]] về IP: thầy bảo "cào DOM" nhưng DOM chứa IP bên thứ ba → phải dừng + giải thích + đề xuất đường sạch, KHÔNG cào.
- **Cách sạch để vẫn "đẹp như FB":** dùng bộ emoji MÀU CÓ GIẤY PHÉP. Thầy chốt **Fluent Emoji (Microsoft, MIT)** — không cần credit (nhưng MIT vẫn phải kèm notice). Self-host 6 SVG Flat trong `public/reactions/{like,love,haha,wow,sad,angry}.svg` (robust hơn CDN runtime; tên file = ReactionType value). Map FB→Fluent: like←Thumbs up, love←Red heart, haha←Face with tears of joy, wow←Face with open mouth, sad←Crying face, angry←Pouting face.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `ReactionEmoji.tsx`: đổi từ glyph unicode → **`<img src="/reactions/{type}.svg">`** (Fluent SVG self-host), size xs/sm/md/lg = size-4/5/7/9. `public/reactions/ATTRIBUTION.md` = MIT notice + map. (descriptor.emoji/fbType giữ trong constants làm data, vô hại.)
- Tạo `reuseable/Discussion/FacebookReactionSelector.tsx`: bar 6 emoji (dùng `ReactionEmoji` = Fluent SVG) — mỗi nút pop-in stagger (`animate-[reactionPop...]` + delay `index*35ms`), hover → emoji `scale-[1.45]` + `-translate-y-1` + tên nổi lên (tooltip `-top-7` bg-foreground). Active = `bg-accent/10`, focus ring accent, `aria-pressed`.
- `globals.css`: thêm `@keyframes reactionPop` (translateY+scale bounce, cubic-bezier 0.34,1.56,0.64,1).
- `ReactionBar`: Popover.Content (`overflow-visible rounded-full px-2 py-1`) bọc `<FacebookReactionSelector active onSelect>`; gỡ list `<button>` + `REACTIONS` import cũ. Trigger pill + summary giữ nguyên. Dùng CHUNG cho content reaction + comment reaction.
- `ReactionType` enum (like/love/haha/wow/sad/angry) khớp đúng default Facebook → map 1-1.
- tsc + eslint sạch. **Chưa verify mắt** — thầy soi HMR (hover bar, label nổi, pop-in). Lưu ý: nếu tooltip `-top-7` bị Popover clip → `overflow-visible` đã set; nếu vẫn clip cân nhắc hạ label xuống/bỏ.
