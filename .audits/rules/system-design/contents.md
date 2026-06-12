# System Design — Content (lesson body) rules · đúc kết

> Bản để audit/viết content lesson **System Design** trong `.audits`. SD dùng **CHUNG skeleton với Fullstack** — đọc **`../fullstack/contents.md`** trước (bố cục file V2, template heading `2.1.1–2.1.7`, theory=2, interview ở `3.1`, separator, code diff=0). File này CHỈ liệt kê **SD deltas**. Đúc kết từ `content-system-design.md` (delta-on-generic) + scan thật m1–m10 SD (2026-06-07). Code repo → `coding.md`. Challenge → `challenges.md`. Quy trình → `../../pipeline.md`.
>
> **Đã verify với content thật:** body SD dùng ĐÚNG scheme FS `## 1 → ## 2 (2.1 Thực hành: 2.1.1…2.1.7 · 2.2 Lý thuyết = 2 mục) → ## 3 (3.1 interview)`. Code-walkthrough ở `##### 2.1.3.x`. KHÔNG có biến thể heading riêng cho SD.

---

## 0. Variant SD (LÀM ĐẦU TIÊN) — 2 trục độc lập

### Trục A — Language track
| Track | Khi nào | `# lang` | bodies/ |
|---|---|---|---|
| **4-lang** (mặc định SD) | concept portable (DB, messaging, cache, search, security, observability) | `typescript`/`java`/`csharp`/`go` | `0-typescript · 1-java · 2-csharp · 3-go` |
| **single-track agnostic** | bài pure-infra YAML/manifest, KHÔNG application code per-lang (vd **kubernetes-fundamentals**) | `agnostic` | `0-agnostic` |

- Mặc định SD = **4-lang** (khác FS hay agnostic/FE). Chỉ agnostic khi bài thật-sự không có code per-lang (kind/kubectl/helm/manifest). Verify: m2 (k8s) = `0-agnostic`; m0/m1/m3–m9 = 4-lang.
- **K8s = 1 track agnostic + app demo 1 lang/1 image (ruling thầy 2026-06-07):** module Kubernetes ngôn ngữ KHÔNG liên quan (manifest/YAML/helm là chính). App demo sau k8s **chỉ cần 1 ngôn ngữ / 1 image** (push sẵn lên hub cho học viên pull) — **KHÔNG làm 4-lang app, KHÔNG lo parity per-lang**. Body = `0-agnostic` duy nhất.
- Per-lang applicability như FS: concept vô nghĩa cho lang nào thì bỏ lang đó, `typescript` LUÔN có, renumber liền mạch, challenge lang ⊆ body lang.

### Trục B — Hạ tầng & verification
| Variant | Khi nào | Verify | Compose / manifest | Rule file gốc |
|---|---|---|---|---|
| **Generic SD** (baseline) | single Docker stack, REST | PowerShell + cURL + Postman | `.docker/compose.yaml`, **1 lệnh** `docker compose up` | `content-system-design.md` |
| **Flexible** | verify cần dashboard UI (Grafana/Jaeger/Keycloak/Vault) / CLI tool (`vault kv`, `etcdctl`, `mc`, `kafka-console-*`) / webhook listener | UI + CLI + webhook | `.docker/compose.yaml` (1 lệnh) | `content-system-design-flexible.md` |
| **Microservices-Docker** | ≥1 app service (NestJS api/worker) chạy TRONG Docker, **build LOCAL — KHÔNG push DockerHub** (ruling thầy 2026-06-07) | PowerShell + cURL ONLY | `.docker/compose.yaml` dùng **`build:`** + per-service `Dockerfile` (KHÔNG `image:` pull/push) | `content-system-design-microservices-docker.md` |
| **Kubernetes** | manifest Pod/Deployment/Service/Ingress/Helm | `kubectl` + port-forward → curl | `.kubernetes/` / `.helm/` / `charts/`; **image push sẵn lên DockerHub** (case DUY NHẤT — học viên chỉ pull, không push) | `content-system-design-microservices-k8s.md` |

Quyết định B (theo thứ tự): có manifest k8s → **K8s**; verify cần dashboard/CLI/webhook → **Flexible**; ≥2 app service + push image → **Microservices-Docker**; còn lại → **Generic SD**.

---

## 1. Bố cục & layout — như FS, BỎ phần FE
- Layout `bodies/<N>-<lang>/{vi,en}.md` + `challenges/` + `code-context.md` + `audited.md` + artifact audit (research/decision/claude_submitted) — **giống FS `contents.md §1`**.
- **SD KHÔNG có frontend/Vite/Sandbox/Playwright** — bỏ hẳn variant "BE+Playwright" và "FE-Vite" của FS, bỏ gate `fe-vite-clean`. Verification SD = curl/CLI/dashboard, KHÔNG DOM.
- ROOT H1 order + separator + `# description` plain-text + `# minutesRead` 15–30 (SD điển hình 20–28 do nhiều bước setup) + `# isPremium` (1–2 lesson cuối) — **giống FS**.
- `.docker/` (hoặc `.kubernetes/`/`.helm/`/`charts/`) nằm ở **cấp lesson** trong repo, KHÔNG trong content mount (content chỉ trỏ tới).

---

## 2. Heading template — GIỐNG HỆT FS (đã verify)
Đọc `../fullstack/contents.md §2`. SD dùng nguyên văn: `2.1.1` Chuẩn bị source → `2.1.2` Kiến trúc/thành phần → `2.1.3` Giải thích code và bản chất (`##### 2.1.3.x`) → `2.1.4` Chuẩn bị & khởi chạy (`2.1.4.1` Điều kiện cần trước · `2.1.4.2` Khởi động stack) → `2.1.5` Kiểm thử (`Luồng N`) → `2.1.6` Dọn tài nguyên → `2.1.7` Đọc thêm → `2.2` Lý thuyết (`2.2.1` Bản chất + `2.2.2` edge cases = **đúng 2 mục**) → `3.1` interview.

---

## 3. Wording SD deltas (sai = fail) — khác FS ở các điểm sau

| # | Điểm | SD | FS |
|---|---|---|---|
| 3.1 | **Repo name** | `system-design-mastery-module-<X>-<slug>` — **MATCH BY SLUG, số `<X>` LEGACY/lộn xộn (KHÔNG off-by-one sạch)**. Verify tên `.repo` folder thật + body URL khớp slug; ĐỪNG suy số. Thực tế: slot0→module-1-fundamentals, slot1→module-2-database, slot2→module-3-kubernetes (rename 2026-06-07), slot3→module-3-communication-patterns (trùng số 3, khác slug = OK), slot4 kafka→module-**10**-kafka (số nhảy). Body PHẢI trỏ đúng tên `.repo` folder hiện có. | `fullstack-mastery-module-<N>-<slug>` (slot-matched) |
| 3.2 | **§2.1.1 source** | BẮT BUỘC mention `; **Docker Compose** và file hands-on nằm trong [<slug>/.docker]`; `cd` step kết thúc `cd <repo>/<lesson-slug>/.docker` | KHÔNG mention `.docker/`; `cd <repo>/<lesson>` |
| 3.3 | **§2.1.2 table** | cột `Thành phần \| Cổng (Port) \| Vai trò` (VI) / `Component \| Port \| Role` (EN). Microservices-docker thêm cột `Image`; k8s thêm cột `Workload type` | cột `Thành phần \| File \| Vai trò` |
| 3.4 | **Mermaid** | **`flowchart TD` default** (LR chỉ ≤3 node); subgraph `"…"` khi ≥3 service cùng role; replica `[Service ×N]` (1 node); node name English; caption **italic strict** `*Hình N: …*` / `*Figure N: …*`; verify `mmdc` | LR cho phép; caption italic preferred |
| 3.5 | **§2.1.4.1 prerequisites** | **đúng 2 bullet**: `- **Docker Desktop** / **Docker Engine** + **Compose plugin**. <RAM hint>` + `- **Windows:** dùng **\`Invoke-RestMethod\`** thay cho **\`curl\`**.` (thêm bullet riêng/lesson được phép) | multi-tool (Node + npm + NestJS CLI + Docker + port 3000) |
| 3.6 | **§2.1.4.2 ConfigModule blockquote** | đặt **TRONG 2.1.4.2 TRƯỚC bash** (wording `> **Lưu ý:** … ConfigModule … không cần tạo/sửa .env khi chạy qua Docker Compose …`) | trước bash block |
| 3.7 | **§2.1.4.2 start** | **MỘT bash block, 1 lệnh** `docker compose up -d --build` (EN `Start the full stack`). Optional 2–3 bullet `Kiểm tra:`/`Verify:` URL/port. K8s = multi-step (`kubectl apply` → `kubectl wait` → port-forward) | multi-step (docker infra + `npm install` + `nest start --watch`) |
| 3.8 | **§2.1.6 Cleanup** | `docker compose down -v` **plain** (KHÔNG `-f .docker/compose.yaml` — vì SD đã `cd …/.docker`). `-v` bắt buộc | `docker compose -f .docker/compose.yaml down -v` |
| 3.9 | **§3.1 interview** | **5–7 câu** (SD strict) | 3–4 câu |
| 3.10 | **§2.1.5 flow count** | 3–10 flow, SD điển hình **4–6**, flow cuối demo edge/failure mode | 3–5 |

- Mọi rule **chung KHÔNG đổi**: opening 2-đoạn (Senior hỏi → Mid đáp sai → bridge bullet `- **Phần 2.1** … / - **Phần 2.2** …`), `§2 intro` "Thực hành dẫn dắt Lý thuyết", flow-list = bullet (`- **Luồng N:** …` CẤM inline), mỗi flow 1 block bash (Win PowerShell + macOS/Linux curl + Postman hint), conclusion `*Kết luận: …*`, 2.2.1 bullet facet đào sâu, 2.2.2 edge 3–5 bullet, em-dash `—`, **tiếng Việt đủ dấu**, code-fence comment English-only.
- **Tiếng Việt chuẩn (`data/rules/audit-vietnamese.md` §A — gate FAIL `Dịch ép thuật ngữ`):** KHÔNG dịch ép technical term, giữ tiếng Anh. SAI→ĐÚNG: `config/cấu hình có kiểu`→**Typed Config** · `trình nghe`/`bộ lắng nghe`→**Listener** · `lớp bọc`/`trình bao bọc`→**Wrapper** · `giàn giáo`/`khung sườn`→**Scaffold** · `phần mềm trung gian`→**Middleware** · `mã thông báo`→**Token** · `bộ nhớ đệm`→**Cache** · `khoá/khóa phân tán`→**Distributed lock** · `hàng đợi thư chết`→**DLQ** · `vỏ app`→**App Layout**. GIỮ theo ngữ cảnh: `nhà cung cấp`=vendor · `điểm cuối`=final score · `tải trọng`=load · `dưới lớp vỏ`=under the hood. KHÔNG calque word-by-word.

---

## 4. `# codeImplementations` — order SD-specific
- Đúng **4 entry, order `typescript → csharp → go → java`** (`## 0` typescript · `## 1` csharp · `## 2` go · `## 3` java). **CẤM entry `dotnet`** (legacy đã remove — audit fail nếu còn).
- Cấu trúc `### lang / ### guide / ### example` + label `**Mapping API:**` + `**Khác biệt/gotcha quan trọng:**`. `### example` 5–15 dòng, fence khai báo lang đúng.
- Concept framework-idiom (NestJS DI/decorator/DiscoveryService) → 1 block concept-mapping, KHÔNG ép 4-lang (như FS). Bỏ toàn bộ section CHỈ khi pure-infra (YAML/nginx/k8s, không có application code) → `audited.md: codeImplementations skipped (pure infra config lesson)` — hiếm với SD.
- (Khác FS: FS đặt `csharp` ở `## 0`. Tool key theo VALUE `### lang` không phải index, nhưng authoring SD theo order trên.)

---

## 5. Code trong bài = diff=0 với repo (CỨNG) — như FS
- Mọi code block `##### 2.1.3.x` + `# codeImplementations` = copy NGUYÊN VĂN từ `.repo/system-design-mastery-module-<N+1>-<slug>/<lesson>/...`. Verify = Loop code↔docs (Sonnet đối chiếu → Opus quyết sửa code hay bài). Đọc `../fullstack/contents.md §4`.
- **CHÚ Ý repo naming SD off-by-one + lệ sử**: scan thật phát hiện một số repo lệch (slot 0 repo còn tên `module-1` đúng theo off-by-one; slot 2 k8s repo `module-2-…` SAI, đáng lẽ `module-3-…`; nhiều `code-context.md` ghi `NEEDS-RENAME`). **Verify tên `.repo` folder + git remote khớp ĐÚNG URL trong body trước khi tin** — RepoSynchronizer upload CDN theo tên `.repo`, sai = học viên clone repo không tồn tại. Trong 1 lesson + module + 4 lang + vi/en: DUY NHẤT 1 giá trị `system-design-mastery-module-N-slug`.

---

## 6. Gotcha SD đã gặp (kiểm kỹ)
- **vi/en divergence + theory≠2** — như FS, gate bắt.
- **Module 4-lang** → fix phải quét cả `0-typescript/1-java/2-csharp/3-go`.
- **Code bịa** — đọc `.repo` source trước khi tin code-walkthrough.
- **Repo numbering lộn xộn** (off-by-one + NEEDS-RENAME + slug lệch) — luôn verify `.repo` thật.
- **Leak ghi chú nội bộ** ("Opus không chạy E2E", "chủ nhiệm/Gemini chạy") lọt body → strip, giữ hướng dẫn quan sát qua CLI/dashboard.
- **Cloud lesson** (m11 video / m15 vector / m16 file): §2.1.3.1 thêm blockquote 5-item provider (path credentials / tier / magic id / free-limit+charge / alternatives VN+CN) — **SD ưu tiên local emulator** (LocalStack/MinIO/fake-gcs) trong hands-on, đẩy cloud sang §2.2 Theory (Local emulator vs Cloud + Region/vendor-lock).

---

## 7. Gate
`./.audits/check-lesson.ps1 -Path <module-dir>` (free) — bắt chung: leak · inline-bullet (2.1.5) · fence chẵn · theory=2 · có 2.1.7 · `has-bodies` · `vn-có-dấu`. **SD bỏ `fe-vite-clean`** (không FE). Bài PASS structure mới lên LLM review ngữ nghĩa + đối chiếu §3 deltas (repo off-by-one, `.docker/` mention, table Port, mermaid TD, prerequisites 2-bullet, single `docker compose up`, interview 5–7, codeImpl order, cleanup plain).
