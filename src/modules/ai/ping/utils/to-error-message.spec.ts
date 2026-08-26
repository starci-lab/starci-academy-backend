import {
    toPingErrorMessage,
} from "./to-error-message"

describe("toPingErrorMessage",
    () => {
        it("includes useful provider response details for nested and string bodies",
            () => {
                const error = Object.assign(
                    new Error("request failed"),
                    {
                        response: {
                            data: {
                                error: {
                                    message: "invalid key",
                                },
                            },
                        },
                    },
                )
                expect(toPingErrorMessage(error)).toContain("invalid key")
                expect(toPingErrorMessage({
                    response: {
                        data: "service unavailable",
                    },
                })).toContain("service unavailable")
            })

        it("normalizes primitive failures and truncates oversized details",
            () => {
                const result = toPingErrorMessage(42)
                expect(result).toBe("42")

                const long = toPingErrorMessage({
                    response: {
                        data: {
                            message: "x".repeat(500),
                        },
                    },
                })
                expect(long.length).toBeLessThanOrEqual(240)
            })
    })
