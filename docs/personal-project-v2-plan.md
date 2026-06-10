# Personal Project V2 — Plan

> Re-architect mỗi khóa thành **một ecommerce app hoàn chỉnh deploy được**, và đại tu **criteria chấm task theo đúng mô hình Challenge V2** (outcome agnostic + approach per-language, yes/no + critical, total 100).
>
> Liên quan: `docs/challenge-criteria-redesign.md`, memory `personal-project-ecommerce-roadmap`, `challenge-criteria-redesign`.

## 0. Chốt thiết kế (thầy duyệt 2026-06-10)

1. **Phạm vi roadmap**: re-architect — toàn bộ milestone ghép thành 1 app ecommerce hoàn chỉnh, có deliverable cuối (deploy/demo) + milestone capstone tổng.
2. **Criteria model**: mirror y hệt Challenge V2 — cột `outcomeCriteria`/`approachCriteria` jsonb + `verified` trên `milestone_task`; bỏ dần entity `milestone_task_criteria` (text/hint/promptText/score).
3. **Scoring**: mỗi task = **100** (outcome 30 / approach 70), chấm yes/no, `critical` miss → zero cả task. Milestone %/course % = trung bình task pass.
4. **Task agnostic** (FE/infra, không có code 4-lang): `approachCriteria` là **1 block agnostic** (không chia `langs`); backend task → approach chia per-lang typescript/go/csharp/java.

## 1. Trạng thái hiện tại (verified 2026-06-10, KHÔNG theo memory cũ)

Personal-project **đã có đủ pipeline**, không phải dựng mới:

- **Entities** (`src/modules/databases/postgresql/primary/entities/`):
  - `milestone` → `milestone_task` (`title/description/hint/orderIndex/weight/type{design|techIntegrate|business}/maxScore` + i18n).
  - `milestone_task_criteria` (`text/hint/promptText/score/orderIndex` + i18n) ← **mô hình CŨ cần thay**.
  - `milestone_task_code_implementations` (`lang/guide/example` + i18n) — 4-lang.
  - User side: `user_milestone_task` → `user_milestone_task_attempts` (`attemptNumber/passed/score/shortFeedback/processedAt`) → `user_milestone_task_attempt_feedbacks` (`message/severity{low|medium|high}/location/suggestion`).
- **Parser**: `src/modules/init/seeders/courses/parsers/milestone.service.ts` + `milestone-task.service.ts`. Content ở `.mount/data/courses/<course>/milestones/<n>-<slug>/{tasks/<n>-<slug>/}{vi,en}.md`. Format `# title/description/type/weight/orderIndex/maxScore/criterias/codeImplementations`, leaf bọc `<!-- @starci/seperator -->`.
- **GraphQL**: query `milestones`, `milestoneTaskProgress` (completionTasks lastScore/maxScore/completed/numAttempts + currentTask), `userMilestoneTaskFeedbacks`. Mutation **`reviewPersonalProjectTask`** (courseId/taskId?/githubUrl?/branch?/mode/model…).
- **Grading job**: BullMQ `review-personal-project-task` → processor `review-milestone-task` (2 step grade→complete). Grade = GithubRepoLoader → Qdrant RAG → LLM chấm theo `promptText` → `passed = score ≥ maxScore×passThreshold`. **Đọc criteria TRỰC TIẾP từ task** (không có bảng submission-snapshot như challenge).
- **FE** (`C:\Repositories\starci-academy`): trang `…/learn/personal-project`, `components/layouts/Task/` (TaskCriteriaList, TaskCodeImplementations, TaskResults, TaskActions) + `PersonalProjectSubmission` (form repo+branch) + mutation review. Score hiển thị /maxScore. **Chưa có lang selector**.

> **Khác biệt then chốt với challenge**: milestone grader đọc criteria thẳng từ task lúc chấm — **không normalize ra entity submission-snapshot**. → mirror bản **đơn giản hơn**: grade trực tiếp từ jsonb của task, KHÔNG cần đẻ bảng `*_submission_*_criteria_*` như ChallengeSubmission.

## 2. Mục tiêu app ("definition of done" mỗi khóa)

Canonical product = **StarCi Shop** (ecommerce). Mỗi khóa build một lát cắt, kết thúc = app chạy + deploy.

- **Fullstack** (10 milestone hiện có + capstone): app full-stack (backend kiểu NestJS/4-lang concept + Next.js storefront) — auth → catalog → cart/orders → async/notifications → storefront fetching → checkout forms → UI polish/a11y → production-readiness → deploy. **Capstone M-final**: tích hợp end-to-end + deploy + demo.
- **System Design** (11 milestone hiện có + capstone): cùng ecommerce nhưng dạng phân tán — k8s monorepo → kong gateway → keycloak SSO → inter-service comm → kafka order pipeline → redis cache → search → flash-sale → distributed tx/wallet → observability → notifications/webhook. **Capstone M-final**: deploy cụm + demo luồng đặt hàng xuyên service.

Mỗi milestone = một **vertical increment để lại app chạy được** (runnable checkpoint). Một repo duy nhất lớn dần; mỗi task chấm trên trạng thái repo hiện tại.

Deliverable cuối mỗi khóa = repo + bằng chứng deploy (Dockerfile/compose/k8s manifest/CI + README "cách chạy") + (khuyến khích) URL/demo.

## 3. Mô hình criteria V2 cho task (mirror challenge)

### 3.1 Schema — thêm cột lên `milestone_task` (KHÔNG đẻ bảng snapshot)

```
outcomeCriteria  jsonb null     -- agnostic
approachCriteria jsonb null     -- per-lang HOẶC agnostic block
outcomeScore     int default 30
approachScore    int default 70
verified         timestamptz null  -- non-null = task V2 (mirror challenge)
```

- `maxScore` của task V2 = `outcomeScore + approachScore = 100` (giữ cột, set 100).
- Giữ `milestone_task_criteria` cho legacy; task V2 KHÔNG dùng nó. Route theo `verified`.

### 3.2 Shape item

```ts
// outcomeCriteria — luôn agnostic
type OutcomeCriterion = { orderIndex: number; body: string; score: number; critical: boolean }

// approachCriteria — 2 dạng tuỳ task:
//  (a) backend task: per-language
type ApproachCriterionPerLang = {
  orderIndex: number
  critical: boolean
  langs: Array<{ lang: "typescript"|"go"|"csharp"|"java"; body: string; score: number }>
}
//  (b) task agnostic (FE/infra): 1 block, KHÔNG langs
type ApproachCriterionAgnostic = { orderIndex: number; body: string; score: number; critical: boolean }
```

- `body` mỗi criterion nêu rõ **3 ý** (theo chuẩn challenge V2): *kiểm gì / bằng chứng quan sát được / cái gì làm RỚT*.
- Σ outcome score = 30, Σ approach score = 70 (mỗi lang với dạng per-lang).
- `critical:true` không đạt → zero cả task.
- Criteria là **rubric nội bộ EN-only**, KHÔNG expose GraphQL (mirror challenge).

### 3.3 Authoring format (markdown, mirror challenge V2)

Trong `tasks/<n>-<slug>/en.md` (criteria EN-only → chỉ cần ở en.md; vi.md giữ phần content còn lại):

```
# verified
<!-- @starci/seperator -->
2026-06-10
<!-- @starci/seperator -->
# outcomeCriteria
<!-- @starci/jsonb -->
# 0
## body
... kiểm gì / bằng chứng / rớt khi ...
## score
10
## critical
false
# 1
...
<!-- @starci/jsonb -->
# approachCriteria
## 0                       <- per-lang: item index
### typescript
### data
<!-- @starci/jsonb -->
# 0
## body
...
## score
40
## critical
true
<!-- @starci/jsonb -->
### go
### data
...
## 1
...
```

- Task agnostic: `# approachCriteria` viết như `# outcomeCriteria` (1 block jsonb, không `### lang`). Parser tự nhận dạng (có `### lang` → per-lang; không → agnostic).

## 4. Grading V2 (BE)

- Route trong job `review-milestone-task`: `isV2Task = Boolean(task.verified)` → nhánh grade-v2.
- Helper `collectMilestoneTaskCriteria(task, lang)`:
  - outcome: dùng cả mảng (agnostic).
  - approach per-lang: `pickLangBody(item, lang)` (fallback lang đầu nếu thiếu); approach agnostic: dùng `body` thẳng.
  - score split: `splitIntegerWeight(outcomeScore, outcomeCount)` + `splitIntegerWeight(approachScore, approachCount)` — TÁI DÙNG util challenge (`src/features/api/processors/shared/challenge-submission-v2/utils/`), nâng lên shared chung nếu cần.
- `renderCriteriaPromptSections` (tái dùng) → prompt yes/no: mỗi criterion MET→full score / NOT→0; `critical` NOT MET → total=0. Output giữ `template.json` shape → reuse parse + complete step + persist attempt/feedback (đã có).
- `maxScore = Σ score = 100`. `passed = score ≥ 100×passThreshold`.
- **lang lúc submit**: thêm `lang?` vào `reviewPersonalProjectTask` request; route V2 dùng lang. Task agnostic bỏ qua lang.

## 5. Frontend

- Type `MilestoneTaskEntity` +`verified` (criteria KHÔNG expose — như challenge).
- Task V2 backend: hiện **ProgrammingLanguageTabs** (tái dùng) chọn lang → đẩy xuống mutation `reviewPersonalProjectTask` kèm `lang`. Task agnostic: không tabs.
- TaskResults: score /100. Per-criterion feedback giữ nguyên (attempt feedbacks đã có).
- **Sub-decision còn mở** (mục 8): có hiển thị checklist criteria cho learner không, hay ẩn hẳn như challenge.

## 6. Aggregation tiến độ

- `milestoneTaskProgress` đã có sẵn: `lastScore/maxScore/completed/numAttempts`. Với maxScore=100, `completed = lastScore ≥ 100×passThreshold` (passThreshold từ config). Milestone % = avg task completed; course personal-project % = avg milestone. Không phải đổi entity, chỉ đổi maxScore=100.

## 7. Phasing (đề xuất thứ tự)

| Phase | Nội dung | Repo | Rủi ro |
|---|---|---|---|
| **P0** | Doc: product brief StarCi Shop + re-map roadmap mỗi khóa + capstone + acceptance + spec authoring `personal-project-v2-criteria.md` | docs/.mount | thấp |
| **P1** | Schema: +4 cột + verified lên `milestone_task`, register, migration; maxScore=100 | BE | thấp |
| **P2** | Parser `milestone-task.service.ts`: parse outcome/approach jsonb + verified (nhận agnostic vs per-lang) | BE | trung |
| **P3** | Grading V2: `collectMilestoneTaskCriteria` + reuse util challenge + nhánh grade-v2 route by verified + `lang` vào request | BE | trung |
| **P4** | FE: type verified, lang Tabs cho task V2 backend, gửi lang, score /100 | FE | trung |
| **P5** | Content: re-write roadmap theo app hoàn chỉnh + author outcome/approach criteria cho MỌI task (21 milestone × ~3-4 task) + set verified | .mount | **nặng** (workflow/agents) |
| **P6** | Live seed + grade e2e (khi repo build sạch) | — | chặn bởi lỗi TS pre-existing |

> P1-P4 là code (làm tuần tự, tái dùng tối đa util challenge). P5 là khối content lớn nhất — fan-out agent, mỗi task author criteria theo spec, gate đếm Σscore=100 + critical + shape.

## 8. OPEN — cần thầy chốt tiếp trước P4/P5

1. **Hiển thị criteria cho learner?** Challenge V2 ẩn hẳn (rubric nội bộ). Personal-project hiện đang SHOW (TaskCriteriaList). Chọn: (a) ẩn hẳn như challenge, learner chỉ thấy description/hint/codeImpl; (b) vẫn show một "acceptance checklist" rút gọn từ outcome body (không lộ score/approach).
2. **Capstone deliverable chấm sao?** Deploy không chạy được trong RAG repo — outcome criteria của capstone kiểm bằng chứng repo (Dockerfile/compose/k8s/CI/README deploy-steps) thay vì runtime. Thầy OK chấm-bằng-chứng hay muốn cơ chế khác (vd nộp URL + screenshot)?
3. **Migration legacy criteria**: xoá hẳn `milestone_task_criteria` sau khi mọi task lên V2, hay giữ để fallback?
4. **passThreshold** cho task V2 = bao nhiêu (vd 0.7)?
