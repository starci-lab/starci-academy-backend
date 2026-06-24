import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    ModelProvider,
} from "@modules/databases"
import {
    AiPingService,
} from "./ai-ping.service"
import {
    OpenAiPingService,
} from "./openai-ping.service"
import {
    GeminiPingService,
} from "./gemini-ping.service"

describe("AiPingService",
    () => {
        let module: TestingModule
        let service: AiPingService
        let openAiPingService: jest.Mocked<Pick<OpenAiPingService, "ping" | "listKeys">>
        let geminiPingService: jest.Mocked<Pick<GeminiPingService, "ping" | "listKeys">>

        beforeEach(async () => {
            // each provider ping service is a thin spy returning a tagged outcome
            openAiPingService = {
                ping: jest.fn(async () => ({
                    success: true,
                    errorMessage: null,
                })),
                listKeys: jest.fn(() => [
                    "sk-openai",
                ]),
            } as unknown as jest.Mocked<Pick<OpenAiPingService, "ping" | "listKeys">>

            geminiPingService = {
                ping: jest.fn(async () => ({
                    success: true,
                    errorMessage: null,
                })),
                listKeys: jest.fn(() => [
                    "sk-gemini",
                ]),
            } as unknown as jest.Mocked<Pick<GeminiPingService, "ping" | "listKeys">>

            module = await Test.createTestingModule({
                providers: [
                    AiPingService,
                    {
                        provide: OpenAiPingService,
                        useValue: openAiPingService,
                    },
                    {
                        provide: GeminiPingService,
                        useValue: geminiPingService,
                    },
                ],
            }).compile()

            service = module.get<AiPingService>(AiPingService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("pingKey",
            () => {
                it("routes an OpenAI ping to the OpenAI ping service",
                    async () => {
                        await service.pingKey({
                            provider: ModelProvider.OpenAI,
                            key: "sk-openai",
                        })

                        expect(openAiPingService.ping).toHaveBeenCalledWith("sk-openai")
                        // sibling providers are never touched for an OpenAI request
                        expect(geminiPingService.ping).not.toHaveBeenCalled()
                    })

                it("routes a Gemini ping to the Gemini ping service",
                    async () => {
                        await service.pingKey({
                            provider: ModelProvider.Gemini,
                            key: "sk-gemini",
                        })

                        expect(geminiPingService.ping).toHaveBeenCalledWith("sk-gemini")
                    })

                it("returns a failure outcome for an unsupported provider",
                    async () => {
                        // an unknown provider short-circuits to a typed failure result
                        const result = await service.pingKey({
                            provider: "mystery" as ModelProvider,
                            key: "sk-x",
                        })

                        expect(result.success).toBe(false)
                        expect(result.errorMessage).toContain("unsupported provider")
                    })
            })

        describe("listKeysForProvider",
            () => {
                it("delegates to the matching provider's listKeys",
                    () => {
                        expect(service.listKeysForProvider(ModelProvider.Gemini)).toEqual([
                            "sk-gemini",
                        ])
                        expect(geminiPingService.listKeys).toHaveBeenCalledTimes(1)
                    })

                it("returns an empty list for an unsupported provider",
                    () => {
                        // an unknown provider has no key source
                        expect(
                            service.listKeysForProvider("mystery" as ModelProvider),
                        ).toEqual([])
                    })
            })
    })
