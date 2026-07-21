import Anthropic from "@anthropic-ai/sdk"

/**
 * Shared Anthropic client for the LLM-eval harness. A single instance is
 * reused across every generation/judge call so credentials (env var or an
 * `ant auth login` profile) are resolved once, not per call.
 */
export const client = new Anthropic()

/**
 * Named cost/quality tiers a harness flow can dispatch generation to.
 *
 * - `economy` — cheapest, for high-volume/low-stakes generation (Haiku 4.5).
 * - `medium`  — balanced default for most harness generation (Sonnet 5, low effort).
 * - `high`    — highest-fidelity generation, reserved for hard cases (Sonnet 5, high effort).
 *
 * Grading is a separate concern — see {@link judge} in `./judge`, which is
 * pinned to Opus 4.8 at `high` effort regardless of which tier produced the
 * output under test.
 */
export const HARNESS_TIER = {
    economy: {
        model: "claude-haiku-4-5",
    },
    medium: {
        model: "claude-sonnet-5",
        effort: "low",
    },
    high: {
        model: "claude-sonnet-5",
        effort: "high",
    },
} as const
