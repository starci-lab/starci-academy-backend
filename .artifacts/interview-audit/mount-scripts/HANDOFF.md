# Bàn giao — mock-interview checklist/author (folder-driven, `.mount` = SSOT)

> Đọc `.news/mock-interview-audit-incident-and-plan.md` trước để biết bối cảnh sự cố (DB-driven audit dùng id-factory theo VỊ TRÍ, map sai fullstack/SD do content đã re-author). Toàn bộ script ở đây đều **folder-driven** (đọc + ghi thẳng vào file `.mount`, không qua DB/id) để tránh lặp lại lỗi đó.

## Đã xong (không cần làm lại)

- **devops-mastery**: 280/280 câu đã có `# checklist` + `# exampleResults` đúng, KHÔNG đụng vào.
- **477 câu "actionable"** (fullstack 255 + SD 222 — kind theory/reasoning/scenario/design-lite + vài câu review/optimize/debug có sẵn `# prompt`+`# idealAnswer`): **ĐÃ AUDIT XONG + ĐÃ GHI VÀO `.mount`** (checklist 5-8 checkpoint + exampleResults 5 mức). Không cần chạy lại.

## Còn lại — việc cho session khác

**228 câu kind=debug/review/optimize THIẾU `# prompt` + `# givenCode`** (chỉ có `# rubric` đã gắn nhãn 4-chiều `[technical]`/`[problemSolving]`/`[communication]`/`[testing]`, do lỗi author trước đây). Danh sách: `.artifacts/interview-audit/mount-scripts/_mount_todo_705_skipped.json` (228 entry `{folder, course, bank, kind}`, GIT-TRACKED).

### Bước 1 — chạy workflow author+grade

Script: `.claude/workflows/mount-author-and-grade.js` (đã có sẵn, GIT-TRACKED — pull mtp là có).

⚠️ **Trước khi chạy trên máy khác**: sửa 2 hằng `FILE` và `ROOT` ở đầu file cho khớp repo root máy đó (comment trong file có ghi ví dụ).

Pipeline mỗi câu (3 giai đoạn nối tiếp): **Opus** brief (đọc `# rubric` dựng ngược tình huống+code outline) → **Sonnet** viết thật `# prompt` + `# givenCode` → **Sonnet** sinh 5 mức trả lời + **Sonnet+Haiku** chấm coverage vs rubric (bước chấm này vừa hoàn thiện `# exampleResults`, vừa tự kiểm tra chất lượng nội dung vừa author — nếu prompt/code viết dở thì chấm sẽ không coherent, lộ ra ngay).

228 câu × ~6 agent/câu ≈ 1368 agent — vượt cap 1000/workflow, **CHIA 2 LẦN**:
```
Workflow({ scriptPath: ".claude/workflows/mount-author-and-grade.js", args: [0, 114] })
Workflow({ scriptPath: ".claude/workflows/mount-author-and-grade.js", args: [114, 114] })
```
Nếu vẫn dính rate-limit/session-limit (đã từng gặp — lỗi "You've hit your session limit · resets HH:mmam"), chia nhỏ hơn (vd 4 batch 57 câu) hoặc resume bằng `resumeFromRunId` sau khi limit reset — completed agent() sẽ replay cache, chỉ chạy lại phần lỗi.

**Kết quả mỗi batch** (`result` trả về) = mảng `{idx, prompt, givenCode, givenLang, checklist, examples, coherent}`. Lưu thành file JSON (vd `.artifacts/interview-audit/mount-scripts/results_0-114.json`) để dùng cho bước 2.

### Bước 2 — merge vào `.mount`

Script: `.artifacts/interview-audit/mount-scripts/merge-author-grade.js` (node script THƯỜNG — chạy qua Bash, KHÔNG phải Workflow script, vì cần `fs`/`path` thật).

1. Sửa mảng `RESULT_FILES` ở đầu file trỏ đúng các file JSON đã lưu ở Bước 1.
2. Chạy dry-run trước: `node merge-author-grade.js --dry` — kiểm tra `matched`/`noRecord`/`alreadyHas`/`noRubricHeading` trước khi ghi thật.
3. Nếu ổn, chạy thật: `node merge-author-grade.js`.

Field được chèn theo đúng thứ tự schema (xem README bank `.mount/data/courses/*/mock-interview/README.md`): `# tags` → **`# prompt` → `# givenCode` → `# givenLang`** (mới) → `# rubric` (giữ nguyên) → **`# checklist` → `# exampleResults`** (mới) → `# followUps`.

### Sau khi merge xong

- Rescan để xác nhận: fullstack + SD phải đạt `hasChecklist: 345/345` và `360/360` (script scan nhanh — xem `.artifacts/interview-audit/mount-scripts/` có thể viết lại tương tự `final-status-scan.js` đã dùng, chỉ cần đếm `# checklist` trong mỗi `en.md`).
- Commit + báo thầy trước khi push (data repo `StarCi-Academy/data`, nhánh `main`) — ĐỪNG tự push khi chưa hỏi.

## Lưu ý an toàn

- KHÔNG dùng `_all.json`/`_id2folder.json`/DB cho việc này nữa — bài học từ sự cố đã ghi trong `.news/mock-interview-audit-incident-and-plan.md`.
- Luôn `--dry` trước khi ghi thật vào `.mount`.
- Nếu 1-2 câu lẻ bị lỗi StructuredOutput/rate-limit giữa batch, tìm đúng `idx` còn thiếu (so `result` trả về với `count` kỳ vọng, lọc `null`) rồi chạy lẻ lại — không cần chạy lại cả batch.
