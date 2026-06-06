# Fullstack — Coding rules (code BE thế nào · code FE thế nào) · đúc kết

> Bản **TỰ-ĐỦ** để audit/viết CODE trong `.repo/fullstack-mastery-module-*` — chỉ đọc trong `.audits`, **KHÔNG ref file ngoài**. Chép + đúc kết từ `coding-fullstack.md` / `coding-conventions` (`.cursor/rules/starci-academy.mdc`) / `lesson-ui.rules.md`, đã align **V2 (FE = Vite default)**. Content body → `contents.md`. Challenge → `challenges.md`. Quy trình → `../../pipeline.md`.
>
> Nguyên tắc cứng: **mọi code block §2.1.3 + `# codeExplaining` = diff=0 với `.repo/.../src`** (xem `contents.md §4`). File này nói code TRONG repo phải viết thế nào.

---

## PHẦN A — Code Backend (NestJS / TypeScript)

### A0. COMMENT CODE KĨ (BẮT BUỘC — yêu cầu thầy, mọi cấp độ, từng dòng)
Áp cho **MỌI file source** trong `backend/<lang>/` (và `frontend/`) của lesson — code này học viên đọc để học, phải tự-giải-thích.
- **ENGLISH ONLY**: comment / JSDoc / identifier tiếng Anh (ra quốc tế). UI copy → i18n; data → giữ. (Mirror rule repo "English-only Code Comments".)
- **MỌI CẤP ĐỘ có doc-block**: mỗi class / module / interface / enum / decorator + mỗi method / function → doc-block mô tả **mục đích + param + return + side-effect**:
  - TS → JSDoc `/** */` (per-member, mọi field/enum-member; mirror rule "JSDoc Strict").
  - Java → Javadoc `/** */`. C# → XML-doc `/// <summary>`. Go → godoc (comment đứng ngay trên symbol, bắt đầu bằng tên symbol).
- **TỪNG DÒNG LOGIC có inline comment GIẢI THÍCH LOGIC** (vì sao, không chỉ "what"): điều kiện, vòng lặp, DI wiring, transform, side-effect, guard, error path… đều phải có. Dòng trivial (import thuần, đóng ngoặc, getter 1 dòng hiển nhiên) thì khỏi.
- **CHỈ thêm/sửa comment, KHÔNG đổi hành vi code**. Giữ lint/format sạch. Comment phải đồng bộ với code (sửa code → sửa comment).
- Snippet §2.1.3 + `# codeExplaining` trong body vẫn diff=0 với code repo (comment trong repo là phần của "code thật" → snippet body nên phản ánh, hoặc lược gọn nhưng KHÔNG mâu thuẫn).

### A1. Layout repo (THỐNG NHẤT — backend grouped)
- **MỌI server backend nằm dưới `<lesson>/backend/<N>-<lang>/`** (`backend/0-typescript`/`backend/1-java`/`backend/2-csharp`/`backend/3-go`), mỗi lang 1 project root. Config native per-lang (`.env`/`application.yml`/`appsettings.json`/`config.yaml`). Lý do: đồng nhất + chừa chỗ **nhiều api server** sau này.
  - Lesson TS-only → chỉ `backend/0-typescript/`. Lesson đa ngôn ngữ → đủ `backend/{0-typescript,1-java,2-csharp,3-go}/`.
- **Lesson có frontend** → thêm `<lesson>/frontend/` (Vite) + `<lesson>/.playwright/` (sibling, KHÔNG nằm trong frontend), song song với `<lesson>/backend/...`.
- Migrate repo cũ (`<lesson>/<N>-<lang>` thẳng, hoặc `<lesson>/backend` đơn=TS) → `.audits/migrate-repo-backend.sh` (git mv, DRYRUN=1 preview). `code-context.md` trỏ `path: <repo>/<lesson>/backend/<N>-<lang>`.
- Repo name `fullstack-mastery-module-<N>-<slug>`. FS **MATCH slot 1:1** (KHÔNG off-by-one) cho lesson mới — NHƯNG repo đời đầu có off-by-one (`module-<slot+1>`); verify repo đúng lesson trước khi đọc (xem `contents.md §4`).
- Anti-pattern: lang dir thẳng ở lesson root (`<L>/0-typescript` thiếu `backend/`), `<L>/src/` (thiếu `backend/<lang>/`), `backend/` đơn chứa TS trực tiếp (phải `backend/0-typescript/`), `package.json` ở lesson/backend root (phải per-lang `backend/<lang>/`), `.server/`/`.client/` dot-prefix.

### A2. Backend chạy trên host (KHÔNG Docker container)
- **CD CONVENTION (body "cách chạy") — 2 loại block:**
  - **Block CLONE/setup** (có `git clone`): kết thúc bằng `cd <repo>/<lesson>` — vào **THƯ MỤC LESSON**, KHÔNG đi sâu vào `backend/<lang>`.
  - **Block RUN/startup — FORMAT 3-STEP CHUẨN (mặc định CẢ 4 lang body):**
    ```
    # Step 1: <vào thư mục>      → cd backend/<lang>
    # Step 2: <cài dependency>   → npm install | mvn install -DskipTests | dotnet restore | go mod download
    # Step 3: <chạy>             → nest start --watch | mvn spring-boot:run | dotnet watch run | go run .
    ```
    Thứ tự BẮT BUỘC **vào → cài → chạy**. KHÔNG gộp/đảo (vd để "Step 1: Install" mà thiếu cd = SAI). Mỗi run-block tự đủ (cd ở Step 1). vi/en + 4 lang đồng bộ format này.
  - Checker bắt MỌI lệnh build/install/run thiếu cd-first: `npm (install|ci|run|start)` · `mvn`/`mvnw` · `dotnet (run|watch|restore|build)` · `go (run|build|mod)` · `gradle`/`pnpm`/`yarn` (xem `check-cd-first.sh` + `fix-cd-format.py`).
  - **Source "thư mục bài học"** (đầu §2.1.1): link trỏ **THƯ MỤC LESSON** `<repo>/tree/main/<lesson>` (KHÔNG `/backend/<lang>` — đó là folder lesson chung, không phải code 1 lang). `fix-cd-format.py` tự strip `/backend/<lang>` khỏi dòng "thư mục bài học"/"tree/main".
  - Sai = học viên `npm install` nhầm chỗ. **Tự động:** `bash .audits/fix-doc-paths.sh` (links) → `python3 .audits/fix-cd-format.py` (cd lines clone→lesson, run→`cd backend/<lang>`) → `bash .audits/check-cd-first.sh <dir>` verify (exit 0 = sạch).
- `nest start --watch` trên **host port 3000**. `backend/0-typescript/package.json` scripts BẮT BUỘC: `"start:dev": "nest start --watch"` (exact, KHÔNG `nest start` plain/`nodemon`), `"build": "nest build"`, `"start": "node dist/main.js"`.
- `main.ts` bootstrap: `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` + `setGlobalPrefix("api/v1")` + `enableCors()` + `listen(3000)` (KHÔNG cần `"0.0.0.0"` vì host).

### A3. Docker = INFRASTRUCTURE ONLY
- `.docker/compose.yaml` chỉ upstream image (postgres:16-alpine, redis:7-alpine, mongo:7, minio, rabbitmq:3-management-alpine, mailhog, keycloak…). KHÔNG service `api`/`web`/`backend`/`frontend`, KHÔNG `Dockerfile`, KHÔNG `build:`, KHÔNG image push DockerHub.
- Có `name:`, `container_name: <lesson-slug>-<svc>`, `<lesson-slug>-network`, named volume. Lesson host-only (no infra) → **KHÔNG có** `.docker/`.
- **Body "cách chạy" khi CÓ docker:** `.docker/compose.yaml` ở **cấp lesson** (KHÔNG trong `backend/<lang>`). Lệnh dựng infra chạy TỪ thư mục lesson: `docker compose -f .docker/compose.yaml up -d` (down: `... down -v`). TUYỆT ĐỐI KHÔNG `cd backend/<lang>` rồi mới `docker compose up` (compose.yaml không nằm ở đó → fail). Thứ tự 3-step lesson-có-docker: **B1 dựng infra** (`docker compose -f .docker/compose.yaml up -d`) → **B2 `cd backend/<lang>` + cài** → **B3 chạy**. KHÔNG cd trùng/“quay lại thư mục” khi đã ở đó.

### A4. Module folder structure (TS)
- Folder cho phép ở module root: `types/` `enums/` `classes/` `constants/` `utils/` `dtos/` (`@ApiProperty`) `graphql-types/{inputs,object-types}/` + NestJS framework folder (`guards/`/`pipes/`/`interceptors/`/`filters/`/`middlewares/`/`decorators/`). Mỗi folder có `index.ts` re-export. Module root `index.ts` re-export public API.
- **NestJS file (`*.service.ts`/`*.controller.ts`/`*.resolver.ts`/`*.processor.ts`/`*.module.ts`) = ZERO `interface`/`type`/`enum`/non-NestJS `class`/exported `const` inline** → chỉ import từ `types/`/`enums/`/`classes/`/`constants/`. Inline = hard violation.
- KHÔNG nested interface — tách shape lồng ra named interface.
- GraphQL leaf module: `<X>SingleQueryModule`/`<X>SingleMutationModule` + `.module-definition.ts` (`ConfigurableModuleBuilder` + `setExtras({ isGlobal })`) + `extends ConfigurableModuleClass`; parent import `.register({ isGlobal: true })` (KHÔNG import leaf trực tiếp). Aggregator = `<Resource>QueriesModule`/`MutationsModule` (plural).

### A5. File naming
- NestJS giữ dotted suffix: `*.service.ts` `*.controller.ts` `*.resolver.ts` `*.module.ts` `*.module-definition.ts` `*.guard.ts` `*.interceptor.ts` `*.pipe.ts` `*.filter.ts` `*.processor.ts` `*.entity.ts` `*.command.ts`.
- Domain file (types/enums/classes/utils) = **kebab-case theo feature**: `types/user.ts`, `enums/role.ts`, `utils/parse-env.ts`.

### A6. Params / Result / callbacks
- Params type `{ActionName}Params`, Result type `{ActionName}Result`. `≥2 args` → params object **destructure ngay trong signature** (`create({ name, email }: CreateUserParams)`). 1 primitive → truyền thẳng (`findById(id: string)`).
- KHÔNG inline type trong signature → `import type`. Dùng `Array<T>` (KHÔNG `T[]`).
- Callback array method: viết đủ danh từ số ít (`(model) =>`, `(key) =>`), comparator dùng `(prev, next)`, reduce `(acc, event)`, forEach `(item, index)` — **CẤM single-letter** (`m`/`k`/`a`/`b`/`i`).
- Type safety: branded primitive (`Brand<string,"OpenAi">`) cho key/id/token; discriminated union cho callback payload theo enum; `ReturnType<typeof fn>` thay vì copy shape.

### A7. JSDoc + comment (STRICT)
- **English-only** mọi comment/JSDoc/identifier/TODO (sản phẩm ra quốc tế). UI copy → i18n, KHÔNG hardcode.
- Mọi exported type/interface/enum/class = JSDoc type-level **VÀ `/** */` trên TỪNG member** (kể cả optional + callback field). Member trống doc = fail.
- Public method non-trivial = JSDoc (`@param`/`@returns`/`@example`).
- **Inline `//` gần như TỪNG dòng/block** giải thích *why* (guard gì, vì sao thứ tự, edge case, magic value) — bắt buộc, KHÔNG restate syntax.

### A8. Data access + config + exception
- DB qua `@InjectPrimaryPostgreSQLEntityManager()` + `EntityManager` (KHÔNG `@InjectRepository`, KHÔNG `TypeOrmModule.forFeature` per feature).
- Tunable value → `envConfig().<group>.<key>` (`src/modules/env/config.ts`), parser `parseEnvString/Int/Ms/Bool`, key `SCREAMING_SNAKE_CASE`, có defaultValue dev. KHÔNG đọc `process.env` ngoài config.ts. Constants cần env → wrap getter (lazy).
- Ops-editable runtime catalog → `app.yaml` (YAML only, KHÔNG `.json`), đọc qua `mountFilesystemService.appConfig()`.
- **CẤM `throw new Error(...)`** trong app code → extends `AbstractException` (`@modules/exceptions`) có `code` + `metadata`. KHÔNG uninitialised `let` cho try/catch (refactor helper-returns-null hoặc 1 try). Normalize `unknown` error 1 lần tại boundary.
- Recurring poll → `setTimeout(random jitter)` rồi `setInterval` + cleanup `OnModuleDestroy` (tránh thundering herd) thay vì `@Interval` cho per-instance job.

### A9. `.env`
- **MENTION ENV CHỈ KHI HỌC VIÊN BUỘC PHẢI TỰ ĐIỀN (rule chốt):** TEST = lesson chạy được OUT-OF-BOX nhờ **default committed** không (kể cả code đọc env có fallback cho PORT/DB)?
  - **CÓ** (chạy ngay, không cần đụng env) → body **KHÔNG mention `.env`/config gì** (xóa cả "không cần tạo .env"/"ship defaults" — đừng disclosure thừa). PORT/DB plumbing = KHÔNG mention; KHÔNG thêm mention dù code đọc env.
  - **KHÔNG** (phải điền secret/cloud thật, vd OAuth Google thật, payment key) → MỚI mention: trỏ `.env.local` để điền + ship `.env.example` (placeholder, KHÔNG secret). Repo committed chỉ default non-secret; secret thật → `.env.local` gitignored.
  - **NGOẠI LỆ — lesson TOPIC là env/config:** nếu bài DẠY về env và flow yêu cầu học viên TỰ set env/profile để quan sát (vd `2-multi-environment-configuration` set `NODE_ENV=production`) → **GIỮ + nhấn mạnh mention** dù chạy out-of-box (env là chủ đề bài, KHÔNG xóa).
  - **CODE-LEVEL (cả 4 lang, KHÔNG hard-code):** config (port/DB/secret-demo) đọc từ **env CÓ default**, KHÔNG hard-code literal (Go cũng `os.Getenv("X")`+default, KHÔNG `jwtSecret:="..."`/`r.Run(":3000")`). **Ship file env/config committed default non-secret** (TS/Go `.env`, Java `application.*`, C# `appsettings.json`) → chạy out-of-box → body silent. Mô hình: env-driven + default committed → học viên không cần đụng env (nên KHÔNG mention), nhưng code KHÔNG hard-code.
  - Tool: workflow `env-fix-modules.js` (Haiku check → Sonnet quyết theo test out-of-box).
- `backend/0-typescript/.env` committed (infra default; cloud key = placeholder `<nhập_key>`). `backend/0-typescript/.env.local` gitignored (credential thật). `frontend/.env.local` gitignored; `VITE_*` (Vite) / `NEXT_PUBLIC_*` (Next) expose browser → KHÔNG để secret.

### A10. Unit test (nếu viết)
- `<source>.spec.ts` cạnh SUT. LUÔN `Test.createTestingModule(...).compile()` (KHÔNG `new Service(...)` tay). `beforeEach` async, `afterEach` `module.close()`. Mock `jest.fn()` + `useValue`, token thật `getEntityManagerToken("primary")`. No real I/O. ≤~300 LOC/spec.

---

## PHẦN B — Code Frontend (Vite + React + HeroUI v3 + Tailwind v4)

### B1. MẶC ĐỊNH Vite, KHÔNG Next.js
- **Mọi `frontend/` = Vite + React 19 + HeroUI v3 + Tailwind v4** (Sandpack KHÔNG chạy Next). **CHỈ dùng Next khi context đầu vào (`args.guidance`) chỉ rõ** (vd dạy RSC/app-router). Repo cũ Next → migrate sang Vite.
- Migrate Next→Vite **SẠCH** (gate `fe-vite-clean` bắt nếu sót):
  1. `create-next-app` → `npm create vite` (react-ts); thêm `index.html` + `src/main.tsx` + `vite.config.ts`.
  2. `app/` → `src/`; `app/page.tsx` → `src/App.tsx`; route Next (`/board` port 3001) → `/` (port Vite).
  3. Bỏ `"use client"` + mọi import `next/*` (`next/link|image|navigation`) → React/Vite equivalent.
  4. **XOÁ rác Next:** `next.config.*`, `next-env.d.ts`, `app/` cũ, `postcss.config.mjs` next-specific, dep `next` trong `package.json`.
  5. Verify `vite build` + Playwright pass.
- Forbidden libs: MUI/Chakra/Ant/Mantine/shadcn/Tailwind UI; plain `<button>/<input>/<select>/<dialog>` khi có HeroUI equivalent; JS thuần (TS mandatory).

### B2. Local / Sandbox (lesson-ui — THE core rule)
- `App = Label + Description + {isSandbox ? <Sandbox/> : <Local/>}`, `isSandbox = new URLSearchParams(location.search).has("sandbox")`. Header rhythm: title → `h-3` → description → `h-6` → content.
- **`<Local/>`** (default, no query) = canonical product UI, **single client**, KHỚP ĐÚNG `data-testid` trong `.playwright/scripts/*.spec.ts` (**đọc spec TRƯỚC**, KHÔNG bịa testid mới), implement đúng event contract thật (`code-context.md`). No tabs.
- **`<Sandbox/>`** (`?sandbox=1`) = embedded preview; realtime/multi-user → multi-client 1 view (Tabs); UX trau chuốt OK; cùng 1 contract/lib với Local; KHÔNG bị E2E test.
- **1 contract + 1 mock / lesson.** Local vs Sandbox khác NHAU chỉ ở layout (single vs multi-client), KHÔNG khác protocol.
- **Single-client lesson** (form/state/perf/data-viz/a11y…) → `<Sandbox/>` = **same single client** như `<Local/>` (KHÔNG tabs). Tabs multi-pane §B5 CHỈ cho realtime/collab.

### B3. Folder structure
```
src/
  main.tsx                 # ReactDOM.createRoot(<App/>)
  App.tsx                  # Label + Description + {isSandbox ? <Sandbox/> : <Local/>}
  vite-env.d.ts
  app/globals.css          # @import "tailwindcss"; @import "@heroui/styles";
  lib/                     # socket factory + shared types (ONE contract)
  components/
    providers/             # HeroUIProvider = <I18nProvider>{children}</I18nProvider>
    Local/index.tsx        # single client (spec-matching)
    Sandbox/index.tsx      # single (reuse Local) hoặc multi-client (tabs, realtime)
    <Feature>Client/index.tsx   # shared client dùng bởi CẢ Local lẫn Sandbox
    ui/                    # UserAvatar, ChatBubble, inline SVG icons…
```

### B4. HeroUI v3 API (KHÔNG NextUI v2)
- `Button` — `variant="primary"|"secondary"`, `isDisabled`, **`onPress`** (KHÔNG `onClick`).
- `Input` — single `<input>`, `type/className/value/onChange` pass-through. Password reveal: wrap `relative` + `pe-10` + abs `<button>` inline eye SVG toggle `type`.
- `Checkbox` compound (`isSelected` boolean, `onChange` boolean) — KHÔNG `<Input type="checkbox">`.
- `TextField` NESTED `<TextField><Label/><Input/><FieldError/></TextField>` (KHÔNG `TextField.Input` dot); `onChange={setX}` nhận **string** (KHÔNG `e.target.value`). RHF: `isInvalid={!!errors.x}` + conditional `<FieldError>`.
- `Chip` — `variant="soft"`, `color`, `className="capitalize"` (DOM text vẫn lowercase cho e2e).
- `Avatar` compound, `Spinner` (`size="sm" color="current"`), `Separator`.
- `Tabs` compound selector-only: `<Tabs selectedKey onSelectionChange><Tabs.ListContainer><Tabs.List aria-label><Tabs.Tab id>…<Tabs.Indicator/></Tabs.Tab></Tabs.List></Tabs.ListContainer></Tabs>`. **NEVER `Tabs.Panel`** (crash Sandpack). UI switch view = Tabs (KHÔNG 2 toggle `<Button>` giả tab bar).
- Semantic token, KHÔNG hardcode màu: `color="primary"`, `text-default-900`, `text-foreground`/`text-muted`/`text-danger`, `bg-background`/`bg-content1`/`bg-default-100`, `border-border`, `rounded-2xl`/`rounded-full`.

### B5. Sandpack gotcha (runtime-only, tsc/vite build vẫn pass)
- **CẤM dep nặng** — `@gravity-ui/icons` (2000+ module) timeout bundler → **inline SVG** cho mọi icon. `swr` OK. Mọi dep mới PHẢI khai trong `package.json`.
- **react-aria compound crash Sandpack**: `Select`/`Select.Value`/`ListBox`-popover dropdown → dùng native `<select>` (giữ `data-testid` + RHF `Controller`); `Tabs.Panel` → render mọi pane + toggle `hidden`. LUÔN smoke-test `?sandbox=1` preview, KHÔNG chỉ vite build.
- `Tabs` realtime multi-pane: render hết pane, `className={pane==="a" ? "" : "hidden"}` để giữ socket sống.
- `VITE_API_BASE` resolve socket origin: `new URL(import.meta.env.VITE_API_BASE ?? "http://localhost:3000").origin`.
- Vite worker: `new Worker(new URL('./x.worker.ts', import.meta.url), {type:'module'})`.

### B6. Spacing (spacer div, KHÔNG margin)
- title → `h-3` → description → `h-6` → content. Major gap `h-6`, sub-gap `h-3`, label→input `h-1.5`, tight `h-2`.

### B7. A11y / animation = kỹ thuật browser-DOM
- focus-trap, roving-tabindex, `aria-live`/`aria-activedescendant`, framer-motion → mô tả **element + `data-testid` + `aria-*`**, KHÔNG mô tả thẩm mỹ UX/icon package.
- FE-only DOM-thuần KHÔNG portable → **bỏ hẳn `# codeImplementations` 4-lang**; challenge codeImpl KHÔNG bịa Next-idiom/Thymeleaf/Go/Java/C#.

### B8. Playwright (nếu có)
- `.playwright/playwright.config.ts` `channel: "chrome"` (real Chrome), `baseURL: "http://localhost:3001"` (Local qua `/`). `@playwright/test` install ở `.playwright/package.json` (isolated). Selector ưu tiên `getByTestId`/`getByRole`/`getByText`. Dùng `observe()` Inspector pause (KHÔNG `waitForTimeout`).

### B9. Gold standard
`.repo/fullstack-mastery-module-9-websocket-realtime-communication` (4 lesson) — App layout + `Local`/`Sandbox` + shared `<*Client>` + `lib/` + `ui/` + inline icon + SWR loading. Copy cấu trúc khi dựng/migrate frontend mới.

---

## PHẦN C — Chung
- **Em-dash `—`** trong prose; giữ `--` trong code/CLI/URL. **Code-fence comment = English-only** (cả vi.md lẫn en.md). KHÔNG dịch ép thuật ngữ IT (Next.js/Vite/resolver/selector/mutation/RSC/Suspense/hydration/headless…).
- **Tiếng Việt prose PHẢI đủ dấu — CẤM không dấu** (content + artifact + references). Gate bắt `Vietnamese KHÔNG DẤU`. (Chỉ comment trong code-fence mới English-only; tiếng Việt ngoài code-fence luôn đủ dấu.)
- TS strict mọi nơi. `npm run lint` sạch trước khi xong.
- **Code TRONG bài = diff=0 với repo** (xem `contents.md §4`): snippet §2.1.3 + codeExplaining copy NGUYÊN VĂN từ `.repo/.../src`, refactor repo ↔ update snippet lock-step.

---

## Gate liên quan
`./.audits/check-lesson.ps1` bắt `fe-vite-clean` (FE lesson: soi `.repo/.../frontend` qua code-context.md → FAIL nếu còn Next leftover). Code diff=0 verify bằng Loop code↔docs (Sonnet đối chiếu, Opus quyết khi lệch).
