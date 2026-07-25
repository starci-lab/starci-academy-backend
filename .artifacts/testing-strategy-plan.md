# Testing Strategy — Plan & Coverage

> Chốt: **4 lane**. CI chỉ chạy `lint → nest build → unit`. E2e + harness **chỉ local**.
> Cập nhật: 2026-07-21.

## Mô hình

| Lane | Chạy ở | Deterministic | Cần Docker | Cần Claude API |
|---|---|---|---|---|
| **unit** | CI + local | ✅ | ✗ | ✗ |
| **e2e** (app-as-Docker, Testcontainers) | **local only** | ✅ | ✅ (Docker Desktop) | ✗ |
| **harness** (LLM eval) | **local only**, nightly/manual | ❌ (fuzzy/judge) | ✗ | ✅ (OAuth/API key) |
| **lint + `nest build`** | CI + local | ✅ | ✗ | ✗ |

**Seam AI duy nhất:** `AiInvokeService.run()` — `src/modules/ai/ai-invoke.service.ts:109`.
- unit → `.overrideProvider(AiInvokeService).useValue(makeAiInvokeMock(...))`
- harness → dùng thật, override balancer trỏ 3 tier về Claude.

**Tier→Claude (harness, thầy chốt A):** Economy=`claude-haiku-4-5` · Medium=`claude-sonnet-5` effort `low` · High=`claude-sonnet-5` effort `high`. Judge=`claude-opus-4-8` effort `high`.

**E2e provider:** `local` (dựng-seed-huỷ) · `dockercloud` (để dành) · `vps` (**smoke read-only**, KHÔNG seed/down).

---

## COVERAGE MATRIX — tất cả luồng

Cột **Lane**: U=unit, E=e2e, H=harness. **AI**=luồng đi qua `AiInvokeService`. Priority P0 (tiền/đúng-sai) → P2.

### A. Auth & Identity
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Keycloak login/register (`http/keycloak/auth`) | U·E | P0 | token cấp, session tạo | |
| 2FA / TOTP (`two-factor`, `modules/totp`) | U·E | P1 | secret gen, verify code | |
| GitHub OAuth (redirect/callback + `resolve-github`/`revoke-github` jobs) | U·E | P1 | code→token, link/unlink account | |
| Google OAuth (`keycloak/google`) | E | P1 | callback → session | |
| Device sessions (`sessions`, `session` module) | U | P2 | list/revoke device | |

### B. Payment & Monetization *(webhook đã e2e sẵn)*
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Stripe/PayOS/SePay/PayPal/NOWPayments webhook | U·E | **P0** | verify sig, idempotent, tạo transaction | |
| Create payment link (payos/…) | U·E | P0 | link + amount đúng | |
| Reconcile transaction (worker + boot-sweep) | U | P0 | orphan → reconcile, không double | |
| Installment plans (+ enforcement cron) | U | P1 | kỳ hạn, khoá khi trễ | |

### C. Enrollment & Access *(P0 — tiền)*
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| **Enroll → pay → entitlement → premium content** | E | **P0** | flow tiền end-to-end | |
| Enroll worker + steps | U | P0 | provision access, membership cache | |
| Premium paywall / entitlement resolve | U·E | P0 | gated content đúng | |

### D. Learning content
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Courses/modules/contents/foundations read | U·E | P1 | list/detail, scope | |
| Learner CMS (`learner-cms`) | U | P2 | edit content | |
| Progress tracking (progress projection) | U | P1 | reducer đúng %, CDC | |
| Search (elasticsearch sync + `search-course-content`) | U | P2 | index → query khớp | |

### E. Challenges & Coding
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| **Challenge submit → judge0 → grade → XP** | E | **P0** | chấm code + cộng XP | |
| judge-coding-submission worker + steps | U | P0 | run testcase, verdict | |
| Coding practice / challenge-submissions | U | P1 | submit, list | |

### F. AI Grading *(harness territory)*
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Git submission grade (`process-git-submission`) | U·**H** | P0 | điểm hợp lý, đúng rubric | ✅ |
| Google-docs submission grade | U·**H** | P1 | điểm coherent | ✅ |
| Milestone/capstone review (`review-milestone-task`) | U·**H** | P0 | rubric per-lang, không bịa | ✅ |
| AI-lab eval review (`review-ai-lab-eval`) | U·**H** | P1 | metric đúng | ✅ |

### G. CV *(AI-heavy)*
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Upload → score (`score-uploaded-cv`) | U·**H** | P1 | điểm + feedback | ✅ |
| Split from text / rewrite block / tailor blocks | U·**H** | P1 | giữ nghĩa, đúng format | ✅ |
| Generate CV (`generate-cv` + compose step) | U·**H** | P1 | output hợp lệ | ✅ |

### H. Mock Interview *(realtime + AI)*
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Start/resume session (persist BE, route sessionId) | U·E | P1 | session sống lại | |
| Turn realtime (`mock-interview.gateway` + turn svc) | U·**H** | P1 | câu hỏi hợp cảnh, coherent | ✅ |
| Grade session (`grade-mock-interview-session`) | U·**H** | P0 | rubric 6-chiều, ownership | ✅ |

### I. Flashcards
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Decks/cards CRUD | U | P2 | sortIndex, mirror vi/en | |
| Spaced-rep SM-2 + stats projections | U | P1 | interval SM-2, CDC stats | |

### J. Content-AI / RAG *(realtime + AI)*
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Content-AI chat (`content-ai.gateway`, scope-gated) | U·**H** | P0 | trả lời trong scope, **không rò** cross-scope | ✅ |
| RAG playground (`rag-playground`) | U·**H** | P1 | retrieval đúng | ✅ |
| Playground BYOM (`playground-byom`) | U | P2 | key user, isolation | ✅ |

### K. AI Lab
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Eval runner (`ai-lab-eval-runner` — đã e2e) | E·**H** | P1 | run → metric | ✅ |
| ai-lab.gateway / run / metric | U | P1 | lifecycle run | ✅ |

### L. Community & Social
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Community chat/feed/discussion (realtime) | U | P2 | broadcast, dedup | |
| Follows / reactions / community mutations | U | P2 | toggle, count | |
| Notifications (realtime + `social-digest-cron`) | U | P1 | fanout, digest | |
| Blog | U | P2 | CRUD | |

### M. Personal Project / Milestones (capstone)
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Personal-project / milestones / tasks CRUD | U | P1 | criteria, weight | |
| User-capstone projection | U | P1 | reducer, CDC | |

### N. Gamification
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| XP/level (level→XP only) | U | P0 | cộng XP idempotent (đã có `xp-history-idempotency` e2e) | |
| Streak (+ `streak-freeze-cron`) | U | P1 | freeze, reset đúng | |
| League (+ `league-reset`, cohort-points projection) | U | P1 | reset cohort | |
| Achievements (projection listener) | U | P1 | badge unlock đúng SQL | |
| Rewards / daily-quest / leaderboard | U | P2 | claim, ranking | |

### O. Headhunting / Jobs
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Job postings / headhuntings | U | P2 | list, filter | |
| Job-notifications (realtime) | U | P2 | subscribe, push | |

### P. Dashboard / Profile / Users
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Dashboard (github-style, streak, explore) | U | P2 | aggregate đúng | |
| Profile (public, edit, revoke github) | U·E | P1 | edit, visibility | |
| Users queries (198 — lớn nhất) | U | P2 | scope, privacy | |

### Q. Autocomplete / Realtime search
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Autocomplete + global-search gateway | U | P2 | suggest, debounce | ✅? |

### R. Init / Sync / CDC *(infra)*
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| CDN/Elasticsearch/Indexer synchronizer (cron) | U | P1 | sync idempotent, orphan reconcile | |
| 14 CDC projection listeners | U | P1 | mỗi reducer đúng, replay-safe | |

### S. Mail
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Send-mail worker + steps (transactional) | U | P1 | template render, retry | |

### T. AI infra (balancer) *(P0 — tim hệ AI)*
| Flow | Lane | Prio | Assert | AI |
|---|---|---|---|---|
| Key rotation / key-store | U | **P0** | round-robin, skip unhealthy | |
| classify-ai-error / retry | U | P0 | phân loại đúng, backoff | |
| Model catalog / credit-for-run | U | P0 | credit tính đúng token | |
| Entitlement (ceil/floor/climb chain) | U | P0 | tier resolve đúng | |
| Ping/health (gemini/openai/openrouter) | U | P1 | probe, latency cache | |
| AI utils (extract-json, normalize-score, resolve-chain) | U | P0 | hàm thuần | |

---

## Roll-up ưu tiên

**P0 (làm trước — tiền + đúng/sai):**
- T. AI balancer (rotation, classify-error, credit, entitlement, utils)
- B. Payment webhooks + reconcile
- C. Enroll→pay→entitlement (e2e)
- E. Challenge→judge→XP (e2e)
- F. Git-grade + milestone-review (unit + harness)
- H. Grade interview (unit + harness)
- J. Content-AI scope isolation (harness — chống rò)
- N. XP idempotent

**P1:** auth/2FA/oauth, installment, progress/projections, CV, interview turn/session, spaced-rep, notifications, sync/CDC, mail, RAG, ai-lab.

**P2:** community, blog, jobs, dashboard, users queries, autocomplete, rewards.

---

## Base code (3 lane) — dựng sẵn skeleton

### Unit — override AiInvokeService
`src/modules/tests/utils/mocks/ai-invoke.mock.ts` → `makeAiInvokeMock(text, overrides)` trả `AiRunResult` cố định. Spec: `.overrideProvider(AiInvokeService).useValue(mock)`.

### Harness — `test/harness/`
- `models.ts` — `HARNESS_TIER` + `new Anthropic()`.
- `judge.ts` — `judge(rubric, output)` structured-output → `Verdict{pass,score,reasons}`.
- `<flow>.harness.spec.ts` — chạy flow thật (AiInvoke không mock) → `judge()` → fuzzy assert.
- Override balancer: trỏ Economy/Medium/High → haiku/sonnet-low/sonnet-high.

### E2e — `apps/core/test/e2e-stack/`
- `e2e-stack.service.ts` — `E2eStackService{ up(), seed(), down(), baseUrl, provider }`. Testcontainers (pg+nats+redis+app). `vps` → smoke-only, no seed/down.
- `jest-e2e-docker.json` — globalSetup=`up()+seed()`, globalTeardown=`down()`.
- `bring-up` dùng chung với deploy compose (chỉ mượn định nghĩa stack, KHÔNG mượn seed/teardown).

---

## Phase order

| Phase | Việc | Docker? |
|---|---|---|
| **0** | Bỏ job `e2e` khỏi `.github/workflows/ci.yml` (CI = lint+build+unit) | ✗ |
| **1** | `ai-invoke.mock.ts` + unit P0 (T. balancer + utils) | ✗ |
| **2** | `E2eStackService` + `jest-e2e-docker.json` + 1 smoke local (health+auth+read) | ✅ |
| **3** | `test/harness/` (models+judge+runner) + harness F (git-grade) | ✗ |
| **4** | Unit P0 còn lại (B payment, N xp, C enroll) + e2e enroll→pay→entitlement | ✅ |
| **5** | Harness G/H/J (CV, interview, content-ai scope) + unit P1 |  |
| **6** | Quét dần P1/P2 theo roll-up | |

---

## Tiến độ

- ✅ **Phase 0** — CI unit-only (job `e2e` đã comment trong ci.yml).
- ✅ **Infra** — `ai-invoke.mock.ts`, `E2eStackService`, harness `models`/`judge`, jest configs e2e/harness, scripts. Compile sạch.
- ✅ **Batch 1** — 14 unit spec P0 (AI balancer + reconcile + xp): **14/14 xanh** (verify jest thật).
- ✅ **Vá baseline đỏ** — workflow `starci-fix-red-specs` vá 41 suite hỏng-sẵn (DI-drift). **Verify full `npm test`: 162 suite / 1030 test XANH, 0 fail.** Baseline unit giờ SẠCH.
- 🔨 **e2e/harness base code** — đã viết, compile-only. Chạy thật: `npm run test:e2e:docker` (Docker), `npm run harness` (Docker + `ant auth login`).
- ⬜ **Batch 2-6** — gen coverage MỚI cho domain còn hở (trên nền baseline đã xanh).
