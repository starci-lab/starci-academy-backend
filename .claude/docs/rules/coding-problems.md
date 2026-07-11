# Coding Problems — Audit rules (LeetCode-style practice bank) · đúc kết

> Bản **TỰ-ĐỦ** để audit/viết coding problems trong
> `.gitrefs/data/coding-problems/sets/<domain>/problems/<slug>/` — chỉ đọc trong `.claude/docs`,
> **KHÔNG ref file ngoài**. Khác hẳn lesson content (`fullstack/contents.md`) và milestone task:
> đây là bài LeetCode chấm bằng **Judge0** (stdin → stdout), không phải chấm bằng criteria.
>
> Nguyên tắc cứng: **mọi reference solution PHẢI Judge0-Accepted trên CẢ 5 ngôn ngữ × MỌI testcase.**
> Self-trace / chạy local KHÔNG đủ — phải nộp Judge0 thật (xem §6).

---

## 1. Vị trí & nguồn

- Source: `.gitrefs/data/coding-problems/sets/<domain>/problems/<slug>/{en.md, vi.md}` (clone của `StarCi-Academy/data`).
- Seeder đọc từ `.contexts/coding-problems/sets/*/problems/*` (materialize từ remote tarball) → **đổi xong PHẢI push remote rồi sync**, không seed thẳng từ local.
- Parser: `src/modules/init/seeders/coding-problems/parsers/coding-problem-parser.service.ts`. Enums: `CodingDomain`, `CodingDifficulty`, `CodingLanguage`.

## 2. Format file (heading-markdown, delimiter `<!-- @starci/seperator -->`)

`en.md` = file canonical ĐẦY ĐỦ, theo ĐÚNG thứ tự section (gold-standard tham chiếu: `slidingWindow/problems/minimum-window-substring/en.md`):

1. `# title` · 2. `# difficulty` · 3. `# domain` · 4. `# orderIndex` (0) · 5. `# tags` (`## 0` = domain, thêm 2–3 tag)
6. `# timeLimitMs` (2000; hard 4000) · 7. `# memoryLimitKb` (262144)
8. `# statement` (1 block delimited): H1 title + mô tả; label section dùng **`:::muted` callout** (KHÔNG `## heading`) giống challenge/task body — CHỈ `:::muted\nĐầu vào\n:::` + `:::muted\nĐầu ra\n:::` (en: Input/Output), rồi nội dung. **KHÔNG nhúng Example/Ví dụ trong statement** — ví dụ chỉ sống ở field `# example` (item 11; FE render riêng + dùng làm sample testcase), tránh trùng. CHỈ statement-block; KHÔNG đụng `## N` index marker ở section khác.
9. `# starterCodes` — `## 0..4` = python, javascript, typescript, java, cpp (mỗi cái `### lang` + `### content` + block delimited = stub có `solve(...)` + main đọc stdin/in ra stdout)
10. `# solutions` — 5 lang ĐÚNG THỨ TỰ như starter, lời giải CHẠY ĐÚNG
11. `# example` — `## 0` (`### input` + `### output`, delimited) — mẫu public
12. `# testcases` — `## 0..` ≥8 case ẩn (`### input` + `### output`, delimited)
13. `# hint` (1 block delimited) — **hướng dẫn tư duy**, 3 mục `:::muted`: **Phân tích đề bài** (en: Problem analysis) · **Cách tiếp cận** (en: Approach) · **Bài liên quan** (en: Related problems). Phân tích = đề thực sự hỏi gì + ràng buộc + vì sao brute-force chưa đủ + nhận xét chốt. Cách tiếp cận = pattern/kỹ thuật + các bước mức ý tưởng + độ phức tạp time/space, **KHÔNG dump full code**. Bài liên quan = 2–4 bài trong bank cùng pattern, render **link click được** sang bài đó: `- [<Tên chính xác>](/practice/<slug>) — vì sao`. Title + slug PHẢI có thật trong bank (FE route `/practice/[slug]`; MarkdownContent render `[..](..)` thành link). KHÔNG bịa tên/slug.
    - **LANGUAGE-AGNOSTIC:** hint KHÔNG nhắc tên ngôn ngữ cụ thể (no "in TypeScript…", "Java's HashMap"…). Nói ý tưởng/thuật toán trung tính. NẾU buộc phải minh hoạ bằng 1 ngôn ngữ → **CHỈ Python** (pseudo-code Pythonic).

`vi.md` = bản localize CHỈ: `# title` (VN) · `# difficulty` · `# domain` · `# statement` (delimited, dịch tiếng Việt CÓ DẤU) · `# hint` (delimited, dịch tiếng Việt CÓ DẤU). KHÔNG section khác.

> `# hint` được parser đọc (en từ en.md, vi từ vi.md) → index ES `coding-problem-hints-<locale>` (KHÔNG vào PG/CDN) → FE `/practice` nút Hint render.

> Delimiter dùng theo cặp (mở + đóng) quanh MỖI block scalar (statement/content/input/output). Số delimiter phải chẵn.

## 3. Field hợp lệ (gate)

- `domain` ∈ `CodingDomain` (camelCase, 20): arrays, strings, hashing, twoPointers, slidingWindow, stack, queue, linkedList, trees, heap, graph, binarySearch, sorting, recursion, backtracking, dynamicProgramming, greedy, math, bitManipulation, matrix. **`domain` PHẢI trùng tên folder set.**
- `difficulty` ∈ {easy, medium, hard} (KHÔNG insane/senior).
- Lang ∈ {python, javascript, typescript, java, cpp} — đủ 5 cho cả starter lẫn solution (10 `### lang`).
- `title` non-empty; `statement` ≥2 đoạn + Input/Output/Example; `tags` ≥1; example ≥1; testcases ≥8.

## 4. I/O convention

- Chấm qua **stdin → stdout**. Statement PHẢI mô tả CHÍNH XÁC format input (số dòng, thứ tự, kiểu) + output.
- Solution + starter đọc stdin / in stdout đúng convention. Idiom theo gold-standard: python `sys.stdin`, node `fs.readFileSync(0,"utf8")`, java `BufferedReader`, cpp `getline/cin`.
- Output KHÔNG có trailing space thừa. Judge0 so sánh **bỏ qua whitespace cuối** nên `print()` thêm `\n` vẫn AC.

## 5. ⚠️ Ràng buộc nền tảng Judge0 (BẮT BUỘC — phát hiện 2026-06-11, bản Judge0 CE 1.13.1 VPS)

Judge0 dùng **runtime/compiler CŨ** → code "đúng" trên máy mới vẫn FAIL trên Judge0. Hai bẫy đã cắn:

- **Python = 3.8.1** → **CẤM** PEP 585 builtin generics (`list[int]`, `dict[str,int]`, `set[...]`, `tuple[...]`) vì crash NZEC lúc định nghĩa hàm. FIX: thêm dòng đầu block `from __future__ import annotations` (giữ nguyên style `list[int]`), hoặc dùng `typing.List`.
- **TypeScript = tsc 3.7.4** (target/lib cũ, KHÔNG có @types/node) → fail compile: `require` undefined (TS2580), `Array.fill`/`Math.trunc` thiếu lib (TS2339), `for..of` trên string (TS2494). FIX: **prepend `// @ts-nocheck`** ở dòng đầu MỌI block TS (starter + solution) → tsc bỏ type-check, vẫn emit, **Node 12 runtime có đủ** require/fill/trunc/Map. Đây là cách duy nhất gọn (không cần ép ES5-safe).
- **TS for-of trên Set/Map = EMIT SAI (WA âm thầm).** `// @ts-nocheck` chỉ tắt type-check, KHÔNG sửa emit: tsc 3.7.4 target mặc định (không `downlevelIteration`) biên dịch `for (const x of someSet/someMap)` thành vòng index `[i]` → SAI với Set/Map (không index được) → kết quả rỗng/sai → Wrong Answer dù compile OK. for-of trên **Array/string thì OK**. FIX: `for (const x of Array.from(set))` hoặc `set.forEach(...)` hoặc `for (const [k,v] of Array.from(map.entries()))`. Luật: trong TS **đừng for-of trực tiếp lên Set/Map**.
- Java = `public class Main`, OpenJDK 13. C++ = GCC 9.2 (`#include <bits/stdc++.h>` OK).
- **Empty output → WA bug.** Judge0 trả **Wrong Answer khi stdout RỖNG hoàn toàn**, kể cả khi `expected_output` cũng rỗng (case N=0 / no-result). FIX: với output nhiều dòng, build list rồi in **1 lần** `print("\n".join(lines))` (js `console.log(lines.join("\n"))`, java `System.out.println(String.join("\n",lines))`, cpp `cout<<joined<<"\n"`) — KHÔNG loop-print từng dòng (rỗng → in 0 lần → stdout rỗng → WA). Output rỗng khi đó = "\n" → Judge0 strip → khớp "".
- Language IDs: python **71** · javascript **63** · typescript **74** · java **62** · cpp **54** (env `JUDGE0_LANGUAGE_IDS`).
- **Local Judge0 (Docker Desktop) = cgroup v2 → MỌI run status 13 Internal Error.** Audit PHẢI nộp lên VPS: `JUDGE0_BASE_URL=https://judge0.academy.starci.org` + header `X-Auth-Token` (token `.mount/terraform/judge0-auth-token.key`).

Script auto-fix 2 bẫy trên (idempotent): `scratch/fix_judge0_compat.py`.

## 6. Gate verify (BẮT BUỘC trước khi mark verified / seed)

1. **Cấu trúc**: parse OK, đủ 12 section + `# hint`, delimiter chẵn, domain trùng folder + ∈ enum, difficulty ∈ enum, 5 starter + 5 solution, ≥8 testcase, vi.md có title+statement+hint (có dấu). `# hint` non-empty cả en+vi, language-agnostic (chỉ Python nếu phải minh hoạ).
2. **Judge0 thật**: mọi solution × 5 lang × mọi case = status 3 (Accepted). KHÔNG tin self-report của agent.
   - Tool: `python scratch/judge0_audit.py` (nộp batch lên VPS, in `AC/FAIL` per problem-lang) → yêu cầu `JUDGE0 RESULT: ALL ACCEPTED`.
   - Quick local (python/js/java, KHÔNG cpp/ts vì cần Judge0/toolchain): `python scratch/verify_problems.py` — dùng để soi logic nhanh, KHÔNG thay Judge0.
   - Lưu ý harness Windows: gửi stdin LF thuần (bytes), đừng để CRLF → false-positive WA.
3. **Coverage testcase**: phủ biên — empty/min, single, max-ish, âm (nếu có), giá trị đặc biệt, + case của example.

## 7. Anti-pattern đã gặp

- Agent "tự trace PASS" nhưng Judge0 FAIL (python PEP585 / TS tsc cũ) → LUÔN re-verify bằng Judge0 độc lập.
- TS viết `Math.trunc`/`Array.fill`/`for..of` string mà quên `// @ts-nocheck` → CompileError trên Judge0 (kể cả gold-standard cũ cũng dính, đã fix 2026-06-11).
- `domain` không trùng tên folder set → parser coerce sai/drop.
- Seed thẳng từ `.gitrefs/data` mà chưa push remote → sync kéo tarball cũ, không thấy bài mới.
