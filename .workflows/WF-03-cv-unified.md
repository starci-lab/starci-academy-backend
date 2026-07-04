# WF-03 · Thống nhất CV (1 entity · 2 nguồn · có điểm) — UMBRELLA

- **Status:** ✅ done (2026-07-04 — cả 3 pha con WF-03a/b/c done; generate + upload đều vào `cv_generations` + chấm chung; retire legacy defer)
- **Repo:** backend (`mtp`)
- **Effort:** L (tách 3 pha)
- **Phụ thuộc:** WF-02 (done) — pha 03c wire CV pillar vào per-track
- **Owner:** (chưa gán)

## Bối cảnh — vì sao thống nhất
Hôm nay có **2 hệ CV song song, rối** cho cả user lẫn code:
- **Review** (`cv_submissions` + `cv_submission_attempts`): user UPLOAD CV → AI chấm rubric Junior/Mid/Senior → có **`score` 0–100** + feedback. Đây là nguồn score job-board gate + job-readiness đang đọc. Processor `review-cv-submission`.
- **Generate** (`cv_generations`, mutation `generateCv`/`reviseCv`): AI SINH CV từ thành tích đã verify (capstone/challenge/coding/XP) + `extraPrompts` free-text + RAG → JSON + LaTeX. **KHÔNG có score.** Đã multi-per-user + có `myCvGenerations` list.

## Mô hình thống nhất (thầy chốt: GIỮ 2 NGUỒN)
**1 khái niệm "CV của tôi"** — 2 nguồn nhập, 1 điểm, 1 list:
- `source`: **generated** (AI dựng từ việc đã làm ở StarCi = moat) | **uploaded** (user mang CV riêng vào).
- Chấm bằng **CÙNG 1 rubric**, bất kể nguồn → mọi CV đều có `score` + `feedback`.
- Customize: `label` (user đặt) · `courseId?` (optional gắn track) · `targetRole?` · `language?`.
- Vòng đời = generate/upload rồi SCORE là các pha của **1 luồng**, không phải 2 hệ.

```
Generated:  gather → compose → render →  SCORE  → CV có điểm ┐
Uploaded:   upload → extract text →       SCORE  → CV có điểm ┘  cùng 1 bảng, cùng 1 bước chấm
```

## Nối fairness
- Pillar CV per-track = `MAX(score WHERE courseId = track)`.
- Job-board gate = `MAX(score global)`.
- 1 nguồn sự thật (bảng thống nhất).

## 3 pha con
| Pha | Việc | File brief |
|---|---|---|
| **WF-03a** | Gộp entity + cột customize + migration + plumb mutation/list | `WF-03a-cv-unify-schema.md` |
| **WF-03b** | Bước scoring dùng chung (generate + upload → điểm) | `WF-03b-cv-unified-scoring.md` |
| **WF-03c** | Switch consumers (job-gate + job-readiness) + migrate/retire legacy | `WF-03c-cv-switch-consumers.md` |

Thứ tự cứng: 03a → 03b → 03c. Trong lúc chuyển, **giữ score cũ chảy** (job-board không được đứng).
