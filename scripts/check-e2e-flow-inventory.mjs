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

const flows = [
    "course-purchase",
    "course-refund",
    "course-trial",
    "installment-payment",
    "installment-default",
    "membership-purchase",
    "ai-subscription-purchase",
    "payment-idempotency",
    "payment-reconciliation",
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
console.log(`e2e flow inventory: OK (${flows.length}/${flows.length})`);
