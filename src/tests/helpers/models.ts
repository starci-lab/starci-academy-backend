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
 * Claude Code OAuth token (`sk-ant-oat...`) instead of an `x-api-key`.
 */
const OAUTH_BETA = "oauth-2025-04-20"

/**
 * Resolve the Claude Code token for the harness. Prefers the
 * `CLAUDE_CODE_OAUTH_TOKEN` env var (for CI), then the gitignored
 * `.secrets/claude-code-token.txt` written by
 * `scripts/set-claude-code-token.ps1`. The raw token value is read only here,
 * at runtime -- it is never surfaced elsewhere.
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
 * Build the shared Anthropic client. A Claude Code OAuth token (`sk-ant-oat...`)
 * authenticates via `authToken` + the `oauth-2025-04-20` beta header; a plain
 * API key goes on `apiKey`; with neither present, fall back to the SDK's own
 * resolution (`ANTHROPIC_API_KEY` / an `ant auth login` profile).
 */
const buildClient = (): Anthropic => {
    const token = readClaudeCodeToken()
    // The SDK retries 429/5xx itself with exponential backoff and honours
    // `retry-after`. Two (its default) is nowhere near enough for a harness run
    // firing dozens of calls back to back, so it is raised here; the outer
    // {@link withRateLimitRetry} loop then covers the case where even that is
    // exhausted.
    const shared = {
        maxRetries: MAX_SDK_RETRIES,
    }
    if (!token) {
        return new Anthropic(shared)
    }

    if (token.startsWith("sk-ant-oat")) {
        return new Anthropic({
            ...shared,
            authToken: token,
            defaultHeaders: {
                "anthropic-beta": OAUTH_BETA,
            },
        })
    }

    return new Anthropic({
        ...shared,
        apiKey: token,
    })
}

/** How many times the Anthropic SDK itself retries a throttled request. */
const MAX_SDK_RETRIES = 10

/** How many times {@link withRateLimitRetry} re-runs a call the SDK gave up on. */
const MAX_OUTER_ATTEMPTS = 10

/** Ceiling on one backoff wait, so an exhausted quota cannot stall a run forever. */
const MAX_BACKOFF_MS = 60_000

/** Shape of the throttling errors the Anthropic SDK surfaces. */
interface ThrottleError {
    /** HTTP status, when the SDK attached one. */
    status?: number
    /** Response headers, carrying `retry-after` when the server sent it. */
    headers?: Record<string, string>
    /** The API's own error envelope. */
    error?: {
        error?: {
            /** e.g. `rate_limit_error`, `overloaded_error`. */
            type?: string
        }
    }
}

/**
 * Tail of the serialisation chain. Every Anthropic call queues behind the
 * previous one: the harness is the only client of this token, so two calls
 * firing concurrently would rate-limit nobody but themselves. `maxWorkers: 1`
 * already serialises across FILES; this serialises within one.
 */
let callChain: Promise<unknown> = Promise.resolve()

/** Run `fn` only after every previously queued call has settled. */
const serialize = <TResult>(fn: () => Promise<TResult>): Promise<TResult> => {
    const run = callChain.then(fn,
        fn)
    callChain = run.catch(() => undefined)
    return run
}

/** Whether an error is the API asking us to slow down or come back later. */
const isRetryable = (error: unknown): boolean => {
    const throttle = error as ThrottleError
    const status = throttle?.status
    const type = throttle?.error?.error?.type
    return status === 429
        || status === 529
        || (status !== undefined && status >= 500)
        || type === "rate_limit_error"
        || type === "overloaded_error"
}

/** The server's own `retry-after` in milliseconds, when it sent one. */
const retryAfterMs = (error: unknown): number | undefined => {
    const raw = (error as ThrottleError)?.headers?.["retry-after"]
    const seconds = raw === undefined ? Number.NaN : Number(raw)
    return Number.isFinite(seconds) ? seconds * 1_000 : undefined
}

const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve,
        ms))

/**
 * Run one Anthropic call, serialised against every other, retrying while the
 * API is throttling or overloaded.
 *
 * A harness verdict must reflect the MODEL's answer, not the account's quota at
 * that minute -- a run reporting "36 failed" because of `rate_limit_error` has
 * measured nothing. Waits honour the server's `retry-after` when present and
 * otherwise back off exponentially with jitter, so a burst of retries does not
 * resynchronise into another burst.
 *
 * Errors that are not throttling (a bad request, a missing credential) rethrow
 * immediately -- retrying those only hides a real defect.
 *
 * @param fn - the API call to run
 * @returns whatever `fn` resolves to
 */
export const withRateLimitRetry = async <TResult>(
    fn: () => Promise<TResult>,
): Promise<TResult> => {
    let lastError: unknown

    for (let attempt = 1; attempt <= MAX_OUTER_ATTEMPTS; attempt += 1) {
        try {
            return await serialize(fn)
        } catch (error) {
            lastError = error
            if (!isRetryable(error) || attempt === MAX_OUTER_ATTEMPTS) {
                throw error
            }
            const backoff = Math.min(MAX_BACKOFF_MS,
                2 ** attempt * 1_000)
            const jitter = Math.floor(Math.random() * 1_000)
            await sleep(retryAfterMs(error) ?? backoff + jitter)
        }
    }

    throw lastError
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
 * - `low`  -- Haiku 4.5 (cheapest, high-volume/low-stakes; Haiku takes no
 *   effort knob, so none is set).
 * - `mid`  -- Sonnet 5 at low effort (balanced default for most generation).
 * - `high` -- Opus 5 at low effort (highest-fidelity model, hard cases).
 *
 * Grading is a separate concern -- see {@link judge} in `./judge`, which is
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

    const res = await withRateLimitRetry(() => client.messages.create({
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
    }))

    return res.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("")
}
