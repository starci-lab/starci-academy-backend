import {
    existsSync,
} from "node:fs"
import {
    join,
} from "node:path"

/**
 * The business flows this backend promises to prove end to end.
 *
 * This list IS the inventory, not a description of one. A flow named here with no suite
 * beside it is a promise nobody keeps, and the failure is silent: the e2e lane still reports
 * green because the missing suite never ran, so the gap surfaces only when the flow breaks
 * in production.
 *
 * It lives here, in the repository that owns the suites, and not in the published lint canon.
 * The canon used to carry this check and resolved its repository root relatively. That path
 * was correct while the machines lived inside this checkout and silently wrong once they were
 * lifted into their own package, so the assertion looked for the suites in the lint repository
 * and failed on every run from that day. A machine cannot know what a consumer contains, and
 * a second consumer adopting the canon would have inherited this backend's inventory as if it
 * were its own.
 */
const CANONICAL_FLOWS = [
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
]

describe("canonical business flow inventory",
    () => {
        it("has an executable e2e suite for every canonical flow",
            () => {
                const missing = CANONICAL_FLOWS.filter(
                    (flow) => !existsSync(join(__dirname,
                        "e2e",
                        flow + ".e2e-spec.ts")),
                )
                expect(missing).toEqual([])
            })

        it("names each flow exactly once",
            () => {
                expect(CANONICAL_FLOWS).toHaveLength(new Set(CANONICAL_FLOWS).size)
            })
    })
