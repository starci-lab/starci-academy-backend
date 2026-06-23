# Draft — Modal: KHÔNG override `p-*` trên `Modal.Body`; HeroUI dialog `p-6` lo gutter, body `p-[3px]/-m-[3px]` lo focus-ring (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (Modal/overlay patterns) + `main.md` §8 spacing (đính chính "block sở hữu padding").
- Bối cảnh: thầy soi DevTools `AuthenticationModal` thấy `div.modal__body…p-3` (12px) → *"tại sao có p-3 ở đây, xóa đi chứ, áp dụng cho toàn bộ modals dc không"*. Đào ra: padding modal bị **drift override** (`p-3/p-4/p-2/p-0`) rải khắp 24 modal, mỗi cái một kiểu.

## HeroUI v3 fact (đọc `@heroui/styles/.../modal.css`)
- `.modal__dialog` = `@apply p-6` → **gutter THẬT = 24px**, header/body/footer sống trong đây.
- `.modal__header` = `flex flex-col gap-3` (`mb-0`); `.modal__footer` = `flex flex-row justify-end gap-2` (`mt-0`) → **không padding riêng**.
- `.modal__body` = `-m-[3px] my-0 overflow-visible p-[3px]` → **idiom focus-ring breathing**: 3px padding + -3px margin ngang triệt tiêu (net indent = 0, body thẳng mép header/footer), 3px chỉ để ring/box-shadow input không bị `overflow` cắt.

## Luật (STRICT)
- **KHÔNG set `p-*` lên `Modal.Body`.** Để HeroUI lo: dialog `p-6` (gutter) + body `p-[3px]/-m-[3px]` (breathing). Set `p-3/p-4` lên body = **double padding** (gutter 24px + padding body) + **lệch mép** (body indent `24-3+padding` > 24px của header/footer vì `-m-[3px]` không bị đụng) → body thụt vào hơn tiêu đề & nút. Đây là áp luật "block/container sở hữu padding, feature chỉ placement": `Modal` là block → sở hữu padding; từng modal KHÔNG tự chế.
- **`gap` nội dung body = wrapper TRONG body** (`<div flex flex-col gap-X>`), KHÔNG nhét `gap-*` lên chính `Modal.Body` (body không luôn là flex; HeroUI chỉ bake gap cho header/footer).
- **Full-bleed = NGOẠI LỆ CÓ CHỦ ĐÍCH, không phải `p-0/p-2` rải bừa.** Search palette (cmd-k input tràn mép), media preview (video/CV/ảnh) muốn sát mép → dùng pattern bleed có TÊN (giảm padding ở dialog hoặc wrapper bleed riêng) + ghi chú lý do; KHÔNG để `p-0`/`p-2` lẻ trông như drift.
- **Nguyên tắc rút ra:** khi 1 component-lib (HeroUI) đã bake mô hình padding (gutter ở dialog, breathing ở body), ĐỪNG đè utility lẻ lên slot con — đọc style bake (`get_styles`/node_modules css) trước, rồi để nó tự lo; chỉ opt-out khi có chủ đích đặt tên.

## Inventory (24 modal, 2026-06-24)
- **Gỡ override:** Authentication (`p-3`, 4 file state) · AdModal/PremiumGate/Language/Livestream (`p-4`) · LessonVideo (`p-4`).
- **Ngoại lệ cần quyết định:** GlobalSearch (`p-0` cmd-k bleed — giữ, đánh dấu) · CvPreview (`p-2` media).
- **Đã đúng (không set `p-*`):** AiQuota · Content · FeedbackDetails · FollowList · Foundation · Headhunter · LinkGithub · ManagePinnedProjects · Payment · Share · UserMilestoneTaskFeedbacks · CvReviewLevelDetails · CvUpdate.
- Doc đầy đủ + bảng: `src/components/modals/MODAL-PADDING-BRAINSTORM.md`.
- **Chưa code** (brainstorm only) → `/starci-fe-ux-apply` để gỡ.
