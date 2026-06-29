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
                it("classifies a 400 context-length / content error as NonKey",
                    () => {
                        expect(classifyAiError(withStatus("maximum context length exceeded",
                            400))).toBe(AiErrorKind.NonKey)
                        expect(classifyAiError(withStatus("blocked by content safety",
                            400))).toBe(AiErrorKind.NonKey)
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
                // AbortError) on purpose → Transient → balancer climbs to the next model.
                // Contrast with the AbortError test above (user-cancel → NonKey → stop).
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
    })
