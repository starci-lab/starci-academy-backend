---
name: write-challenge
description: >
  Write challenge files (vi.md, en.md) for a StarCi Academy System Design Mastery lesson.
  Use this skill whenever the user asks to "write challenge", "viết challenge", "tạo challenge",
  "viết bài tập SD", or when creating/updating files inside a challenges/<N>-<slug>-<difficulty>/
  directory under 1-system-design-mastery. Also trigger when the user specifies a difficulty
  level (easy/medium/hard/insane) with a System Design lesson or topic.
---

# write-challenge (System Design Mastery)

Write challenge files for a System Design lesson, matching the format and rigor of existing
challenges in the course.

---

## Step 0 — Gather inputs

| Input | Example |
|---|---|
| **Lesson path** | `.mount/data/courses/1-system-design-mastery/modules/<slot>/contents/<lesson>/` |
| **Difficulty** | `easy` (20 pts) / `medium` (40 pts) / `hard` (60 pts) / `insane` (80 pts) |
| **Challenge slug** | kebab-case, difficulty as last segment: `big-tech-systems-4-pillars-survey-easy` |
| **Index N** | `easy=0` always; medium/hard/insane increment from 1 |
| **Challenge format** | `coding` (githubUrl) or `survey/research` (googleDocsUrl) |

Challenge directory:
`.mount/data/courses/1-system-design-mastery/modules/<slot>/contents/<lesson>/challenges/<N>-<slug>-<difficulty>/`

Read the lesson's `vi.md` first — challenges must build on the lesson's concrete concepts, not
generic system-design platitudes.

---

## Step 1 — Read rules and ground in real challenges

```
.mount/data/rules/challenge-format.md     ← 10-section spec, rubric rules, forbidden rules
.mount/data/templates/challenge.md        ← canonical separator template
```

**Read at least 1 existing SD challenge to mirror tone and rubric depth:**
- `.mount/data/courses/1-system-design-mastery/modules/0-fundamentals-of-system-design/contents/0-core-concepts-and-metrics/challenges/0-big-tech-systems-4-pillars-survey-easy/vi.md` — research/survey style, googleDocsUrl
- Any `challenges/0-*-easy/vi.md` under modules 4-18 for coding-style references

---

## Step 2 — The separator

Same as `write-lesson`: `<!-- @starci/seperator -->` (keep the misspelling).

Every leaf value is wrapped between two separator lines. Step `### body` content (containing
`### 1. Các bước thực hiện` etc.) wraps as ONE block.

---

## Step 3 — Score allocation

| Difficulty | Total | # Requirements | Example split |
|---|---|---|---|
| `easy` | 20 | 3-4 | `6 + 8 + 6` or `8 + 6 + 6` |
| `medium` | 40 | 4-6 | `12 + 0 + 10 + 8 + 0 + 10` |
| `hard` | 60 | 5-7 | `15 + 10 + 10 + 10 + 0 + 10 + 5` |
| `insane` | 80 | 6-8 | `15 + 15 + 10 + 10 + 10 + 10 + 5 + 5` |

- Requirements with `score: 0` share a rubric with another (note: `promptText: "Sử dụng chung với yêu cầu X (<tóm tắt>)."`).
- Sum of all `### score` = `# score` at end of file = submission score.

---

## Step 4 — Rubric design (CRITICAL)

Every requirement's `### promptText` follows this exact shape:

```
Rubric chấm điểm (tối đa <N>):

- Tiêu chí A (<X> điểm): <mô tả CONCEPT — năng lực/hiểu biết>.
- Tiêu chí B (<Y> điểm): <mô tả CONCEPT — pattern/nguyên tắc đã áp dụng>.
- Tiêu chí C (<Z> điểm): <mô tả CONCEPT — trade-off/quyết định>.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
```

**Concept-level only:**
- ✅ "Pick 5 hệ thống cross-domain (>= 4 domain buckets) thể hiện diversity thực sự, không trùng pattern."
- ✅ "Mỗi pillar có trade-off đầy đủ 3 phần (losing side / reason / consequence) gắn với 1 design choice cụ thể."
- ❌ "File `kafka.module.ts` dòng 5 có `imports: [ConfigModule]`." (← code-line specific — forbidden)
- ❌ "Service có `constructor(private readonly kafkaService: KafkaClient)`." (← forbidden)

Tiêu chí scores sum to the requirement's `### score`. Closing line `Quy tắc chấm:...` is mandatory.

---

## Step 5 — Forbidden rules

At least 1 requirement has `### forbidden` listing prohibited behaviors. Pattern:

```
### forbidden
- <Hành vi cấm — concrete, observable> -> **0 prompt <tên ngắn>**.
- <Hành vi cấm nghiêm trọng> -> **0 whole challenge**.
```

- `0 prompt <name>` = lose that specific requirement's rubric points.
- `0 whole challenge` = lose all points. Reserve for severe violations: plagiarism, fabricated data,
  copying solution from external blog, etc.

Real example from the survey challenge:
```
- Copy-paste table/câu từ external blog kể cả dịch -> **0 whole challenge**.
- Số không có source/year -> **0 prompt metric**.
- Dùng "average latency" thay vì p95/p99 -> **0 prompt metric**.
- Claim 1 system tốt trên cả 4 pillar mà không có trade-off -> **0 prompt tradeoff**.
- Reference từ Medium translation, wiki, tutorial -> **0 prompt references**.
```

---

## Step 6 — Structural skeleton for vi.md

```
# title
<!-- @starci/seperator -->
<Plain text 1 dòng — tên challenge mô tả mục tiêu chính. Không markdown, không inline code>
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
<Plain text 2-3 câu — challenge làm gì + mục tiêu rèn luyện>
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
<Mục tiêu requirement — 1-2 câu>
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
<Ràng buộc kỹ thuật cụ thể — có thể inline code, đầy đủ chi tiết: ngưỡng số liệu, format file, structure deliverable>
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- <Gợi ý 1>.
- <Gợi ý 2>.
- <Gợi ý 3>.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
<điểm requirement này>
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa <N>):

- Tiêu chí A (<X> điểm): <concept>.
- Tiêu chí B (<Y> điểm): <concept>.
- Tiêu chí C (<Z> điểm): <concept>.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
## 2   ← requirement cuối (hoặc bất kỳ requirement nào hợp lý) đặt forbidden
### purpose
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- <hành vi cấm> -> **0 prompt <tên>**.
- <hành vi cấm nghiêm trọng> -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Bạn <năng lực đạt được — 1-2 câu>.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Bạn <năng lực đạt được>.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Bạn <năng lực đạt được>.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Bạn <năng lực đạt được>.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Đã đọc xong content `<lesson-slug>`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
<Điều kiện kỹ thuật — vd hiểu khái niệm cốt lõi>.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
<Điều kiện công cụ — vd Docker / Node v20+ / git>.
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
<Tên step ngắn — action phrase>
<!-- @starci/seperator -->
### body
### 1. Các bước thực hiện
- **Bước 1:** <mô tả>.
- **Bước 2:** <mô tả>.
- **Bước 3:** <mô tả>.
- **Bước 4:** <mô tả>.

### 2. Yêu cầu tối thiểu cần đạt
- <Tiêu chí kiểm chứng được 1>.
- <Tiêu chí 2>.
- <Tiêu chí 3>.

### 3. Nice to have
- <Gợi ý nâng cao 1>.
- <Gợi ý nâng cao 2>.
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
<Step 2 name>
<!-- @starci/seperator -->
### body
### 1. Các bước thực hiện
- ...
### 2. Yêu cầu tối thiểu cần đạt
- ...
### 3. Nice to have
- ...
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
<Step cuối — thường là smoke test, evidence collection, hoặc submit step>
<!-- @starci/seperator -->
### body
### 1. Các bước thực hiện
- ...
### 2. Yêu cầu tối thiểu cần đạt
- ...
### 3. Nice to have
- ...
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
<Display name — official docs / engineering blog>
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
<URL>
<!-- @starci/seperator -->
## 1
### alias
<!-- @starci/seperator -->
<name>
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
<URL>
<!-- @starci/seperator -->
## 2
### alias
<!-- @starci/seperator -->
<name>
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
<URL>
<!-- @starci/seperator -->
# submissions
## 0
### type
<!-- @starci/seperator -->
<githubUrl | googleDocsUrl>
<!-- @starci/seperator -->
### title
<!-- @starci/seperator -->
<Tên submission ngắn — vd "Link Google Docs survey ..." hoặc "Repo GitHub ...">
<!-- @starci/seperator -->
### description
<!-- @starci/seperator -->
<2-4 câu deliverable cụ thể: repo layout / Doc structure / README sections / evidence files cần nộp>.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
<= # score cuối file>
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
<easy | medium | hard | insane>
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
<20 | 40 | 60 | 80>
<!-- @starci/seperator -->
```

---

## Step 7 — Format-specific notes

### Survey/research challenge (googleDocsUrl)

- Deliverable is a Google Docs link (Anyone with the link: Viewer).
- Word count constraint always specified (e.g. `>= 1500 từ excluding tables`).
- References must be first-party (engineering blogs, papers, post-mortems) — explicitly forbid Medium translations, wikis, tutorials.
- Requirements often demand: real metrics with `year + source`, p95/p99 (not average), trade-off in 3 parts (losing side / reason / consequence), distinctiveness checks ("any 2 tables differ in >= 2 of 4 cells").

### Coding challenge (githubUrl)

- Deliverable is a GitHub repo with `README.md` containing 6 mandatory sections:
  - **Challenge description** — 1-2 sentences.
  - **How to run** — stack-specific commands.
  - **Architecture / Stack** — table or Mermaid diagram.
  - **Smoke Test** — paste REAL request/response (fabrication is a `0 whole challenge` violation).
  - **Code Execution Trace** — `file:line -> method()` format for main flow.
  - **Design Decisions** — 1-2 decisions + trade-off rationale.
- Stack-agnostic where possible (allow Node/Go/Python/Java/.NET) unless the lesson is hard-bound to one stack (e.g. NestJS DI internals).
- Steps with application code SHOULD include `### codeImplementations` with 4 entries (typescript/csharp/go/java), each having `##### lang` + `##### guide` + `##### example`. See `challenge-format.md §3.6` for the exact nested format.

---

## Step 8 — Escalation chain (medium / hard / insane)

If writing medium/hard/insane:
- `# description` mentions "phát triển từ bản EASY" (or previous tier).
- `# prerequisites[0]` MUST be: `Đã hoàn thành <PREVIOUS_DIFFICULTY> \`<slug-without-difficulty>\`.`
- Requirements escalate from "apply concept" (easy) → "extend + design" (medium) → "production-grade benchmark + monitoring" (hard) → "1M-user capacity planning + chaos test" (insane).

---

## Step 9 — Write files

Write to:
```
.mount/data/courses/1-system-design-mastery/modules/<slot>/contents/<lesson>/challenges/<N>-<slug>-<difficulty>/vi.md
.mount/data/courses/1-system-design-mastery/modules/<slot>/contents/<lesson>/challenges/<N>-<slug>-<difficulty>/en.md
```

**EN wording deltas** (mirror VI structure):
- Step body: `### 1. Steps`, `### 2. Minimum acceptance criteria`, `### 3. Nice to have`.
- Bullet prefix: `- **Step 1:**`, `- **Step 2:**`.
- Rubric: `Scoring rubric (max <N>):`, criteria `- Criterion A (<X> pts): ...`, closing `Rule: each criterion fully met receives its full points; partial/incorrect receives 0.`
- Prerequisites for tiered challenges: `Completed <PREVIOUS_DIFFICULTY> \`<slug>\`.`

After writing, report:
- Challenge path written
- Difficulty + total score
- Requirement count + score split (verify sum == `# score`)
- Confirmation rubric criteria are concept-level (cite the existing challenge you mirrored)
- Forbidden rules count + types (`0 prompt` vs `0 whole challenge`)
- Submission type (githubUrl vs googleDocsUrl) and deliverable summary
