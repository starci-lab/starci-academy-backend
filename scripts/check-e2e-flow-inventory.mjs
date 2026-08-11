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
    "membership-purchase",
    "installment-plan",
    "ai-subscription-purchase",
    "payment-idempotency",
    "signup-and-signin",
    "password-reset",
    "two-factor",
    "session-lifecycle",
    "github-account-link",
    "content-progress",
    "content-ai-session",
    "challenge-submission",
    "flashcard-session",
    "mock-interview",
    "cv-build",
    "personal-project",
    "course-catalogue",
    "daily-quest",
    "rewards-redeem",
    "streak-freeze",
    "notification-delivery",
    "community-thread",
    "job-application",
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
