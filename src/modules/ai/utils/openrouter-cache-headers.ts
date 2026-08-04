/** OpenRouter's sticky-routing header name. */
export const OPENROUTER_SESSION_HEADER = "x-session-id"

/** OpenRouter caps the session key at 256 characters. */
export const OPENROUTER_SESSION_ID_MAX = 256

/**
 * Build the OpenRouter header that pins follow-up requests sharing a prompt
 * prefix to the same upstream provider, so its warm prompt-cache is reused.
 *
 * A HEADER, never a body field: an unrecognised or malformed value is ignored by
 * the gateway, so this can never corrupt the request itself — the worst case is
 * a cache miss, not a failed call. Returns `undefined` (no header) when there is
 * no key, and truncates to {@link OPENROUTER_SESSION_ID_MAX} rather than letting
 * the gateway reject an over-length value.
 *
 * @param cacheSessionId - the stable grouping key (challenge id, conversation id).
 * @returns the header map, or `undefined` when there is no key.
 */
export const openRouterCacheHeaders = (
    cacheSessionId?: string,
): Record<string, string> | undefined => {
    if (!cacheSessionId) {
        return undefined
    }
    return {
        [OPENROUTER_SESSION_HEADER]: cacheSessionId.slice(
            0,
            OPENROUTER_SESSION_ID_MAX,
        ),
    }
}
