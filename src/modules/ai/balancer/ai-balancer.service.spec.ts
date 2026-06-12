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
    AiBalancerService,
} from "./ai-balancer.service"
import {
    KeyStoreService,
} from "./key-store.service"
import {
    KeyRotatorService,
} from "./key-rotator.service"
import {
    KeyStatus,
} from "./enums"
import type {
    KeyState,
} from "./types"

/** Build an Active key state with the given raw value. */
const buildKeyState = (
    value: string,
): KeyState => ({
    value,
    provider: ModelProvider.OpenAI,
    status: KeyStatus.Active,
    keySuffix: value.slice(-4),
    failCount: 0,
    lastUsedAt: null,
    lastHealthCheckAt: null,
    disabledAt: null,
})

describe("AiBalancerService",
    () => {
        let module: TestingModule
        let service: AiBalancerService
        let keyStoreService: jest.Mocked<
            Pick<KeyStoreService, "listProviders" | "getPool" | "reloadAll">
        >
        let keyRotatorService: jest.Mocked<Pick<KeyRotatorService, "next">>
        let aiPingCacheService: jest.Mocked<Pick<AiPingCacheService, "getMap">>

        beforeEach(async () => {
            // store: one OpenAI provider with a single key
            keyStoreService = {
                listProviders: jest.fn(() => [
                    {
                        provider: ModelProvider.OpenAI,
                        keysFilePath: "/mnt/openai.keys",
                    },
                ]),
                getPool: jest.fn(() => [
                    buildKeyState("sk-aaaa"),
                ]),
                reloadAll: jest.fn(async () => undefined),
            } as unknown as jest.Mocked<
                Pick<KeyStoreService, "listProviders" | "getPool" | "reloadAll">
            >

            // rotator: hand back a picked key reference
            keyRotatorService = {
                next: jest.fn(async () => ({
                    state: buildKeyState("sk-aaaa"),
                    activeKeysCount: 1,
                })),
            } as unknown as jest.Mocked<Pick<KeyRotatorService, "next">>

            // cache: nothing recorded by default
            aiPingCacheService = {
                getMap: jest.fn(async () => ({
                })),
            } as unknown as jest.Mocked<Pick<AiPingCacheService, "getMap">>

            module = await Test.createTestingModule({
                providers: [
                    AiBalancerService,
                    {
                        provide: KeyStoreService,
                        useValue: keyStoreService,
                    },
                    {
                        provide: KeyRotatorService,
                        useValue: keyRotatorService,
                    },
                    {
                        provide: AiPingCacheService,
                        useValue: aiPingCacheService,
                    },
                ],
            }).compile()

            service = module.get<AiBalancerService>(AiBalancerService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("acquire",
            () => {
                it("returns the rotated key value plus an opaque handle",
                    async () => {
                        const result = await service.acquire({
                            provider: ModelProvider.OpenAI,
                        })

                        // the raw value rides through; the handle masks it to a suffix
                        expect(result.value).toBe("sk-aaaa")
                        expect(result.handle).toEqual({
                            provider: ModelProvider.OpenAI,
                            keySuffix: "aaaa",
                        })
                        expect(keyRotatorService.next).toHaveBeenCalledWith({
                            provider: ModelProvider.OpenAI,
                        })
                    })
            })

        describe("healthSnapshot",
            () => {
                it("marks a key Active when the ping cache has no negative entry",
                    async () => {
                        // empty cache → every key is treated healthy
                        const snapshot = await service.healthSnapshot()

                        const provider = snapshot.providers[0]
                        expect(provider.provider).toBe(ModelProvider.OpenAI)
                        expect(provider.totalKeys).toBe(1)
                        expect(provider.activeKeys).toBe(1)
                        expect(provider.disabledKeys).toBe(0)
                        expect(provider.keys[0].status).toBe(KeyStatus.Active)
                    })

                it("marks a key Disabled when its cached ping reports failure",
                    async () => {
                        // the key is flagged status:false in the ping cache
                        aiPingCacheService.getMap.mockResolvedValueOnce({
                            [ModelProvider.OpenAI]: {
                                "sk-aaaa": {
                                    status: false,
                                    lastPing: new Date().toISOString(),
                                },
                            },
                        })

                        const snapshot = await service.healthSnapshot()
                        const provider = snapshot.providers[0]

                        expect(provider.activeKeys).toBe(0)
                        expect(provider.disabledKeys).toBe(1)
                        expect(provider.keys[0].status).toBe(KeyStatus.Disabled)
                        // a failed ping is surfaced as a non-zero fail count
                        expect(provider.keys[0].failCount).toBe(1)
                    })
            })

        describe("reload",
            () => {
                it("delegates to the key store's full reload",
                    async () => {
                        await service.reload()

                        expect(keyStoreService.reloadAll).toHaveBeenCalledTimes(1)
                    })
            })
    })
