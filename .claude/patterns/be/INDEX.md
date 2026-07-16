# BE Patterns — CODE-STYLE FORCE

> **FORCE**: đây là quy ước BẮT BUỘC khi viết/sửa bất kỳ dòng TypeScript nào trong
> `$BE_SOURCE` (NestJS, branch `mtp`). Skill BUILD/APPLY
> đọc bộ này TRƯỚC KHI code. Không phải gợi ý — code lệch là code SAI, dù tsc/eslint pass.
> INFER từ code thật trong `src/` + `eslint.config.mjs` (2026-07-16).

## Files

| File | Nội dung |
|---|---|
| [[format-and-imports]] | Format cơ học (eslint-gated): indent 4 · double quotes · no semi · mọi object/import/call-args xuống dòng · import order · `Array<T>` · JSDoc |
| [[modules-and-di]] | Cấu trúc module NestJS: folder anatomy · `ConfigurableModuleBuilder` · DI constructor · barrel `index.ts` · naming suffixes · path alias |
| [[exceptions]] | ⭐ LUẬT SẮT: LUÔN `AbstractException` — cấm `new Error` / Nest built-in; anatomy 1 exception file; `httpStatus` chỉ cho guard/auth |
| [[api-surface]] | GraphQL resolver (1 operation = 1 folder) + REST controller + DTO validation (class-validator + swagger) |
| [[type-safety]] | Type-safety STRICT: cấm `any` (→ `unknown`+narrow) · DTO validate boundary · enum state/kind · return type tường minh · cấm `!`/`as` bừa (`satisfies` + type guard) · generics/`as const` · typed config `envConfig()` (không đọc `process.env` rải) |
| [[comments]] | Comment ghi LÚC NÀO: WHY không WHAT · xoá comment thừa + code comment-out · JSDoc cho public surface + hằng số/field có nghĩa ngầm · TODO(tag) kèm ngữ cảnh · comment sống cùng code |

## Verify sau khi code

```bash
npx tsc --noEmit -p tsconfig.json   # type-check
npm run lint                        # eslint --fix (format rules là 'error')
```

## Phạm vi STRICT vs nới

- **STRICT toàn bộ**: `src/modules/**` + `src/features/api/**` (core app surface).
- **Nới (không chạm thì thôi)**: `src/features/mock/**` (demo dạy học) và `src/features/tools/**`
  hiện còn Nest built-in exceptions — code MỚI ở đó vẫn nên theo chuẩn, nhưng không burn nợ cũ trong lượt build feature.
