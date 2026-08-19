import {
    PING_ERROR_MESSAGE_MAX_LEN,
} from "../constants/error-message"

/** The `response.data` envelope of {@link AxiosLikeProviderError}. */
interface AxiosLikeProviderErrorResponse {
    data?: unknown
}

/** Minimal axios-style error shape read for the provider response-body detail (duck-typed; not importing axios). */
interface AxiosLikeProviderError {
    response?: AxiosLikeProviderErrorResponse
}

/**
 * Pull the provider's RESPONSE BODY detail out of an axios-style error -- e.g.
 * Google's `{ error: { message: "API key not valid..." } }` or OpenAI's
 * `{ error: { message } }`. A bare axios message ("Request failed with status
 * code 400") hides the real reason; this surfaces it. Duck-typed so we don't
 * import axios. Returns null when there's no usable body.
 * @param err - Value caught from a provider ping call.
 */
const extractResponseDetail = (err: unknown): string | null => {
    if (typeof err !== "object" || err === null) {
        return null
    }
    const data = (err as AxiosLikeProviderError).response?.data
    if (data == null) {
        return null
    }
    if (typeof data === "string") {
        return data
    }
    if (typeof data !== "object") {
        return null
    }
    // { error: { message } } | { error: "..." } | { message }
    const errorField = (data as { error?: unknown }).error
    if (typeof errorField === "string") {
        return errorField
    }
    if (errorField !== null && typeof errorField === "object") {
        const nested = (errorField as { message?: unknown }).message
        if (typeof nested === "string") {
            return nested
        }
    }
    const message = (data as { message?: unknown }).message
    if (typeof message === "string") {
        return message
    }
    try {
        return JSON.stringify(data)
    } catch {
        return null
    }
}

/**
 * Normalize an unknown thrown value into a short ping error string -- including
 * the provider's response-body detail (the real reason) when present.
 * @param err - Value caught from a provider ping call.
 * @returns Truncated error message suitable for logs and key health state.
 */
export const toPingErrorMessage = (err: unknown): string => {
    const base = err instanceof Error ? err.message : String(err)
    const detail = extractResponseDetail(err)
    const full = detail && !base.includes(detail) ? `${base} — ${detail}` : base
    return full.slice(
        0,
        PING_ERROR_MESSAGE_MAX_LEN,
    )
}
