// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelsHandler,
} from "./ai-models.handler"
import {
    AiModelCatalogService,
    AiTaskKind,
    AiTaskModelService,
    UseApiService,
} from "@modules/ai"

describe("AiModelsHandler",
    () => {
        let module: TestingModule
        let handler: AiModelsHandler
        let aiTaskModelService: jest.Mocked<Pick<AiTaskModelService, "primaryChoice" | "fallbackChain">>
        let modelCatalog: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>
        let useApiService: jest.Mocked<Pick<UseApiService, "availableProviders">>

        beforeEach(async () => {
            // task-model service: deterministic primary + fallback per task kind
            aiTaskModelService = {
                primaryChoice: jest.fn((taskKind: AiTaskKind) => `primary-${taskKind}`),
                fallbackChain: jest.fn((taskKind: AiTaskKind) => [
                    `primary-${taskKind}`,
                    `fallback-${taskKind}`,
                ]),
            } as unknown as jest.Mocked<Pick<AiTaskModelService, "primaryChoice" | "fallbackChain">>

            // catalog returns one enabled model the handler projects into a gradable model
            modelCatalog = {
                enabledModels: jest.fn(async () => [
                    {
                        name: "gpt-4o",
                        provider: "openai",
                        category: "premium",
                        complimentary: false,
                    },
                ]),
            } as unknown as jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

            // balancer: which providers currently have a healthy key (drives `available`)
            useApiService = {
                availableProviders: jest.fn(async () => new Set(["openai"])),
            } as unknown as jest.Mocked<Pick<UseApiService, "availableProviders">>

            module = await Test.createTestingModule({
                providers: [
                    AiModelsHandler,
                    {
                        provide: AiTaskModelService,
                        useValue: aiTaskModelService,
                    },
                    {
                        provide: AiModelCatalogService,
                        useValue: modelCatalog,
                    },
                    {
                        provide: UseApiService,
                        useValue: useApiService,
                    },
                ],
            }).compile()

            handler = module.get<AiModelsHandler>(AiModelsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("builds the active-model rows for every task kind",
            async () => {
                const result = await handler.execute()

                // one active-model row per declared task kind (Grade, ReviewPersonalProject,
                // ReviewCvSubmission — milestone generation was removed)
                expect(result.models).toHaveLength(3)
                const grade = result.models.find(
                    (model) => model.taskKind === AiTaskKind.Grade,
                )
                expect(grade?.activeModel).toBe(`primary-${AiTaskKind.Grade}`)
                expect(grade?.fallbackChain).toEqual([
                    `primary-${AiTaskKind.Grade}`,
                    `fallback-${AiTaskKind.Grade}`,
                ])
            })

        it("projects the enabled catalog into gradable models",
            async () => {
                const result = await handler.execute()

                expect(result.gradableModels).toEqual([
                    {
                        model: "gpt-4o",
                        provider: "openai",
                        category: "premium",
                        complimentary: false,
                        // openai is in the mocked available-providers set
                        available: true,
                    },
                ])
            })

        it("returns an empty gradable list when the catalog is empty",
            async () => {
                modelCatalog.enabledModels.mockResolvedValueOnce([])

                const result = await handler.execute()

                expect(result.gradableModels).toEqual([])
            })

        it("includes Free models in the gradable list (shown flagged danger, not hidden)",
            async () => {
                // Free models stay in the picker so a learner can pick one at their
                // own risk (the FE flags them danger — may grade inaccurately)
                modelCatalog.enabledModels.mockResolvedValueOnce([
                    {
                        name: "qwen/qwen-2.5-coder-14b-instruct",
                        provider: "openrouter",
                        category: "free",
                        complimentary: true,
                    },
                    {
                        name: "gpt-4o",
                        provider: "openai",
                        category: "premium",
                        complimentary: false,
                    },
                ] as unknown as Awaited<ReturnType<AiModelCatalogService["enabledModels"]>>)
                // both providers have a healthy key for this case
                useApiService.availableProviders.mockResolvedValueOnce(
                    new Set(["openrouter",
                        "openai"]),
                )

                const result = await handler.execute()

                expect(result.gradableModels).toEqual([
                    {
                        model: "qwen/qwen-2.5-coder-14b-instruct",
                        provider: "openrouter",
                        category: "free",
                        complimentary: true,
                        available: true,
                    },
                    {
                        model: "gpt-4o",
                        provider: "openai",
                        category: "premium",
                        complimentary: false,
                        available: true,
                    },
                ])
            })
    })
