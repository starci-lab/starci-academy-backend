import {
    generateOrderCode,
} from "./order-code"

/** PayOS and SePay both refuse an order code above this. */
const GATEWAY_MAX_ORDER_CODE = Number.MAX_SAFE_INTEGER

describe("generateOrderCode",
    () => {
        it("returns a positive integer the gateways will accept",
            () => {
                const code = generateOrderCode()
                expect(Number.isSafeInteger(code)).toBe(true)
                expect(code).toBeGreaterThan(0)
                expect(code).toBeLessThanOrEqual(GATEWAY_MAX_ORDER_CODE)
            })

        it("stays under the gateway ceiling for a clock decades ahead",
            () => {
                const year2054 = Date.UTC(2054,
                    0,
                    1)
                const spy = jest.spyOn(Date,
                    "now").mockReturnValue(year2054)
                try {
                    expect(generateOrderCode()).toBeLessThanOrEqual(GATEWAY_MAX_ORDER_CODE)
                } finally {
                    spy.mockRestore()
                }
            })

        /*
     * The point of the change: two orders created in the same millisecond used to collide once in a
     * thousand, and the code doubles as `referenceId`, so a collision reconciles one order's payment
     * against the other order's transaction. Freezing the clock is what makes that measurable --
     * without it the timestamp alone would separate the codes and the test would prove nothing.
     */
        it("separates codes drawn within a single frozen millisecond",
            () => {
                const spy = jest.spyOn(Date,
                    "now").mockReturnValue(Date.UTC(2026,
                    5,
                    1))
                try {
                    const codes = new Set(Array.from({
                        length: 200 
                    },
                    () => generateOrderCode()))
                    expect(codes.size).toBeGreaterThan(190)
                } finally {
                    spy.mockRestore()
                }
            })

        it("advances with the clock, so later orders sort after earlier ones",
            () => {
                const spy = jest.spyOn(Date,
                    "now")
                try {
                    spy.mockReturnValue(Date.UTC(2026,
                        5,
                        1))
                    const earlier = generateOrderCode()
                    spy.mockReturnValue(Date.UTC(2026,
                        5,
                        2))
                    expect(generateOrderCode()).toBeGreaterThan(earlier)
                } finally {
                    spy.mockRestore()
                }
            })
    })
