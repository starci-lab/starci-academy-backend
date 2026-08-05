import {
    existsSync,
    readFileSync,
} from "node:fs"
import {
    join,
} from "node:path"
import Anthropic from "@anthropic-ai/sdk"

/**
 * Beta header the Anthropic API requires when a request authenticates with a
 * Claude Code OAuth token (`sk-ant-oat…`) instead of an `x-api-key`.
 */
const OAUTH_BETA = "oauth-2025-04-20"

/**
 * Resolve the Claude Code token for the harness. Prefers the
 * `CLAUDE_CODE_OAUTH_TOKEN` env var (for CI), then the gitignored
 * `.secrets/claude-code-token.txt` written by
 * `scripts/set-claude-code-token.ps1`. The raw token value is read only here,
 * at runtime — it is never surfaced elsewhere.
 */
const readClaudeCodeToken = (): string | undefined => {
    const fromEnv = process.env.CLAUDE_CODE_OAUTH_TOKEN?.trim()
    if (fromEnv) {
        return fromEnv
    }

    const file = join(process.cwd(),
        ".secrets",
        "claude-code-token.txt")
    if (existsSync(file)) {
        const fromFile = readFileSync(file,
            "utf8").trim()
        if (fromFile) {
            return fromFile
        }
    }

    return undefined
}

/**
 * Build the shared Anthropic client. A Claude Code OAuth token (`sk-ant-oat…`)
 * authenticates via `authToken` + the `oauth-2025-04-20` beta header; a plain
 * API key goes on `apiKey`; with neither present, fall back to the SDK's own
 * resolution (`ANTHROPIC_API_KEY` / an `ant auth login` profile).
 */
const buildClient = (): Anthropic => {
    const token = readClaudeCodeToken()
    if (!token) {
        return new Anthropic()
    }

    if (token.startsWith("sk-ant-oat")) {
        return new Anthropic({
            authToken: token,
            defaultHeaders: {
                "anthropic-beta": OAUTH_BETA,
            },
        })
    }

    return new Anthropic({
        apiKey: token,
    })
}

/**
 * Shared Anthropic client for the LLM-eval harness. A single instance is
 * reused across every generation/judge call so credentials are resolved once,
 * not per call.
 */
export const client = buildClient()

/** Reasoning-effort levels accepted by `output_config.effort`. */
export type Effort = "low" | "medium" | "high" | "xhigh" | "max"

/** One cost/quality tier: a model id plus an optional reasoning effort. */
export interface Tier {
    model: string
    effort?: Effort
}

/**
 * Named cost/quality tiers a harness flow dispatches generation to:
 *
 * - `low`  — Haiku 4.5 (cheapest, high-volume/low-stakes; Haiku takes no
 *   effort knob, so none is set).
 * - `mid`  — Sonnet 5 at low effort (balanced default for most generation).
 * - `high` — Opus 5 at low effort (highest-fidelity model, hard cases).
 *
 * Grading is a separate concern — see {@link judge} in `./judge`, which is
 * pinned to Opus 4.8 at `high` effort regardless of which tier produced the
 * output under test, so grading rigor never varies with the SUT's cost tier.
 */
export const HARNESS_TIER = {
    low: {
        model: "claude-haiku-4-5",
    },
    mid: {
        model: "claude-sonnet-5",
        effort: "low",
    },
    high: {
        model: "claude-opus-5",
        effort: "low",
    },
} satisfies Record<string, Tier>

/** Name of a {@link HARNESS_TIER} entry (`low` | `mid` | `high`). */
export type HarnessTierName = keyof typeof HARNESS_TIER

/**
 * Run one generation through a named {@link HARNESS_TIER} and return its
 * concatenated text output. `system` is optional; `output_config.effort` is
 * applied only for tiers that set an effort.
 *
 * @param tier - which cost/quality tier to dispatch to
 * @param input - the user `prompt` and an optional `system` prompt
 * @returns the model's text response, blocks joined
 */
export const generate = async (
    tier: HarnessTierName,
    input: {
        prompt: string
        system?: string
    },
): Promise<string> => {
    const config: Tier = HARNESS_TIER[tier]

    const res = await client.messages.create({
        model: config.model,
        max_tokens: 2048,
        ...(config.effort
            ? {
                output_config: {
                    effort: config.effort,
                },
            }
            : {
            }),
        ...(input.system
            ? {
                system: input.system,
            }
            : {
            }),
        messages: [
            {
                role: "user",
                content: input.prompt,
            },
        ],
    })

    return res.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("")
}
