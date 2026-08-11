#!/usr/bin/env node

/**
 * Refuses a backend gate when one of the canonical business-flow suites is
 * absent. The inventory comes from `.brainstorm/e2e-flow-plan.md`; keeping the
 * executable list here makes TESTING-8 (an empty/missing lane is not green)
 * survive a fresh clone where the local `.claude` directory is intentionally
 * ignored.
 */

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** User-visible business promises. One suite may contain several named steps. */
const businessFlows = [
    "course-purchase",
    "course-refund",
    "course-trial",
    "installment-payment",
    "installment-default",
    "membership-purchase",
    "ai-subscription-purchase",
    "signup-and-signin",
    "password-reset",
    "two-factor-lifecycle",
    "session-lifecycle",
    "github-account-link",
    "social-oauth-login",
    "profile-publication",
    "profile-portfolio",
    "course-discovery",
    "content-progress",
    "content-discussion",
    "content-ai-session",
    "challenge-submission",
    "coding-submission",
    "flashcard-review-session",
    "flashcard-quiz-session",
    "flashcard-due-review-session",
    "mock-interview",
    "cv-build",
    "personal-project-review",
    "personal-project-team-request",
    "playground-session",
    "rag-playground",
    "global-learning-search",
    "daily-quest",
    "weekly-challenge",
    "kpi-reward",
    "rewards-redeem",
    "streak-freeze",
    "achievement-unlock",
    "league-season",
    "notification-delivery",
    "community-thread",
    "follow-network",
    "community-chat",
    "job-posting",
    "job-application",
    "talent-discovery",
];

/**
 * Cross-component failure/concurrency promises.
 *
 * WHY this is a separate executable inventory: a happy-path business suite can
 * stay green while a retry charges twice, a fallback attributes the wrong model,
 * a socket leaks another room, or two pods drop an event. Those are not endpoint
 * variants; they are production topology promises and must not disappear during
 * a "test cleanup" merely because the corresponding happy path still exists.
 */
const operationalFlows = [
    "ai-entitlement-resilience",
    "ai-fallback-chain",
    "ai-stream-resilience",
    "auth-security-resilience",
    "background-worker-resilience",
    "dependency-health-resilience",
    "embedding-fallback-resilience",
    "payment-idempotency",
    "payment-reconciliation",
    "installment-webhook-resilience",
    "payos-webhook",
    "sepay-webhook",
    "stripe-webhook",
    "paypal-webhook",
    "nowpayments-webhook",
    "checkout-resilience",
    "refund-resilience",
    "otp-challenge-resilience",
    "refresh-token-concurrency",
    "community-chat-room-authorization",
    "community-concurrency",
    "cross-instance-event-routing",
    "mock-interview-grading-resilience",
    "payment-to-enrollment",
    "scheduler-resilience",
    "search-sync-resilience",
    "storage-video-resilience",
    "projection-cdc-routing",
    "xp-history-idempotency",
];

const flows = [
    ...businessFlows,
    ...operationalFlows,
];

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)),
    "..");
const missing = flows.filter((flow) => !existsSync(resolve(
    repositoryRoot,
    "src",
    "tests",
    "e2e",
    `${flow}.e2e-spec.ts`,
)));

assert.deepEqual(missing,
    [],
    `Missing canonical E2E flows: ${missing.join(", ")}`);
console.log(`e2e flow inventory: OK (${businessFlows.length} business + ${operationalFlows.length} operational = ${flows.length})`);
