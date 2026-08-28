import type {
    ExecutionContext,
} from "@nestjs/common"
import type {
    ThrottlerLimitDetail,
} from "@nestjs/throttler"
import {
    ThrottlerBehindProxyGuard,
    toThrottleTracker,
} from "./throttler-behind-proxy.guard"

class ExposedThrottlerGuard extends ThrottlerBehindProxyGuard {
    fail(detail: ThrottlerLimitDetail): Promise<void> {
        return this.throwThrottlingException({
        } as ExecutionContext,
        detail)
    }
}

describe("toThrottleTracker",
    () => {
        it("keeps deployed throttling IP-only",
            () => {
                expect(toThrottleTracker({
                    ip: "127.0.0.1",
                    headers: {
                        origin: "http://rate-limited.lvh.me:3000"
                    },
                },
                "production")).toBe("127.0.0.1")
            })

        it("isolates an exact local UAT origin from sibling cases",
            () => {
                expect(toThrottleTracker({
                    ip: "127.0.0.1",
                    headers: {
                        origin: "http://rate-limited.lvh.me:3000"
                    },
                },
                "development")).toBe("127.0.0.1|rate-limited.lvh.me")
            })

        it("does not trust a lookalike suffix or malformed origin",
            () => {
                expect(toThrottleTracker({
                    ip: "127.0.0.1",
                    headers: {
                        origin: "http://rate-limited.lvh.me.example.com"
                    },
                },
                "development")).toBe("127.0.0.1")
                expect(toThrottleTracker({
                    ip: "127.0.0.1",
                    headers: {
                        origin: "not a URL"
                    },
                },
                "development")).toBe("127.0.0.1")
            })

        it("still prefers the first trusted proxy hop",
            () => {
                expect(toThrottleTracker({
                    ip: "proxy", ips: ["client",
                        "proxy"]
                },
                "development"))
                    .toBe("client")
            })
    })

describe("ThrottlerBehindProxyGuard",
    () => {
        it("throws the stable rate-limit boundary with a retry fact",
            async () => {
                const guard = Object.create(ExposedThrottlerGuard.prototype) as ExposedThrottlerGuard
                await expect(guard.fail({
                    totalHits: 11,
                    timeToExpire: 42,
                    isBlocked: true,
                    timeToBlockExpire: 28,
                    ttl: 60_000,
                    limit: 10,
                    key: "auth",
                    tracker: "reader",
                })).rejects.toMatchObject({
                    code: "RATE_LIMIT_EXCEEDED_EXCEPTION",
                    httpStatus: 429,
                    metadata: {
                        retryAfterSeconds: 28,
                    },
                })
            })
    })
