import type {
    Redis,
} from "ioredis"
import type {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import type {
    ExchangeRefreshTokenResult,
} from "./types"
import {
    RefreshTokenCoalescerService,
} from "./refresh-token-coalescer.service"

interface Deferred<T> {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason: unknown) => void
}

const deferred = <T>(): Deferred<T> => {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<T>((onResolve, onReject) => {
        resolve = onResolve
        reject = onReject
    })
    return {
        promise,
        resolve,
        reject,
    }
}

class MemoryRedis {
    private readonly values = new Map<string, string>()

    async get(key: string): Promise<string | null> {
        return this.values.get(key) ?? null
    }

    async exists(key: string): Promise<number> {
        return this.values.has(key) ? 1 : 0
    }

    async set(key: string, value: string, ...args: Array<unknown>): Promise<"OK" | null> {
        if (args.includes("NX") && this.values.has(key)) {
            return null
        }
        this.values.set(key,
            value)
        return "OK"
    }

    async eval(_script: string, _keyCount: number, key: string, owner: string): Promise<number> {
        if (this.values.get(key) !== owner) {
            return 0
        }
        this.values.delete(key)
        return 1
    }
}

const tokenSet = (sequence: number): ExchangeRefreshTokenResult => ({
    access_token: `access-${sequence}`,
    refresh_token: `refresh-${sequence}`,
    expires_in: 300,
    scope: "openid",
    token_type: "Bearer",
    session_state: `session-${sequence}`,
})

describe("RefreshTokenCoalescerService",
    () => {
        let redis: MemoryRedis
        let exchange: jest.Mock
        let service: RefreshTokenCoalescerService

        beforeEach(() => {
            redis = new MemoryRedis()
            exchange = jest.fn()
            service = new RefreshTokenCoalescerService(
                redis as unknown as Redis,
                {
                    exchangeRefreshTokenForToken: exchange,
                } as unknown as KeycloakTokenService,
            )
        })

        it("publishes one exchange result to every concurrent caller",
            async () => {
                const provider = deferred<ExchangeRefreshTokenResult>()
                exchange.mockReturnValue(provider.promise)

                const requests = Array.from({
                    length: 8,
                },
                () => service.exchange({
                    refreshToken: "same-old-token",
                }))
                provider.resolve(tokenSet(2))

                await expect(Promise.all(requests)).resolves.toEqual(
                    Array.from({
                        length: 8,
                    },
                    () => tokenSet(2)),
                )
                expect(exchange).toHaveBeenCalledTimes(1)
            })

        it("elects a new leader after the first leader fails",
            async () => {
                const firstAttempt = deferred<ExchangeRefreshTokenResult>()
                exchange
                    .mockReturnValueOnce(firstAttempt.promise)
                    .mockResolvedValueOnce(tokenSet(3))

                const leader = service.exchange({
                    refreshToken: "recoverable-token",
                })
                const follower = service.exchange({
                    refreshToken: "recoverable-token",
                })
                firstAttempt.reject(new Error("keycloak unavailable"))

                await expect(leader).rejects.toThrow("keycloak unavailable")
                await expect(follower).resolves.toEqual(tokenSet(3))
                expect(exchange).toHaveBeenCalledTimes(2)
            })
    })
