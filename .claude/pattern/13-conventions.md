# 13 — Conventions (tóm tắt)

> **Authoritative**: `.claude/skills/coding-conventions/SKILL.md` (mirror `.cursor/rules/starci-academy.mdc`). File này chỉ tóm tắt — khi nghi ngờ đọc skill. Chạy `npm run lint` trước khi xong.

## Cấu trúc folder module
- `constants/ enums/ types/ utils/` (+ `classes/ dtos/ graphql-types/{inputs,object-types}/`) luôn là **folder nested**, mỗi folder có `index.ts` re-export — KHÔNG để file lẻ ngoài folder. NestJS folder: `guards/ pipes/ interceptors/ middlewares/ filters/ decorators/`. Root module có `index.ts` lộ public API.
- **Service để flat `*.service.ts`** ngay ở module root — KHÔNG folder-hoá service. `types/ enums/ constants/ utils/` là **folder ngang hàng service** ở root module (mỗi cái `index.ts`), chỉ tạo khi có nội dung:
  ```
  <module>/
  ├─ <module>.module.ts
  ├─ foo.service.ts        # service flat
  ├─ bar.service.ts
  ├─ types/      (index.ts)
  ├─ enums/      (index.ts) # chỉ khi có nội dung
  └─ index.ts
  ```
  KHÔNG declare type/enum inline trong `*.service.ts` → tách ra `types/`/`enums/` root, import lại qua `./types`.
- **Phân tầng nơi đặt type/enum/constant/util:**
  - Trong 1 module → folder root module `types/ enums/ constants/ utils/` (mọi service import từ đây). KHÔNG nhồi vào folder con từng service.
  - **Dùng chung nhiều module (global) → `src/modules/common/{types,enums,constants,utils}`** (`@modules/common`). KHÔNG viết type lan man / lặp ở nhiều module — gom về common.

## File naming
- NestJS giữ suffix chấm: `*.service.ts *.controller.ts *.resolver.ts *.module.ts *.module-definition.ts *.guard.ts *.processor.ts *.entity.ts *.command.ts *.event.ts *.handler.ts …`
- Domain file (types/enums/classes/utils) đặt theo feature, **kebab-case**: `types/user.ts`, `enums/role.ts`.
- ⚠️ File NestJS **KHÔNG** declare `interface`/`enum`/`class` — chỉ import từ `types/ enums/ classes/ dtos/ graphql-types/`.

## Params / Result
- `≥2 args` → object `{...}` destructure trong signature; 1 primitive → truyền thẳng (`findById(id: string)`).
- Type tên `{Action}Params` / `{Action}Result`, định nghĩa ở `types/`, KHÔNG inline trong signature.
- `Array<T>` KHÔNG `T[]`. `import type` cho type-only.

## Type safety
- Branded primitive cho thứ không nên hoán đổi: `Brand<string, "OpenAi">` (cast `as XApiKey` chỉ tại boundary load key).
- Callback payload khác theo enum → discriminated union (narrow tự động).
- Type dẫn xuất → `ReturnType<typeof fn>` / `Parameters` / `Awaited`, KHÔNG copy tay.

## Callback param naming
- Spell-out singular: `(model) =>`, `(key) =>` — KHÔNG `(m) =>`, `(k) =>`.
- `sort` → `(prev, next)`; `reduce` → `(acc, event)`; `forEach` index → `index`.

## JSDoc (BẮT BUỘC — STRICT per-member)
- Mọi type/enum/class/interface export có JSDoc cấp type **VÀ `/** */` trên TỪNG field/property/enum-member** (kể cả field optional + callback — ghi rõ callback gọi khi nào, nhận gì). Field trống không doc = fail review.
- Public method non-trivial có `@param`/`@returns`/`@example`.
- **Inline `//` comment BẮT BUỘC, gần như từng dòng**: mọi line/block logic non-trivial phải có comment giải thích **logic/why** (branch guard gì, vì sao thứ tự đó, edge case, magic value) — KHÔNG diễn lại cú pháp. Áp cho service/processor/resolver/util. Line logic non-trivial không comment = fail review.
- ⚠️ File NestJS (`*.service.ts`/`*.resolver.ts`/`*.controller.ts`/`*.processor.ts`) **KHÔNG** chứa `interface`/`type`/`enum`/`class`/`const` export — chỉ import từ `types/ enums/ constants/ classes/`.

## Data / Config / Errors (xem 07/11/12)
- DB: `@InjectPrimaryPostgreSQLEntityManager()` — KHÔNG `@InjectRepository`, KHÔNG active-record.
- Config: `envConfig()` (hạ tầng) / `appConfig()` YAML (ops-editable) — KHÔNG hardcode, KHÔNG `.json` config.
- Lỗi: extend `AbstractException` — KHÔNG `throw new Error`.

## Unit test (coding-conventions §10)
- `*.spec.ts` cạnh SUT. Luôn `Test.createTestingModule(...).compile()` (KHÔNG `new Service(...)`). Mock `jest.fn()` + `useValue`. Token thật: `getEntityManagerToken("primary")`. Không real I/O. `beforeEach` async, `afterEach` `module.close()`.
- Chạy: `npx jest --testPathPatterns "<keyword>"`.

## Typo cố ý — KHÔNG đổi
| Thực tế | Đúng | Vị trí |
|---------|------|--------|
| `bussiness` | business | `src/modules/bussiness/` |
| `vaildators` | validators | `src/modules/vaildators/` |

## Checklist trước khi lưu file
File đúng folder · naming đúng · NestJS file không declare type · JSDoc đủ · inline step comment · params/result đặt tên + destructure · `Array<T>` · `import type` · `index.ts` cập nhật · env qua `envConfig()` · DB qua EntityManager · không `throw new Error` · callback param spell-out · `npm run lint` sạch.
