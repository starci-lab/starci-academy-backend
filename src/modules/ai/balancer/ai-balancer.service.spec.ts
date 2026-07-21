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
import type {
    AiModelEntity,
} from "@modules/databases"
import {
    NoActiveBalancerKeyException,
} from "@modules/exceptions"
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
    AiModelCatalogService,
} from "./ai-model-catalog.service"
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
    keysFilePath: "/mnt/openai.keys",
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
        let aiModelCatalogService: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

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

            // catalog: one OpenAI model loading from the test key file
            aiModelCatalogService = {
                enabledModels: jest.fn(async () => [
                    {
                        name: "gpt-test",
                        provider: ModelProvider.OpenAI,
                        keysFilePath: "/mnt/openai.keys",
                    },
                ]),
            } as unknown as jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

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
                    {
                        provide: AiModelCatalogService,
                        useValue: aiModelCatalogService,
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

                it("propagates NoActiveBalancerKeyException when the rotator has no eligible key",
                    async () => {
                        // rotator throws when every key in the pool is disabled/cooling —
                        // acquire is a thin wrapper and must not swallow it
                        keyRotatorService.next.mockRejectedValueOnce(
                            new NoActiveBalancerKeyException({
                                provider: ModelProvider.OpenAI,
                                totalKeysCount: 1,
                            }),
                        )

                        await expect(service.acquire({
                            provider: ModelProvider.OpenAI,
                        })).rejects.toBeInstanceOf(NoActiveBalancerKeyException)
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

                it("masks long key values and stamps disabledAt from lastUsedAt when disabled",
                    async () => {
                        const longKey = buildKeyState("sk-1234567890abcdef")
                        longKey.lastUsedAt = new Date("2026-07-01T00:00:00.000Z")
                        keyStoreService.getPool.mockReturnValueOnce([
                            longKey,
                        ])
                        aiPingCacheService.getMap.mockResolvedValueOnce({
                            [ModelProvider.OpenAI]: {
                                [longKey.value]: {
                                    status: false,
                                    lastPing: new Date().toISOString(),
                                },
                            },
                        })

                        const snapshot = await service.healthSnapshot()
                        const key = snapshot.providers[0].keys[0]

                        // first 3 + last 3 chars of the raw value — never the raw value itself
                        expect(key.keyMask).toBe("sk-...def")
                        // no separate disabled-timestamp field — mirrors the key's lastUsedAt
                        expect(key.disabledAt).toEqual(longKey.lastUsedAt)
                    })
            })

        describe("modelKeyHealth",
            () => {
                it("groups keys by their source file and tags the models using it",
                    async () => {
                        const result = await service.modelKeyHealth()

                        expect(result.groups).toHaveLength(1)
                        const group = result.groups[0]
                        expect(group.provider).toBe(ModelProvider.OpenAI)
                        expect(group.keysFilePath).toBe("/mnt/openai.keys")
                        expect(group.models).toEqual([
                            "gpt-test",
                        ])
                        expect(group.totalKeys).toBe(1)
                        expect(group.activeKeys).toBe(1)
                        expect(group.keys[0].status).toBe(KeyStatus.Active)
                    })

                it("splits one provider's pool into separate groups per source file",
                    async () => {
                        const fileAKey = buildKeyState("sk-aaaa")
                        const fileBKey: KeyState = {
                            ...buildKeyState("sk-bbbb"),
                            keysFilePath: "/mnt/openai-2.keys",
                        }
                        keyStoreService.getPool.mockReturnValueOnce([
                            fileAKey,
                            fileBKey,
                        ])
                        // catalog only names a model for file A; file B has no
                        // enabled model pointing at it → its group falls back to []
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            {
                                name: "gpt-test",
                                provider: ModelProvider.OpenAI,
                                keysFilePath: "/mnt/openai.keys",
                            } as AiModelEntity,
                        ])

                        const result = await service.modelKeyHealth()

                        expect(result.groups).toHaveLength(2)
                        const byFile = new Map(
                            result.groups.map((group) => [
                                group.keysFilePath,
                                group,
                            ]),
                        )
                        expect(byFile.get("/mnt/openai.keys")?.models).toEqual([
                            "gpt-test",
                        ])
                        expect(byFile.get("/mnt/openai-2.keys")?.models).toEqual([])
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
