# Fullstack — Challenge rules · đúc kết

> Bản **TỰ-ĐỦ** để audit/viết challenge FS — chỉ đọc trong `.audits`, **KHÔNG ref file ngoài**. Đúc kết từ challenge gold (M0/M14) + migration M13 (16 ch V1→V2) trong session. Content body → `contents.md`. Quy trình → `../../pipeline.md`.
>
> ⚠️ **THUẬT NGỮ & BOLD trong prose challenge (title/description/`##### body`/outputs/prerequisites) → BẮT BUỘC theo `.audits/rules/terminology-bold.md`. STRICT, đã có feedback.**

---

## 1. Cấu trúc file
```
challenges/<N>-<slug>-<difficulty>/
├── vi.md / en.md          ← challenge body (display cho học viên)
└── submissions/0/
    ├── en.md              ← submission scalar + CRITERIA chấm điểm (English-only)
    └── vi.md              ← CHỈ type/title/description (i18n UI; KHÔNG copy criteria)
```
- `<difficulty>` ∈ easy/medium/hard/insane. `<N>` = orderIndex.

## 2. H1 challenge vi.md/en.md (thứ tự)
`# title · # description · # requirements · # steps · # outputs · # prerequisites · # difficulty · # score · # verified`
- **KHÔNG** `# references` / `# submissions` inline (dấu hiệu V1 — phải bỏ).
- `# title` trung lập (không bám framework). `# score = 100` MỌI challenge (difficulty chỉ là tag; score 20/40/60/80 = V1 chưa migrate). `# verified` = ngày.

## 3. Item-major (requirements / steps / outputs / prerequisites)
```
# requirements
## 0                 ← item
### langs
#### 0               ← lang bucket (FE agnostic = 1 bucket; BE 4-lang = nhiều bucket)
##### lang
<!-- @starci/seperator -->
agnostic
<!-- @starci/seperator -->
##### title  …  ##### body  …  ##### score   (requirements có score; steps không; outputs/prerequisites chỉ ##### text)
```
- **Field theo loại**: requirements = lang+title+body+score · steps = lang+title+body · outputs/prerequisites = lang+text.
- **Sub-block trong `##### body` = callout `:::muted`**, CẤM `### 1./2./3.` heading (phá H5 hierarchy):
  - requirements body: `:::muted` `Mục đích` / `Ràng buộc kỹ thuật` / `Gợi ý` (EN: Purpose / Technical constraints / Hints).
  - steps body: `:::muted` `Các bước thực hiện` / `Yêu cầu tối thiểu cần đạt` / `Nice to have` (EN: Steps to follow / Minimum acceptance criteria / Nice to have).
- Lang set: chỉ lang có nghĩa cho concept; challenge lang ⊆ body lang. FE → `agnostic`.

## 4. submissions/0/en.md — chấm điểm (điểm THẬT ở đây)
```
# type → githubUrl   # title   # description   # score → 100
# outcomeCriterias   (agnostic outcome, Σ ### score = 30)
## 0
### body → #### 0 → ##### lang (agnostic) + ##### body
### score (10)   ### critical (false/true)
## 1 … ## 2
# approachCriterias  (Σ ### score = 70; ≥1 critical:true = 40, + 15 + 15)
```
- **Σ outcome = 30, Σ approach = 70, submission # score = 100.** ≥1 `critical:true` trong approach (cơ chế cốt lõi; rớt → zero cả bài).
- Criteria **English-only** (rubric AI chấm 1 bản). `vi.md` chỉ type/title/description.
- Mỗi criterion `##### body` nêu rõ 3 ý: **Kiểm gì** / **Bằng chứng quan sát được** / **Fail nếu:** — proof CƠ CHẾ thật (failure-injection / edge case / concurrency / benchmark), KHÔNG happy-path chung chung.

## 5. Parsing gotchas (sai → parser ra string-leaf, hỏng)
- KHÔNG bọc `<!-- @starci/seperator -->` NGAY SAU heading có children (`# outcomeCriterias`, `## N`, `### body`...). Chỉ bọc quanh **scalar leaf** (`##### lang/title/body/score/text`, `### score`, `### critical`).
- Children PHẢI sâu hơn parent ≥1 cấp (`# outcomeCriterias` L1 → `## 0` L2 → `### body` L3 → `#### 0` L4 → `##### lang` L5).
- Sep mỗi section CHẴN (= 2 × số scalar field). Lẻ → toggle hỏng, mọi H1 sau bị skip.
- ⚠️ **Khi verify bằng grep/awk**: giá trị scalar nằm **2 dòng sau** heading (separator chen giữa) — `getline`/`-A1` lấy nhầm separator. Dùng skip-separator (xem `check-lesson.ps1` `Get-ScalarsAfter`).

## 6. Tier & premium
- Slot 1–3 (nền tảng): CHỈ easy + medium.
- Slot ≥4: đủ tier NHƯNG theo merit — giữ hard/insane khi có **độ sâu production thật** (FE advanced: virtualization/web-worker/offline/optimistic = giữ); BỎ kiểu build-exercise/overlap/edge-UI. Per-lesson ghi verdict + lý do vào `audited.md`; phân vân → hỏi chủ nhiệm.
- Premium: 1–2 lesson cuối module.

## 7. Quy trình duyệt (Opus)
Script lo format (§gate). Opus DUYỆT ngữ nghĩa: **criteria có đo đúng cơ chế không · outputs/requirements khớp topic không · tier có nhồi không**. Sai format → Opus rewrite (dùng challenge V2 gold làm template, vd M14 `0-responsive-product-card-grid-easy`).

## 8. Gate
`./.audits/check-lesson.ps1 -Path <module-dir>` bắt: score=100 · có verified · no `# references`/`# submissions` · no `### N.` heading · Σ outcome=30 · Σ approach=70 · ≥1 critical:true · separator chẵn. PASS structure rồi mới Opus duyệt ngữ nghĩa.
