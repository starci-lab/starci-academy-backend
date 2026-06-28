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
} from "./enums"
import type {
    KeyState,
} from "./types"

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

            // ping cache: nothing recorded → every key is eligible
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

                        // bbbb has the lower failCount → picked
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

                        // bbbb was used longer ago → picked
                        expect(result.state.keySuffix).toBe("bbbb")
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
                        // the first key is flagged status:false → excluded from rotation
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
                        // both keys flagged unhealthy → exhaustion
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
                        // missing Redis key → counter is zero
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
                        // unknown suffix → no match
                        expect(
                            service.findBySuffix(
                                ModelProvider.OpenAI,
                                "zzzz",
                            ),
                        ).toBeUndefined()
                    })
            })
    })
