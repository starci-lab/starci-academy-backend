# Rule — Domain file đặt tên theo FEATURE (kebab-case), NestJS file giữ suffix chấm

**Type/enum/class file đặt tên theo function/feature nó phủ (`user.ts`, `auth.ts`), gom type liên quan vào 1 file — khác NestJS file giữ nguyên suffix chấm `.service.ts`/`.module.ts`.**

- Domain file (types/enums/classes/utils): kebab-case theo feature, KHÔNG theo tên hàm lẻ — vd mọi type pagination gom vào `types/pagination.ts`, không tách `types/page.ts` + `types/limit.ts`.
- NestJS file giữ nguyên suffix framework: `*.service.ts *.controller.ts *.resolver.ts *.module.ts *.module-definition.ts *.guard.ts *.processor.ts *.entity.ts *.command.ts *.event.ts *.handler.ts` — không đổi sang kebab tự do.
- Raw-SQL row shape: PascalCase kết thúc `Row` (`RewardSumRow`, `EnrolledCourseIdRow`), **giữ nguyên tên cột snake_case** (`user_id`, `week_end`) vì đó là wire-format DB row, đổi tên = vỡ runtime.
- Param/Result type theo `{ActionName}Params` / `{ActionName}Result` — xem [[params-result-object-pattern]].

> Đã áp: `src/modules/bussiness/community/community-comment.service.ts` dùng `CommunityReplyCountRow`, `CommunityPostCommentCountRow` (raw-query row types, snake_case field giữ nguyên).
> Nguồn: `.cursor/rules/starci-academy.mdc` §File naming rule · §No inline type definitions.

[[params-result-object-pattern]] · [[no-inline-nested-interfaces]]
