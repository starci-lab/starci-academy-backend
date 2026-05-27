---
name: write-srt
description: >
  Write SRT subtitle/script files (caption.srt and caption-phonetic.srt) for a StarCi Academy
  lesson video. Use this skill whenever the user asks to "write SRT", "viết SRT", "tạo SRT",
  "viết script video", "tạo phụ đề", "viết kịch bản video", or when creating video caption files
  for a lesson. Also trigger when the user mentions caption.srt, phonetic.srt, or video script
  generation for a lesson.
---

# write-srt

Generate two SRT files for a lesson video — `caption.srt` (display subtitles) and
`caption-phonetic.srt` (AI voice TTS input) — following the strict format in `srt-rules.md`.

---

## Step 0 — Gather inputs

| Input | Notes |
|---|---|
| **Lesson path** | `.mount/data/courses/.../contents/<lesson-slug>/` |
| **Video slot slug** | e.g. `0-nestjs-core-and-request-lifecycle-introduction` |
| **Source code context** | File/class/method names from `.repo/` (optional but strongly preferred) |

Read these files before generating:
1. `.mount/data/rules/srt-rules.md` — 8-phase structure, voice rules, SRT format
2. Lesson `vi.md` — primary source for content (interview scenario, flows, theory, interview Qs)
3. Lesson `en.md` — for EN terminology reference

If source code is available in `.repo/`, read the relevant files to get exact file paths,
class names, and method names for Phase 5 (code critical). NEVER fabricate file/class/method names.

---

## Step 1 — Plan the 8 phases

Map lesson content to each phase. Rough timing target (total 5-7 min):

| Phase | Content source | Duration |
|---|---|---|
| 1. Hook | Lesson title + problem statement from `## 1. Lời mở đầu` | ~15s |
| 2. Interview scenario | Dialogue from opening paragraph | ~30s |
| 3. Clone + architecture | `§2.1.1` clone cmd + `§2.1.2` component table | ~45s |
| 4. Demo flows | Each `§2.1.4` flow | ~90s total |
| 5. Code critical | `# codeExplaining` snippets | ~45s |
| 6. Practice conclusion | Key takeaways from demo | ~15s |
| 7. Theory | `§2.2` concepts + edge cases | ~30s |
| 8. Wrap-up | `§3.1` interview questions + challenge CTA | ~15s |

---

## Step 2 — Write caption.srt (display file)

This is the subtitle file shown to viewers. Rules:

**Voice:**
- First person: "mình", address viewers as "các bạn"
- Professional IT tone — no slang (no "băm nát", "chọc vào", "chém rụng", "quăng lỗi")
- IT terms stay in English: Microservices, Loose Coupling, TypeORM, Kafka, etc.
- Natural spoken sentences — NOT slide text or docs reading

**Content rules:**
- Do NOT read raw commands (cURL, PowerShell) — paraphrase: "Mình gửi POST tới Order Service..."
- Do NOT read tables row by row — describe: "Stack gồm 3 thành phần: ..."
- Do NOT mention file `vi.md` — say "lên web StarCi Academy đọc nội dung bài học"
- Demo flows: "các bạn lên web copy câu lệnh cURL dán vào Postman" (NOT "copy JSON payload")
- Code Phase 5: cite EXACT file/class/method names from source code — NEVER fabricate
  - Example: "Mở file `order.service.ts`, class `OrderService`, phương thức `createOrder`..."
- Do NOT include phase labels/headings in the output — pure flowing narration

**SRT format (Gold Standard):**
```
1
00:00:00.000 --> 00:00:03.000
Dòng thuyết minh thứ nhất.

2
00:00:03.100 --> 00:00:06.000
Dòng thuyết minh thứ hai.
```

**Format rules (CRITICAL for CapCut):**
- Millisecond separator: `.` (dot) NOT `,` (comma)
- 1-2 lines per entry, max 45 characters per line
- Duration per entry: ~0.25s/word (e.g. 12 words ≈ 3s), minimum 1s
- Gap between entries: 100ms (entry 1 ends `03.000`, entry 2 starts `03.100`)
- Encoding: UTF-8 NO BOM
- Line endings: CRLF (Windows)
- Exactly 1 blank line between entries (no trailing spaces)
- Trailing blank line at end of file
- Arrow: ` --> ` with exactly 1 space each side
- Number and timestamp: NO blank line between them
- Allow timestamp gaps for screen demo sections (no narration needed)
- Total: 60-100 entries for 5-7 minutes

---

## Step 3 — Write caption-phonetic.srt (TTS file)

Same structure and timestamps as caption.srt. Content differences:
- All English technical terms transliterated to Vietnamese phonetics for AI voice
- Drop trailing English consonant sounds for natural Vietnamese reading:
  - Microservices → "Mai cờ rô sơ vịt" (NOT "Mai cờ rô sơ vịt xít")
  - TypeORM → "Tai pờ o a rờ em"
  - Kafka → "Cáp ca"
  - NestJS → "Nét giây ét"
- File paths, variable names, decorator names: phonetic in this file
  - `auth.controller.ts` → "auth chấm controller chấm ti ét"
  - `@Roles` → "a còng Roles"
  - `/auth/signup` → "xuyệt auth xuyệt signup"
- caption.srt keeps all original technical notation (NOT phonetic)

**CRITICAL: Both files must have identical timestamps.** caption-phonetic.srt is the timing
authority (more words → needs more time). Stretch caption.srt timestamps to match total duration.

---

## Step 4 — Write files

Output directory: `.mount/data/courses/<course>/modules/<slot>/lesson-videos/<video-slug>/`

Create the directory if it doesn't exist. Write both files:
```
<video-slug>/
  <video-slug>-caption.srt
  <video-slug>-caption-phonetic.srt
```

After writing, report:
- Total entries in each file
- Estimated total duration (last timestamp end time)
- Confirmation that both files have identical entry count and end timestamps
- Note any phases where source code context was unavailable (code names could not be verified)
