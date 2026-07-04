# Job-Readiness · Công bằng liên-khóa — Workflow Index

> Tập brief chia việc cho team. Mọi brief `status: undone`. Thầy gán owner khi chia job.
> Bối cảnh + lý do thiết kế: xem §"Mô hình" dưới. Ground từ code thật repo BE (`mtp`) + FE (`starci-academy`).

## Mô hình chốt (đọc trước khi làm bất kỳ WF nào)

**Nguyên tắc gốc — công bằng bất đối xứng:** người mua 1 khóa cần *"không bị thiệt"*; người mua 3 khóa cần *"công sức hiện ra"*. Giải bằng cách **không có 1 điểm số gộp nào phồng theo số khóa**.

**Bỏ composite gộp.** Thay bằng:

| Lớp | Là gì | Quy tắc | Ở StarCi |
|---|---|---|---|
| **Per-track card** | 1 card / mỗi khóa đã mua | mỗi card tự đứng, KHÔNG gộp | Capstone% + Mock interview + CV(best theo khóa) → `depth` + `band` |
| **Global foundation** | 1 con số, không gắn khóa | kiếm bằng hoạt động ai cũng làm được | **Coding percentile** (giải problem) |
| **Engagement** | vui/status | SUM được phép, gate ZERO cơ hội | XP leaderboard, badge, streak |
| **Entitlement** | quyền AI / job | nhị phân theo tier/enroll, không theo count | AI credit, model-tier, job-board gate |

**Luật vàng (mọi feature mới phải qua):** *tín hiệu này lên CƠ HỌC khi mua thêm khóa không?* → Có = SAI, phải sửa. (breadthBonus cũ vi phạm đúng chỗ này → đã bỏ.)

**CV = 1 hệ thống nhất, 2 nguồn (thầy chốt giữ cả 2):** hôm nay có 2 hệ rời — **review** (upload → chấm, có score) + **generate** (AI sinh, KHÔNG score). Gộp về **1 entity "CV của tôi"**: `source` = generated | uploaded, cùng 1 rubric chấm → mọi CV có `score` + `feedback`; customize `label`/`courseId?`/`targetRole?`/`language?`; multi-per-user. Pillar CV per-track = MAX(score theo `courseId`); job-board gate = MAX(score global). "C# vs Java" chỉ là VÍ DỤ user tự tổ chức, KHÔNG ép taxonomy. Chi tiết: WF-03 (umbrella) + 03a/b/c.

## Hiện trạng code
- BE `JobReadinessService` **đã commit trên mtp** nhưng lệch model (còn breadthBonus + composite gộp + CV latest). → refactor, không build mới.
- FE **chưa có gì** → build mới, clone pattern `userChallengeStrength`.

## Danh sách workflow + thứ tự

| ID | Việc | Repo | Effort | Phụ thuộc | Status |
|---|---|---|---|---|---|
| WF-01 | Khoá invariant fair (test + rule doc) | BE | S | — | ✅ done |
| WF-02 | Bỏ composite → per-track + foundation | BE | M | WF-03, WF-04 (mềm) | ✅ done |
| WF-03 | **Thống nhất CV** (umbrella, 2 nguồn) | BE | L | WF-02 | ✅ done |
| ├ WF-03a | Gộp entity CV + cột customize + migration | BE | M | — | ✅ done |
| ├ WF-03b | Bước scoring dùng chung (generate + upload) | BE | M | 03a | ✅ done |
| └ WF-03c | Switch consumers + migrate/retire legacy | BE | M | 03a,03b,02 | ✅ done (retire deferred) |
| WF-04 | Verify bảng `mock_interview_attempts` | BE | S | — | ✅ done |
| WF-05 | FE profile: section Job-Readiness | FE | M | WF-02 | ✅ done |
| WF-06 | FE dashboard widget + copy discipline | FE | M | WF-02, WF-05 | ✅ done |
| WF-07 | Đường upload CV → unified (source=uploaded + chấm) | BE | M | 03a,03b | ✅ done |
| WF-08 | Recruiter marketplace — filter/rank theo track | BE+FE | L | WF-02 | undone |
| WF-09 | Interview pillar — cửa sổ recent-N | BE | S | WF-02 | undone |
| WF-10 | Retire legacy CV (sau verify prod) | BE | M | WF-03c, WF-07 | undone |
| WF-11 | FE upload CV UI (presign→PUT→uploadCv→poll) | FE | M | WF-07 | ✅ done (⚠️ 2 flag) |

**Đường tới hạn:** WF-03 (CV schema, lớn nhất) → làm sớm. WF-01/WF-04 độc lập, nhặt trước cho gọn. WF-02 restructure có thể chạy song song, wire pillar khi WF-03/04 xong. FE (WF-05/06) chờ WF-02 xong GraphQL shape.

## Test coverage (§10 — one spec per SUT, `Test.createTestingModule`) — ✅ 10 suites / 52 test pass
Chạy gộp: `npx jest --testPathPatterns "job-readiness.service|consultant-contact-gate|cv-scoring.service|generate-cv-score-step|score-uploaded-cv|upload-cv.handler|generate-cv.handler|revise-cv.handler|cv-generation.handler"` → **10 suites / 52 pass**. Gồm: job-readiness (invariant + CV per-track + 3-pillar), consultant-gate (union + no-count), cv-scoring, generate-cv-score-step, score-uploaded-cv (service + worker), upload-cv.handler, 3 thin CV handler.

### (chi tiết cũ) — ✅ vòng đầu 27 test
| Spec | SUT | Test |
|---|---|---|
| `job-readiness.service.spec.ts` | JobReadinessService | 11 — invariant (thêm track ≠ đổi điểm) + CV per-track + 3-pillar renormalize + sort + empty |
| `consultant-contact-gate.service.spec.ts` | ConsultantContactGateService | gate reveal/hide theo `bestCvScore` + `getBestCvScore` GREATEST(unified,legacy) + no-count-param |
| `cv-scoring.service.spec.ts` | CvScoringService | 11 — parse/clamp/source-agnostic/RAG-fail degrade/AI-fail propagate |
| `generate-cv-score-step.service.spec.ts` | GenerateCvScoreStepService | 5 — score+persist / throw→persist null (không mất CV) / missing compose→fail |
Chạy: `npx jest --testPathPatterns "job-readiness.service|consultant-contact-gate|cv-scoring.service|generate-cv-score-step"` → **4 suites / 27 pass**.
Ghi chú: gate-assertion đã tách khỏi job-readiness spec (đúng §10 one-spec-per-SUT). Vài spec hàng xóm cũ dùng `new Service()` — 4 spec này theo chuẩn §10 (`Test.createTestingModule`).

## Còn lại — KHÔNG phải code (team làm khi có môi trường)
**Runtime (không chạy được ở đây: no dev server / no DB / no push):**
1. Chạy 2 migration: `1721700000000-UnifyCvGenerations` + `1721800000000-BackfillLegacyCvIntoUnified`.
2. Restart BE (schema GraphQL đổi: job-readiness shape + CV mutation args).
3. ~~Chạy invariant test~~ → **ĐÃ XONG**: 4 unit spec / 27 test pass ngay ở đây (mock EntityManager, no DB). Chỉ còn integration/e2e với DB thật (optional).
4. QA mắt: profile section (WF-05) + dashboard widget (WF-06) render.

**Quyết định defer (team chốt):**
- **Retire legacy CV** (`cv_submissions`/`cv_submission_attempts` + review pipeline) — WF-03c mới backfill + union-read, `// TODO(retire-legacy-cv)`. Gỡ SAU khi verify backfill trên prod → xem **WF-10**.
- ~~Upload → unified ingest~~ → **ĐÃ XONG (WF-07)**: `uploadCv` mutation + `score-uploaded-cv` worker + presign trả `cdnKey`. Generate + upload đều vào `cv_generations` + chấm chung `CvScoringService`. FE cần wire luồng: `generateSubmitCvPresignUrl → PUT file → uploadCv({cdnKey,…}) → poll cvGeneration`.
- **CV scoring có debit credit không** — WF-03b để free (mirror compose). Chốt.
- **CV templateLevel** — default `mid`; mở rộng user chọn rubric sau.
- ~~**FE hiện CV per-track**~~ → **ĐÃ XONG**: profile + dashboard hiện `tracks[].cvScore` thành pillar thứ 3; BE thêm `@Field courseId` (bug FE-query select courseId mà BE chưa expose → đã fix).

**Chưa có WF (ngoài scope, ưu tiên sau):** đã brief — xem WF-08, WF-09, WF-10 ở bảng trên.

## Ràng buộc chung
- Không đụng file đang dirty (`src/modules/health/*`, `package.json`).
- BE tsc có baseline lỗi ở module WIP khác → verify "NO NEW ERRORS", không hoảng.
- Verify KHÔNG chạy dev server: `tsc --noEmit` + eslint + validate JSON. FE i18n vi/en phải khớp key.
- FE xác nhận nhánh (`main` vs `mtp`) trước khi tạo file.
