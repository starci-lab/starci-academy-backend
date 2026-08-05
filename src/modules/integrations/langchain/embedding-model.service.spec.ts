import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    UseApiService,
} from "@modules/ai/balancer/use-api.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    EmbeddingModelService,
} from "./embedding-model.service"

/** Params shape of the mocked `useApi` call driven by `wireUseApi` below. */
interface UseApiMockParams {
    action: (ctx: unknown) => Promise<unknown>
}

/**
 * Mock the heavy LangChain embedding clients with tagged stubs so the test can
 * assert WHICH class was built + with WHAT options, without importing real
 * network/SDK code.
 */
jest.mock("@langchain/openai",
    () => ({
        OpenAIEmbeddings: jest.fn(function (
            this: Record<string, unknown>,
            opts: unknown,
        ) {
            this.__kind = "openai"
            this.opts = opts
        }),
    }))
jest.mock("@langchain/google-genai",
    () => ({
        GoogleGenerativeAIEmbeddings: jest.fn(function (
            this: Record<string, unknown>,
            opts: unknown,
        ) {
            this.__kind = "gemini"
            this.opts = opts
        }),
    }))
jest.mock("@langchain/community/embeddings/ollama",
    () => ({
        OllamaEmbeddings: jest.fn(function (
            this: Record<string, unknown>,
            opts: unknown,
        ) {
            this.__kind = "ollama"
            this.opts = opts
        }),
    }))

// NOTE: @modules/env is NOT mocked -- the real envConfig().ai.local.baseUrl
// defaults to "http://localhost:11434/v1" (OLLAMA_BASE_URL default), which is
// exactly the /v1-suffixed value these tests assert gets stripped. Mocking the
// whole module breaks other modules that read full config at load time.
const LOCAL_BASE_URL_ROOT = "http://localhost:11434"

describe("EmbeddingModelService",
    () => {
        let module: TestingModule
        let service: EmbeddingModelService
        let useApiService: jest.Mocked<Pick<UseApiService, "useApi">>
        let mountFilesystemService: jest.Mocked<Pick<MountFilesystemService, "openAiApiKeys" | "geminiApiKeys" | "localApiKeys">>

        beforeEach(async () => {
            jest.clearAllMocks()

            mountFilesystemService = {
                openAiApiKeys: jest.fn(() => [
                    "sk-openai",
                ]),
                geminiApiKeys: jest.fn(() => [
                    "sk-gemini",
                ]),
                localApiKeys: jest.fn(() => [
                    "local-token",
                ]),
            } as unknown as jest.Mocked<Pick<MountFilesystemService, "openAiApiKeys" | "geminiApiKeys" | "localApiKeys">>

            // useApi runs the supplied action against a fake context, then echoes
            // the action's result back in the standard envelope
            useApiService = {
                useApi: jest.fn(),
            } as unknown as jest.Mocked<Pick<UseApiService, "useApi">>

            module = await Test.createTestingModule({
                providers: [
                    EmbeddingModelService,
                    {
                        provide: MountFilesystemService,
                        useValue: mountFilesystemService,
                    },
                    {
                        provide: UseApiService,
                        useValue: useApiService,
                    },
                ],
            }).compile()

            service = module.get<EmbeddingModelService>(EmbeddingModelService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("get",
            () => {
                it("builds an OpenAI embedder with the first pooled key",
                    () => {
                        const embedder = service.get({
                            model: "text-embedding-3-small",
                            provider: ModelProvider.OpenAI,
                        }) as unknown as Record<string, unknown>

                        expect(embedder.__kind).toBe("openai")
                        expect(embedder.opts).toEqual({
                            model: "text-embedding-3-small",
                            apiKey: "sk-openai",
                        })
                    })

                it("falls back to an empty key when the OpenAI pool is empty",
                    () => {
                        mountFilesystemService.openAiApiKeys.mockReturnValueOnce([])

                        const embedder = service.get({
                            model: "text-embedding-3-small",
                            provider: ModelProvider.OpenAI,
                        }) as unknown as Record<string, unknown>

                        expect((embedder.opts as Record<string, unknown>).apiKey).toBe("")
                    })

                it("builds a Gemini embedder with the first pooled key",
                    () => {
                        const embedder = service.get({
                            model: "text-embedding-004",
                            provider: ModelProvider.Gemini,
                        }) as unknown as Record<string, unknown>

                        expect(embedder.__kind).toBe("gemini")
                        expect(embedder.opts).toEqual({
                            model: "text-embedding-004",
                            apiKey: "sk-gemini",
                        })
                    })

                it("builds a Local Ollama embedder with the /v1 suffix stripped from baseUrl",
                    () => {
                        const embedder = service.get({
                            model: "nomic-embed-text",
                            provider: ModelProvider.Local,
                        }) as unknown as Record<string, unknown>

                        expect(embedder.__kind).toBe("ollama")
                        expect(embedder.opts).toEqual({
                            model: "nomic-embed-text",
                            // root URL -- no /v1 (native Ollama embeddings API)
                            baseUrl: LOCAL_BASE_URL_ROOT,
                            maxConcurrency: 8,
                            // Bearer token from the pool -- the prod tunnel gate requires it
                            headers: {
                                Authorization: "Bearer local-token",
                            },
                        })
                    })

                it("throws for an unsupported provider",
                    () => {
                        expect(() => service.get({
                            model: "x",
                            provider: ModelProvider.Anthropic,
                        })).toThrow(/Unsupported embedding provider/)
                    })
            })

        describe("getViaBalancer",
            () => {
                /**
                 * Drive useApi: run the passed action against `context`, echo its
                 * result back in the standard envelope.
                 */
                const wireUseApi = (context: unknown) => {
                    useApiService.useApi.mockImplementation(
                        async ({ action }: UseApiMockParams) => ({
                            result: await action(context),
                            model: (context as { model: string }).model,
                            provider: (context as { provider: ModelProvider }).provider,
                            attempts: 1,
                        }) as never,
                    )
                }

                it("routes through the Auto lane with the Embedding task",
                    async () => {
                        wireUseApi({
                            provider: ModelProvider.Local,
                            model: "nomic-embed-text",
                        })

                        await service.getViaBalancer()

                        expect(useApiService.useApi).toHaveBeenCalledWith(
                            expect.objectContaining({
                                lane: "chain",
                                task: AiModelTask.Embedding,
                            }),
                        )
                    })

                it("builds a Local Ollama embedder (local-first) from the resolved context",
                    async () => {
                        wireUseApi({
                            provider: ModelProvider.Local,
                            model: "nomic-embed-text",
                            key: "resolved-local-token",
                        })

                        const embedder = await service.getViaBalancer() as unknown as Record<string, unknown>

                        expect(embedder.__kind).toBe("ollama")
                        expect(embedder.opts).toEqual({
                            model: "nomic-embed-text",
                            baseUrl: LOCAL_BASE_URL_ROOT,
                            maxConcurrency: 8,
                            // uses the balancer-ACQUIRED key (not the mount pool directly)
                            headers: {
                                Authorization: "Bearer resolved-local-token",
                            },
                        })
                    })

                it("builds an OpenAI embedder with the balancer-rotated key when local is down",
                    async () => {
                        wireUseApi({
                            provider: ModelProvider.OpenAI,
                            model: "text-embedding-3-small",
                            key: "sk-rotated",
                        })

                        const embedder = await service.getViaBalancer() as unknown as Record<string, unknown>

                        expect(embedder.__kind).toBe("openai")
                        expect(embedder.opts).toEqual({
                            model: "text-embedding-3-small",
                            apiKey: "sk-rotated",
                        })
                    })

                it("builds a Gemini embedder from the resolved context",
                    async () => {
                        wireUseApi({
                            provider: ModelProvider.Gemini,
                            model: "text-embedding-004",
                            key: "sk-g-rotated",
                        })

                        const embedder = await service.getViaBalancer() as unknown as Record<string, unknown>

                        expect(embedder.__kind).toBe("gemini")
                        expect(embedder.opts).toEqual({
                            model: "text-embedding-004",
                            apiKey: "sk-g-rotated",
                        })
                    })

                it("throws for a provider with no embeddings endpoint (e.g. OpenRouter)",
                    async () => {
                        wireUseApi({
                            provider: ModelProvider.OpenRouter,
                            model: "whatever",
                            key: "sk-or",
                        })

                        await expect(service.getViaBalancer())
                            .rejects.toThrow(/Unsupported embedding provider/)
                    })
            })
    })
