# Plan audit mount (brief)

Cập nhật: 2026-05-25  
Delimiter chuẩn: `<!-- @starci/seperator -->` (một dòng, trim; chính tả `seperator` giữ nguyên).

---

## Sườn chung mount markdown

Mọi file `en.md` / `vi.md` dưới `.mount/data/courses/` tuân **một khung** sau. Lesson / challenge / milestone chỉ khác **tên `#` section** và **level** (`#` vs `###`), không khác quy tắc delimiter.

### 1. Delimiter

| | |
|---|---|
| Chuẩn | `<!-- @starci/seperator -->` |
| Code | `src/modules/init/seeders/shared/extracts/mount-delimiter.constants.ts` |
| Scratch sync | `scratch/mount-delimiter.js` |

Delimiter **không** strip toàn file trước parse. Chỉ dùng để **bọc blob** hoặc **đóng/mở section** theo từng heading.

### 2. Hai kiểu field (parser)

| Kiểu | Mount | Extract → DB |
|------|-------|----------------|
| **Leaf (delimiter)** | Nội dung **giữa hai** `<!-- @starci/seperator -->` dưới heading | **string** (trimmed) |
| **Structured** | Section `#` → `## 0`, `## 1`, … → field con (mỗi leaf có delimiter) | **object** / list qua `normalizeMountNumericSections` |

Parser (`ExtractJsonFromMdService.parseSectionBody`):

- Có `<!-- @starci/seperator -->` trong field → cắt nội dung giữa delimiter đầu/cuối, **trim**, trả **string** (không đệ quy heading con).
- Không có delimiter → đệ quy `parseAtLevel` theo heading level kế tiếp.

Scratch `report-non-string-extract-fields.js` mirror cùng rule unwrap.

### 3. Mẫu bọc blob (áp dụng mọi nơi)

```md
# <key>                    <!-- hoặc ### <key> trong ## N -->
<!-- @starci/seperator -->
... markdown blob ...
... (có thể có ## / ### bên trong, vẫn là một string)
<!-- @starci/seperator -->
# <sectionTiếpTheo>        <!-- hoặc ### sibling kế tiếp -->
```

**Tight wrap (bắt buộc với `body`):** dòng không-trống **đầu tiên** và **cuối cùng** của blob phải là delimiter (gate script, không chỉ “file có delimiter”).

| Blob key | Ví dụ path | Gate script |
|----------|------------|-------------|
| `body` | Lesson `# body` | `audit-lesson-body-tight.js` |
| `body` | Challenge `# steps` → `## N` → `### body` | `audit-challenge-step-body-tight.js` |
| `title`, `description` | Mọi file có key | Structure audit + unwrap (không script tight riêng) |

Fix mount khi fail gate: `wrap-lesson-body-tight.js`, `wrap-challenge-step-body-tight.js`.

### 4. Section có cấu trúc (không unwrap cả section)

```md
# codeExplaining
## 0
### lang
...
## 1
...
```

Hoặc challenge:

```md
# steps
<!-- @starci/seperator -->   <!-- bọc cả khối steps, optional theo file -->
## 0
### title
<!-- @starci/seperator -->
...
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
...
<!-- @starci/seperator -->
## 1
...
```

`# steps` = array; mỗi step: `title` scalar + `body` blob tight như lesson.

### 5. Ma trận nhanh theo loại file

| Loại | Scalar blob keys | Structured `#` sections |
|------|------------------|-------------------------|
| Lesson | `title`, `description`, `body` | `codeExplaining`, `codeImplementations`, `references`, `minutesRead`, `isPremium` |
| Challenge | `title`, `description`; step: `title`, `body` | `requirements`, `prerequisites`, `steps`, `outputs`, `references`, `submissions`, `difficulty`, `score` |
| Lesson video | `title`, `description`, `caption` | `url`, `thumbnailUrl`, `durationMs`, `kind`, `hostPlatform` |
| Milestone task | `title`, `description`, `hint` (nếu có) | theo schema từng task |

Output challenge: `### text` bọc delimiter; **không** có `### title` dưới `# outputs`.

---

## Template cho thầy

Skeleton thuần (copy → `en.md` / `vi.md`):

- `.mount/data/templates/content.md` — lesson
- `.mount/data/templates/challenge.md` — challenge
- `.mount/data/templates/milestone.md` — milestone (`courses/.../milestones/{n}-{slug}/`)
- `.mount/data/templates/milestone-task.md` — milestone task (`.../milestones/.../tasks/{n}-{slug}/`)

Ký hiệu: `<brief | dạng>` — `title` / `description` (mọi level) luôn `string`. Template: mỗi `# section` lớn = **một block** delimiter (như `# body` trong `content.md`); bên trong block tự viết `## 0`, `### purpose`, … `references` giữ list `## 0` + delimiter từng `alias`/`url` như content.

**Prompt chấm điểm (challenge thật):** mỗi `## N` trong `# requirements` có `### score` + `### promptText` (rubric). `### forbidden` thường chỉ ở requirement cuối. **Không** có `### prompts` dưới `# submissions`. `0 prompt <tên>` trong forbidden = tên tiêu chí trong rubric `promptText`.

---

## Trạng thái đã chạy (gate đầy đủ)

| Kiểm tra | Script | Kết quả |
|----------|--------|---------|
| Lesson `# body` bọc kín | `audit-lesson-body-tight.js` | **298** OK, 0 loose |
| Challenge step `### body` bọc kín | `audit-challenge-step-body-tight.js` | **946** challenge md OK (sau wrap: 672 file, 1308 step) |
| Extract scalar = string | `report-non-string-extract-fields.js` | **0** / 1302 file |
| Schema + delimiter + EN/VI | `audit-mount-content-challenges.js` | 0 nonCanonical, 0 enVi |
| Gộp một lệnh | `audit-mount-full.js` | `allPass: true` → `MOUNT-FULL-AUDIT-SUMMARY.json` |

Delimiter chuẩn duy nhất: `<!-- @starci/seperator -->`.

---

## Phase còn lại (nếu mở rộng)

| Field | Kiểu | Ghi chú |
|-------|------|---------|
| `### text` (outputs) | Scalar blob | Đã bỏ `### title` |
| `### hint` | milestone-task | Cùng sườn delimiter nếu dài |
| `codeExplaining` | Structured | `## N` vẫn array; delimiter chỉ trong từng khối con nếu cần |
| `guide` / `example` | step impl | Audit khi có `###` lồng |

---

## Áp delimiter theo template (bulk)

Chạy **theo thứ tự** sau khi đổi mount hoặc template:

```bash
node scratch/apply-mount-template-delimiters.js   # per-field + strip envelope # structured
node scratch/fix-mount-delimiter-gaps.js          # ### score orphan + ### title close trong # steps
node scratch/wrap-lesson-body-tight.js            # tight # body lesson
node scratch/wrap-challenge-step-body-tight.js    # tight ### body từng step
node scratch/audit-mount-full.js
```

Templates (`.mount/data/templates/`):

| File | Mount path |
|------|------------|
| `content.md` | `courses/.../contents/.../en\|vi.md` |
| `challenge.md` | `courses/.../challenges/.../en\|vi.md` |
| `cv.md` | `cv/{tier}/en\|vi.md` |
| `foundation-category.md` | `foundations/{category}/en\|vi.md` |
| `foundation-item.md` | `foundations/{category}/foundations/{item}/en\|vi.md` |
| `headhunting-company.md` | `headhuntings/{company}/en\|vi.md` |
| `headhunting-consultant.md` | `headhuntings/{company}/consultants/{slug}/en\|vi.md` |
| `milestone.md` | `courses/{course}/milestones/{n}-{slug}/en\|vi.md` |
| `milestone-task.md` | `courses/{course}/milestones/{n}-{slug}/tasks/{n}-{slug}/en\|vi.md` |

Pipeline áp dụng: `node scratch/pipeline-mount-delimiters.js` (courses + cv + foundations + headhuntings).

---

## Gate trước seed

```bash
node scratch/audit-mount-full.js
# hoặc từng script:
node scratch/audit-lesson-body-tight.js
node scratch/audit-challenge-step-body-tight.js
node scratch/report-non-string-extract-fields.js
node scratch/audit-mount-content-challenges.js
```

Pass → seed. Fail → sửa mount; không dựa `asMarkdownField` reconstruct làm chuẩn.

---

## Việc **không** làm trong audit mount

- Không strip delimiter toàn file trước parse.
- Không đổi `## 1. Opening` → `## Opening` chỉ để tránh numeric parse (delimiter bọc `body` là đủ).
- Không audit nội dung pedagogy — chỉ cấu trúc + kiểu extract.
