# INDEX — Rules (hard coding conventions, BE)

> Bản đồ `be/rules/`. Rule = convention CỨNG khi viết code BE (không phải kiến trúc — kiến trúc ở `be/concepts/`, hiện TODO chưa viết). Distill từ `.cursor/rules/starci-academy.mdc` (SSOT) + `claude-legacy/pattern/13-conventions.md` + `claude-legacy/tech-integration/{19-conventions,21-gotchas}.md` + memory `feedback-*`, grounded lại vào `src/modules/**` thật.

**Trạng thái:** ✓ = grounded đầy đủ (rule + ví dụ thật trong `src/`) · **XLINK** = nội dung đầy đủ nằm ở `fe/engineering/` (rule thuần BE lọt sang lúc dọn cây fe/), file ở đây chỉ là pointer + anchor nguồn BE thật.

## Structure (layout module/file)

| Rule | Trạng thái | 1 dòng | Nguồn |
|---|---|---|---|
| [[module-folder-layout]] | ✓ | Service flat root + `types/enums/constants/utils` ngang hàng, mỗi folder `index.ts` | `.cursor/rules/starci-academy.mdc` §Module Folder Structure |
| [[service-file-flat]] | ✓ | File NestJS (`*.service.ts`…) ZERO khai báo type/enum/class/const, chỉ import | `.cursor` §NestJS files must not define types (STRICT) |
| [[no-barrel-imports]] | ✓ | Consumer import qua `@modules/<name>` public index.ts, không đào sub-path (ngược hướng FE cùng tên) | `.cursor` §Module Folder Structure · `pattern/03-modules-layer.md` |
| [[shared-modules-global-once-at-app-root]] | XLINK | Module hạ tầng đăng ký `isGlobal:true` đúng 1 lần ở app root, feature module không import lại | `fe/engineering/shared-modules-global-once-at-app-root.md` |

## Typing / JSDoc

| Rule | Trạng thái | 1 dòng | Nguồn |
|---|---|---|---|
| [[type-and-enum-naming]] | ✓ | Domain file kebab theo feature; NestJS file giữ suffix chấm; raw-row `XxxRow` giữ snake_case field | `.cursor` §File naming rule |
| [[params-result-object-pattern]] | ✓ | ≥2 arg → params object destructure signature; return `{Action}Result`; `export const` arrow, `Array<T>` | `.cursor` §Function Parameters & Result Naming |
| [[jsdoc-strict-per-member]] | ✓ | JSDoc type-level + TỪNG member (STRICT) + inline `//` gần như từng dòng giải thích why | `.cursor` §Unified Comment Pattern + §Inline Explanation Rule |
| [[no-inline-nested-interfaces]] | ✓ | Cấm object-type literal ở generic/cast/return/nested field — tách `types/` có tên | `.cursor` §No inline type definitions (STRICT) |
| [[english-only-code-comments]] | ✓ | Comment/JSDoc/identifier English-only; copy UI qua i18n | `.cursor` §Unified Comment Pattern ("ENGLISH ONLY") |

## Data / TypeORM

| Rule | Trạng thái | 1 dòng | Nguồn |
|---|---|---|---|
| [[index-on-relation-property-not-relationid]] | ✓ | Composite `@Index`/`@Unique` dùng relation property (`user`), không `@RelationId` (`userId`) — sai là vỡ boot | memory `feedback-index-relation-columns.md` |
| [[relationid-virtual-not-queryable]] | ✓ | `@RelationId` không query được trong `where` — filter qua `where:{user:{id}}` | memory `be-relationid-not-queryable.md` |
| [[opaque-global-id-decode-before-raw-id]] | XLINK | Id từ `toGlobalId` là opaque — decode `fromGlobalId(...).id` trước khi đưa vào chỗ ăn raw id | `fe/engineering/opaque-global-id-must-decode-before-raw-id-mutation.md` |

## CQRS

| Rule | Trạng thái | 1 dòng | Nguồn |
|---|---|---|---|
| [[cqrs-no-inline-aggregate]] | ✓ | Read nặng (aggregate/join/GROUP BY) PHẢI qua CQRS projection + CDC, không SQL inline resolver | memory `feedback-cqrs-no-inline-aggregate.md` |

## Errors

| Rule | Trạng thái | 1 dòng | Nguồn |
|---|---|---|---|
| [[log-errors-typed-exception]] | ✓ | Bọc lỗi catch vào `AbstractException`, log `logger.error(message, stack)` — cấm `new Error` lẫn Nest built-in `*Exception` | memory `feedback-log-errors-typed-exception.md` |
| [[envelope-response-data-nullable]] | XLINK | Field `data` mọi GraphQL envelope response phải `nullable: true` (error path luôn trả null) | `fe/engineering/envelope-response-data-must-be-nullable.md` |

## Ghi chú — moved/shared từ `fe/engineering/`

3 file ở `fe/engineering/` là rule **THUẦN BACKEND** lọt sang lúc dọn cây fe/ (2026-07 cleanup) — nội dung đã đủ chi tiết, KHÔNG viết lại 2 lần:
- `envelope-response-data-must-be-nullable.md` — GraphQL interceptor error-path, 100% BE.
- `opaque-global-id-must-decode-before-raw-id-mutation.md` — id-contract do resolver BE quyết định (`toGlobalId`), dù case minh hoạ là 1 lỗi FE gọi sai.
- `shared-modules-global-once-at-app-root.md` — thuần NestJS module wiring, không đụng gì FE.

**Khuyến nghị:** dời (move, không copy) cả 3 file này từ `fe/engineering/` sang `be/rules/` khi audit cây fe/ tiếp theo (`/starci-doc-audit`) — hiện `be/rules/` đã có pointer thin-file trỏ ngược, đủ dùng tạm; dời thật sẽ xoá được lớp gián tiếp này. `no-barrel-imports` KHÔNG nằm trong nhóm move — đây là 2 rule riêng cùng tên khác hướng (FE cấm barrel, BE bắt buộc qua barrel module-root), giữ 2 file riêng ở 2 cây.

## TODO (chưa confirm được — không bịa)
- Không có rule nào trong danh sách yêu cầu phải bỏ; toàn bộ 14 rule đều grounded được vào `.cursor/rules/starci-academy.mdc` hoặc memory `feedback-*` + ít nhất 1 ví dụ thật trong `src/modules/**`.

## Dùng
- Viết code BE mới → tra bảng trên theo nhóm gần nhất với việc đang làm TRƯỚC khi code.
- Rule mới lặp lại ≥2 lần → thêm file ở đây (1 rule = 1 file, brief-depth, `> Đã áp: <path thật>`).
