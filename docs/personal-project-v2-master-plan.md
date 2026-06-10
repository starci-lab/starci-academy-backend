# Personal Project V2 — MASTER PLAN (để thầy duyệt tổng thể)

> Gom toàn bộ thiết kế + tiến độ + việc còn lại của đại tu "Dự án cá nhân" (capstone) cho cả 2 khoá. Duyệt khung này trước khi em chạy tiếp.
> Doc con: `personal-project-v2-fullstack-roadmap.md` (roadmap FS) · `personal-project-v2-scoring-and-entities-plan.md` (scoring+DB) · `personal-project-v2-plan.md` (lịch sử quyết định).

## 1. Mục tiêu
Mỗi khoá có 1 **capstone = build một app ecommerce hoàn chỉnh, deploy được** ("StarCi Shop"). Từng milestone là 1 increment để lại app chạy được; kết thúc bằng milestone capstone (tích hợp + deploy + demo). 1 repo lớn dần, học viên nộp → AI chấm từng task.

## 2. Stack chuẩn (đã chốt)
- **Backend**: học viên chọn **1 trong 4** ngôn ngữ — TypeScript(NestJS) / Java(Spring) / C#(ASP.NET) / Go(Gin) — làm xuyên suốt.
- **Frontend**: React + Next.js + **HeroUI v3** + Tailwind v4.
- **Deploy**: **VPS DigitalOcean** + `docker compose` + **nginx** reverse proxy + **certbot** HTTPS trên domain. KHÔNG k8s/PaaS ("không đao to búa lớn").
- **DB**: PostgreSQL.

## 3. Roadmap content (StarCi Shop)
**Fullstack — 11 milestone / 36 task** (✅ viết xong V2, gate sạch):
M0 Project Init · M1 Auth · M2 Catalog(+image-upload) · M3 Cart&Orders · M4 Async&Notif · M5 Storefront(FE) · M6 Checkout(FE) · M7 UI Polish&A11y(FE) · M8 Production Readiness · M9 Deploy&DevOps(VPS) · M10 Capstone(integrate+deploy+demo).

**System Design — 11 milestone / ~29 task** (❌ CHƯA làm — cùng app ecommerce nhưng dạng phân tán):
k8s monorepo · kong gateway · keycloak SSO · inter-service comm · kafka order pipeline · redis cache · search · flash-sale · distributed-tx/wallet · observability · notif/webhook (+ capstone).
> SD có task **infra = agnostic** (k8s/helm/yaml), task **service = 4-lang**.

## 4. Format criteria (authoring — content GIỮ NGUYÊN)
Markdown **lang-first**: task → `# criterias` → `## N` per lang → `lang` · `body`(đề bài :::muted) · `outcome`(3×10=30) · `approach`(40/15/15=70). Mỗi criterion: `body`/`score`/`critical`. Bỏ codeImplementations (code vào brief). Gate `scratch/gate-task-v2.mjs` kiểm Σ=100/critical/callout/mirror.

## 5. Scoring (đã chốt)
- **Mỗi task chấm 0-100** = outcome 30 + approach 70 (tỉ lệ 7:3). Chấm yes/no, `critical` miss → 0 cả task.
- **1 milestone = 100** = **trung bình CÓ TRỌNG SỐ** điểm các task theo `task.weight`. Tính ở progress service, KHÔNG cột mới, content không đụng.

## 6. Data model (DB) — criterion-first, mirror Challenge V2 (✅ code xong)
6 bảng mới:
- `milestone_task_outcome_criteria` (orderIndex/score/critical) → `_langs` (lang/body, outcome agnostic = 1 row)
- `milestone_task_approach_criteria` (orderIndex/score/critical) → `_langs` (4 lang)
- `milestone_task_briefs` (lang/body/orderIndex + i18n) → `_brief_translations`
- Task: +`briefs`(@Field) +`outcomeCriteria`/`approachCriteria`(internal, không @Field) +`verified`. Criteria EN-only, không lộ GraphQL. Khác challenge đúng 1 điểm: giữ cột `score`.

## 7. Grading pipeline (✅ code xong)
Mutation `reviewPersonalProjectTask` → job `review-milestone-task` (load repo → Qdrant RAG → LLM). Grade-step **route theo `task.verified`**: V2 → `collectMilestoneTaskCriteria(task,lang)` (pickLangBody + score) → prompt yes/no+critical (reuse util challenge) → maxScore=Σ=100. Legacy giữ nguyên. `lang` học viên gửi lúc submit.

## 8. Phasing & trạng thái
| Phase | Nội dung | FS | SD |
|---|---|---|---|
| Roadmap chuẩn + capstone | thiết kế | ✅ | ❌ |
| Content V2 (criteria + brief) | author + gate | ✅ 36 task | ❌ |
| Chuẩn HeroUI + VPS deploy | áp content | ✅ | n/a |
| Entity criterion-first (6 bảng) | code | ✅ (chung) | ✅ (chung) |
| Grader V2 (processor) | code | ✅ (chung) | ✅ (chung) |
| **Migration 6 bảng** | DB | ⏳ | ⏳ |
| **P2 Parser** (markdown→DB) | code | ⏳ | ⏳ |
| **FE** (render brief + gửi lang) | code | ⏳ | ⏳ |
| **Seed + sync CDN/ES** (`_seed.yaml`) | ops | ⏳ | ⏳ |

## 9. Cần thầy duyệt / chốt
1. **Khung tổng thể trên** — ổn chưa? (stack, scoring, DB criterion-first, phasing)
2. **Thứ tự chạy tiếp**: em đề xuất **(a)** khép mạch FS engine [migration → P2 parser → FE → seed] để có 1 khoá chạy thật end-to-end → **(b)** làm content SD (quất full như FS) → seed SD.
3. **Chuẩn nghiệp vụ** còn muốn thêm? (vd payment provider, giỏ hàng guest, coupon, chủ đề khác StarCi Shop...)
4. **SD**: giữ 11 milestone phân tán hiện có làm khung, hay thầy muốn re-map khác?
