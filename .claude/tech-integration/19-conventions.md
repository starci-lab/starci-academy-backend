# 19 — Quy ước khi thêm tích hợp mới

## Thêm 1 module mới

1. Tạo `src/modules/<name>/` với 3 file pattern:
   - `<name>.module.ts` — class chính `@Module(...)`
   - `<name>.module-definition.ts` — `ConfigurableModuleBuilder<Options>` cho `register({ isGlobal })`
   - `index.ts` — re-export public API
2. Nếu có providers phức tạp → tách `<name>.providers.ts`.
3. Nếu có decorator riêng → `<name>.decorators.ts`.
4. Nếu có constants/enums → tách subfolder `constants/`, `enums/`, `types/`.
5. Đăng ký vào `apps/core/src/app.module.ts` với `<Module>.register({ isGlobal: true })` nếu muốn global.

## Thêm consumer BullMQ

- **Nghiệp vụ** → `src/features/api/processors/<name>/`
- **Sync** → `src/features/synchronizer/processors/<name>/`
- Subfolder: `<name>.processor.ts`, `<name>.service.ts`, `dto/`, `index.ts`.

## Thêm HTTP / GraphQL endpoint

- REST → `src/features/api/core/http/<area>/`
- GraphQL → `src/features/api/core/graphql/queries|mutations/<name>/`

## Naming

| Loại | Quy ước |
|------|--------|
| File | `kebab-case.ts` |
| Class | `PascalCase` |
| Decorator file | `<name>.decorators.ts` |
| Providers file | `<name>.providers.ts` |
| Module-definition | `<name>.module-definition.ts` |
| Entity | `<name>.entity.ts` + `<name>-translation.entity.ts` (nếu i18n) |

## Anti-pattern

- ❌ Bypass `bussiness/` từ controller đi thẳng repository.
- ❌ Tạo module mới không có `index.ts` (gãy alias `@modules/<name>`).
- ❌ Hardcode env biến — luôn qua `EnvModule`.
- ❌ Đổi tên typo (`bussiness`, `vaildators`, `proccessor`) — xem [21-gotchas.md](21-gotchas.md).
