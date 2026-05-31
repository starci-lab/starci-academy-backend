# 17 — Legacy content & challenge mount format

Cấu trúc file mount **bản legacy (V1)** của content (lesson) và challenge — định dạng `vi.md` / `en.md` mà `ContentLegacyParserService` / `ChallengeLegacyParserService` parse. Đọc kèm 2 ví dụ thật ở module **M0** (`0-nestjs-core-and-request-lifecycle`) để hiểu nhanh.

> Đây là format **đang dùng đại trà**. Bản V2 (concept-first, criteria yes/no) là additive, chỉ M0 L0 dùng. Mọi lesson/challenge KHÔNG có marker V2 (mục §4) đều parse theo legacy.

## Ví dụ tham chiếu (mở ra đọc trực tiếp)

| | Đường dẫn |
|---|---|
| **M0 L1 — content** | `.mount/data/courses/0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/1-request-response-lifecycle/vi.md` |
| **M0 L2 — content** | `.mount/data/courses/0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/2-multi-environment-configuration/vi.md` |
| **M0 L1 — challenge (easy)** | `.../contents/1-request-response-lifecycle/challenges/0-book-pipeline-lifecycle-easy/vi.md` |
| **M0 L2 — challenge (easy)** | `.../contents/2-multi-environment-configuration/challenges/0-payment-gateway-config-namespaces-easy/vi.md` |

Mỗi thư mục có cặp `vi.md` + `en.md` cùng cấu trúc H1; merge per-locale do `MergeJsonService` lo (xem `16-mount-parsing.md`).

---

## 1. Token phân tách

Mọi **leaf** (giá trị string cuối) được bọc bằng cặp token:

```md
<!-- @starci/seperator -->
<giá trị thật>
<!-- @starci/seperator -->
```

`ExtractJsonFromMdService` cắt theo token này. Heading (`#`, `##`, `###`) định nghĩa cây; token bọc leaf bên trong.

---

## 2. Content (lesson) legacy — các H1 theo thứ tự

Xem M0 L1 `1-request-response-lifecycle/vi.md`:

| H1 | Kiểu | Ý nghĩa |
|---|---|---|
| `# title` | leaf | Tiêu đề bài. |
| `# description` | leaf | Tóm tắt ngắn. |
| `# body` | prose | Toàn bộ bài giảng — **viết Markdown thường** (có `##`/`###` con, bảng, mermaid, code block). Cả khối nằm giữa 1 cặp seperator. |
| `# codeExplaining` | prose | Giải thích code (thường rỗng ở bài concept). |
| `# codeImplementations` | prose | Code per-language (thường rỗng ở bài concept). |
| `# references` | array | List `## N → ### alias / ### url` (mỗi leaf bọc seperator). |
| `# minutesRead` | leaf | Số phút đọc (vd `18`). |
| `# isPremium` | leaf | `true` / `false`. |
| `# verified` | leaf | Ngày verify (vd `2026-05-29`) — cột `verified` trên entity. |

**Lưu ý `# body`:** sub-heading bên trong (`## 1. Lời mở đầu`, `### 2.1. Thực hành`...) là Markdown nội dung, KHÔNG phải cây JSON. Chúng nằm gọn trong 1 cặp seperator bao cả body.

---

## 3. Challenge legacy — các H1 theo thứ tự

Xem M0 L1 challenge `0-book-pipeline-lifecycle-easy/vi.md`:

| H1 | Kiểu | Cấu trúc con |
|---|---|---|
| `# title` | leaf | — |
| `# description` | leaf | — |
| `# requirements` | array | `## N` → `### purpose`, `### technicalConstraints`, `### proTipsHints`, `### score`, `### promptText` |
| `# prerequisites` | array | `## N` → `### text` |
| `# steps` | array | `## N` → `### title`, `### body` (body là Markdown nhiều mục: "Các bước thực hiện / Yêu cầu tối thiểu / Nice to have") |
| `# outputs` | array | `## N` → `### text` |
| `# references` | array | `## N` → `### alias`, `### url` |
| `# submissions` | array | `## N` → `### type` (`githubUrl`/`googleDocsUrl`), `### title`, `### description`, `### score` |
| `# difficulty` | leaf | `easy` / `medium` / `hard` / `insane` |
| `# score` | leaf | Tổng điểm |

**Chấm điểm legacy:** dựa trên `requirements[].purpose` + `requirements[].promptText` (rubric prose tự do) → LLM đọc và cho điểm. Đây chính là phần V2 thay bằng `outcomeCriteria` + `approachCriteria` yes/no.

---

## 4. Phân biệt legacy ↔ V2

Seeder route per-file. Một item là **V2** khi:

- **Challenge:** có H1 `# approachCriteria` (+ `# outcomeCriteria`). Không có → legacy.
- **Content:** có thư mục `bodies/<N>-<lang>/{vi,en}.md` cạnh `vi.md` (body per-language). Không có → legacy.

| | Legacy (V1) | V2 |
|---|---|---|
| Content body | `# body` Markdown đầy đủ inline | `# body` chỉ marker `@starci/replace`; body thật ở `bodies/<N>-<lang>/` |
| Challenge chấm | `requirements.purpose + promptText` (prose) | `outcomeCriteria` (agnostic Σ30) + `approachCriteria` (per-lang Σ70), yes/no |
| Parser | `ChallengeLegacyParserService` / `ContentLegacyParserService` | `ChallengeV2ParserService` / V2 content path |

Chi tiết cơ chế parse chung (extract → merge → render) xem `16-mount-parsing.md`.
