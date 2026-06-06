# StarCi FS — QA Audit Pipeline

Mục tiêu: kiểm content + challenge **từng module một, có kiểm soát**. Nguyên tắc: **gate rẻ chạy trước, LLM chỉ làm cái script không phán được**. Làm chậm, lưu vết để thầy review.

Files trong `.audits/`:
- `check-lesson.ps1` — gate deterministic (free, 0 token).
- `pipeline.md` — file này (quy trình + phân vai model).
- `rules-lean.md` + `rules/fullstack/{contents,challenges,coding}.md` — rules tự-đủ (`coding.md` = code BE/FE thế nào).
- `references.md` — **registry gold modules** (append sau mỗi module PASS để lần sau audit tốt hơn).
- `workflows/audit-fs-module.js` — **runner** (xem dưới).

---

## Chạy bằng WORKFLOW (thống nhất — KHÔNG ad-hoc)
Toàn bộ pipeline chạy như **một Workflow per module**, không gọi agent lẻ tay. Đảm bảo mỗi module qua y hệt các phase + đúng model tier.

```
Workflow({ scriptPath: ".audits/workflows/audit-fs-module.js", args: { module: "13-frontend-performance" } })
```
> Runner nhận `args` cả 3 dạng: object `{module}`, chuỗi-JSON `'{"module":"..."}'`, hoặc chuỗi tên-module trần `"13-frontend-performance"` (harness có lúc serialize args thành string → đừng để fail vì arg-shape).
> Thêm `args.guidance` (tùy chọn) = chỉ-dẫn-riêng-module, chèn vào brief/loop/decision với **ưu tiên tuyệt đối** — vd `{ module: "15-interaction-and-accessibility", guidance: "FE thuần → Vite + Sandbox, KHÔNG Next.js" }`.
> Thêm `args.expand: true` (tùy chọn) = **ép loop chạy ≥1 vòng dù gate PASS** — dùng khi MỞ RỘNG nội dung (vd thêm lang 4-lang/agnostic) mà gate không tự phát hiện thiếu (gate chỉ bắt format/structure). Kèm `guidance` nêu rõ per-lesson bucket (4-lang / agnostic / TS-only).
> Thêm `args.only: "<lesson>"` (hoặc CSV nhiều lesson) = **chỉ xử lý lesson đó**, bỏ qua các lesson khác — dùng khi thêm/sửa 1 lesson mà không muốn động (+ tốn token + rủi ro nhiễm) các lesson đã PASS. Kết hợp `expand:true` để author lesson mới từ seed.

## LUỒNG AUDIT 2-PHASE LAI (human-in-loop) — BẮT BUỘC từ M4 trở đi
Tách rõ **PHÂN TÍCH + CHỐT** (rẻ, có thầy) khỏi **EXECUTION** (nặng). KHÔNG chạy thẳng workflow nặng nữa.

### PHASE 1 — Phân tích & chốt (KHÔNG đụng code/repo)
1. **Gate (free)** + **Haiku brief** mỗi lesson: purpose, phần quan trọng, flow, loại bài, sơ bộ challenge.
2. **Opus phân tích** (đọc brief + gate + content/challenge + repo hiện trạng) → ra **đề xuất**:
   - **Đổi gì / sửa gì** (content, code, format).
   - **Lang nào GIỮ / lang nào BỎ** (theo content-check applicability — bỏ lang phải bịa concept vô nghĩa).
   - **Challenge nào HỢP / không hợp** (tier, criteria, có cần thêm/bớt/đổi).
   - **Rủi ro pivot** (vd Next↔Vite, 4-lang↔agnostic, gộp/tách lesson).
3. **Opus HỎI THẦY** các câu hỏi chốt (dùng AskUserQuestion) để quyết **có pivot không** cho phù hợp — KHÔNG tự quyết mấy thứ thay đổi định hướng.
4. **Thầy CONFIRM** → chốt scope (lang giữ/bỏ, challenge, pivot) → mới sang Phase 2.

→ Output Phase 1: 1 bản tóm tắt phân tích + quyết định đã chốt (ghi `research.md`/`decision.md` sơ bộ). **Đây là cổng người-duyệt: chưa confirm thì KHÔNG sang Phase 2.**

### PHASE 2 — Execution (sau khi thầy confirm)
Chạy workflow nặng theo scope đã chốt: migrate `backend/<lang>` → fix-doc-paths/cd-format → comment KĨ → loop code↔docs → **e2e thật (bind 127.0.0.1)** → re-gate → clean-residue → commit+push. (Phase ↔ model bên dưới.)

> Lý do: tránh đốt token chạy workflow nặng rồi mới phát hiện sai định hướng (lang thừa, challenge lệch, nên pivot). Chốt rẻ trước, execute sau.

---

Phase ↔ model (cố định trong runner):

| Phase | Model | Việc | Output |
|---|---|---|---|
| Gate | Haiku | chạy `check-lesson.ps1` + parse fails | (structured) |
| Brief | Haiku | research per lesson | `research.md` |
| **Phân tích + hỏi (Phase 1)** | **Opus** | đề xuất đổi/sửa + lang giữ/bỏ + challenge + hỏi thầy → confirm | `decision.md` (sơ bộ) |
| Loop | Sonnet | viết code thiếu + test luồng + đối chiếu snippet↔repo (4-lang port-map) | `.code/` `.e2e/` |
| Decision | Opus | duyệt + áp fix + mark | `decision.md` `claude_submitted.md` |

- **2 tầng loop:** `parallel` iter TỪNG lesson (song song) · mỗi lesson chạy **vòng hội tụ `while`** = brief 1 lần → `[Sonnet loop → Opus fix → re-gate]` **lặp tới khi gate PASS** hoặc hết `MAX_ITER` (3). Re-gate mỗi vòng quyết định lặp tiếp hay `claude_submitted.md`.
- **Phase cuối `References`:** sau khi cả module hội tụ, append 1 block vào `.audits/references.md` (variant + lesson gold + bài học) → lần audit sau đọc gold cùng variant cho chuẩn.
- **Artifact ghi THẲNG vào mount, trong từng `contents/<lesson>/`** (cạnh `audited.md`), KHÔNG để ở cây `.audits/` riêng. Nội dung **tiếng Việt**.
- Sửa runner: Edit `audit-fs-module.js` rồi re-invoke `{scriptPath}`. ĐỪNG nhắn khi workflow chạy (bị giết).

---

## Gate trước tiên (free)

```powershell
./.audits/check-lesson.ps1 -Path ".mount/data/courses/0-fullstack-mastery/modules/<module>"
# thêm -Mermaid để parse mermaid (chậm). Exit code = số FAIL (0 = sạch).
# Runner gọi kèm -Json để in JSON {lessons:[{name,fails}]} (agent copy thẳng vào StructuredOutput):
#   powershell -NoProfile -File ".audits/check-lesson.ps1" -Path "<module-dir>" -Json
# Trên Windows PHẢI dùng powershell.exe (KHÔNG pwsh/bash) → agent gate khỏi retry vô ích rồi chết.
```

Check: leak Opus/chủ-nhiệm/Gemini · inline-bullet (scope 2.1.5) · fence chẵn · theory=2 mục · có 2.1.7 · challenge score=100/verified/no-ref-sub/no-`### N.` · criteria Σ30+Σ70 · ≥1 critical · separator chẵn.
→ **Chỉ bài PASS mới đẩy lên LLM.** Bài FAIL: sửa structure rồi re-gate.

---

## Các bước (per lesson)

| # | Việc | Model | Output |
|---|---|---|---|
| 0 | Gate structure/format/sums | **Script** (free) | exit code |
| 1 | Bài PASS → brief: purpose, phần quan trọng, flow make-sense, **loại bài**, challenges sơ bộ | **Haiku** | `research.md` |
| 2 | **Loop code↔docs**: code có chưa (thiếu→Sonnet viết) → test luồng theo docs → sai→Opus sửa code/docs → lặp tới khớp | **Sonnet** test + **Opus** sửa | `.code/` `.e2e/` |
| 3 | E2E từng luồng (4-lang **parallel**, port-mapped) → output file tạm → check chuẩn chưa | **Sonnet** (code thiếu → Sonnet viết) | log |
| 4 | Challenge: script lo format → duyệt **chấm bài (criteria) + outputs + requirements**, quyết nâng cấp/giữ tier | **Haiku** brief → **Opus** duyệt | `decision.md` |
| 5 | Ghi done-marker + **DỌN TÀN DƯ** (module done) | **Script** | `claude_submitted.md` |

### Dọn tàn dư khi module DONE (dọn dần, mỗi module xong 1 lần)
Khi module **đã hội tụ** (gate PASS + e2e proof + pushed) → chạy `bash .audits/clean-residue.sh <mount-module-dir> [<repo-dir>]` (DRYRUN=1 xem trước):
- **XÓA (tàn dư):** `antigravity_test.md` (module-level test junk) · `code-context.md` (spec pre-audit, hết cần sau khi done) · repo test-scaffolding (`test_spec.py`, `__pycache__/`, `generate-test.js`, `compose_test.yaml`) · leftover bare lang dir sau migrate.
- **GIỮ (audit trail + learner):** `vi.md` `en.md` `bodies/` `challenges/` `audited.md` `research.md` `decision.md` `claude_submitted.md` `.code/` `.e2e/`.
- Xóa `code-context.md` KHÔNG phá gate (BE lesson không cần; Check-FrontendVite return sớm). Mount gitignored → chỉ recover từ DB, nên chỉ dọn KHI module thực sự done.

### Artifacts per lesson — ghi THẲNG vào mount `.../modules/<slot>/contents/<lesson>/` (cạnh `audited.md`), **tiếng Việt**
```
research.md           [Haiku] brief: purpose + phần quan trọng + flow make-sense + loại bài + challenges sơ bộ
decision.md           [Opus]  duyệt: findings + quyết định (criteria/outputs/requirements) + việc đã fix
.code/                [Sonnet] TRACK code Sonnet đã viết: liệt kê file tạo/sửa + tóm tắt + diff/lý do (mỗi lang nếu 4-lang)
.e2e/<lang>/          [Sonnet] CHỨNG MINH đã test — TÁCH 4 sub theo lang (typescript/java/csharp/go); mỗi luồng = 1 file flow-<N>-<slug>-<status>.md (status: done|fail|require-creds) + output thật + log lệnh
claude_submitted.md   done-marker: ghi khi gate PASS + đã duyệt + .e2e đủ proof
```
> Trước (cũ): các file này nằm ở `.audits/0-fullstack-mastery/<module>/<lesson>/`. Nay **ghi thẳng vào folder `contents/<lesson>/` trong mount** để review tại chỗ cùng nội dung bài. Seeder bỏ qua các file ngoài schema (giống `audited.md`).
- **`.code/`** — Sonnet viết/sửa code gì PHẢI ghi vào đây để track (file path + tóm tắt + vì sao). 4-lang → ghi mỗi lang.
- **`.e2e/` — TÁCH 4 SUB THEO LANG** (thay luật cũ "gộp 1 record"): `.e2e/typescript/`, `.e2e/java/`, `.e2e/csharp/`, `.e2e/go/`. Trong mỗi sub, **mỗi luồng = 1 file** `flow-<N>-<slug>-<status>.md` chứa: lệnh chạy, **output thật**, port đã assign, kết luận. `<status>`:
  - **`done`** — chạy thật, PASS. Thôi.
  - **`fail`** — chạy **≥2 lần** vẫn không pass → ghi rõ lỗi + nguyên nhân trong file; **PHẢI fix** (Opus quyết sửa code hay docs) rồi chạy lại tới `done`.
  - **SKIP RE-RUN khi sửa quá nhỏ (Opus quyết):** nếu flow **đã `done` trước đó** (có proof pass) và thay đổi lần này là **trivial — KHÔNG đổi hành vi runtime** (chỉ thêm comment / sửa path doc / cd-first / format) → **GIỮ `done`, KHÔNG chạy lại e2e** (đỡ tốn quota + tránh firewall). Chỉ re-run khi đổi **logic/source thật** hoặc chưa có proof. Opus là người quyết "trivial hay không".
  - **`require-creds`** — luồng đụng **cloud / cần credential từ provider** (Twilio, SMTP/Brevo, AWS/S3/MinIO cloud, Stripe/PayPal/PayOS/Sepay, Vault, OAuth Google/Keycloak, v.v.) mà trò **không tự tạo được** → ghi **RÕ TÊN cred cần** (biến env nào, account nào) ra file; **thầy quăng cred → Claude tự chạy nốt** → đổi sang `done`. **Local infra dựng bằng Docker được (Postgres/Redis/Mongo/RabbitMQ/Kafka...) KHÔNG tính require-creds** — fail thì phải fix.

Mỗi log entry gắn tag model để thầy biết ai làm gì:
```
[Haiku 4.5] brief: bài dạy responsive layout không media-query-soup; flow 2.1.5 hợp lý...
[Opus 4.8] duyệt: challenge easy criteria tổng outcome=35 (sai, phải 30) → fix về 30/70...
[Sonnet 4.x] viết code: thêm backend/java SmsController port 3001; .e2e/flow-1: POST /sms 201 {messageSid} → PASS.
```

---

## Viết content — chống vi/en divergence
- **Opus viết `vi.md`** (tiếng Việt = bản gốc). **Sonnet dịch sang `en.md`** (mirror 1-1 từ vi) — KHÔNG author `en` độc lập. → vi/en luôn cùng bài, cùng cấu trúc.
- Backstop: gate so vi↔en (cùng số heading · cùng số luồng · cùng số fence). Lệch = en đã trôi thành bài khác.

## Loop code ↔ docs (step 2) — **Sonnet loop → Opus decision**
Áp cho **CẢ HAI**: **(A) luồng 2.1.5** + **(B) code-walkthrough §2.1.3 viết TRONG bài** (snippet body PHẢI khớp `.repo/src`, không bịa — vd Twilio bài cũ ghi `/sms/send` nhưng repo là `POST /sms`).

**Sonnet chạy vòng lặp:**
1. Code có chưa? thiếu lang nào → Sonnet viết (contract bài + repo gold). Ghi `.code/`.
2. Test luồng theo docs **+ đối chiếu snippet §2.1.3 với code repo thật** (4-lang port-mapped). Ghi `.e2e/` (output thật + log).
3. Lệch? (luồng sai **HOẶC** snippet bài ≠ repo) → **Opus decision: sửa CODE hay sửa DOCS** (tùy mục đích bài).
4. Lặp 2↔3 tới khi **mọi luồng + mọi snippet khớp** → done. (LOOP, KHÔNG one-shot diff.)

> Công thức chung: **Sonnet loop (viết/test/đối chiếu) · Opus decision (quyết khi lệch).**

## Phân vai model
- **Script (free):** structure / format / criteria-sum / leak / fence / parity / vi↔en mirror.
- **Haiku:** brief/skim content, brief challenge.
- **Sonnet:** **viết code nếu repo thiếu/chưa có**; **chạy E2E test (4-lang, parallel)**; check output luồng đúng chưa; viết body 4-lang số lượng lớn.
- **Opus:** quyết định — criteria/outputs/requirements, diff lesson-vs-code (sửa bên nào), rewrite sai-format, update rules.

E2E test = **Sonnet** chạy thật trên host (xem "Test 4-lang" dưới). Chủ nhiệm/Gemini chỉ ký duyệt cuối nếu cần.

---

## Layout `.repo` THỐNG NHẤT (backend grouped)
- Mỗi lesson trong repo GitHub theo cấu trúc: **`<repo>/<lesson>/backend/<N>-<lang>/`** cho server (0-typescript, 1-java, 2-csharp, 3-go) + **`<repo>/<lesson>/frontend/`** cho FE. File lẻ (README/test.md/.docker/...) ở cấp lesson.
- Lý do: đồng nhất + chừa chỗ **nhiều api server** sau này (backend/ chứa được >1 service). FE check gate vẫn dùng `.repo/.../frontend`.
- Migrate repo cũ (`<lesson>/<N>-<lang>` thẳng, hoặc `<lesson>/backend` đơn = TS) → dùng script `.audits/migrate-repo-backend.sh` (DRYRUN=1 xem trước, DRYRUN=0 chạy `git mv` giữ history). `code-context.md` phải trỏ `path: <repo>/<lesson>/backend/<N>-<lang>`.

## Test 4-lang (parallel + PORT MAPPING)
- **Không có code / repo thiếu lang nào → Sonnet viết** (theo contract bài + repo gold), rồi mới test.
- E2E = **Sonnet**, chạy **PARALLEL cả 4 lang** cho nhanh.
- 4 backend đều default cùng port (vd `3000`) → **đụng port khi parallel**. PHẢI tạo **port mapping TRƯỚC** rồi mới test:

  | lang | port |
  |---|---|
  | typescript | 3000 |
  | java | 3001 |
  | csharp / .net | 3002 |
  | go | 3003 |

  Mỗi lang chạy port riêng (set qua env/config); flow logic GIỮ NGUYÊN, chỉ đổi base URL theo port.
- **BIND `127.0.0.1` (loopback), KHÔNG `0.0.0.0`** — BẮT BUỘC cho e2e local. Lý do: khi server (java/dotnet/go binary "mới") nghe `0.0.0.0` (all interfaces), **Windows Defender Firewall bật popup "Allow access" modal → treo agent chờ click**. Nghe loopback thì firewall KHÔNG quản → không hỏi. Curl/test dùng `http://127.0.0.1:<port>` hoặc `localhost`.
  - TS/Nest: `app.listen(port, '127.0.0.1')`. Java Spring: `server.address=127.0.0.1` (application.properties / `-Dserver.address=127.0.0.1`). Go: `r.Run("127.0.0.1:<port>")` / `http.ListenAndServe("127.0.0.1:<port>", ...)`.
  - **C# ASP.NET — DỄ ESCAPE, ép kỹ:** `dotnet run` mặc định/`Properties/launchSettings.json` `applicationUrl` hay bind `0.0.0.0`/`localhost`(→IPv6 `::` cũng bị firewall). PHẢI set **env `ASPNETCORE_URLS=http://127.0.0.1:<port>`** (override launchSettings) TRƯỚC khi chạy, VÀ thêm cờ `--urls http://127.0.0.1:<port>`. Nếu `Program.cs` có `UseUrls(...)`/`applicationUrl` non-loopback → sửa về `127.0.0.1`. Verify bằng `Get-NetTCPConnection` không có `0.0.0.0`/`::` cho port đó. (Đã từng popup vì `ConfigAndLogging.exe` bind `::`.)
  - Chỉ khi e2e CẦN truy cập từ máy khác (hiếm) mới bind 0.0.0.0 + thêm firewall allow rule trước (admin).
- **TÌM PORT RẢNH TRƯỚC RỒI MỚI ASSIGN** (KHÔNG khởi động ở port mặc định rồi xử lý va chạm). Quét port đang dùng → lấy port trống → assign cho 4 lang:
  ```powershell
  $used = (Get-NetTCPConnection -State Listen -EA SilentlyContinue).LocalPort
  $free = 3000..3100 | Where-Object { $used -notcontains $_ } | Select-Object -First 4   # hoặc random 1000-9999 til free
  # $free[0]=ts · $free[1]=java · $free[2]=net · $free[3]=go
  ```
  Đặt port qua `PORT`/config, chỉ đổi base URL — flow giữ nguyên. **KHÔNG fail/skip e2e vì port.** Ghi **PORT thực tế đã assign** mỗi lang vào `.e2e/`. (Hay gặp: server e2e run trước chưa cleanup vẫn giữ 3000-3002 → vì tìm-trống-trước nên tự nhảy 3003+.)
- **Kết quả TÁCH THEO LANG** (đổi luật cũ "gộp 1 bảng"): mỗi lang ghi riêng `.e2e/<lang>/flow-<N>-<slug>-<status>.md` (xem mục Artifacts). Lý do tách: biết chính xác lang nào pass / lang nào fail / lang nào chờ creds, không bị che bởi 1 bảng gộp. Có thể kèm 1 file tổng `.e2e/summary.md` (bảng `flow × lang × status`) nếu muốn nhìn nhanh, nhưng per-lang per-flow là BẮT BUỘC.

---

## Quyết định LOẠI BÀI (bake vào rules)
- **Demo thuần BE**, call API đơn giản → viết **thuần backend** (curl/PowerShell flows).
- **BE trọng tâm nhưng cần FE để demo** (thuần BE quá trừu tượng: websocket, file-upload) → **backend + Playwright** (docs KHÔNG mô tả UX/UI; chỉ element/div = DOM tối thiểu để Playwright kiểm cơ chế BE; học viên cần thì tự dựng UI sau).
- **Thuần FE** → **frontend Vite** theo `lesson-ui.rules`: `Local` = spec-accurate (khớp testid Playwright) / `Sandbox` = trực quan, mô tả giao diện (KHÔNG cần 100% đúng).

---

## Tối ưu
1. **Gate-first:** bài script PASS → bỏ qua tầng Haiku-format; LLM chỉ chạm cái script không phán được (ngữ nghĩa, đúng-loại, diff-quyết-định).
2. **Idempotent:** bài có `claude_submitted.md` + gate PASS → skip lần sau. Làm từng module: gate → fix → re-gate → mark.
3. **Bake** quyết-định-loại-bài + Sandbox≠Local vào `rules-lean.md` → Haiku chỉ *phân loại*, không *nghĩ lại luật*.
4. **Diff snippet↔repo = script**, không LLM. Opus chỉ vào khi có diff thật.
5. **Đừng nhắn khi workflow/agent chạy** → bị giết. Để chạy xong mới review.
