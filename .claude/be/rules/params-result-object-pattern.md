# Rule — Hàm ≥2 tham số → 1 params object destructure; trả về `{ActionName}Result`

**Function ≥2 tham số PHẢI nhận 1 object (destructure ngay trong signature); function 1 tham số nguyên thuỷ thì truyền thẳng. Return type luôn đặt tên `{ActionName}Result`.**

- Type đặt tên `CreateUserParams`/`CreateUserResult` theo `actionName(param: ActionNameParams): Promise<ActionNameResult>`, định nghĩa ở `types/` — KHÔNG inline trong signature.
- **Destructure tối đa**: `create({ key, config }: CreateParams)` chứ không `create(param: CreateParams)` rồi tự `const { key, config } = param` bên trong.
- Top-level function (util/helper/factory) luôn là `export const foo = async (...) => {}` (arrow), KHÔNG `export function foo() {}` — method trong class thì giữ nguyên method.
- `Array<T>` thay vì `T[]`; `import type` cho type-only import.

> Đã áp: convention xuyên suốt `src/modules/**` (vd `writeXpHistory`, mọi `*.service.ts` method có ≥2 field input).
> Nguồn: `.cursor/rules/starci-academy.mdc` §Function Parameters & Result Naming.

[[type-and-enum-naming]] · [[no-inline-nested-interfaces]]
