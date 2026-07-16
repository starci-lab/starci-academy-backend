---
name: starci-interview-generate
description: >
  TẠO / MỞ RỘNG ngân hàng câu MOCK-INTERVIEW, 2 FAMILY: **technical** (per-course, ground `.mount` nội dung khóa) tại
  `.mount/data/courses/<course>/mock-interview/<N>-bank/` + **behavioral/EQ** (GLOBAL, curated) tại
  `.mount/data/mock-interview-eq/<N>-bank/`. Author bank/câu MỚI theo schema README/RESEARCH/ROADMAP in-folder. Câu =
  tình huống/bài toán TƯ DUY (thí sinh tự NÓI lời giải, AI chấm) — KHÁC flashcard (fact recall). DSL `# field`+separator;
  question fields theo family: technical (prompt/diagram/givenCode/**rubric 4-chiều**/rubricByTier(design)/followUps/hints/
  **idealAnswer** ground-truth/keywords) · behavioral (prompt/competency/**rubric 6-STAR**/**ownershipSignal** bắt buộc/
  leadershipTier). Technical ground `.mount` (không bịa); behavioral curated (không ground module). vi↔en mirror +
  terminology (đủ dấu, không dịch ép). NHẸ (KHÔNG e2e). 2 GIAI ĐOẠN: đề xuất scope (bank/family/kind/tier) → HỎI THẦY
  chốt → author (Sonnet 5 mặc định). Dùng khi user gõ `/starci-interview-generate <course|bank>`, "gen mock interview",
  "viết câu phỏng vấn/EQ", "tạo bank". Để KIỂM đã đủ → `/starci-interview-audit`.
---

# /starci-interview-generate — Author / mở rộng mock-interview (technical + EQ)

Chạy khi thầy muốn TẠO câu phỏng vấn. **Rule tự-đủ = `.mount/data/courses/<course>/mock-interview/{README,RESEARCH,ROADMAP}.md`** (đọc trước) + `.claude/docs/rules/terminology-bold.md`. Chung nguyên tắc pipeline: substantive = hỏi thầy. ⚠️ **PILOT** (2026-07-07) — bám README mới nhất.

## Model tier (xem `.claude/docs/pipeline.md §Phân vai MODEL`)
- **DEFAULT Sonnet 5** author prompt + rubric + idealAnswer + mirror. **Haiku** enumerate. **Opus opt-in** cho câu design/rubric khó. Tiết kiệm theo mặc định.

## ⛔ 2 FAMILY — chọn đúng rổ + nơi đặt (STRICT)
- **technical** → `courses/<course>/mock-interview/<N>-bank/` (mỗi module 1 bank), **ground `.mount`** (lesson/flashcard của module đó), có `# moduleRefs`. Chấm rubric kỹ thuật.
- **behavioral/EQ** → **GLOBAL** `.mount/data/mock-interview-eq/<N>-bank/`, **curated** (không ground module), KHÔNG `moduleRefs`. Chấm STAR 6-chiều. **1 bộ dùng chung toàn platform** (competency universal → không nhân bản theo khóa).

## ⛔ Substantive = HỎI THẦY trước khi author
- **Bank nào tạo**, **family** (technical/behavioral), **kind** mỗi câu, **tier bucket**, **module ground** (technical), **competency** (behavioral) → thầy chốt. Gen = "vẽ mới" → đề xuất rồi HỎI.

## 1. GIAI ĐOẠN 1 — Đề xuất scope → HỎI THẦY
- **Technical:** đọc lesson + flashcard của module → đề xuất bank + câu (kind/tier), mỗi câu ground concept THẬT trong khóa. **Behavioral:** đề xuất competency + tình huống (từ trải nghiệm phỏng vấn thật). → **HỎI THẦY** (AskUserQuestion) chốt. Chưa confirm KHÔNG author.

## 2. GIAI ĐOẠN 2 — Author (sau khi thầy chốt)
- **DSL:** `# field` + `<!-- @starci/seperator -->`; list = `## 0`/`## 1`. Bank meta: `# sortIndex/title/description/difficulty/family/moduleRefs`(technical only).
- **Field chung:** `# sortIndex/isPremium/family/tier(junior|middle|senior)/kind/tags/prompt`. `# kind` ∈ 11 (technical: theory·reasoning·scenario·debug·review·optimize·coding·design; behavioral: behavioral·situational·culture).
- **prompt = tình huống TƯ DUY** (tự nói lời giải), có thể trỏ "sơ đồ/code dưới". KHÔNG fact-recall 1-dòng.
- **Technical author:**
  - `# diagram` (mermaid) cho `scenario`; `# givenCode`+`# givenLang` (code ĐỀ hỏng/để review) cho debug/review/optimize.
  - `# rubric` = list `## N` ý ĂN ĐIỂM. `kind∈{coding,debug,review,optimize}` → mỗi item ghi rõ **1 trong 4 chiều** `communication|problemSolving|technical|testing`. `kind=design` → `# rubricByTier` (3 đoạn junior/middle/senior, KHÔNG rubric chung).
  - `# followUps` (1–3 câu đào sâu) · `# hints` (list tăng dần) · `# idealAnswer` (dàn ý lời giải MẠNH, `:::muted` như flashcard — CHÍNH LÀ ground-truth chấm) · `# keywords` (`:::chip` phủ coverage). **Ground `.mount` — không bịa endpoint/concept.**
- **Behavioral author:**
  - `# competency` (conflict/ownership/leadership/communication/growth) · `# rubric` = **ĐÚNG 6 chiều STAR** (`situationClarity·actionSpecificity·resultImpact·selfAwareness·communication·relevanceToRole`, mỗi chiều 1 dòng "tốt trông như gì") · `# ownershipSignal` **BẮT BUỘC** (nhắc AI trừ điểm khi "chúng tôi/team" thay hành động cụ thể) · `# leadershipTier` (opt, chỉ senior). KHÔNG `moduleRefs/diagram/givenCode`.
- **Bilingual + terminology:** `vi.md` gốc (đủ dấu, giữ term English, không dịch ép) → `en.md` mirror 1-1.

## 3. Verify + đóng
```
node .claude/docs/check-interview.mjs <bank-dir>    # technical: courses/<c>/mock-interview/<N>-bank · behavioral: mock-interview-eq/<N>-bank
```
Gate deterministic: đủ field theo family · family/tier/kind enum · kind-family khớp · technical rubric+idealAnswer (design→rubricByTier) · behavioral competency+rubric+ownershipSignal · **placement đúng** (behavioral→`mock-interview-eq`; technical→`courses/*/mock-interview` + moduleRefs) · sortIndex liên tục · vi đủ dấu · vi↔en mirror (FAIL). Chất lượng (judge): prompt tư-duy không fact-recall, technical ground thật. Báo cáo bank/câu đã tạo. Push `.mount/data` chỉ khi thầy bảo.

## Phân biệt
- **generate interview** = tạo câu tự-nói-AI-chấm. Khác **flashcard** (fact recall — `/starci-flashcard-generate`). **technical vs behavioral = 2 rổ** (nơi đặt + chấm khác) — chọn đúng, đừng trộn.
