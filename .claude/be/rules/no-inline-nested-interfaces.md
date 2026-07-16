# Rule — Cấm inline/nested object-type literal ở vị trí TYPE (generic/cast/return/param)

**Không viết `{ ... }` object shape trực tiếp ở generic arg, `as` cast, return type, hay nested field — luôn tách thành interface có tên trong `types/` + JSDoc, import lại.**

- Vi phạm kinh điển: `.getRawOne<{ sum: string }>()`, `qb.getRawMany<{ card_id: string }>()`, `x as { data?; count? }`, `Map<string, { earnedAt; tier }>`, `interface A { nested?: { p: string } }`.
- Sửa đúng: tách `RewardSumRow`/`CommunityReplyCountRow` (PascalCase + `Row` cho raw-SQL, **giữ nguyên snake_case field**), import `type` từ `./types`.
- **KHÔNG tính vi phạm** (LEAVE-idiom): `Pick/Record/Partial/Omit/ReturnType/Array/Promise`, mapped type `{[K in keyof T]}`, narrow 1-field boundary-cast (`error.driverError as { code?: string }`), named type-alias def (`type X = SocketIoPayload<{...}>`), NestJS `getContext<{ req }>`, mock apps + spec file.
- Gotcha `ExtractJsonFromMdService.extract<T extends Record<string, unknown>>`: wrapper phải là `type X = {...}` (không `interface` — thiếu implicit index signature → TS2344).

> Đã áp: `src/modules/bussiness/community/community-comment.service.ts` (`CommunityReplyCountRow`), `src/modules/bussiness/community/community-reaction.service.ts` (`CommunityPostReactionCountRow`); audit 2026-06-16 fix 13 EXTRACT case thật (ai-lab, achievements, coding…) trên 79 hit quét.
> Nguồn: `.cursor/rules/starci-academy.mdc` §No inline type definitions in generics/casts/return types (STRICT) · memory `feedback-no-inline-nested-interfaces.md`.

[[type-and-enum-naming]] · [[service-file-flat]]
