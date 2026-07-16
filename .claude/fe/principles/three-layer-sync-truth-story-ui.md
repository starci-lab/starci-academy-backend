# Principle — 3 LỚP đồng bộ: CHÂN LÝ (`.claude/fe`) · UI-REF (story) · UI (component)

> Nguyên tắc GỐC/governance (họ `principles/*`, cùng nhà [[self-critique-before-presenting]] · [[single-source-render]]). Thầy chốt 2026-07-15 sau khi 1 skill-suite build + push lên canon nhưng RỜI RẠC với story/component. **Mọi skill FE thầy gọi phải nội hoá — chạy xong phải để 3 lớp KHỚP.**

## Mô hình 3 lớp (ai là chân lý)
- **`.claude/fe/` = CHÂN LÝ** — luật/nền tảng quyết định "ĐÚNG là gì" (token · hover · icon · CTA · anatomy · layout…). UI được **XÂY TRÊN** nó, không phải ngược lại.
- **Storybook story = UI REF** — biểu hiện trực quan của luật (state/variant chuẩn để mắt đối chiếu). Story **PHẢN ÁNH** chân lý, **KHÔNG tự quyết định** luật. Story đẹp mà TRÁI luật = story SAI → sửa story theo luật, KHÔNG hợp thức hoá cái sai bằng cách "story đang thế".
- **component/UI (`src/`) = xây trên chân lý, tham chiếu story** để biết hình hài đúng.

## Rule (STRICT)
**Chạm 1 lớp → PHẢI reconcile CẢ 3. Không bao giờ sửa 1 lớp mà bỏ 2 lớp kia.**
- Chỉnh **component** (thầy feedback / build) → (a) **đối chiếu luật** `.claude/fe` — component có phá rule KỀ BÊN không (vd "icon leading cùng màu title" [[../components/icon]] §leading — ca QuickActions 2026-07-15); rule CHƯA có = rule MỚI thầy vừa dạy → GHI vào đúng nhà TRƯỚC; (b) **cập nhật story ref** cho khớp component mới.
- Đổi **luật** → story + component phải THEO (patch/sync).
- Sửa **story** → phải phản ánh 1 luật THẬT; story lộ component production lệch → CHỐT thầy, KHÔNG tự sửa production ở lane story.

## Vì sao
Sửa 1 lớp bỏ 2 lớp kia = rời rạc: component đổi nhưng **story cũ** (mắt thầy soi ra cái sai) + **luật không ghi** (lần sau tái diễn y hệt). Đồng bộ cả 3 mỗi lần → luật luôn là NGUỒN, story luôn KHỚP, code luôn theo luật — không drift ngầm. Đây là lỗi thật đã xảy ra: suite build+push canon mà chưa bao giờ sống trong runtime + feedback xử tay không qua skill.

## Liên quan
- Recipe THAO TÁC (khi chạm 1 lớp làm gì) → [[../patterns/reconcile-three-layers-on-change]]. · [[single-source-render]] (1 nguồn render) · [[self-critique-before-presenting]] (tự soát trước ship). Memory gốc: `feedback-analyze-and-approve-before-editing`.
