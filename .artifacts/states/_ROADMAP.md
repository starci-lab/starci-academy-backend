# Backend deep-scan — Phase B roadmap (2026-08-04)

30 business domains scanned read-only by 10 Sonnet agents → `.artifacts/states/<domain>/{business.md, findings.md}`.
Graded against `canon/be/`. This file is the cross-cutting synthesis; per-domain detail is in each findings.md.

## CRITICAL — production-breaking, fix first

1. **[crash] device.service.ts:52** queries `where: { userId, fingerprint }` but `userId` is a `@RelationId` (virtual, non-queryable) → `EntityPropertyNotFoundError` at runtime on EVERY real coding submission carrying a fingerprint header (the normal case), stranding an unjudged Pending row. Same class the repo fixed elsewhere 2026-06-17. → be-relationid-not-queryable.
2. **[money] Double-grant race (check-then-act)** — transactions + installment-plan finalize paths read status, compare in app code, then grant + mark Succeeded with an unconditional update. Webhook vs ReconcileTransactionWorker poll race → AI/membership double email (state ok); **installment double-applies recordPayment (non-idempotent) → corrupts installmentsPaid/remainingVnd**. The guarded pattern (updateTransactionStatusIfExpected) exists but is used only for Unpaid. Existing e2e tests only prove sequential replay.
3. **[security/revenue] flashcard isPremium never enforced** — premium card answers readable by any authenticated user; no enrollment/paywall check anywhere.
4. **[security] jobs SubcribeJobNotificationHandler** joins any client to any jobId room, returns full status/error with no userId check → cross-user job-status leak.
5. **[security/IDOR] ai-lab submitEvalChallenge + content-ai session mutations** — client-supplied enrollmentId with no ownership check; un-scoped UPDATE/DELETE keyed only on sessionId after a separate SELECT. Both are exactly `canon/be/enforce/authoring/authorization.md` §3 IDOR.

## CROSS-CUTTING PATTERNS (systemic, ranked by reach)

### A. Test coverage is the single biggest gap (test-tier, ~18 domains)
Zero unit spec: daily-quest, streak, installment-plan, rewards, kpi-reward, league, es-sync, weekly-challenge, chat, community, learner-cms, notification, activity; 12/14 projections; most flashcard + ai-lab services. **Zero `.harness-spec.ts` anywhere** — ai-lab/content-ai (LLM-judge) are the textbook lane. e2e (12 specs) covers only AiSubscription webhook grants — no e2e for installment, rewards, progress joins.

### B. Check-then-act on non-idempotent writes (business-logic/edge-case, 4 domains)
transactions #1, installment #1, daily-quest claimReward (no 23505 catch), streak-freeze cron (no lock, multi-replica double-decrement). Counter-example done right: rewards.redeem (pessimistic row lock).

### C. Authorization drift (security, 5+ domains) — the new authorization.md rule's first catches
ai-lab IDOR, content-ai un-scoped mutations, jobs cross-user leak, flashcard paywall. Founder identity re-implemented inline (`user.username === founderUsername`) in community + discussion + chat — no shared guard.

### D. Timezone day-boundary (edge-case, 3 domains)
streak/projections/kpi use bare `created_at::date`/`CURRENT_DATE` (DB session tz) while weeklyStudyDays/daily-quest cast `AT TIME ZONE 'Asia/Ho_Chi_Minh'` → the "streak day" and "platform day" disagree by up to 7h for late-night VN users. Literal `"Asia/Ho_Chi_Minh"` hardcoded 30× (no shared constant).

### E. Built-but-never-wired (business-logic, 4 domains)
streak buyStreakFreeze (complete service, no GraphQL mutation), anti-cheat suspicion fields (written, read by nothing — no reviewer surface), bloom-filter has() (no callers; real consumer reimplements inline with different case-normalization), rewards Fulfilled/Cancelled (declared states, no fulfillment/refund path for physical rewards).

### F. Missing/swallowed error handling (business-logic, 3 domains)
jobs 10/16 Enqueue*.enqueue() no .catch (job stranded Queued forever); notification digest cron swallowed try/catch; coding recordDevice no try/catch (compounds critical #1).

### G. DTO validation gaps (validation, 3+ domains)
Money DTOs (PayNextInstallmentRequest, RedeemRewardRequest — incl. unbounded shipping free-text), progress courseId — no class-validator decorators.

### H. Resolver bypasses service / DRY (naming/gate-middleware, 3 domains)
kpi-reward SetKpiTarget raw entityManager.query + clamp math in the resolver; MAX_LIMIT clamp copy-pasted 4× (learner-cms, notification, ...); several stale JSDoc/gateway "wired" claims contradict each other.

## SUGGESTED PHASE C ORDER (apply, gated per teacher)
1. Critical 1-5 above (crash, money race, 3 security) — each via starci-be-cannon-apply + an e2e/harness test proving it.
2. Pattern C (authorization) sweep — a shared founder guard + owner-in-query fixes.
3. Pattern A — stand up harness specs for ai-lab/content-ai; unit specs for the untested money domains first.
4. Patterns D-H — mechanical, batch via cannon-apply.
