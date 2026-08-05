import {
    AiErrorKind,
} from "../enums/ai-error-kind"
import {
    classifyAiError,
    extractRetryAfterMs,
} from "./classify-ai-error"

/** Build an Error carrying an arbitrary `status` (mimics provider SDK errors). */
const withStatus = (message: string, status: number): Error => {
    const error = new Error(message) as Error & { status: number }
    error.status = status
    return error
}

describe("classifyAiError",
    () => {
        describe("Auth",
            () => {
                it("classifies 401 / 403 as Auth",
                    () => {
                        expect(classifyAiError(withStatus("nope",
                            401))).toBe(AiErrorKind.Auth)
                        expect(classifyAiError(withStatus("nope",
                            403))).toBe(AiErrorKind.Auth)
                    })
                it("classifies invalid-api-key messages as Auth",
                    () => {
                        expect(classifyAiError(new Error("Incorrect API key provided"))).toBe(AiErrorKind.Auth)
                        expect(classifyAiError(new Error("invalid_api_key"))).toBe(AiErrorKind.Auth)
                        // space-separated phrasing ("invalid api key") is a distinct
                        // substring from the underscore form above -- both must match.
                        expect(classifyAiError(new Error("Invalid API key supplied"))).toBe(AiErrorKind.Auth)
                    })
                it("classifies unauthorized / permission-denied messages as Auth",
                    () => {
                        expect(classifyAiError(new Error("Unauthorized"))).toBe(AiErrorKind.Auth)
                        expect(classifyAiError(new Error("Permission denied for this resource"))).toBe(AiErrorKind.Auth)
                    })
                it("reads status off nested response.status / statusCode / code shapes",
                    () => {
                        // extractStatus() is internal -- exercised only through classifyAiError,
                        // which is the only exported surface that consumes it.
                        expect(classifyAiError({
                            response: {
                                status: 401,
                            },
                        })).toBe(AiErrorKind.Auth)
                        expect(classifyAiError({
                            statusCode: 403,
                        })).toBe(AiErrorKind.Auth)
                        expect(classifyAiError({
                            code: 401,
                        })).toBe(AiErrorKind.Auth)
                    })
            })

        describe("RateLimit",
            () => {
                it("classifies 429 as RateLimit",
                    () => {
                        expect(classifyAiError(withStatus("slow down",
                            429))).toBe(AiErrorKind.RateLimit)
                    })
                it("classifies rate-limit / quota messages as RateLimit",
                    () => {
                        expect(classifyAiError(new Error("Rate limit reached"))).toBe(AiErrorKind.RateLimit)
                        expect(classifyAiError(new Error("RESOURCE_EXHAUSTED"))).toBe(AiErrorKind.RateLimit)
                    })
                it("classifies 'too many requests' as RateLimit",
                    () => {
                        expect(classifyAiError(new Error("Too Many Requests"))).toBe(AiErrorKind.RateLimit)
                    })
            })

        describe("NonKey",
            () => {
                it("classifies aborts + JSON parse as NonKey",
                    () => {
                        const aborted = new Error("The operation was aborted")
                        aborted.name = "AbortError"
                        expect(classifyAiError(aborted)).toBe(AiErrorKind.NonKey)
                        expect(classifyAiError(new SyntaxError("Unexpected token"))).toBe(AiErrorKind.NonKey)
                    })
                it("classifies a plain 'aborted' message as NonKey even without the AbortError name",
                    () => {
                        // some SDKs surface cancellation as a generic Error whose message
                        // mentions "aborted" but whose `.name` stays "Error" -- the message
                        // substring check must catch this independently of the name check.
                        expect(classifyAiError(new Error("request aborted by caller"))).toBe(AiErrorKind.NonKey)
                    })
                it("classifies a 400 context-length / content error as NonKey",
                    () => {
                        expect(classifyAiError(withStatus("maximum context length exceeded",
                            400))).toBe(AiErrorKind.NonKey)
                        expect(classifyAiError(withStatus("blocked by content safety",
                            400))).toBe(AiErrorKind.NonKey)
                    })
                it("classifies a 422 token error as NonKey too — not just 400",
                    () => {
                        expect(classifyAiError(withStatus("token limit exceeded",
                            422))).toBe(AiErrorKind.NonKey)
                    })
                it("classifies a 400 with no matching content keyword as Transient, not NonKey",
                    () => {
                        // status 400/422 alone is not enough -- the message must also point
                        // at the prompt/content, otherwise it falls to the safe default.
                        expect(classifyAiError(withStatus("generic bad request",
                            400))).toBe(AiErrorKind.Transient)
                    })
            })

        describe("Transient (default)",
            () => {
                it("classifies 5xx + network errors as Transient",
                    () => {
                        expect(classifyAiError(withStatus("bad gateway",
                            502))).toBe(AiErrorKind.Transient)
                        expect(classifyAiError(new Error("ECONNRESET"))).toBe(AiErrorKind.Transient)
                    })
                it("defaults unknown errors to Transient",
                    () => {
                        expect(classifyAiError(new Error("something weird"))).toBe(AiErrorKind.Transient)
                        expect(classifyAiError("a string")).toBe(AiErrorKind.Transient)
                    })
                // the AI_INVOKE_TIMEOUT_MS hard timeout throws THIS message (not an
                // AbortError) on purpose -> Transient -> balancer climbs to the next model.
                // Contrast with the AbortError test above (user-cancel -> NonKey -> stop).
                it("classifies our hard-timeout as Transient → next model in the chain",
                    () => {
                        expect(classifyAiError(new Error("AI invoke timed out after 75000ms")))
                            .toBe(AiErrorKind.Transient)
                        expect(classifyAiError(new Error("AI stream timed out after 75000ms")))
                            .toBe(AiErrorKind.Transient)
                    })
            })
    })

describe("extractRetryAfterMs",
    () => {
        it("parses delta-seconds from headers['retry-after']",
            () => {
                const error = Object.assign(new Error("429"),
                    {
                        headers: {
                            "retry-after": "30" 
                        },
                    })
                expect(extractRetryAfterMs(error)).toBe(30_000)
            })

        it("reads the header off error.response.headers too",
            () => {
                const error = Object.assign(new Error("429"),
                    {
                        response: {
                            headers: {
                                "retry-after": "5" 
                            } 
                        },
                    })
                expect(extractRetryAfterMs(error)).toBe(5_000)
            })

        it("returns undefined when no Retry-After header is present",
            () => {
                expect(extractRetryAfterMs(new Error("429"))).toBeUndefined()
                expect(extractRetryAfterMs("nope")).toBeUndefined()
            })

        it("returns undefined when a headers object exists but omits retry-after",
            () => {
                // distinct branch from the "no headers object at all" case above --
                // here `headers` is truthy but neither key is present, so `raw` is undefined.
                const error = Object.assign(new Error("429"),
                    {
                        headers: {
                            "content-type": "application/json"
                        },
                    })
                expect(extractRetryAfterMs(error)).toBeUndefined()
            })

        it("reads a capitalized 'Retry-After' header key too",
            () => {
                const error = Object.assign(new Error("429"),
                    {
                        headers: {
                            "Retry-After": "5"
                        },
                    })
                expect(extractRetryAfterMs(error)).toBe(5_000)
            })

        it("parses an HTTP-date Retry-After into a non-negative millisecond delta",
            () => {
                const future = new Date(Date.now() + 5000).toUTCString()
                const error = Object.assign(new Error("429"),
                    {
                        headers: {
                            "retry-after": future
                        },
                    })
                const ms = extractRetryAfterMs(error)
                // Date.now() inside the SUT runs slightly after this fixture was built,
                // so assert an honest window instead of pinning an exact millisecond count.
                expect(ms).toBeGreaterThan(0)
                expect(ms).toBeLessThanOrEqual(6000)
            })

        it("clamps a past HTTP-date Retry-After to zero instead of a negative delta",
            () => {
                const past = new Date(Date.now() - 60_000).toUTCString()
                const error = Object.assign(new Error("429"),
                    {
                        headers: {
                            "retry-after": past
                        },
                    })
                expect(extractRetryAfterMs(error)).toBe(0)
            })

        it("returns undefined for an unparseable Retry-After value",
            () => {
                const error = Object.assign(new Error("429"),
                    {
                        headers: {
                            "retry-after": "not-a-date"
                        },
                    })
                expect(extractRetryAfterMs(error)).toBeUndefined()
            })
    })
