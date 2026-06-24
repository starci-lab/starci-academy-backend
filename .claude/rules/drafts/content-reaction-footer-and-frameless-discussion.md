# Draft — Cảm xúc/like của 1 BÀI = footer trong card đọc (border-t, không card riêng/không mồ côi); khu comment FRAMELESS + composer avatar-led collapse→expand (2026-06-25)

- File/§ đích khi `/merge`: `concepts/` (engagement) + [[concepts/card]] + [[elements/card]] + [[interactive-needs-hover]] + [[labeled-section-render-empty-not-self-hide]].
- Bối cảnh: lesson reader, khu cảm xúc + bình luận. Thầy: *"comment xấu quá; like để TRONG card content trên hay card khác?"* → chốt **A: like vào chân card đọc** (mockup widget A viền xanh).

## Luật (STRICT)
- **Reaction/like của 1 ĐỐI TƯỢNG (bài viết/lesson) thuộc về đối tượng đó → đặt làm FOOTER bên TRONG card của nó** (`border-t border-default` cuối "tờ giấy"), **KHÔNG** để thành 1 strip flat mồ côi giữa 2 card, **KHÔNG** dựng thành 1 card riêng (1 hàng action đơn KHÔNG phải card — [[concepts/card]]). Đây là pattern Medium (clap cuối bài) · Substack (like ngay dưới bài). Footer-row `border-t` ≠ card-in-card (chỉ là divider-section của cùng card) → không vi phạm luật card-lồng.
- **Khu BÌNH LUẬN dưới 1 card đọc → FRAMELESS** (label NGOÀI + composer + list phẳng trên nền trang, KHÔNG bọc `<Card>`): tránh 2 card bordered chồng dọc ("box nối box" — [[concepts/card]]). Trang còn 1 card bordered duy nhất (paper bài đọc). Composer input vẫn bordered (vẫn có affordance gõ).
- **Composer top-level = AVATAR-LED, collapse→expand**: idle = `[avatar][pill placeholder "Đặt câu hỏi hoặc chia sẻ…"]` 1 hàng mảnh (cả hàng click mở — [[interactive-needs-hover]] hover `bg-default`); focus → bung TextArea + Hủy/Đăng; submit/cancel → thu lại. KHÔNG để `TextArea rows=3` mở hết cỡ thường trực (hộp xám bự rỗng = nặng/trống). Reply/edit composer giữ expanded (không collapsible). Ref YouTube/GitHub/Substack.
- **Empty-state = `EmptyContent` chuẩn** (icon + title + hint), KHÔNG dòng muted trơ ([[labeled-section-render-empty-not-self-hide]]). Vd "Chưa có thảo luận" + "Đặt câu hỏi đầu tiên về bài này".
- **Nhãn khu = "Thảo luận · N"** (Q&A học tập), KHÔNG "Bình luận (N)" (comment MXH). `·` thay `()`.

## Kỹ thuật — tách reaction-bar khỏi container comment mà KHÔNG nhân đôi socket
- Reaction bar cần render TRONG card đọc (component khác cây với container comment ở dưới). Cách: **2 `useSWR` CÙNG KEY** (`["content-discussion-reactions", contentId]`) → SWR dedupe = 1 request + 1 cache. `ContentReactionBar` (trong card) giữ key này + mutation react; `ContentDiscussion` (dưới) GIỮ key này CHỈ để socket `ContentReactionChanged` gọi `mutate()` → revalidate shared key → bar live-update. **KHÔNG** subscribe socket ở 2 nơi (tránh double room-join). Nguyên tắc: muốn cùng 1 data ở 2 vị trí xa nhau trong cây → dùng **shared SWR key**, đừng nâng state lên hay portal.

## ĐÃ ÁP DỤNG 2026-06-25 (FE `D:\Repositories\starci-academy`)
- Tạo `LessonReader/ContentBody/ContentBodyV2/Discussion/ContentReactionBar.tsx` (reaction SWR shared-key + InteractionBar). Render trong footer card đọc (`mt-6 border-t border-default pt-4`, gate `!isLocked`, chỉ nhánh paper-card = tab Nội dung).
- `ContentDiscussion`: bỏ `onReactContent` + `mutateReactToContent`; bỏ props reaction khỏi `Discussion`; thêm `currentUser`; giữ `reactionsSwr` cho socket revalidate shared key.
- `reuseable/Discussion`: bỏ `InteractionBar`/`LabeledCard` → FRAMELESS (heading = block **`<Label>` HeroUI** + icon ChatsCircle, KHÔNG `Typography` tay — khớp `LabeledCard` label; composer + list); empty → `EmptyContent` (ChatsCircle + title + hint). Thầy chốt 2026-06-25: nhãn section frameless vẫn dùng `<Label>` (đồng bộ mọi section label).
- `CommentComposer` TextField **`variant="primary"`** (KHÔNG `secondary` — secondary cho fill nặng/đậm như screenshot). Thầy: *"input dùng variant primary hoặc xóa variant đi"*.

## Tinh chỉnh spacing + nút (thầy soi DevTools 2026-06-25)
- **Nút composer dồn TRÁI, thứ tự Đăng (primary) TRÁI · Hủy (tertiary) PHẢI** (`justify-start`, Post trước Cancel). Thầy: *"dời hủy đăng sang bên trái; Đăng bên trái và Hủy bên phải"*. (Đảo so với mặc định `justify-end` Cancel-trước.)
- **Comment list = `gap-3`** giữa các comment (KHÔNG `gap-6` — comment là item-list, không phải section↔section). Thầy chỉ list gap-6 → "cái này gap-3".
- **CommentItem bỏ `gap-1.5` (off-scale) → `gap-2`** (cả 3 chỗ: outer stack, content col, author header row). Thầy: *"sao lại gap-1.5"* — 1.5 ngoài thang [[gap]] (0/2/3/6/8).
- **Discussion `<section>` `gap-6` → `gap-3`** (thầy soi section → "gap-3 lun nhé"): cả khu thảo luận nén gap-3 (label+composer ↔ list = gap-3, list items = gap-3). Khu thảo luận là 1 cụm nén, không phải nhiều section khác chức năng.
- **LessonReader ROOT `gap-3` → `gap-6`** (thầy soi đúng div root 9922px `flex flex-col gap-3` → "gap-6 nhé"). ⚠️ Blast radius: giãn MỌI block top-level của reader (header↔tabbar↔reading-card↔engagement) từ 12→24px trên MỌI tab. Đây là **đính chính** [[three-tier-page-layout]] (tier reader trước gap-3) — thầy chốt muốn reader breathe gap-6. Nếu header↔tabbar trông quá xa → cân nhắc tách wrapper để chỉ reading-card↔discussion = gap-6.
- `CommentComposer`: thêm `collapsible` + `currentUser` (avatar-led collapse→expand); reply/edit không truyền → giữ cũ.
- i18n `discussion.{title,placeholder,empty}` + thêm `emptyHint` (vi+en). tsc + eslint sạch.
- **Chưa đụng:** tab Thử thách (cardless) không hiện reaction footer nữa (trước có flat InteractionBar) — chủ ý: reaction thuộc bài đọc, tab challenge không có card bài. Comment (frameless) vẫn hiện mọi tab non-fullwidth.
- Doc brainstorm: `…/Discussion/UX-BRAINSTORM.md` (mục 2026-06-25).
