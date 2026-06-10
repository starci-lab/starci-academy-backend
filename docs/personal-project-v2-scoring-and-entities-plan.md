# Personal Project V2 — Scoring & Entity Plan (mirror Challenge V2)

> Chốt 2026-06-10: criteria entity **mirror Challenge V2** (quan hệ, criterion-first) + **giữ brief** per-lang. Score: **tổng 1 milestone = 100, tỉ lệ approach:outcome = 7:3**. Doc này để thầy duyệt TRƯỚC khi code (đập model lang-block sai + dựng lại).

## 1. Entity design — mirror Challenge V2 `ChallengeSubmission*Criteria`

Challenge V2 lưu criteria **quan hệ, KHÔNG jsonb**: `challenge_submission_outcome_criteria` (orderIndex + critical) → con `..._langs` (lang + body). approach y hệt. Score per-item KHÔNG lưu — bucket weight `outcomeScore`/`approachScore` trên parent, grade chia đều (`splitIntegerWeight`).

**Áp cho milestone task (parent = task thay vì submission):**

| Entity (bảng) | Cột | Ghi chú |
|---|---|---|
| `milestone_task_outcome_criteria` | orderIndex, critical, FK task | mirror outcome-criteria |
| `milestone_task_outcome_criteria_langs` | lang, body | con, EN-only, không translation |
| `milestone_task_approach_criteria` | orderIndex, critical, FK task | mirror approach-criteria |
| `milestone_task_approach_criteria_langs` | lang, body | con |
| `milestone_task_briefs` *(giữ brief)* | lang, body, orderIndex, defaultLocale, FK task | learner-facing đề bài per-lang |
| `milestone_task_brief_translations` | (parentId, locale, field), value | i18n cho brief body |

`MilestoneTaskEntity`: +`outcomeScore`(default 30) +`approachScore`(default 70) +`verified`; +OneToMany `outcomeCriteria`/`approachCriteria`/`briefs`. **Criteria KHÔNG @Field** (rubric nội bộ); briefs CÓ @Field (FE render).

→ **6 entity mới** (thay 3 entity lang-block em chế sai — sẽ xoá).

**Grader**: viết `collectMilestoneTaskCriteria(task, lang)` mirror `collectSubmissionCriteria` — split `outcomeScore`/`approachScore` đều across criteria + `pickLangBody`. Tái dùng `splitIntegerWeight`/`pickLangBody`/`renderCriteriaPromptSections` của challenge (reuse 100%).

## 2. Scoring — "tổng 1 milestone = 100, tỉ lệ 7:3"

1 milestone có **T task**. Đây là chỗ cần thầy chốt cách phân bổ 100 điểm:

### Phương án A *(đề xuất)* — task chấm 0-100, milestone = trung bình có trọng số
- **Mỗi task vẫn chấm trên thang 0-100**, trong đó **approach 70 / outcome 30** (đúng 7:3). Grader per-task self-contained (KHÔNG cần biết milestone).
- **Điểm milestone (0-100)** = trung bình có trọng số điểm các task theo `weight` task → tổng milestone quy về 100.
- Ưu: grader đơn giản, **content 36 FS task giữ nguyên** (đã 30/70), pass/fail per task rõ. "Tổng milestone=100, 7:3" thoả ở mức milestone.

### Phương án B — chia 100 cho các task trong milestone
- Milestone 100 chia cho T task theo weight → mỗi task max = `100 × wᵢ/Σw` (vd 4 task = 25 mỗi task).
- Trong mỗi task: approach 70% / outcome 30% của task-max đó.
- Nhược: task-max phụ thuộc số task trong milestone → grader phải biết ngữ cảnh milestone; content per-task không cố định 100; phức tạp hơn.

### Per-criterion score (trong 1 bucket)
- **Y chang challenge = chia đều** (`splitIntegerWeight`): vd approach 70 / 3 criterion = 24/23/23. Content 40/15/15 thành thông tin tham khảo, KHÔNG ảnh hưởng (critical fail→0 vẫn chạy).
- HOẶC thêm cột `score` trên criterion để giữ đúng 40/15/15 (lệch challenge chút).
→ **cần thầy chốt** (đề xuất: chia đều cho đúng "y chang challenge").

## 3. Ảnh hưởng & việc phải làm
- **Đập**: 3 entity lang-block (`milestone_task_lang_blocks` + translation + `milestone_task_criterions`) + util/grade-step đang trỏ vào nó.
- **Dựng**: 6 entity mới (mục 1) + đăng ký (index + primary.module ×3) + id-factory (cho parser).
- **Grader**: `collectMilestoneTaskCriteria` mirror challenge + grade-step đọc relations mới.
- **Parser (P2)**: đọc markdown lang-first → pivot criterion-first (outcome criterion i ← body từ mỗi lang block) + brief per-lang + set verified + outcomeScore/approachScore.
- **Migration**: tạo 6 bảng.
- **Content**: GIỮ NGUYÊN (markdown lang-first vẫn parse được sang criterion-first). Nếu chọn "chia đều" thì 40/15/15 trong content thành tham khảo.
- **FE (P4)**: render brief per-lang + gửi lang lúc submit.

## 4. Cần thầy chốt
1. **Scoring phân bổ**: Phương án **A** (task 0-100, milestone=avg) hay **B** (chia 100 cho task)?
2. **Per-criterion score**: chia đều y-chang-challenge, hay thêm cột score giữ 40/15/15?

Chốt 2 cái này em đập-dựng lại entity + grader + plan parser luôn.
