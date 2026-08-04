import {
    OPENROUTER_SESSION_HEADER,
    OPENROUTER_SESSION_ID_MAX,
    openRouterCacheHeaders,
} from "./openrouter-cache-headers"

describe("openRouterCacheHeaders",
    () => {
        it("emits the x-session-id header for a stable key",
            () => {
                expect(openRouterCacheHeaders("challenge-42")).toEqual({
                    [OPENROUTER_SESSION_HEADER]: "challenge-42",
                })
            })

        it("emits no header when there is no key — routing falls back to hashing",
            () => {
                expect(openRouterCacheHeaders(undefined)).toBeUndefined()
                expect(openRouterCacheHeaders("")).toBeUndefined()
            })

        it("truncates an over-length key to the gateway's 256-char cap",
            () => {
                const long = "x".repeat(OPENROUTER_SESSION_ID_MAX + 50)
                const header = openRouterCacheHeaders(long)?.[OPENROUTER_SESSION_HEADER]
                expect(header).toHaveLength(OPENROUTER_SESSION_ID_MAX)
            })

        it("keys two submissions of the same challenge to the same header — the whole point",
            () => {
                // different submissions, same challenge id → identical routing key, so
                // both hit the same provider and reuse the cached rubric prefix
                const first = openRouterCacheHeaders("challenge-42")
                const second = openRouterCacheHeaders("challenge-42")
                expect(first).toEqual(second)
            })
    })
