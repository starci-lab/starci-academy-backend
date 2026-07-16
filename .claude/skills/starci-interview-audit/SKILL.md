---
name: starci-interview-audit
description: >
  Audit / nghiệm thu ngân hàng câu MOCK-INTERVIEW đã có, 2 FAMILY: **technical** (per-course, ground `.mount` nội dung
  khóa) tại `.mount/data/courses/<course>/mock-interview/<N>-bank/` + **behavioral/EQ** (GLOBAL, không thuộc khóa) tại
  `.mount/data/mock-interview-eq/<N>-bank/`. Rule tự-đủ = README/RESEARCH/ROADMAP TRONG folder mock-interview. Soi:
  schema DSL (bank meta + question fields theo family) · kind ∈ 11 kind hợp lệ · **rubric đúng chiều** (coding/debug/
  review/optimize = 4-chiều communication/problemSolving/technical/testing · design = `rubricByTier` junior/middle/senior ·
  behavioral = ĐÚNG 6-chiều STAR + `ownershipSignal` BẮT BUỘC) · `idealAnswer` = ground-truth (`:::muted`) · technical
  KHÔNG bịa (ground `.mount`) · prompt = tình huống TƯ DUY (không fact-recall = đó là flashcard) · vi↔en mirror +
  terminology (đủ dấu, không dịch ép). NHẸ (KHÔNG code/e2e); fan-out judge per-bank (Sonnet 5 mặc định). DELETE/đổi
  family/đổi cấu trúc bank = HỎI THẦY. Dùng khi user gõ `/starci-interview-audit <course|bank>`, "audit mock interview",
  "kiểm câu phỏng vấn/EQ". Để TẠO bank/câu MỚI → `/starci-interview-generate`.
---

# /starci-interview-audit — Nghiệm thu ngân hàng mock-interview (technical + EQ)

Chạy khi thầy muốn kiểm câu phỏng vấn. **Rule tự-đủ = `.mount/data/courses/<course>/mock-interview/{README,RESEARCH,ROADMAP}.md`** (đọc trước — đây là schema + lý do khoa học) + `.claude/docs/rules/terminology-bold.md`. Chung nguyên tắc pipeline: substantive = hỏi thầy. ⚠️ Feature còn **PILOT** (2026-07-07) — schema có thể tiến hoá; bám README bản mới nhất.

## Model tier (xem `.claude/docs/pipeline.md §Phân vai MODEL`)
- **DEFAULT Sonnet 5** cho judge chất lượng + sửa rubric/idealAnswer + mirror. **Haiku** enumerate bank/câu. **Opus opt-in** cho bank khó (rubric tinh vi). Tiết kiệm theo mặc định.

## ⛔ 2 FAMILY — KHÔNG trộn 1 rổ (STRICT)
| Family | Nơi đặt | Nguồn | Chấm |
|---|---|---|---|
| **technical** | `courses/<course>/mock-interview/<N>-bank/` (mỗi module 1 bank) | ground `.mount` (lesson/flashcard) | rubric kỹ thuật (đúng/sai có căn cứ); feed job-readiness |
| **behavioral/EQ** | **GLOBAL** `.mount/data/mock-interview-eq/<N>-bank/` | curated (trải nghiệm, KHÔNG ground module) | STAR 6-chiều; feed pillar "kỹ năng mềm" RIÊNG (không pha điểm kỹ thuật) |
- EQ global vì competency (conflict/ownership/leadership) UNIVERSAL → 1 bộ dùng chung, **KHÔNG nhân bản theo khóa** (vi phạm single-source). Audit EQ ở path global, technical ở path khóa.

## ⛔ Substantive = HỎI THẦY
- **DELETE câu**, **đổi family**, **merge/tách bank**, **đổi số bank/câu**, **đổi tier/kind** → thầy chốt. Judge ĐỀ XUẤT → gom HỎI THẦY. **Cơ học tự làm:** sửa rubric sai chiều, viết lại idealAnswer sai skeleton, mirror vi↔en, thêm dấu, re-index sortIndex, format field/separator.

## Gate-first (free, deterministic — chạy TRƯỚC judge)
```
node .claude/docs/check-interview.mjs .mount/data/courses/<course>/mock-interview/<N>-bank    # technical
node .claude/docs/check-interview.mjs .mount/data/mock-interview-eq                            # behavioral (global)
```
FAIL: thiếu field theo family · prompt rỗng · family/tier/kind sai enum · kind-family lệch · technical thiếu rubric/idealAnswer (design thiếu rubricByTier) · behavioral thiếu competency/rubric/ownershipSignal · **placement sai** (behavioral không ở `mock-interview-eq`/technical ở đó; moduleRefs technical-only) · question không liên tục · vi KHÔNG DẤU · vi↔en lệch. WARN: thiếu en.md (pilot) · debug/review/optimize thiếu givenCode · behavioral có field technical-only. Gate suy family từ path khi bank thiếu `# family`. **Chỉ bank FAIL sạch mới đẩy lên judge chất lượng.**

## 1. Schema DSL (§Format README) — kiểm mỗi câu
- Field = `# fieldName` + `<!-- @starci/seperator -->` + value + separator; list = `## 0`/`## 1`… Bank meta: `# sortIndex/title/description/difficulty/family/moduleRefs`(moduleRefs **technical only**).
- **Field chung mọi câu:** `# sortIndex / # isPremium / # family / # tier` (junior|middle|senior) `/ # kind / # tags / # prompt`.
- **`# kind` ∈ 11:** technical = `theory·reasoning·scenario·debug·review·optimize·coding·design`; behavioral = `behavioral·situational·culture`.
- **Field CHỈ technical:** `# diagram` (mermaid, cho scenario) · `# givenCode`+`# givenLang` (cho debug/review/optimize) · `# rubric` · `# rubricByTier` (chỉ design) · `# followUps` · `# hints` (tăng dần) · `# idealAnswer` (`:::muted`) · `# keywords` (`:::chip`).
- **Field CHỈ behavioral:** `# competency` (conflict/ownership/leadership/communication/growth) · `# rubric` (6-STAR) · `# ownershipSignal` (BẮT BUỘC) · `# leadershipTier` (opt, senior).

## 2. Kiểm CHẤT LƯỢNG (per family)
- **prompt = tình huống / bài toán TƯ DUY** (thí sinh tự NÓI lời giải), KHÔNG fact-recall 1-dòng (đó là flashcard — nếu thấy → nên là flashcard, không phải interview). Có thể trỏ "sơ đồ/code dưới".
- **Technical rubric:** mỗi `## N` = 1 ý lập luận ĂN ĐIỂM. Với `kind∈{coding,debug,review,optimize}` **PHÂN 4 chiều** mỗi item ghi rõ `communication|problemSolving|technical|testing` (Testing tách riêng). `kind=design` → dùng `# rubricByTier` (3 đoạn junior/middle/senior, KHÔNG 1 rubric chung).
- **Behavioral rubric = ĐÚNG 6 chiều STAR cố định:** `situationClarity·actionSpecificity·resultImpact·selfAwareness·communication·relevanceToRole` (mỗi chiều 1 dòng "tốt trông như gì" cho câu NÀY). `# ownershipSignal` BẮT BUỘC (nhắc AI trừ điểm khi trả lời "chúng tôi/team" thay vì hành động cụ thể).
- **`idealAnswer` = ground-truth** (chấm so với nó + rubric, KHÔNG RAG lesson) → phải là dàn ý lời giải MẠNH, đúng kỹ thuật. Technical: idealAnswer + rubric phải khớp nội dung khóa THẬT (không bịa endpoint/concept).
- **Ranh giới:** đề (prompt/diagram/givenCode/rubric/idealAnswer) = TĨNH (author `.mount`); chấm + follow-up = AI live. Anti-gaming: prompt cho phép diễn đạt lại biến thể nhỏ.

## 3. Bilingual + terminology
- `vi.md` ↔ `en.md` mirror cùng schema + cùng câu. vi **đủ dấu**, giữ technical term English, KHÔNG dịch ép (`terminology-bold.md`).

## 4. Đóng
- Báo cáo per-bank: câu KEEP/DELETE + rubric/idealAnswer sửa + lệch schema/family. Push `.mount/data` chỉ khi thầy bảo.

## Phân biệt
- **mock-interview = tự NÓI, AI chấm cách lập luận** (khác **flashcard** = đọc đáp án tự chấm → `/starci-flashcard-*`). **technical vs behavioral = 2 rổ khác nguồn/chấm/nơi đặt** — đừng trộn.

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
