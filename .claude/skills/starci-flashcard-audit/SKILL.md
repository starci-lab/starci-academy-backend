---
name: starci-flashcard-audit
description: >
  Audit / nghiệm thu FLASHCARD decks + cards đã có của 1 khóa StarCi (Fullstack `0-fullstack-mastery`, System Design
  `1-system-design-mastery`, DevOps `2-devops-mastery`) tại `.mount/data/courses/<course>/flashcard-decks/`. Soi theo
  `.claude/docs/rules/flashcard-answer.md`: cấu trúc (15 deck/khóa × 10 card/deck, sortIndex liên tục, phân bố level
  ≥3 junior + ≥3 senior/staff) · quality gate §1 (KEEP câu phỏng vấn SÂU / DELETE trivia-1-dòng/trùng) · answer §2 =
  "Interview Arc" (`:::muted` label: Chốt/Cơ chế/Trade-off/Bẫy/Đào sâu/Từ khoá, level-adaptive) · bilingual vi↔en mirror
  + terminology (đủ dấu, không dịch ép). NHẸ hơn module audit (KHÔNG code/e2e). Fan-out judge per-deck (Sonnet 5 mặc
  định). DELETE card / đổi cấu trúc deck = substantive → HỎI THẦY. Dùng khi user gõ `/starci-flashcard-audit <course|deck>`,
  "audit flashcard", "kiểm/soi thẻ", "nghiệm thu deck". Để TẠO deck/card MỚI → `/starci-flashcard-generate`.
---

# /starci-flashcard-audit — Nghiệm thu flashcard decks + cards

Chạy khi thầy muốn kiểm/soi/nghiệm thu flashcard. **Rule tự-đủ: `.claude/docs/rules/flashcard-answer.md`** (đọc HẾT trước). Chung nguyên tắc tối thượng của pipeline (`.claude/docs/pipeline.md`): substantive = hỏi thầy · cơ học = tự làm.

## Model tier (đồng bộ, xem `pipeline.md §Phân vai MODEL`)
- **DEFAULT Sonnet 5** cho judge KEEP/DELETE + viết/sửa answer + mirror. **Haiku** enumerate deck/card. **Opus opt-in** cho deck khó (judge tinh vi). Tiết kiệm theo mặc định.

## ⛔ Substantive = HỎI THẦY (đừng tự quyết)
- **DELETE 1 card**, **merge/tách deck**, **đổi phân bố level**, **đổi số deck/card** (15×10) → quyết định thầy chốt. Judge chỉ ĐỀ XUẤT keep/delete → gom lại HỎI THẦY, rồi mới xoá + re-index.
- **Cơ học tự làm:** sửa answer sai skeleton (§2), thêm dấu tiếng Việt, mirror vi↔en, format field/separator, re-index sortIndex sau khi thầy duyệt xoá.

## 1. Scope + cấu trúc mục tiêu (§0)
- Path: `.mount/data/courses/<course>/flashcard-decks/<N>-<slug>/` — mỗi deck: `{vi,en}.md` (meta: `# sortIndex/# title/# description/# difficulty/# moduleRefs`) + `cards/<n>-card/{vi,en}.md`.
- **Chuẩn:** mỗi khóa **ĐÚNG 15 deck** (`0-…`→`14-…`, sortIndex khớp) · mỗi deck **ĐÚNG 10 card** (`0-card`→`9-card`, sortIndex liên tục) · phân bố level: **≥3 junior + ≥3 senior/staff**, còn lại middle, sắp dễ→khó.
- Card field DSL: `# sortIndex / # isPremium / # question / # level / # tags / # answer`, mỗi block ngăn `<!-- @starci/seperator -->`. Cloze `{{c1::…}}` giữ nguyên.

## 2. Gate-first (free, deterministic — chạy TRƯỚC judge)
```
node .claude/docs/check-flashcard.mjs .mount/data/courses/<course>/flashcard-decks/<N>-<slug>   # hoặc cả folder flashcard-decks
```
FAIL (cứng): thiếu field/answer rỗng · level sai enum · sortIndex≠folder · card không liên tục từ 0 · vi KHÔNG DẤU · vi↔en lệch · `:::muted`/`:::chip` không cân · difficulty sai enum. WARN: deck≠10 card · <3 junior/<3 senior · course≠15 deck · thiếu en.md. **Chỉ deck FAIL sạch mới đẩy lên judge** (gate lo cấu trúc, judge lo chất lượng §1).

## 3. Quy trình audit (fan-out per-deck)
1. **Enumerate** (Haiku): liệt kê deck + card.
2. **Judge quality §1** (Sonnet 5, parallel per-deck): mỗi card hỏi *"đây có phải câu phỏng vấn SÂU không?"* → **KEEP** (cần lập luận/chẩn đoán/trade-off/design, có "vì sao", scale theo seniority) / **DELETE** (trivia 1-fact, 1-dòng-không-lập-luận, học cú pháp tool, trùng/gần-trùng, gượng). Default DELETE khi không chắc. → gom danh sách đề xuất.
3. **HỎI THẦY** danh sách DELETE + deck lệch cấu trúc (≠10 card / thiếu level bucket) → thầy chốt.
4. **Sửa cơ học** (Sonnet 5): answer sai §2 → viết lại theo Interview-Arc; vi↔en lệch → mirror; thiếu dấu → thêm; sau khi thầy duyệt xoá → xoá folder `<n>-card/` + **re-index** sortIndex + tên folder liên tục từ 0.

## 3. Answer skeleton §2 — "Interview Arc" (kiểm mỗi card KEEP)
`# answer` = chuỗi section, **mỗi label bọc `:::muted` riêng, body prose thường bên dưới** (KHÔNG bọc body trong muted). Thứ tự: **Chốt (TL;DR)** → **Cơ chế/vì sao** → **Trade-off** → **Bẫy thường gặp** → **Đào sâu tiếp** → *(optional)* **Từ khoá ăn điểm**.
- **Level-adaptive:** junior = TL;DR + Cơ chế (+Từ khoá) · middle = +Bẫy · senior/staff = full arc (Trade-off + Đào sâu có design reasoning thật). **KHÔNG pad junior bằng depth senior giả.**
- TL;DR ≤2 câu (PHẢI trả lời câu hỏi, không lặp lại đề); mỗi muted block ≤3 câu. Never invent facts.

## 4. Bilingual §3 + terminology
- `vi.md` ↔ `en.md` mirror cùng skeleton + cùng quyết định KEEP/DELETE. vi **đủ dấu**; giữ technical term English (`stderr`, `2>&1`…) — KHÔNG dịch ép (theo `.claude/docs/rules/terminology-bold.md`). Label localize: `Chốt/Cơ chế/Trade-off/Bẫy thường gặp/Đào sâu tiếp/Từ khoá ăn điểm` ↔ `TL;DR/How it works/Trade-off/Common pitfall/Go deeper/Keywords`.

## 5. Đóng
- Báo cáo: deck × (card KEEP/DELETE) + card sửa answer + lệch cấu trúc. Ghi artifact tóm tắt (tiếng Việt) nếu cần. Push `.mount/data` chỉ khi thầy bảo.
- **Follow-up graph (§0):** ưu tiên mỗi card "Đào sâu tiếp" trả lời được bởi 1 card khác cùng deck.

## Phân biệt
- **flashcard = 1 fact recall** (đọc đáp án, tự chấm). Khác **mock-interview** (tự NÓI lời giải, AI chấm — dùng `/starci-interview-*`). Đừng trộn 2 rổ.

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
