# Challenge Criteria Redesign — Design Spec (v1, 2026-05-29)

Chuyển chấm bài challenge từ `promptText` mờ (LLM tự cho 1 điểm tổng) sang **criteria yes/no chặt, gắn ở CHALLENGE level**, RAG chạy thuần trên criteria.

---

## 1. Quyết định đã chốt

| # | Quyết định |
|---|---|
| 1 | Criteria gắn vào **challenge** (không per-requirement). Requirements giữ để **hiển thị spec**, bỏ vai trò chấm. |
| 2 | 2 loại criteria: **outcomeCriteria** (kết quả quan sát được, agnostic) + **approachCriteria** (cách làm, per-language). |
| 3 | **Total = 100** mọi challenge; `difficulty` chỉ là tag. Coding default: outcome **30** / approach **70**. Docs/research: **linh hoạt** — có thể nullable outcome (hoặc approach), miễn Σ = 100. |
| 4 | Chấm **yes/no**: `met=true` → full `score` phần đó, `false` → 0. AI không bịa điểm lẻ. |
| 5 | **`critical: true`** trên criterion → không đạt thì **zero cả bài** (thay cho `0 whole challenge`). |
| 6 | Bỏ `promptText` khỏi requirement. `forbidden` text **giữ trên requirement để hiển thị**. |
| 7 | Criteria là **grading spec single-language** (không i18n) — tách ra file **`prompt.md`** riêng. |
| 8 | RAG **chỉ chạy trên criteria** (không cần requirements). |

---

## 2. Schema

### `challenges` (thêm 2 cột jsonb, nullable)
```
+ outcome_criteria   jsonb   nullable   -- array, agnostic
+ approach_criteria  jsonb   nullable   -- array, có lang bên trong
+ audited            ...     nullable   -- §5 (tag)
```

### `challenge_requirements`
```
- prompt_text                -- XÓA (hết vai trò chấm)
  score                      -- giữ cột nhưng chỉ display; KHÔNG dùng để chấm nữa
  purpose / technical_constraints / pro_tips_hints / forbidden / order_index  -- GIỮ (display)
```

### `contents` (lessons)
```
+ audited   ...   nullable   -- §5 (tag)
```

### JSON shapes
```jsonc
// outcome_criteria — Σ score = 30 (coding); agnostic; yes/no
[
  { "orderIndex": 0, "condition": "POST /orders trả {orderId(uuid v4), reservedQty}", "score": 15, "critical": false },
  { "orderIndex": 1, "condition": "Inject throw giữa flow → order và inventory đều revert", "score": 15, "critical": true }
]

// approach_criteria — Σ score (mỗi lang) = 70 (coding); per-language; yes/no
[
  {
    "orderIndex": 0,
    "langs": [
      { "lang": "typescript", "condition": "Bọc 2 write trong 1 DataSource.transaction", "score": 70 },
      { "lang": "go",         "condition": "Dùng db.Begin/Commit/Rollback quanh 2 write",  "score": 70 },
      { "lang": "csharp",     "condition": "...", "score": 70 },
      { "lang": "java",       "condition": "...", "score": 70 }
    ]
  }
]
```

**Bất biến điểm (thay §7 challenge-format):**
- `Σ outcome[].score` = 30 (coding) — agnostic, không có lang.
- Với mỗi `lang`: `Σ approach[].langs(lang).score` = 70 (coding). Cùng 1 criterion thì mọi lang **cùng score** (cùng 1 check, khác cách verify).
- `outcome 30 + approach 70 = 100`. Docs: linh hoạt (vd outcome=null → approach 100; hoặc outcome 100 → approach=null).
- `critical` đặt được trên cả outcome lẫn approach.

### GraphQL (typed, không scalar mù)
ObjectType map từ jsonb: `OutcomeCriterion { orderIndex, condition, score, critical }`, `ApproachCriterion { orderIndex, langs: [ApproachCriterionLang { lang, condition, score, critical }] }`. FE nhận data có type, không cần bảng/resolver-relation.

---

## 3. `prompt.md` (file mới mỗi challenge)

Đặt cạnh `vi.md` / `en.md` trong thư mục challenge. **Không** dùng separator `@starci/seperator` (đây là file JSON cấu trúc, không phải prose). Single-language.

```
# 0
## outcomeCriteria
```json
[
  { "orderIndex": 0, "condition": "...", "score": 15, "critical": false },
  { "orderIndex": 1, "condition": "...", "score": 15, "critical": true }
]
```
## approachCriteria
```json
[
  { "orderIndex": 0, "langs": [
    { "lang": "typescript", "condition": "...", "score": 70 },
    { "lang": "go",         "condition": "...", "score": 70 },
    { "lang": "csharp",     "condition": "...", "score": 70 },
    { "lang": "java",       "condition": "...", "score": 70 }
  ]}
]
```
```

- `# N` = list array (hiện chỉ cần `# 0`; parser đọc mọi `# N` nhưng challenge dùng index 0).
- `## outcomeCriteria` / `## approachCriteria` = mỗi cái 1 fenced ```json block → parse thẳng vào cột jsonb cùng tên.
- Docs challenge: bỏ `## approachCriteria` (hoặc lang=null), `## outcomeCriteria` có thể null.

> **OPEN:** xác nhận `# 0` đúng ý (list-array index) hay thầy muốn cấu trúc khác.

---

## 4. Grading flow (sửa 2 grader: git + google-docs)

1. **Detect ngôn ngữ submission** từ repo đã load: `package.json`→typescript, `go.mod`→go, `*.csproj`→csharp, `pom.xml`/`build.gradle`→java. Docs → no lang. *(OPEN: detect-from-repo vs học viên chọn lúc submit — đề xuất detect-from-repo, zero friction.)*
2. **Chọn criteria áp dụng:** `outcome_criteria` (toàn bộ) + `approach_criteria[].langs(lang khớp)`. Lang không khớp → fallback typescript hoặc flag manual.
3. **RAG query** = ghép mọi `condition` của criteria áp dụng (bỏ `purpose + promptText` cũ).
4. **Prompt chấm** = challenge title/description + danh sách criteria (bỏ requirements khỏi context). Mỗi criterion 1 dòng: `(id, condition, score, critical)`.
5. **LLM trả** per-criterion: `{ orderIndex, kind: "outcome"|"approach", met: true|false, evidence }` → cập nhật `template.json` + type `ChallengeEvaluation` (`@modules/bullmq`) + `parse.service.ts`.
6. **Tính điểm:** `earned = Σ(score nơi met=true)`. Nếu có `critical` nào `met=false` → `earned = 0` (zero cả bài). `maxScore = 100`. `passed = earned ≥ 100 × passThreshold`.

---

## 5. `# audited` tag (challenge + content)

Thêm H1 `# audited` vào `vi.md`/`en.md` của **cả lesson lẫn challenge**, giữ 1 value (đề xuất: date `2026-05-29` hoặc boolean) → seed vào cột `audited` → FE render **badge/tag**.

> **OPEN — tên tag hay hơn "audited"?** "Audited" nghe nội bộ (kế toán). Đề xuất learner-facing:
> - **`verified`** → badge "Verified ✓" *(trò nghiêng — tin cậy, gọn)*
> - `reviewed` → "Reviewed"
> - `vetted` → "Vetted"
>
> Giữ file `audited.md` (audit log) như cũ — khác với field tag này.

---

## 6. Files phải đụng

| Layer | File |
|---|---|
| Entity | `entities/challenge.entity.ts` (+2 jsonb +audited +ObjectTypes), `challenge-requirement.entity.ts` (−promptText), `content` entity (+audited) |
| Parser ×2 | `init/seeders/courses/parsers/challenge.service.ts`, `databases/primary/seeders/courses/parsers/challenge.service.ts` — đọc `prompt.md` + bỏ parse promptText + đọc `# audited` |
| Insert/hydration | challenge insert/hydration (set jsonb), requirement insert (bỏ promptText), content insert (audited) |
| Grader ×2 | `process-git-submission-grade-step.service.ts`, `process-google-docs-submission-grade-step.service.ts` + `template.json` + `parse.service.ts` + type `ChallengeEvaluation` |
| Migration | convert `promptText` cũ → criteria (sau khi schema xong) |
| Rule | `challenge-format.md` (§5.5/§6/§7/§9 đổi promptText→criteria + prompt.md), `audit-framework.md`, format content (thêm `# audited`) |
| FE (repo khác) | render criteria typed + audited badge |

---

## 7. Open items cần chốt trước khi code
1. `prompt.md` cấu trúc `# 0` đúng ý? (§3)
2. Tên tag thay "audited"? (§5) — đề xuất `verified`.
3. Detect ngôn ngữ submission: từ repo (đề xuất) hay học viên chọn? (§4)
4. `requirement.score` giữ làm display hay bỏ hẳn? (đề xuất giữ cột, không dùng chấm)
