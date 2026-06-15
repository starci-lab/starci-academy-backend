# Fullstack — Content (lesson body) rules · đúc kết

> Bản **TỰ-ĐỦ** để audit/viết content lesson FS — chỉ đọc trong `.audits`, **KHÔNG ref file ngoài**. Đúc kết từ bài gold (M0/M1) + các bài đã sửa trong session (M10–M14). Challenge → `challenges.md`. **Code BE/FE viết thế nào → `coding.md`** (cùng thư mục). Quy trình → `../../pipeline.md`.
>
> ⚠️ **THUẬT NGỮ & BOLD (tiếng Việt phổ thông vs English vs English+bold) → BẮT BUỘC theo `.audits/rules/terminology-bold.md`. STRICT, đã có feedback. Đọc TRƯỚC khi đụng chữ trong body.**

---

## 0. Variant & quyết định loại bài (LÀM ĐẦU TIÊN)

| Variant | Khi nào | `# lang` | bodies/ | Testing | Repo frontend |
|---|---|---|---|---|---|
| **Pure BE** | demo BE, call API đơn giản | `typescript` (+java/csharp/go nếu portable) | `0-typescript`(+`1-java`/`2-csharp`/`3-go`) | curl + PowerShell | — |
| **BE + Playwright** | BE trọng tâm nhưng thuần-BE quá trừu tượng (websocket, file-upload, realtime) | `typescript` | `0-typescript` | Playwright + BE | Vite client mỏng (element/div, KHÔNG UX/UI) |
| **FE-Vite** | thuần frontend (form, state, perf, responsive, a11y, data-viz) | `agnostic` | `0-agnostic` | Playwright | Vite, `isSandbox=true` |

- **Quyết định**: thuần-BE → backend; cần FE để bớt trừu tượng → backend+Playwright (FE chỉ đoạn KẾT NỐI; **docs KHÔNG mô tả UX/UI, chỉ element/div** = DOM tối thiểu để Playwright kiểm cơ chế BE; học viên cần thì tự dựng UI sau); thuần FE → frontend Vite.
- **MẶC ĐỊNH FE = Vite (React) + Sandbox. KHÔNG Next.js** — kể cả repo cũ đang Next thì migrate sang Vite. **CHỈ giữ/dùng Next khi có CONTEXT ĐẦU VÀO chỉ rõ** (vd module dạy đúng đặc thù Next: RSC / app-router / routing). Không có chỉ-dẫn = Vite.
- **Context đầu vào (`args.guidance`)**: khi chạy runner có thể truyền chỉ-dẫn-riêng-module để override mặc định (vd `guidance: "module này dùng Next vì dạy RSC"` hoặc `"FE Vite + Sandbox"`). Guidance được chèn vào brief/loop/decision với **ưu tiên tuyệt đối**.
- Module FE-only **bỏ `# codeImplementations`** (React/Next không có equivalent C#/Go/Java có nghĩa). Ghi `audited.md: codeImplementations skipped (FE-only)`.
- 4-lang portable CHỈ khi concept không phụ-thuộc framework idiom. Idiom NestJS (`@Module`, `DiscoveryService`, decorator) → 1 block concept-mapping, KHÔNG ép 4-lang. Per-lang applicability: concept vô nghĩa cho lang nào thì BỎ lang đó (vd DI-decorator → bỏ Go); TypeScript LUÔN có. Khi bỏ lang: renumber orderIndex liền mạch; challenge lang ⊆ body lang.

---

## 1. Bố cục file V2

```
modules/<slot>/contents/<lesson>/
├── vi.md / en.md                  ← ROOT metadata; # body / # codeExplaining / # codeImplementations RỖNG (2 sep)
├── bodies/<N>-<lang>/{vi,en}.md   ← body THẬT
├── challenges/<N>-<slug>-<diff>/  ← xem challenges.md
├── code-context.md                ← spec repo (FE-only viết tay)
├── audited.md                     ← log audit nội bộ (KHÔNG hiện học viên)
├── research.md / decision.md / claude_submitted.md  ← artifact audit (tiếng Việt, ghi thẳng đây — KHÔNG để ở .audits/)
└── .code/ · .e2e/<lang>/flow-<N>-<slug>-<status>.md  ← code track + proof e2e TÁCH 4 sub theo lang (status: done|fail|require-creds; xem pipeline.md)
```
- Artifact audit (research/decision/claude_submitted/.code/.e2e) = **nội bộ, tiếng Việt**, ghi cạnh `audited.md`; seeder bỏ qua. Gold để học theo: `.audits/references.md` (đọc mục cùng variant trước khi audit).
- bodies order: `0-typescript → 1-java → 2-csharp → 3-go` hoặc `0-agnostic`.
- ROOT H1 order: `title · description · body · codeExplaining · codeImplementations · databases(opt) · references · minutesRead · isPremium · verified`.
- Separator literal `<!-- @starci/seperator -->` (typo CỐ Ý). Block rỗng = 2 sep, KHÔNG `[]`. KHÔNG sep trong code fence. Mỗi scalar leaf = đúng 2 sep (đếm sep mỗi section phải CHẴN).
- `# description` plain text, CẤM markdown/inline-code/link. title/description/references trung lập (không nêu đích danh framework). `# verified` = ngày khi audit xong. `# minutesRead` 15–30. `# isPremium` boolean (1–2 lesson cuối module = true).

---

## 2. Template body — heading strict (VI / EN)

```
## 1. Lời mở đầu                                   / Opening
## 2. Các khái niệm cốt lõi                         / Core concepts
### 2.1. Thực hành                                  / Hands-on
#### 2.1.1. Chuẩn bị source code và môi trường       / Prepare the source code and environment
#### 2.1.2. Kiến trúc / thành phần                   / Architecture / components
#### 2.1.3. Giải thích code và bản chất              / Code walkthrough and essence    (2.1.3.1 / .2 / .3)
#### 2.1.4. Chuẩn bị & khởi chạy                     / Setup & run    (2.1.4.1 Điều kiện cần trước · 2.1.4.2 Khởi động)
#### 2.1.5. Kiểm thử  (FE/WS: "Kiểm thử (Playwright)") / Testing       (3–5 × "Luồng N — …" = 2.1.5.x)
#### 2.1.6. Dọn tài nguyên                           / Cleanup
#### 2.1.7. Đọc thêm                                 / Further reading
### 2.2. Lý thuyết                                   / Theory     → 2.2.1 Bản chất + 2.2.2 Các trường hợp biên (edge cases)
## 3. Tổng kết                                       / Wrap-up    → ### 3.1. Các câu hỏi dễ bị phỏng vấn
```
- **2.2 = ĐÚNG 2 mục** (Bản chất + edge cases). >2 mục = sai (lỗi hay gặp khi vi/en lệch — xem §6).
- Hands-on tới **2.1.7** (scheme V2). Nếu chỉ tới 2.1.6 / có "Prerequisites" ở 2.1.3 = scheme V1 cũ, phải sửa.
- Heading KHÔNG dấu `.` cuối phần chữ. Code-walkthrough sub = `##### 2.1.3.1` (KHÔNG `**(a)(b)**`).

---

## 3. Wording cố định (sai = fail)

- **§1 Opening** = 2 đoạn: (1) `*"<câu hỏi Senior>"*` — **Senior Engineer** → **Mid-level Developer** đáp sai → `Câu trả lời thiếu chiều sâu:` + lỗ hổng; (2) **bridge = bullet** `- **Phần 2.1**: **thực hành** …` / `- **Phần 2.2**: **lý thuyết** …` (CẤM inline).
- **§2 intro**: `Bài tuân theo **Thực hành dẫn dắt Lý thuyết**.`
- **2.1.1**: `Mục đích:` + `Source: [StarCi-Academy/fullstack-mastery-module-<N>-<slug>](...)`, KHÔNG mention `.docker/`. Bash comment **English** (`# Step 1: …`).
  - **GIT PHẢI ĐỒNG NHẤT (rule chốt):** `module-<N>-<slug>` trong MỌI URL/clone của bài đọc PHẢI khớp CHÍNH XÁC tên folder `.repo` + git remote (RepoSynchronizer đọc theo tên `.repo` để upload CDN — sai = học viên clone repo trùng/không tồn tại). **N = số repo thật (theo `.repo`/remote), KHÔNG phải slot-prefix của folder content** — 2 cái LỆCH +1 (vd content folder `3-authentication` ↔ repo `module-4-authentication`; `9-background-jobs` ↔ `module-10-...`). Trong 1 lesson + cả module + 4 lang + vi/en: dùng DUY NHẤT 1 `module-N-slug`, KHÔNG trộn. Verify: `grep -rhoE "fullstack-mastery-module-[0-9]+-[a-z-]+" bodies/` ra đúng 1 giá trị = tên `.repo` folder. (Đã dính off-by-one + trùng số ở auth/form/client/bg-jobs + database — fix 2026-06-07.)
- **2.1.2**: bullet component + table `Thành phần | … | Vai trò` + Mermaid (caption italic `*Hình N: …*`, verify `mmdc`).
- **2.1.4.2**: blockquote `.env`/ConfigModule **TRƯỚC** bash. Docker: `docker compose -f .docker/compose.yaml up -d` → `npm install` → `nest start --watch` (no `npx`). KHÔNG docker-hoá backend.
- **2.1.5 flow-list = bullet** (`- **Luồng N:** …`), CẤM inline `**(1)** …; **(2)**`. Mỗi flow 1 block bash (`# Windows (PowerShell)` Invoke-RestMethod + `# macOS / Linux` curl + Postman hint). Conclusion `*Kết luận: …*`.
- **2.2.1 Bản chất**: bullet facet `- **<facet>.** <cơ chế + VÌ SAO + trade-off>`, đào sâu, liên kết ≥1 luồng. **2.2.2 edge cases**: 3–5 bullet `- **<tên>:** <vấn đề>. **Giải pháp:** <…>.`
- **3.1 interview**: 3–4 câu, block `- **Câu hỏi N: …?**` → `  - Ý interviewer muốn nghe: …` → `  - Trả lời mẫu (ngắn): …` (EN: Question / What interviewers want to hear / Sample answer (concise)).
- Em-dash `—` trong prose; `--` giữ trong code/CLI/URL/separator. **Tiếng Việt PHẢI đủ dấu — CẤM không dấu** (`khong`/`duoc`/`phai`/`kiem thu`/`ban chat`…); áp cho `vi.md` (body + challenge) + artifact (`research/decision/claude_submitted`) + `references.md`. Gate bắt `Vietnamese KHÔNG DẤU`. **Code-fence comment = English-only** (cả vi.md lẫn en.md; không xét dấu trong code).
- **KHÔNG dịch ép technical term (chuẩn `data/rules/audit-vietnamese.md` §A — gate FAIL `Dịch ép thuật ngữ`):** giữ tiếng Anh nhúng vào câu Việt. SAI→ĐÚNG: `vỏ app`/`vỏ layout`→**App Layout** · `config/cấu hình có kiểu`→**Typed Config** · `trình nghe`/`bộ lắng nghe`→**Listener** · `móc nối`→**Hook** · `lớp bọc`/`trình bao bọc`→**Wrapper** · `giàn giáo`/`khung sườn`→**Scaffold** · `phần mềm trung gian`→**Middleware** · `mã thông báo`→**Token** · `bộ nhớ đệm`→**Cache** · `khoá/khóa phân tán`→**Distributed lock** · `hàng đợi thư chết`→**DLQ**. GIỮ tiếng Việt theo ngữ cảnh: `nhà cung cấp`=vendor · `điểm cuối`=final score · `tải trọng`=load · `dưới lớp vỏ`=under the hood · term nghiệp vụ. KHÔNG calque word-by-word.

---

## 4. Code trong bài = diff=0 với repo (CỨNG)
- **MỌI code block trong body** — `##### 2.1.3.x` (code-walkthrough) **và** `# codeExplaining` — = **copy NGUYÊN VĂN** từ `.repo/<repo>/<lesson>/src/...`. **diff=0**: không paraphrase, không simplify, không bịa.
- Áp cho **TẤT CẢ**, không chỉ logic nghiệp vụ: `@Module({ controllers, providers, exports })`, `imports`, decorator, DTO, config, import statement... mọi dòng phải GIỐNG repo. Đổi `exports: [CatService]` ↔ repo phải khớp 100%.
- Code refactor trong repo → update snippet bài song song (bidirectional lock-step).
- Verify = **Loop code↔docs** (xem `../../pipeline.md`): Sonnet đối chiếu từng snippet với file repo thật → lệch → Opus quyết sửa code hay bài.
- Repo name `fullstack-mastery-module-<N>-<slug>`. **CHÚ Ý off-by-one:** một số repo FE đánh số `module-<slot+1>` (slot 13 frontend-performance → repo `module-14-...`). Verify repo đúng lesson trước khi đọc code.

---

## 5. FE Vite + Sandbox (Local / Sandbox)
- **MẶC ĐỊNH FE = Vite (React) + Sandbox, KHÔNG Next.js.** Chỉ dùng Next khi **context đầu vào (`args.guidance`)** chỉ rõ (vd dạy RSC/app-router). Repo cũ Next → migrate sang Vite.
- `App = Label + Description + {isSandbox ? <Sandbox/> : <Local/>}` (`?sandbox` query). `Local` = spec-accurate (khớp ĐÚNG `data-testid` trong `.playwright/scripts/*.spec.ts` — đọc spec TRƯỚC). `Sandbox` = trực quan (KHÔNG cần 100% đúng). **Single-client → Sandbox = Local** (không tabs).
- Stack: Vite + HeroUI v3 + Tailwind v4 (Sandpack KHÔNG chạy Next → repo FE PHẢI Vite). HeroUI v3 API: `onPress`/`variant`/`Chip variant="soft"`/`Tabs` selector-only (KHÔNG `Tabs.Panel`). **Inline SVG, CẤM @gravity-ui** (timeout Sandpack bundler). Spacing h-6/h-3. `providers/HeroUIProvider` = `<I18nProvider>`. Gold: `.repo/module-9-websocket`.
- Vite worker: `new Worker(new URL('./x.worker.ts', import.meta.url), {type:'module'})`.
- **Recipe migrate Next→Vite (làm CHO SẠCH, gate `fe-vite-clean` bắt nếu sót):**
  1. Scaffold: `create-next-app` → `npm create vite` (react-ts); thêm `index.html` + `src/main.tsx` (entry Vite) + `vite.config.ts`.
  2. File-path: `app/` (app-router) → `src/`; `app/page.tsx` → `src/App.tsx`; route `/board` (port Next) → `/` (port Vite).
  3. Bỏ `"use client"`, mọi import `next/*` (`next/link|image|navigation`) → React/Vite tương đương.
  4. **XOÁ rác Next:** `next.config.*`, `next-env.d.ts`, `app/` cũ, `postcss.config.mjs` next-specific, dep `next` trong `package.json`. KHÔNG để nửa-Next-nửa-Vite.
  5. Verify: `vite build` chạy + Playwright (`.playwright/scripts/*.spec.ts`) pass.
- **A11y / animation = kỹ thuật browser-DOM** (focus-trap, roving-tabindex, aria-live/activedescendant, framer-motion) → mô tả **element + `data-testid` + `aria-*`**, KHÔNG mô tả thẩm mỹ UX/icon package. Đây là FE-only **KHÔNG portable** → bỏ hẳn `# codeImplementations` 4-lang; challenge codeImpl cũng KHÔNG bịa Next-idiom (`"use client"`, Thymeleaf, Go/Java/C#) cho concept DOM thuần.

---

## 6. Bug/gotcha đã gặp (session learnings — kiểm kỹ)
- **vi/en divergence**: en.md có thể lệch HẲN vi.md (bài khác, theory 5 mục vs 2, code khác). PHẢI so heading + nội dung vi↔en (gate bắt theory≠2).
- **Code BỊA trong body**: snippet/endpoint trong bài có thể KHÔNG tồn tại trong `.repo` (vd Twilio bài cũ dạy `/sms/send` + class-validator nhưng repo là `POST /sms` + idempotency Redis). LUÔN đọc `.repo` source trước khi tin code-walkthrough.
- **Module 4-lang**: fix PHẢI quét cả `0-typescript`/`1-java`/`2-csharp`/`3-go` — đừng chỉ sửa typescript rồi tưởng xong.
- **Repo FE còn Next** (M12–M15) trong khi `isSandbox=true` → Sandbox không render. Phải migrate repo Next→Vite per lesson-ui. **Migrate PHẢI SẠCH:** xoá hết file Next (`next.config.*`, `next-env.d.ts`, `app/` app-router cũ, `postcss.config.mjs` next-specific, dep `next` trong package.json) — KHÔNG để repo nửa-Next-nửa-Vite (dead-code). Xong **verify `vite build` chạy + Playwright pass** rồi mới coi là migrate xong.
- **Leak ghi chú nội bộ** ("Opus không chạy E2E", "chủ nhiệm/Gemini chạy thật rồi backfill", "trợ giảng") lọt vào body học viên → strip clause nội bộ, GIỮ hướng dẫn ("quan sát qua UI/DOM/DevTools, KHÔNG curl").
- **Docker path**: lệnh phải `-f .docker/compose.yaml` (repo có `.docker/compose.yaml`); đừng tự bịa "no Docker" — đọc repo `app.module` xem có RedisModule/infra không.
- **Off-by-one repo** + **repo stale topic** (slot rename: ui-polish→responsive nhưng repo cũ giữ tên/topic cũ) → có thể phải BUILD repo mới từ đầu.

---

## 7. Gate
`./.audits/check-lesson.ps1 -Path <module-dir>` (free; `-Json` cho runner). Bắt: leak · inline-bullet (scope 2.1.5) · fence chẵn · theory=2 · có 2.1.7 · **`fe-vite-clean`** (FE lesson: soi `.repo/.../frontend` qua code-context.md, FAIL nếu còn `next.config.*`/`next-env.d.ts`/`app/`/dep `next`/thiếu `index.html`+`vite` → chặn false-PASS khi repo còn Next) · **`has-bodies`** (FAIL nếu lesson có root `vi.md` mà KHÔNG có `bodies/<lang>/` = V1 chưa tách → chặn false-PASS khi body chưa migrate) · **`vn-có-dấu`** (FAIL nếu `vi.md`/challenge-vi/artifact viết tiếng Việt KHÔNG DẤU — toàn file 0 dấu hoặc token không-dấu lọt prose). Chỉ bài PASS mới lên LLM review ngữ nghĩa.
