import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiPingCacheService,
} from "@modules/cache"
import {
    ModelProvider,
} from "@modules/databases"
import {
    NoActiveBalancerKeyException,
} from "@modules/exceptions"
import {
    createIoRedisKey,
    IoRedisInstanceKey,
} from "@modules/native"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    KeyRotatorService,
} from "./key-rotator.service"
import {
    KeyStoreService,
} from "./key-store.service"
import {
    KeyStatus,
} from "./enums/key-status"
import type {
    KeyState,
} from "./types/key-state"

/** Build a fresh Active key state with the given raw value. */
const buildKeyState = (
    value: string,
): KeyState => ({
    value,
    provider: ModelProvider.OpenAI,
    keysFilePath: "/mnt/openai.keys",
    status: KeyStatus.Active,
    keySuffix: value.slice(-4),
    failCount: 0,
    lastUsedAt: null,
    lastHealthCheckAt: null,
    disabledAt: null,
})

describe("KeyRotatorService",
    () => {
        let module: TestingModule
        let service: KeyRotatorService
        let keyStoreService: jest.Mocked<Pick<KeyStoreService, "getPool">>
        let aiPingCacheService: jest.Mocked<Pick<AiPingCacheService, "getProviderMap" | "recordKeyPicked">>
        let redis: {
            incr: jest.Mock
            del: jest.Mock
            get: jest.Mock
        }

        beforeEach(async () => {
            // pool: two healthy keys by default
            keyStoreService = {
                getPool: jest.fn(() => [
                    buildKeyState("sk-aaaa"),
                    buildKeyState("sk-bbbb"),
                ]),
            } as unknown as jest.Mocked<Pick<KeyStoreService, "getPool">>

            // ping cache: nothing recorded -> every key is eligible
            aiPingCacheService = {
                getProviderMap: jest.fn(async () => ({
                })),
                recordKeyPicked: jest.fn(async () => undefined),
            } as unknown as jest.Mocked<Pick<AiPingCacheService, "getProviderMap" | "recordKeyPicked">>

            // redis counter starts at 1 on the first INCR
            redis = {
                incr: jest.fn(async () => 1),
                del: jest.fn(async () => 1),
                get: jest.fn(async () => null),
            }

            module = await Test.createTestingModule({
                providers: [
                    KeyRotatorService,
                    {
                        provide: KeyStoreService,
                        useValue: keyStoreService,
                    },
                    {
                        provide: AiPingCacheService,
                        useValue: aiPingCacheService,
                    },
                    {
                        provide: createIoRedisKey(IoRedisInstanceKey.Cache),
                        useValue: redis,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            service = module.get<KeyRotatorService>(KeyRotatorService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("next",
            () => {
                it("prefers the eligible key with fewer recent failures",
                    async () => {
                        aiPingCacheService.getProviderMap.mockResolvedValueOnce({
                            "sk-aaaa": {
                                status: true,
                                lastPing: new Date().toISOString(),
                                failCount: 3,
                            },
                            "sk-bbbb": {
                                status: true,
                                lastPing: new Date().toISOString(),
                                failCount: 0,
                            },
                        })

                        const result = await service.next({
                            provider: ModelProvider.OpenAI,
                        })

                        // bbbb has the lower failCount -> picked
                        expect(result.state.keySuffix).toBe("bbbb")
                    })

                it("breaks failCount ties by least-recently-used",
                    async () => {
                        const older = new Date(Date.now() - 60_000).toISOString()
                        const newer = new Date().toISOString()
                        aiPingCacheService.getProviderMap.mockResolvedValueOnce({
                            "sk-aaaa": {
                                status: true,
                                lastPing: newer,
                                lastUsedAt: newer,
                            },
                            "sk-bbbb": {
                                status: true,
                                lastPing: older,
                                lastUsedAt: older,
                            },
                        })

                        const result = await service.next({
                            provider: ModelProvider.OpenAI,
                        })

                        // bbbb was used longer ago -> picked
                        expect(result.state.keySuffix).toBe("bbbb")
                    })

                it("breaks failCount and lastUsedAt ties by keySuffix (stable order)",
                    async () => {
                        // pool listed bbbb-before-aaaa on purpose: a naive "first in array"
                        // pick would return bbbb, but the tiebreak must fall through to
                        // localeCompare on keySuffix once failCount/lastUsedAt are equal.
                        keyStoreService.getPool.mockReturnValueOnce([
                            buildKeyState("sk-bbbb"),
                            buildKeyState("sk-aaaa"),
                        ])
                        const sameUsedAt = new Date().toISOString()
                        aiPingCacheService.getProviderMap.mockResolvedValueOnce({
                            "sk-aaaa": {
                                status: true,
                                lastPing: sameUsedAt,
                                lastUsedAt: sameUsedAt,
                                failCount: 0,
                            },
                            "sk-bbbb": {
                                status: true,
                                lastPing: sameUsedAt,
                                lastUsedAt: sameUsedAt,
                                failCount: 0,
                            },
                        })

                        const result = await service.next({
                            provider: ModelProvider.OpenAI,
                        })

                        // "aaaa" sorts before "bbbb" lexicographically -> deterministic tiebreak
                        expect(result.state.keySuffix).toBe("aaaa")
                    })

                it("logs the pick with provider, suffix and eligible-pool size",
                    async () => {
                        const winstonService = module.get<WinstonService>(WinstonService)

                        const result = await service.next({
                            provider: ModelProvider.OpenAI,
                        })

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.AiBalancerKeyPicked,
                            {
                                provider: ModelProvider.OpenAI,
                                keySuffix: result.state.keySuffix,
                                activeKeysCount: result.activeKeysCount,
                            },
                        )
                    })

                it("persists the pick time in Redis (shared LRU)",
                    async () => {
                        await service.next({
                            provider: ModelProvider.OpenAI,
                        })

                        expect(aiPingCacheService.recordKeyPicked).toHaveBeenCalledWith(
                            expect.objectContaining({
                                provider: ModelProvider.OpenAI,
                            }),
                        )
                    })

                it("skips keys marked unhealthy in the ping cache",
                    async () => {
                        // the first key is flagged status:false -> excluded from rotation
                        aiPingCacheService.getProviderMap.mockResolvedValueOnce({
                            "sk-aaaa": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                            },
                        })
                        redis.incr.mockResolvedValueOnce(1)

                        const result = await service.next({
                            provider: ModelProvider.OpenAI,
                        })

                        // only sk-bbbb remained eligible
                        expect(result.state.keySuffix).toBe("bbbb")
                        expect(result.activeKeysCount).toBe(1)
                    })

                it("stamps lastUsedAt on the picked key and reports the eligible count",
                    async () => {
                        redis.incr.mockResolvedValueOnce(1)

                        const result = await service.next({
                            provider: ModelProvider.OpenAI,
                        })

                        // the rotator marks the pick used and counts both eligible keys
                        expect(result.state.lastUsedAt).toBeInstanceOf(Date)
                        expect(result.activeKeysCount).toBe(2)
                    })

                it("throws when no eligible key remains in the pool",
                    async () => {
                        // both keys flagged unhealthy -> exhaustion
                        aiPingCacheService.getProviderMap.mockResolvedValueOnce({
                            "sk-aaaa": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                            },
                            "sk-bbbb": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                            },
                        })

                        await expect(
                            service.next({
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(NoActiveBalancerKeyException)
                        // no counter increment happens once the pool is empty
                        expect(redis.incr).not.toHaveBeenCalled()
                    })

                it("throws when the provider pool is empty",
                    async () => {
                        // an unloaded provider yields an empty pool
                        keyStoreService.getPool.mockReturnValueOnce([])

                        await expect(
                            service.next({
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(NoActiveBalancerKeyException)
                    })

                it("logs the exhaustion with provider and total pool size before throwing",
                    async () => {
                        const winstonService = module.get<WinstonService>(WinstonService)
                        aiPingCacheService.getProviderMap.mockResolvedValueOnce({
                            "sk-aaaa": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                            },
                            "sk-bbbb": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() + 60_000).toISOString(),
                            },
                        })

                        await expect(
                            service.next({
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(NoActiveBalancerKeyException)

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.AiBalancerNoActiveKey,
                            {
                                provider: ModelProvider.OpenAI,
                                totalKeysCount: 2,
                            },
                        )
                    })

                it("excludes a hard-disabled key even without an active cooldown",
                    async () => {
                        // `disabled` is a distinct eligibility branch from `cooldownUntil`
                        aiPingCacheService.getProviderMap.mockResolvedValueOnce({
                            "sk-aaaa": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                disabled: true,
                            },
                        })

                        const result = await service.next({
                            provider: ModelProvider.OpenAI,
                        })

                        // only sk-bbbb remained eligible
                        expect(result.state.keySuffix).toBe("bbbb")
                        expect(result.activeKeysCount).toBe(1)
                    })

                it("treats a key with an expired cooldown as eligible again",
                    async () => {
                        // cooldownUntil already in the past -> auto-recovered, not excluded
                        aiPingCacheService.getProviderMap.mockResolvedValueOnce({
                            "sk-aaaa": {
                                status: false,
                                lastPing: new Date().toISOString(),
                                cooldownUntil: new Date(Date.now() - 60_000).toISOString(),
                                failCount: 5,
                            },
                            "sk-bbbb": {
                                status: true,
                                lastPing: new Date().toISOString(),
                                failCount: 5,
                            },
                        })

                        const result = await service.next({
                            provider: ModelProvider.OpenAI,
                        })

                        // both keys eligible + tied failCount -> keySuffix tiebreak picks aaaa
                        expect(result.activeKeysCount).toBe(2)
                        expect(result.state.keySuffix).toBe("aaaa")
                    })

                it("propagates a ping-cache read failure instead of swallowing it",
                    async () => {
                        // upstream Redis outage while loading the provider's ping snapshots
                        aiPingCacheService.getProviderMap.mockRejectedValueOnce(
                            new Error("ECONNREFUSED"),
                        )

                        await expect(
                            service.next({
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toThrow("ECONNREFUSED")
                        // no pick should have been recorded once the read itself failed
                        expect(aiPingCacheService.recordKeyPicked).not.toHaveBeenCalled()
                    })

                it("propagates a failure to persist the pick instead of swallowing it",
                    async () => {
                        // the key was already chosen, but the shared-LRU write failed
                        aiPingCacheService.recordKeyPicked.mockRejectedValueOnce(
                            new Error("write failed"),
                        )

                        await expect(
                            service.next({
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toThrow("write failed")
                    })
            })

        describe("resetCounter",
            () => {
                it("deletes the per-provider Redis counter key",
                    async () => {
                        await service.resetCounter(ModelProvider.Gemini)

                        expect(redis.del).toHaveBeenCalledWith(
                            "ai_balancer:rotation:gemini",
                        )
                    })
            })

        describe("getCounter",
            () => {
                it("returns 0 when no rotation has happened yet",
                    async () => {
                        // missing Redis key -> counter is zero
                        redis.get.mockResolvedValueOnce(null)

                        expect(await service.getCounter(ModelProvider.OpenAI)).toBe(0)
                    })

                it("parses the stored numeric counter",
                    async () => {
                        // a stored string is parsed back to a number
                        redis.get.mockResolvedValueOnce("7")

                        expect(await service.getCounter(ModelProvider.OpenAI)).toBe(7)
                    })
            })

        describe("findBySuffix",
            () => {
                it("returns the key state matching the suffix",
                    () => {
                        // suffix lookup is used when reporting a previously-picked key's failure
                        const found = service.findBySuffix(
                            ModelProvider.OpenAI,
                            "bbbb",
                        )

                        expect(found?.value).toBe("sk-bbbb")
                    })

                it("returns undefined when no key matches the suffix",
                    () => {
                        // unknown suffix -> no match
                        expect(
                            service.findBySuffix(
                                ModelProvider.OpenAI,
                                "zzzz",
                            ),
                        ).toBeUndefined()
                    })
            })
    })
