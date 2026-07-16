---
name: starci-flashcard-generate
description: >
  TẠO / MỞ RỘNG flashcard decks + cards cho 1 khóa StarCi (Fullstack/System Design/DevOps) tại
  `.mount/data/courses/<course>/flashcard-decks/` — author deck/card MỚI để đạt chuẩn **15 deck × 10 card**, hoặc
  fill deck thiếu card, theo `.claude/docs/rules/flashcard-answer.md`. Card = câu phỏng vấn SÂU kiểu tuyển dụng hay
  hỏi thật (system design / bản chất ngôn ngữ / edge case — KHÔNG trivia/hàm-cụ-thể/padding), answer = "Interview
  Arc" (`:::muted` label Trả lời thẳng/Cơ chế/Trade-off/Bẫy/Đào sâu, level-adaptive; cloze `{{cN::…}}` CHỈ trong
  Trả lời thẳng, plain text — không backtick/tên hàm/class), bilingual vi↔en mirror + terminology (đủ dấu, không
  dịch ép, NGỮ PHÁP tiếng Việt đúng và tự nhiên — không word-for-word từ câu Anh), phân bố level ≥3 junior + ≥3
  senior/staff. Generic hoá framework/API cụ thể trừ khi đó chính là trọng
  tâm câu hỏi; card phụ thuộc 1+ ngôn ngữ cụ thể phải gắn `# langs`. Ground từ nội dung lesson (`# moduleRefs`).
  NHẸ (KHÔNG code/e2e). 2 GIAI ĐOẠN: đề xuất scope (deck nào · bao nhiêu card · level bucket) → HỎI THẦY chốt →
  author (Sonnet 5 mặc định) → verify structure + mirror. Dùng khi user gõ `/starci-flashcard-generate
  <course|deck>`, "gen flashcard", "viết/thêm thẻ", "tạo deck". Để KIỂM deck đã đủ → `/starci-flashcard-audit`.
---

# /starci-flashcard-generate — Author / mở rộng flashcard

Chạy khi thầy muốn TẠO/thêm flashcard. **Rule tự-đủ: `.claude/docs/rules/flashcard-answer.md`** (đọc HẾT trước) + `.claude/docs/rules/terminology-bold.md`. Chung nguyên tắc pipeline: substantive = hỏi thầy.

## Model tier (xem `pipeline.md §Phân vai MODEL`)
- **Build/regen CẢ DECK = 2 tầng model (chuẩn, thầy chốt 2026-07-13):** **OPUS viết BRIEF** trước — thiết kế 20 card (câu hỏi từng thẻ · level · concept để cloze + distractor · coverage đủ sub-topic · không trùng), bám đúng chuẩn chất lượng deck-0 (`0-module-1`) làm exemplar vàng. → **Sonnet 5 VIẾT card** từ brief đó (author answer Interview Arc + mirror vi↔en + verify). **Haiku** enumerate. Chạy qua Workflow: `pipeline(deck → opus-brief → sonnet-write)`, mỗi deck 1 nhánh song song.
- **Fill NHỎ (thêm vài card vào deck có sẵn):** Sonnet 5 làm cả brief lẫn viết, KHỎI cần Opus. Tiết kiệm theo mặc định.

## ⛔ Substantive = HỎI THẦY trước khi author
- **Deck nào tạo mới**, **bao nhiêu card cần thêm**, **level bucket** (thiếu junior hay senior), **chủ đề deck** (1 mental model coherent) → quyết định thầy chốt. Gen = "vẽ mới" → đề xuất scope rồi HỎI, đừng đoán rồi đốt token.

## 1. Chuẩn mục tiêu (§0) — "curate-then-fill để chạm 10"
- Mỗi khóa **15 deck** (1 deck = 1 sub-topic coherent, `0-…`→`14-…`, sortIndex khớp). Mỗi deck **10 card** (`0-card`→`9-card`).
- **Nguồn > 10 card đáng giá** → giữ 10 mạnh nhất (theo gate §1), xoá phần còn lại (nông/gượng/gần-trùng). **Nguồn < 10** → viết card MỚI SÂU (câu phỏng vấn thật, không padding) tới 10, thiên về level bucket đang thiếu.
- **Phân bố level:** ≥3 junior + ≥3 senior/staff, còn lại middle; sắp dễ→khó. **Coverage:** không mất topic nguồn khi merge. **Follow-up graph:** mỗi "Đào sâu tiếp" nên trả lời được bởi card khác cùng deck.

## 2. GIAI ĐOẠN 1 — Đề xuất scope → HỎI THẦY
- Đọc `# moduleRefs` (lesson deck rút từ) + nội dung lesson tương ứng + card hiện có → **ĐỀ XUẤT**: deck nào cần fill/tạo · số card thêm · level bucket · chủ đề từng card mới (câu phỏng vấn nào). → **HỎI THẦY** (AskUserQuestion) chốt. Chưa confirm KHÔNG author.

### 2.1. Nguồn brainstorm THẬT — mỗi lesson đã có sẵn "Common interview questions" (2026-07-13)
- **ĐỌC `# bodies` của từng lesson trong `moduleRefs`, KHÔNG chỉ đọc `# title`/`# description` của module** — mỗi lesson thật (`contents/<lesson>/bodies/<lang>/en.md`) kết thúc bằng mục **"§3.1 Common interview questions"**: 2-3 câu, mỗi câu có sẵn `Question` / `What the interviewer wants to hear` / `Sample answer` — đội content đã viết đúng tinh thần tư duy phỏng vấn (why/when/trade-off), KHÔNG phải trivia. **Đây là nguồn brainstorm chính, không tự bịa câu mới khi nguồn này đã có.**
- **Lesson có `# bodies` PER-LANGUAGE** (thường `typescript/java/csharp/go`, mỗi ngôn ngữ minh hoạ bằng 1 framework/pattern riêng của nó) — mục Common interview questions LẶP LẠI ở mỗi bản ngôn ngữ: câu hỏi #1 thường Y HỆT/universal giữa các ngôn ngữ (test đúng khái niệm), câu #2-3 có thể ĐỔI theo ngôn ngữ khi bản chất câu hỏi là về sự khác biệt (vd "Go không có IoC container thì DI thế nào" chỉ có ở bản Go). Câu universal → generic hoá bình thường; câu khác biệt-có-chủ-đích → giữ nguyên + gắn `# langs`.
- **Curate 15 câu (5 lesson × 3) xuống 10 card** (khớp §0 "curate-then-fill"): chọn 2 câu mạnh nhất/lesson (deck 5-lesson) hoặc theo tỷ lệ tương ứng số lesson trong module, ưu tiên câu có trade-off/edge-case thật (không phải câu mô tả thuần).
- **Generic hoá sample answer có sẵn** — sample answer gốc thường lách vào tên framework cụ thể ("In NestJS the pipe runs before the handler") vì đó là bản 1 ngôn ngữ; viết lại theo đúng §0.2 (khái niệm trước, framework chỉ khi là trọng tâm).
- Mục **"Edge cases to watch"** (§2.2.2 của mỗi lesson, ngay trước Common interview questions) là nguồn tốt để làm giàu **Trade-off/Bẫy thường gặp** — mỗi bullet đã có sẵn tình huống + "Fix:", chỉ cần diễn lại theo giọng Interview Arc.

## 3. GIAI ĐOẠN 2 — Author (sau khi thầy chốt)
- **Field DSL card:** `# sortIndex / # isPremium / # question / # level / # tags / # langs(optional) / # answer`, ngăn `<!-- @starci/seperator -->`. Deck meta: `# sortIndex / # title / # description / # difficulty / # moduleRefs`.
- **Question §1:** câu phỏng vấn SÂU kiểu tuyển dụng hay hỏi thật — system design / bản chất ngôn ngữ / edge case, cần lập luận/chẩn đoán/trade-off/design, có "vì sao" thật, mời follow-up tự nhiên, scale theo seniority. KHÔNG trivia/1-fact/cú-pháp-tool/hỏi-hàm.
- **Generic hoá framework/API cụ thể (§0.2 mới):** mặc định câu hỏi + answer KHÔNG gắn cứng vào 1 framework/lib cụ thể (vd không hỏi "NestJS ValidationPipe làm gì") — viết theo ngôn ngữ system-design/HTTP/runtime thuần, áp dụng được ở bất kỳ stack nào. Chỉ giữ tên framework/API riêng khi chính nó LÀ trọng tâm mental model của card (không phải chi tiết phụ trợ).
- **`# langs` (optional, §0.1 rule.md):** mặc định KHÔNG có field này (ngôn ngữ-độc lập). Chỉ thêm khi câu hỏi phụ thuộc nội tại 1+ ngôn ngữ cụ thể (vd Go GC → `go`; so sánh Rust/Go → `go, rust`). Pseudocode minh hoạ không tính là language-bound. **Field này mới là quy ước nội dung — chưa có cột DB/GraphQL/FE picker, đừng giả định filter được.**
- **Answer §2 = Interview Arc:** mỗi label 1 `:::muted` block (body prose thường bên dưới, KHÔNG bọc body): **Trả lời thẳng (TL;DR ≤2 câu, trả lời thật — KHÔNG dùng nhãn "Chốt")** → **Cơ chế/vì sao** → **Trade-off** → **Bẫy thường gặp** → **Đào sâu tiếp** (1 follow-up). Không có section "Từ khoá ăn điểm" riêng (đã retired) — cloze chính là từ khoá. Level-adaptive (junior: TL;DR+Cơ chế; middle: +Bẫy; senior/staff: full). Mỗi muted ≤3 câu. **Never invent facts** — sai/không chắc thì bỏ.
- **Cloze `{{cN::…}}` (§2.1 rule.md) — CHỈ trong "Trả lời thẳng", PLAIN TEXT:** mọi card phải có ≥1 cloze che đúng khái niệm cốt lõi (không phải tên hàm/class/API cụ thể trừ khi đó chính là trọng tâm), đặt trong section TL;DR, không backtick/code-span bên trong marker. Các section khác (Cơ chế/Trade-off/Bẫy) giữ code/SQL/tên riêng bình thường nhưng KHÔNG cloze.
- **`# answer` = PLAIN TEXT TUYỆT ĐỐI (§2.2 rule.md) — KHÔNG markdown ở BẤT KỲ đâu**, kể cả 2 locale: không backtick, không `**bold**`, không `*italic*` — kể cả quanh 1 từ/tên riêng/snippet ngắn (vd viết "hàm main", KHÔNG viết `` `main` ``). Nghiêm hơn `terminology-bold.md` (rule đó cho content/challenge bold jargon Loại 3) — flashcard answer là ngoại lệ KHÔNG bold gì cả.
- **Distractor cloze (optional, §2.3 rule.md):** `{{cN::term::distractorA,distractorB}}` — 1-2 near-synonym gây nhiễu thật lấy từ chính nội dung card (không bịa, không lấy tùy tiện), ưu tiên hơn sibling-pool ngẫu nhiên của FE. Thêm khi card có sẵn 1 khái niệm dễ nhầm thật.
- **Tag phải khớp nội dung thật** — không copy tag cũ/không liên quan (vd đừng gắn "TypeScript" cho card không có gì TypeScript-specific).
- **Bilingual §3:** viết `vi.md` gốc (đủ dấu, giữ technical term English, không dịch ép — `terminology-bold.md`) → `en.md` mirror 1-1 (cùng skeleton, cùng câu, cùng số lượng + vị trí cloze). Label localize (Trả lời thẳng↔TL;DR…). **Ngữ pháp vi.md phải đúng + tự nhiên** — diễn đạt lại bằng tiếng Việt bản xứ, KHÔNG convert word-for-word cấu trúc câu Anh (tránh lặp chủ ngữ kiểu Anh, mệnh đề quan hệ dịch cứng, trạng ngữ sai vị trí) — đọc lại như người Việt viết ra, không như bản dịch máy.

## 4. Verify + đóng
```
node .claude/docs/check-flashcard.mjs .mount/data/courses/<course>/flashcard-decks/<N>-<slug>
```
Gate deterministic: đủ field + separator · sortIndex liên tục · level enum · `:::muted`/`:::chip` cân · vi đủ dấu · vi↔en mirror (FAIL); deck 10 card · phân bố ≥3 junior/≥3 senior (WARN). Sạch FAIL → báo cáo deck/card đã tạo. Push `.mount/data` chỉ khi thầy bảo.

## Phân biệt với `/starci-flashcard-audit` + `/starci-interview-generate`
- **generate flashcard** = tạo card MỚI (fill 15×10). **audit** = kiểm deck đã có. **interview** = câu tự-nói-AI-chấm (khác cơ chế — `/starci-interview-generate`), KHÔNG trộn với flashcard (fact recall).

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
