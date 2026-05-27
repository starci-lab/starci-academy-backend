---
name: write-slide
description: >
  Write Gamma slide deck files (slide.md, record.txt, mermaids/) for a StarCi Academy lesson.
  Use this skill whenever the user asks to "write slide", "viết slide", "tạo slide", "viết deck",
  "tạo slide deck", "viết kịch bản quay", or when creating Gamma presentation files for a lesson.
  Also trigger when the user mentions slide.md, record.txt, or needs the 8-phase visual structure
  for a lesson video.
---

# write-slide

Generate the slide package for a lesson — **slide.md** (Gamma import), **record.txt** (recording
script), and **mermaids/** (Mermaid source files) — following `slide-rules.md`.

---

## Step 0 — Gather inputs

| Input | Notes |
|---|---|
| **Lesson path** | `.mount/data/courses/.../contents/<lesson-slug>/` |
| **SRT file** | `lesson-videos/<slug>/<slug>-caption.srt` (use if exists) |
| **Source code context** | `.repo/` file/class/method names for Phase 5 |

Read before generating:
1. `.mount/data/rules/slide-rules.md` — 8-phase structure, Gamma rules, mermaid-png pattern
2. Lesson `vi.md` — content authority (architecture, flows, theory, interview Qs)
3. `caption.srt` if it exists — align slide anchor text with SRT narration timing
4. Lesson `en.md` — for any EN labels needed

---

## Step 1 — Understand the role split

**Slide = visual anchor.** SRT = narration. Never copy SRT text verbatim into slides.

| Phase | Slide contains | What gets recorded |
|---|---|---|
| 1. Hook | Title + tagline only | SLIDE (no recording) |
| 2. Interview | Senior's question + wrong answer + why it's wrong | SLIDE |
| 3. Architecture | Commands + component list + mermaid-png diagram | RECORD: terminal clone + run |
| 4. Demo flows | Anchor card: flow name + Purpose/Expected table | RECORD: Postman + DB viewer |
| 5. Code critical | 5-8 line snippet + file/class/method label | RECORD: code editor |
| 6. Practice conclusion | 3-4 bullet takeaways | SLIDE |
| 7. Theory | Concepts table + Edge cases table | SLIDE |
| 8. Wrap-up | 3 interview questions + challenge reminder | SLIDE |

---

## Step 2 — Write slide.md

One file, all 8 phases separated by `---`. Gamma rules:
- First slide: `#` (H1). All other slides: `##` (H2).
- NO emoji — use `[Icon: name]` placeholders (e.g. `[Icon: check]`, `[Icon: warning]`)
- NO direct ` ```mermaid ` blocks — use mock block instead:
  ` ```mermaid-png `
  `mermaids/01-architecture.md`
  ` ``` `
- Max 5-8 lines per slide — no wall of text
- No copy-paste from SRT; no raw cURL commands; no long JSON responses

```markdown
# <Lesson Title>
<Tagline — 1 short sentence describing the core problem>

---

## Tình huống phỏng vấn

**Senior hỏi:** <question text>

**Ứng viên:** <incomplete/wrong answer>

**Vấn đề:** <why this answer lacks depth — 1-2 sentences>

---

## Khởi chạy môi trường

<Startup commands — just the commands, not explanations>

**Thành phần:**

| Component | Port | Role |
|---|---|---|
| <name> | <port> | <1-phrase role> |

---

## Kiến trúc tổng quan

```mermaid-png
mermaids/01-architecture.md
```

---

## Demo — Luồng <N>: <tên>

| | |
|---|---|
| **Mục đích** | <1 sentence> |
| **Kết quả kỳ vọng** | <observable outcome> |

---

[Repeat for each flow]

---

## Code critical — `<FileName>`

*Class: `ClassName` | Method: `methodName()`*

```typescript
<5-8 lines with inline comment highlighting key point>
```

---

## Kết luận thực hành

- <Takeaway 1>
- <Takeaway 2>
- <Takeaway 3>

---

## Lý thuyết: <Topic>

| Khái niệm | Định nghĩa ngắn |
|---|---|
| <term> | <1-phrase definition> |

---

## Edge Cases

| Vấn đề | Giải pháp |
|---|---|
| <edge case 1> | <solution> |

---

## Câu hỏi phỏng vấn

1. <Question 1>
2. <Question 2>
3. <Question 3>

[Icon: target] Làm **Challenges** trên StarCi Academy để hiểu sâu hơn.
```

---

## Step 3 — Write mermaids/01-architecture.md

Pure Mermaid source (no markdown wrapper — just the diagram code):

```
graph LR
    A[Client] --> B[API Service :3000]
    B --> C[(PostgreSQL :5432)]
    B --> D[(Redis :6379)]
```

Name files descriptively: `01-architecture.md`, `02-flow-overview.md` etc. if multiple diagrams
are needed. Use the exact component names, ports, and connections from `§2.1.2` in `vi.md`.

---

## Step 4 — Write record.txt

Line-by-line guide for the instructor recording the video. Mark each section clearly:

```
=== Phase 1: Hook ===
SLIDE — no recording needed
CapCut: import Phase1 slide + SRT entries 1-5

=== Phase 2: Tình huống phỏng vấn ===
SLIDE — no recording needed
CapCut: import Phase2 slide + SRT entries 6-10

=== Phase 3: Clone & Kiến trúc ===
RECORD — quay màn hình terminal
Thao tác:
1. Mở terminal mới
2. Chạy: git clone <repo-url>
3. cd vào thư mục lesson
4. Chạy: docker compose up -d  (hoặc npm install + nest start --watch cho FS)
5. Show terminal output — chờ services healthy
6. Mở file explorer — show cấu trúc thư mục

Kết quả kỳ vọng: tất cả container running / server started on port 3000

=== Phase 4: Demo Luồng N — <tên> ===
RECORD — quay Postman + DB viewer
Thao tác:
1. Mở trang web StarCi Academy — copy cURL từ flow <N>
2. Mở Postman — Import → Raw text → dán cURL
3. Send request
4. Show response panel — highlight field <field-name>
5. (Nếu cần) Mở pgAdmin / MongoDB Compass — show record vừa tạo

Kết quả kỳ vọng: <specific observable result>

[Repeat for each flow]

=== Phase 5: Code Critical ===
RECORD — quay code editor (VSCode/Cursor)
Thao tác:
1. Mở file <exact-path> trong editor
2. Scroll đến class <ClassName>, method <methodName>
3. Highlight dòng <key-line>
4. Giải thích ngắn khi camera quay

=== Phase 6-8: Kết luận + Lý thuyết + Kết bài ===
SLIDE — no recording needed
CapCut: import Phase6/7/8 slides + SRT entries <range>
```

---

## Step 5 — Write files

Output location: `.mount/data/courses/<course>/modules/<slot>/lesson-videos/<video-slug>/`

```
<video-slug>/
  slide.md
  record.txt
  mermaids/
    01-architecture.md
    [02-<name>.md if multiple diagrams]
```

After writing, report:
- Slide count (total `---` separators + 1)
- Phases covered
- Mermaid files created
- Any phases where source code context was missing (affects Phase 5 accuracy)
- Recommendation: generate SRT first if it doesn't exist yet (slide should align with SRT phases)
