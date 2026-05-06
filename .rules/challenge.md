# Strict Format — Challenge Files (`en.md` / `vi.md`)

Mọi file challenge (`en.md`, `vi.md`) trong thư mục `challenges/` **bắt buộc tuân theo đúng cấu trúc** dưới đây. Parser backend (`ChallengeParserService`) dùng `ExtractJsonFromMdService` để parse heading `# key` thành JSON fields — bất kỳ sai lệch nào về heading name hay nesting đều khiến data bị mất khi seed.

> File này bổ sung cho `challenges/base.md` (quy ước nội dung) và `challenges/fullstack/*.md`, `challenges/system-design/*.md` (quy ước theo level). File này tập trung vào **format kỹ thuật chính xác** mà parser yêu cầu.

---

## 1. Folder Convention

```
challenges/
  {orderIndex}-{slug}-{difficulty}/
    en.md
    vi.md
```

| Rule | Detail |
|---|---|
| **Folder name** | `{orderIndex}-{slug}-{difficulty}` — ví dụ `0-library-author-book-tag-crud-easy`. `orderIndex` bắt đầu từ `0`. |
| **`{difficulty}`** | Đúng 1 trong: `easy`, `medium`, `hard`, `insane`. **Phải khớp** field `# difficulty` trong `en.md` / `vi.md`. |
| **Files bắt buộc** | `en.md` (English — **default locale**, source-of-truth cho parser) + `vi.md` (Vietnamese). |

---

## 2. Top-Level Sections (bắt buộc, đúng thứ tự)

Mỗi section là **heading `#`** (H1). Parser extract theo đúng key name (**case-sensitive**). Thứ tự sections **phải** giữ nguyên:

```
# title
# description
# requirements
# prerequisites
# steps
# outputs
# references
# submissions
# difficulty
# score
```

**KHÔNG** thêm heading `#` nào khác ngoài danh sách trên. Parser sẽ bỏ qua hoặc ghi đè sai field.

---

## 3. Chi tiết từng Section

### 3.1. `# title`

- Plain text, 1 dòng, **không** markdown formatting.
- Mô tả ngắn gọn challenge + tech stack chính.

```markdown
# title
Library CRUD with TypeORM + PostgreSQL (Author 1-n Book n-n Tag) and real migrations
```

### 3.2. `# description`

- Plain text hoặc 1 paragraph. **KHÔNG** dùng heading, list, code block.
- Mô tả tổng quan: loại challenge (hands-on, design...), công nghệ, mục tiêu chính.

```markdown
# description
This is a hands-on coding challenge. You will build a NestJS library API with TypeORM and PostgreSQL using three entities...
```

### 3.3. `# requirements`

Mỗi requirement là 1 item indexed `## {index}` (bắt đầu từ `0`). Mỗi item chứa **các sub-heading `###`** cố định:

| Sub-heading | Bắt buộc? | Mô tả |
|---|---|---|
| `### purpose` | ✅ | Mục tiêu / goal statement |
| `### technicalConstraints` | ✅ | Ràng buộc kỹ thuật cụ thể |
| `### proTipsHints` | ✅ | Gợi ý, mẹo (dạng bullet list `-`) |
| `### forbidden` | ⚡ Chỉ ở **requirement cuối cùng** | Các quy tắc cấm — vi phạm → 0 điểm |

**Parser aliases** (nhận dạng được cả các tên sau):
- `purpose`: `Purpose`, `mucTieu`, `Muc_tieu`
- `technicalConstraints`: `Technical_Constraints`, `Rang_buoc_ky_thuat`, `Rang_buoc`
- `proTipsHints`: `Pro-tips/Hints`, `Goi_y_&_Meo`, `Goi_y`
- `forbidden`: `Forbidden`, `Cam`, `Cấm`, `Prohibited`, `forbiddenRules`

**Cấu trúc mẫu:**

```markdown
# requirements
## 0
### purpose
Build a NestJS project `library-typeorm-postgres` running on real PostgreSQL via Docker...
### technicalConstraints
Must include Postgres 16 in `docker-compose.yml`, 3 entities (`Author`, `Book`, `Tag`)...
### proTipsHints
- Start Postgres with `docker compose up -d` before booting the app.
- Keep the join-table name explicit as `book_tags`.

## 1
### purpose
Practice production-style migration flow...
### technicalConstraints
Must provide exactly 2 migrations under `src/migrations/`...
### proTipsHints
- Use the standard CLI scripts: ...

## N (requirement cuối cùng)
### purpose
Finish the deliverable to submission standards.
### technicalConstraints
Commit `.env.example` only; never commit a real `.env`.
### proTipsHints
- Capture successful migration-run output.

### forbidden
- `synchronize: true` in any env/file -> **0 prompt migration**.
- Lazy relation (`Promise<Book[]>`) without `await` -> **0 whole challenge**.
- Commit a real `.env` file; only commit `.env.example`.
```

**Quy tắc `### forbidden`:**
- Phải nằm trong **requirement cuối cùng** — gom toàn bộ forbidden rules cho cả challenge.
- Mỗi rule dùng format: `- <vi phạm cụ thể> -> **0 <scope>**.`
- **Scope**: `prompt <tên prompt>`, `whole challenge`, hoặc section cụ thể.

---

### 3.4. `# prerequisites`

Mỗi prerequisite là 1 item indexed `## {index}`, nội dung nằm trong `### text`:

```markdown
# prerequisites
## 0
### text
Completed the EASY challenge `0-sql-nosql-landscape-survey-easy`.
## 1
### text
Basic SQL (CREATE TABLE, JOIN, FK).
## 2
### text
`docker` + `docker compose` installed.
```

- Số lượng: ≥ 2 items.

---

### 3.5. `# steps`

Mỗi step là 1 item indexed `## {index}`, chứa `### title` và `### body`:

```markdown
# steps

## 0
### title
Bootstrap the project and the Postgres docker-compose
### body
**Steps to follow**
- **Step 1:** Create the project and install deps:
  ```bash
  nest new library-typeorm-postgres
  ```
- **Step 2:** Create `docker-compose.yml`:
  ```yaml
  services:
    postgres:
      image: postgres:16
  ```

**Minimum acceptance criteria**
- `docker compose up -d` starts Postgres successfully.
- `.env.example` is committed; the real `.env` sits in `.gitignore`.

**Nice to have**
- Add a `pgadmin` service in `docker-compose.yml`.
```

**3 phần bắt buộc trong `### body`:**

| Phần | Heading trong body | Mô tả |
|---|---|---|
| Hướng dẫn | `**Steps to follow**` hoặc `**Steps**` | Danh sách `- **Step N:**` kèm code block |
| Tiêu chí | `**Minimum acceptance criteria**` | Bullet list điều kiện pass tối thiểu |
| Mở rộng | `**Nice to have**` | Bullet list gợi ý nâng cao |

**Quy tắc:**
- Mỗi step dùng format `- **Step N:**` (N bắt đầu từ 1).
- Code block **phải** có language tag (`bash`, `ts`, `yaml`, `json`...).
- Step cuối thường là smoke-test: curl commands, expected output, README requirements.

---

### 3.6. `# outputs`

Mỗi output là 1 item indexed `## {index}`, nội dung trong `### text`:

```markdown
# outputs
## 0
### text
Build a working NestJS + TypeORM library CRUD API with correct relationship modeling.
## 1
### text
Run a safe two-step migration workflow against PostgreSQL.
## 2
### text
Implement tag-based filtering with QueryBuilder and handle core validation/error cases.
```

- Số lượng: ≥ 2 items — bao phủ tất cả skills challenge dạy.
- Mỗi item là 1 learning outcome dạng câu hoàn chỉnh.

---

### 3.7. `# references`

Mỗi reference là 1 item indexed `## {index}`, chứa `### alias` và `### url`:

```markdown
# references
## 0
### alias
NestJS - Database TypeORM
### url
https://docs.nestjs.com/techniques/database
## 1
### alias
TypeORM - Migrations
### url
https://typeorm.io/migrations
```

- Số lượng: ≥ 2.
- URL: chỉ link official docs uy tín.

---

### 3.8. `# submissions`

Mỗi submission slot là `## {index}`. Chứa fields + nested `### prompts`:

```markdown
# submissions
## 0
### type
githubUrl
### title
GitHub Repository Link
### description
A repository with full source + `docker-compose.yml` for Postgres + 2 migrations + a README...
### score
20
### prompts
#### 0
##### title
docker-compose Postgres + 3 entities with correct 1-n and n-n relationships
##### score
5
##### promptText
Grading rubric (max 5 points):

- Criterion 1 (2 points): `docker-compose.yml` runs Postgres 16 and `docker compose up -d` starts successfully.
- Criterion 2 (2 points): The 3 entities use correct relationship decorators.
- Criterion 3 (1 point): `AppModule` uses `TypeOrmModule.forRootAsync`.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 1
##### title
2 migrations that run up/down cleanly
##### score
6
##### promptText
Grading rubric (max 6 points):

- Criterion 1 (2 points): ...
- Criterion 2 (2 points): ...
- Criterion 3 (1 point): ...
- Criterion 4 (1 point): ...

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
```

**Submission fields:**

| Sub-heading | Bắt buộc? | Mô tả |
|---|---|---|
| `### type` | ✅ | `githubUrl` hoặc `googleDocsUrl` |
| `### title` | ✅ | Tên submission slot |
| `### description` | ✅ | Mô tả chi tiết những gì cần submit |
| `### score` | ✅ | Tổng điểm cho submission slot này |
| `### prompts` | ✅ | Chứa các grading prompt (nested `####`) |

**Prompt fields (nested trong `#### {index}`):**

| Sub-heading | Bắt buộc? | Mô tả |
|---|---|---|
| `##### title` | ✅ | Tên prompt — mô tả tiêu chí chấm |
| `##### score` | ✅ | Điểm tối đa cho prompt này |
| `##### promptText` | ✅ | Rubric chi tiết — format cố định |

**PromptText format cố định:**

```
Grading rubric (max {score} points):

- Criterion 1 ({points} point(s)): <mô tả criterion kiểm chứng được>
- Criterion 2 ({points} point(s)): <mô tả criterion kiểm chứng được>
...

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
```

- Tổng points các criteria **phải bằng** `score` của prompt.
- Dùng `point` (số ít) cho 1 điểm, `points` (số nhiều) cho > 1 điểm.
- Mỗi criterion phải **kiểm chứng được**: SQL log, `\d` output, HTTP status, JSON response, grep result...

---

### 3.9. `# difficulty`

- Giá trị: `easy`, `medium`, `hard`, hoặc `insane` (lowercase).
- **Phải khớp** suffix của folder name.

### 3.10. `# score`

- Số nguyên dương.
- **Phải bằng** tổng `### score` của tất cả submissions.

---

## 4. Quy tắc Score Budget

| Level | Validation |
|---|---|
| `# score` (challenge) | = Σ `### score` (submissions) |
| `### score` (submission) | = Σ `##### score` (prompts) |

Parser **KHÔNG** validate tự động — author phải tự đảm bảo tổng khớp.

### 4.1. Submission types cho easy / medium

Challenge `easy` và `medium` chỉ cho phép **đúng 1 submission slot**, chọn 1 trong 2 loại:

| `### type` | Khi nào dùng |
|---|---|
| `googleDocsUrl` | Survey / research / runbook — bài nộp dạng Google Docs (`Anyone with the link: Viewer`) |
| `githubUrl` | Hands-on coding — bài nộp dạng GitHub repo public |

**Quy tắc:**
- Challenge dạng **survey / nghiên cứu / phân tích**: dùng `googleDocsUrl`.
- Challenge dạng **code / deploy / hands-on**: dùng `githubUrl`.
- **KHÔNG** mix 2 loại cho easy / medium — chỉ 1 slot duy nhất.
- Từ `hard` trở lên mới được phép 2 slots (`githubUrl` + `googleDocsUrl`).

### 4.2. Score theo difficulty

| Difficulty | Score | Submission slots | Prompts per submission |
|---|---|---|---|
| `easy` | 20 | 1 (`googleDocsUrl` hoặc `githubUrl`) | 2–4 |
| `medium` | 40 | 1 (`googleDocsUrl` hoặc `githubUrl`) | 2–4 |
| `hard` | 60 | 1–2 (`githubUrl` + optional `googleDocsUrl`) | 3–5 |
| `insane` | 100 | 2–3 | 3–5 |

---

## 5. Quy tắc Song ngữ EN / VI

| Rule | Detail |
|---|---|
| **EN là source-of-truth** | Parser dùng `en.md` làm default locale. Mọi field (`title`, `description`, `difficulty`, `score`, structure) lấy từ EN. |
| **VI phải mirror cấu trúc** | `vi.md` **phải có cùng heading structure**, cùng số lượng items cho mỗi section. Chỉ khác nội dung text (dịch). |
| **Code blocks giữ nguyên** | Code, commands, entity names, decorator names, SQL — giữ nguyên tiếng Anh trong cả 2 file. |
| **`# difficulty` + `# score`** | Giá trị **giống hệt** giữa EN và VI. |
| **Heading names giữ nguyên EN** | `# title`, `### purpose`, `### technicalConstraints`, `### proTipsHints`, `### forbidden`, `### text`, `### alias`, `### url`, `### type`, `### body`, `##### promptText`... — giữ **nguyên tiếng Anh** trong cả 2 file. Parser match theo key name. |
| **Step body headings** | Nội dung bold heading trong `### body` phải đúng ngôn ngữ: EN dùng `**Steps to follow**` / `**Minimum acceptance criteria**` / `**Nice to have**` + `**Step N:**`; VI dùng `**Các bước thực hiện**` / `**Yêu cầu tối thiểu cần đạt**` / `**Nice to have**` + `**Bước N:**`. |
| **PromptText nội dung** | EN dùng `Grading rubric (max X points):` + `Criterion N (X points):` + `Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.`; VI dùng `Thang chấm (tối đa X điểm):` + `Tiêu chí N (X điểm):` + `Quy tắc chấm: đạt thì full điểm, không đạt thì nhận 0.` |

---

## 6. Checklist trước khi commit

- [ ] Folder name đúng format `{index}-{slug}-{difficulty}`.
- [ ] Có đủ `en.md` + `vi.md`.
- [ ] 10 H1 sections đúng thứ tự: `title` → `description` → `requirements` → `prerequisites` → `steps` → `outputs` → `references` → `submissions` → `difficulty` → `score`.
- [ ] `# difficulty` value khớp folder name suffix.
- [ ] `# score` = tổng `### score` của tất cả submissions.
- [ ] Mỗi submission `### score` = tổng `##### score` của prompts.
- [ ] `requirements` có `### forbidden` ở item cuối cùng.
- [ ] Mỗi step body có 3 phần: **Steps to follow** + **Minimum acceptance criteria** + **Nice to have**.
- [ ] Mỗi step instruction dùng `- **Step N:**`.
- [ ] Code blocks có language tag.
- [ ] `outputs` ≥ 2 items.
- [ ] `references` ≥ 2 items, URL uy tín.
- [ ] `prerequisites` ≥ 2 items.
- [ ] EN và VI có cùng số items cho mỗi section.
- [ ] Heading names (`### purpose`, `### technicalConstraints`...) giữ nguyên tiếng Anh trong cả 2 file.
- [ ] PromptText format đúng rubric template (có "Grading rubric" + "Scoring rule" + tổng points khớp).
