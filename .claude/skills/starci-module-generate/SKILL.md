---
name: starci-module-generate
description: >
  TẠO / MỞ RỘNG nội dung 1 module StarCi — author lesson + challenges MỚI, hoặc bổ sung lang (4-lang/agnostic) /
  thêm lesson vào module đã có — cho khóa Fullstack (`0-fullstack-mastery`) hoặc System Design (`1-system-design-mastery`),
  qua pipeline tự-đủ trong `.claude/docs/`. Dùng CHUNG runner với audit nhưng bật `expand:true` (ép loop chạy ≥1 vòng dù
  gate PASS, để MỞ RỘNG mà gate không tự phát hiện thiếu) + `only:"<lesson>"` (author đúng lesson từ seed) + `guidance`
  (per-lesson bucket: 4-lang / agnostic / TS-only, pivot Next/Vite). Chạy 2 GIAI ĐOẠN: phân tích + ĐỀ XUẤT scope
  (lesson nào · lang nào · challenge nào) → HỎI THẦY chốt → author (viết `vi.md` gốc, mirror `en.md` + code)
  → gate → e2e. Model: **mặc định Sonnet 5** (tiết kiệm), **Opus opt-in** qua `args.opus:true` (+`only:"<lesson>"`)
  cho lesson author khó. BẮT BUỘC qua Workflow. Dùng khi user gõ `/starci-module-generate <N|slug>`, "GEN/TẠO MODULE",
  "author/viết/mở rộng lesson/challenge", "thêm lang cho module". Để KIỂM module đã đủ → dùng `/starci-module-audit`.
---

# /starci-module-generate — Author / mở rộng module (FS / SD)

Chạy khi thầy muốn TẠO nội dung mới (lesson/challenge) hoặc MỞ RỘNG (thêm lang, thêm lesson) cho 1 module. **Quy trình + rules tự-đủ trong `.claude/docs/`** — đọc `.claude/docs/pipeline.md` + `.claude/docs/rules-lean.md` + `.claude/docs/references.md` + `.claude/docs/rules/<course>/{contents,challenges,coding}.md`. Cùng runner với audit; khác ở **INTENT = author/expand** (bật `expand`/`only`).

## Model tier (đồng bộ cả hệ `.claude/docs`, xem `pipeline.md §Phân vai MODEL`)
- **DEFAULT = Sonnet 5** cho author (`vi.md` gốc) + mirror `en.md` + code + review/decision. **Haiku** cho enumerate/re-gate/refs. **Opus = opt-in** — bật `args.opus: true` (thường kèm `only:"<lesson>"`) escalate 1 lesson author KHÓ (pedagogically-hard / criteria hard-insane phức tạp) khi bản Sonnet 5 chưa đạt. Tiết kiệm theo mặc định, đắt-tiền chỉ khi ngoại lệ.

## ⛔ NGUYÊN TẮC TỐI THƯỢNG (pipeline.md §NGUYÊN TẮC — đọc trước tiên)
- **Quyết định SUBSTANTIVE = thầy chốt, KHÔNG tự làm:** scope (lesson nào, lang nào GIỮ/BỎ), tạo challenge mới + tier, pivot (Next↔Vite, 4-lang↔agnostic, gộp/tách lesson), loại bài. Gen là "author mới" → **CÀNG phải HỎI THẦY trước** (đừng đoán rồi đốt token viết sai định hướng).
- **BỎ lang phải bịa concept vô nghĩa** — chỉ gen lang mà nội dung áp dụng THẬT (content-check applicability). Đừng ép đủ 4-lang khi 1 lang phải bịa.
- **MẶC ĐỊNH e2e THẬT** sau khi author (bind `127.0.0.1`, Docker local). `noE2e`/`no-test` là ngoại lệ CHỈ khi thầy nói rõ, KHÔNG tự lan.

## ⭐ Quy ước VIẾT NỘI DUNG (BẮT BUỘC đọc trước khi author/sửa 1 ký tự prose)
Author/reviewer PHẢI đọc `.claude/docs/rules/terminology-bold.md` (STRICT — "sai 1 chỗ = sai cả module") + `.claude/docs/rules/<course>/contents.md` §3 trước. Truyền các luật này vào prompt agent author:
- **Terminology + Bold (4 loại từ):** L1 phổ thông → DỊCH tiếng Việt tự nhiên, KHÔNG bold · L2 English nền tảng (lifecycle/scope/provider/middleware/payload/handler…) → GIỮ English, KHÔNG bold · L3 jargon chuyên ngành (dependency injection/idempotent/eventual consistency/single source of truth…) → English + **bold** (bold lần-đầu-mỗi-lesson, sau plain) · L4 code/định danh/literal → `inline code`. **Bold CHỈ 2 nhóm:** jargon L3 + nhãn template §3A (Senior Engineer/Phần 2.1/Câu hỏi N/Bước N/Giải pháp/Trade-off…). CẤM bold ad-hoc, L1/L2 giữa văn xuôi, quanh/lấn inline-code. Polysemy = đọc context (`source code` giữ EN, không "mã nguồn"), CẤM search-replace mù.
- **Tiếng Việt đủ dấu** ở MỌI prose (vi.md body + challenge + artifact) — gate FAIL `Vietnamese KHÔNG DẤU`. Comment trong code-fence = English-only. Em-dash `—` trong prose; giữ `--` trong code/CLI/URL/separator.
- **§2.1.5 Kiểm thử = ACCORDION** (convention hiện hành, xem `refactor-<course>-accordion-terminology.js` + gold `0-nestjs-core.../0-frameworks-in-backend`): intro = 1 bullet-list `- **Luồng N — \`route\`:** <mục tiêu>` (EN `- **Flow N — …:** <goal>`), rồi 1 khối **`::::accordion`** (4 dấu `:`) chứa mỗi luồng 1 **`:::panel{title="<tên luồng, KHÔNG số>"}`** … bước/curl/json/`*Kết luận:*` … `:::`, đóng `::::`. GIỮ nguyên §2.1.3 nest `#####`. CẤM inline `**(1)**…**(2)**`.
- **Code trong bài = diff=0 với `.repo/src`** — mọi block §2.1.3 + `# codeExplaining` copy NGUYÊN VĂN (không paraphrase/simplify/bịa), kể cả `@Module`/imports/decorator.

## 1. Xác định `<module>` + `<course>` + BUCKET
- `<module>` = folder slug dưới `.mount/data/courses/<course>/modules/`. `<course>` quyết định runner + rules:
  | Course | folder | runner | rules |
  |---|---|---|---|
  | **Fullstack** | `0-fullstack-mastery` | `audit-fs-module.js` | `.claude/docs/rules/fullstack/*` |
  | **System Design** | `1-system-design-mastery` | `audit-sd-module.js` | `.claude/docs/rules/system-design/*` |
- **BUCKET per-lesson** (quyết định thầy chốt) = lesson gen ra dạng nào:
  - **4-lang** (`0-typescript → 1-java → 2-csharp → 3-go`) — BE demo/code-walkthrough có ý nghĩa ở nhiều lang.
  - **agnostic** (`0-agnostic`) — FE/infra/khái niệm không gắn 1 lang cụ thể (SD phần lớn agnostic).
  - **TS-only** — chỉ TypeScript khi lang khác vô nghĩa.
- **Đọc `.claude/docs/references.md` (gold CÙNG variant) TRƯỚC khi author** → bắt chước format chuẩn (FE-Vite / BE-4lang / BE+Playwright / SD-agnostic), đỡ lặp lỗi.

## 2. GIAI ĐOẠN 1 — Phân tích scope + ĐỀ XUẤT → HỎI THẦY (KHÔNG đụng code/repo)
- Đọc seed/context module hiện có + `code-context.md` (nếu có) + gold references → **ĐỀ XUẤT**: lesson nào cần author/mở rộng · bucket mỗi lesson (4-lang/agnostic/TS-only) · challenge nào cần tạo (4 tier easy+medium+hard+insane) + criteria sơ bộ · loại bài (thuần BE / BE+Playwright / FE Vite Sandbox) · rủi ro pivot.
- **HỎI THẦY** (AskUserQuestion) chốt scope. **Chưa confirm thì KHÔNG author.** → tránh gen sai định hướng (lang thừa, challenge lệch, pivot sai).

## 3. GIAI ĐOẠN 2 — Author / expand (SAU khi thầy chốt scope)
```
Workflow({ scriptPath: ".claude/docs/workflows/<runner>", args: {
  module: "<module>",
  stage: "apply",
  expand: true,                       // ép loop chạy ≥1 vòng dù gate PASS — cần cho MỞ RỘNG (gate chỉ bắt format, không biết "thiếu lang/lesson")
  only: "<lesson|CSV>",               // chỉ author đúng lesson này — KHÔNG động (+tốn token +rủi ro nhiễm) lesson đã PASS
  guidance: "<bucket + pivot đã chốt>" // vd "lesson X = 4-lang; lesson Y = agnostic; FE thuần → Vite + Sandbox, KHÔNG Next"
}})
```
- **`expand: true`** = author lesson mới từ seed / bổ sung lang mà gate không tự phát hiện thiếu (gate chỉ bắt format/structure).
- **`only`** = khoanh vùng đúng lesson đang gen → không nhiễm lesson đã done.
- **Author theo bố cục V2** (rules-lean §Bố cục + §Heading): ROOT metadata (body/codeExplaining/codeImplementations rỗng, 2 sep) · body thật ở `bodies/<N>-<lang>/{vi,en}.md` · separator `<!-- @starci/seperator -->` · heading strict `1→2→2.1.x→3` · §2.2 theory ĐÚNG 2 mục · §2.1.7 đọc thêm · §3.1 câu hỏi phỏng vấn.
- **vi.md = bản GỐC (tác giả viết) · en.md = mirror 1-1** (chống divergence; gate so cùng số heading/luồng/fence). Tier tác giả mặc định Sonnet 5; escalate Opus qua `opus:true` khi lesson khó.
- **Tiếng Việt chuẩn** (rules-lean §Tiếng Việt): đủ dấu mọi nơi · KHÔNG dịch ép thuật ngữ (App Layout/Hook/Wrapper/Middleware/Cache… giữ Anh) · không calque · comment trong code English-only.
- **Challenge V2** (rules-lean §Challenge): mỗi lesson đủ **4 challenge = easy+medium+hard+insane**, `score=100` mọi bài, criteria `outcomeCriterias` Σ30 + `approachCriterias` Σ70 (≥1 critical=40), mỗi criteria nêu **Kiểm gì / Bằng chứng quan sát / Fail nếu** (cơ chế thật, không chung chung). hard/insane depth production thật (không gượng).
- **Code + e2e:** Sonnet viết code repo thiếu (`.code/`) → e2e thật 4-lang parallel port-mapped (`.e2e/<lang>/flow-*.md`) → Opus decision khi lệch (sửa code hay docs) → loop tới khớp. `.repo` layout: `<repo>/<lesson>/backend/<N>-<lang>/` + `<repo>/<lesson>/frontend/`.

## 4. Gate + hội tụ + đóng
- Sau author: **Gate** (`check-lesson.ps1 -Json`) → **vòng hội tụ per-lesson** `[Sonnet loop → Opus fix → re-gate]` tới PASS. **Decision** (Opus) duyệt criteria/outputs + lệch code↔docs → `decision.md` + `claude_submitted.md`. **References** append gold.
- **ĐỪNG nhắn khi workflow chạy** (bị giết). Đợi xong → re-gate → báo cáo lesson mới `flow × lang × status` + challenge đã tạo.
- Push + verify-repos + clean-residue: theo `/starci-module-audit` §5 (chỉ khi thầy bảo push).

## Artifacts (ghi THẲNG vào mount `contents/<lesson>/`, tiếng Việt)
`research.md` · `review.md`/`decision.md` · `.code/` · `.e2e/<lang>/flow-*.md` · `claude_submitted.md` · `synced.yaml`. Seeder bỏ qua file ngoài schema.

## Phân biệt với `/starci-module-audit`
- **generate** = author/mở-rộng nội dung MỚI (bật `expand`/`only`, gen từ seed) — dùng khi content còn thiếu/muốn thêm.
- **audit** = nghiệm thu module ĐÃ CÓ (review → gate → loop → e2e, sửa cơ học) — dùng khi content đã đủ, chỉ kiểm+chuẩn hóa.
- Cùng runner + rules + nguyên tắc tối thượng; khác INTENT + args.
