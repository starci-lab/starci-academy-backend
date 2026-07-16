# Rule — Module root: service FLAT + `types/enums/constants/utils` NGANG HÀNG, mỗi folder có `index.ts`

**Mỗi module `src/modules/<name>/` có service để flat ở root; type/enum/constant/util sống trong folder riêng ngang hàng service, KHÔNG lồng vào service.**

- Root module: `<name>.module.ts` + `<name>.module-definition.ts` + `*.service.ts` (flat, không `foo.service/foo.service.ts`) + `index.ts` (public export) + `types/ enums/ constants/ utils/` (mỗi cái 1 `index.ts` barrel) — **chỉ tạo folder khi có nội dung**.
- Type/enum dùng trong 1 module → root module đó. Dùng chung nhiều module → `src/modules/common/{types,enums,constants,utils}` (`@modules/common`), KHÔNG lặp/lan man.
- Module lớn → tách **nested sub-module** (đủ 3 file), cha `imports` qua `.register({...})` rồi **re-export ở `exports`** — consumer dùng qua `@modules/<parent>`, không đào sub-path (vd `AiModule` chứa `AiBalancerModule`).
- Allowed folder khác ở root: `dtos/` (REST), `graphql-types/{inputs,object-types}/` (GraphQL), NestJS framework folder (`guards/ pipes/ interceptors/ middlewares/`).

> Đã áp: `src/modules/bussiness/progress/` (`progress.module.ts` + `challenge.service.ts`/`personal-project.service.ts` flat + `types/` + `constants/`), `src/modules/bussiness/projections/content-engagement/` (3-file sub-module pattern).
> Nguồn: `.cursor/rules/starci-academy.mdc` §Module Folder Structure · `claude-legacy/pattern/13-conventions.md`.

[[service-file-flat]] · [[type-and-enum-naming]]
