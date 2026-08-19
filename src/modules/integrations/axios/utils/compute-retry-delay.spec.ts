import {
    computeRetryDelayWithJitter,
} from "./compute-retry-delay"

describe("computeRetryDelayWithJitter",
    () => {
        afterEach(() => {
            jest.restoreAllMocks()
        })

        it("bounds the result to [backoff, backoff + jitterMaxMs]",
            () => {
                const baseDelayMs = 100
                const jitterMaxMs = 100
                const randomSpy = jest.spyOn(
                    Math,
                    "random"
                )

                const samples = [
                    0,
                    0.25,
                    0.5,
                    0.75,
                    0.999999,
                ]
                const retryCounts = [
                    0,
                    1,
                    2,
                    3,
                ]
                for (const retryCount of retryCounts) {
                    const backoff = baseDelayMs * 2 ** retryCount
                    for (const randomValue of samples) {
                        randomSpy.mockReturnValueOnce(randomValue)
                        const delay = computeRetryDelayWithJitter({
                            retryCount,
                            baseDelayMs,
                            jitterMaxMs,
                        })
                        expect(delay).toBeGreaterThanOrEqual(backoff)
                        expect(delay).toBeLessThanOrEqual(backoff + jitterMaxMs)
                    }
                }
            })

        it("grows exponentially with retryCount for a fixed jitter draw",
            () => {
                // pin the jitter contribution to 0 so only the backoff term varies
                jest.spyOn(
                    Math,
                    "random"
                ).mockReturnValue(0)
                const baseDelayMs = 50
                const jitterMaxMs = 50
                const retryCounts = [
                    0,
                    1,
                    2,
                    3,
                ]

                const delays = retryCounts.map((retryCount) => computeRetryDelayWithJitter({
                    retryCount,
                    baseDelayMs,
                    jitterMaxMs,
                }))

                const expectedDelays = [
                    50,
                    100,
                    200,
                    400,
                ]
                expect(delays).toEqual(expectedDelays)
            })

        it("varies across calls with the same retryCount",
            () => {
                const randomSpy = jest.spyOn(
                    Math,
                    "random"
                )
                const params = {
                    retryCount: 1,
                    baseDelayMs: 1000,
                    jitterMaxMs: 1000,
                }

                randomSpy.mockReturnValueOnce(0.1)
                const first = computeRetryDelayWithJitter(params)

                randomSpy.mockReturnValueOnce(0.9)
                const second = computeRetryDelayWithJitter(params)

                expect(first).not.toBe(second)
            })

        it("is a finite, non-negative number usable directly as a retryDelay return",
            () => {
                // DelayMilliseconds is a `number` at runtime -- axios-retry's
                // retryDelay callback can return it with no unwrapping. The
                // brand itself is a compile-time-only fence (see the invariant
                // documented on DelayMilliseconds) enforced by `tsc --noEmit`,
                // not by this runtime assertion.
                const delay = computeRetryDelayWithJitter({
                    retryCount: 0,
                    baseDelayMs: 10,
                    jitterMaxMs: 10,
                })
                const asPlainNumber: number = delay
                expect(Number.isFinite(asPlainNumber)).toBe(true)
                expect(asPlainNumber).toBeGreaterThanOrEqual(0)
            })
    })
