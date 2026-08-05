import {
    AiErrorKind,
} from "../enums/ai-error-kind"

/**
 * Pull an HTTP-ish status code off the many error shapes LangChain / provider
 * SDKs throw (`status`, `statusCode`, `response.status`, `code`).
 */
const extractStatus = (error: unknown): number | undefined => {
    if (typeof error !== "object" || error === null) {
        return undefined
    }
    const candidate = error as Record<string, unknown>
    const direct = candidate.status ?? candidate.statusCode ?? candidate.code
    if (typeof direct === "number") {
        return direct
    }
    const response = candidate.response as Record<string, unknown> | undefined
    if (response && typeof response.status === "number") {
        return response.status
    }
    return undefined
}

/**
 * Pull a `Retry-After` delay (ms) off a 429 error when the provider sent one.
 * The header is either delta-seconds (e.g. `"30"`) or an HTTP date. Returns
 * undefined when absent/unparseable so the caller falls back to a default cooldown.
 *
 * @param error - the thrown error (any shape).
 * @returns cooldown milliseconds, or undefined.
 */
export const extractRetryAfterMs = (error: unknown): number | undefined => {
    if (typeof error !== "object" || error === null) {
        return undefined
    }
    const candidate = error as Record<string, unknown>
    const response = candidate.response as Record<string, unknown> | undefined
    const headers = (candidate.headers ?? response?.headers) as
        | Record<string, unknown>
        | undefined
    if (!headers) {
        return undefined
    }
    const raw = headers["retry-after"] ?? headers["Retry-After"]
    if (raw === undefined || raw === null) {
        return undefined
    }
    const value = String(raw).trim()
    // delta-seconds form (e.g. "30")
    const seconds = Number(value)
    if (value !== "" && Number.isFinite(seconds)) {
        return Math.max(0,
            seconds * 1000)
    }
    // HTTP-date form
    const dateMs = Date.parse(value)
    if (!Number.isNaN(dateMs)) {
        return Math.max(0,
            dateMs - Date.now())
    }
    return undefined
}

/**
 * Classify a failed AI call into a rotation-relevant bucket so the balancer can
 * react correctly instead of blindly marking every failure as "key unhealthy":
 *
 * - {@link AiErrorKind.Auth} — invalid / revoked key (401/403): hard-disable it.
 * - {@link AiErrorKind.RateLimit} — 429 / quota: short cooldown, auto-recovers.
 * - {@link AiErrorKind.NonKey} — the prompt/content/abort is at fault, NOT the key
 *   (context length, content filter, malformed request, aborted, JSON parse):
 *   do NOT penalize the key and stop retrying other keys (they will fail too).
 * - {@link AiErrorKind.Transient} — everything else (5xx, network, timeout): light
 *   cooldown + try another key. The safe default for unknown errors.
 */
export const classifyAiError = (error: unknown): AiErrorKind => {
    const status = extractStatus(error)
    const message = (error instanceof Error ? error.message : String(error)).toLowerCase()

    // aborted request / our own JSON parsing — never the key's fault
    if (
        (error instanceof Error && error.name === "AbortError")
        || error instanceof SyntaxError
        || message.includes("aborted")
    ) {
        return AiErrorKind.NonKey
    }

    // invalid / revoked / unauthorized key
    if (
        status === 401
        || status === 403
        || message.includes("invalid api key")
        || message.includes("incorrect api key")
        || message.includes("invalid_api_key")
        || message.includes("unauthorized")
        || message.includes("permission denied")
    ) {
        return AiErrorKind.Auth
    }

    // rate limit / quota exhaustion — transient, recovers on its own
    if (
        status === 429
        || message.includes("rate limit")
        || message.includes("too many requests")
        || message.includes("quota")
        || message.includes("resource_exhausted")
    ) {
        return AiErrorKind.RateLimit
    }

    // bad request caused by the prompt/content, not the key
    if (
        (status === 400 || status === 422)
        && (
            message.includes("context length")
            || message.includes("maximum context")
            || message.includes("context_length")
            || message.includes("content")
            || message.includes("safety")
            || message.includes("token")
        )
    ) {
        return AiErrorKind.NonKey
    }

    // 5xx / network / timeout / unknown → transient (penalize lightly, retry next key)
    return AiErrorKind.Transient
}
