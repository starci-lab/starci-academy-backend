// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelsHandler,
} from "./ai-models.handler"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
import {
    UseApiService,
} from "@modules/ai/balancer/use-api.service"
import {
    AiTaskKind,
} from "@modules/ai/types/model"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"

describe("AiModelsHandler",
    () => {
        let module: TestingModule
        let handler: AiModelsHandler
        let modelCatalog: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>
        let useApiService: jest.Mocked<Pick<UseApiService, "availableProviders">>

        beforeEach(async () => {
            // the catalog is now the ONLY source for the panel: the grading chain
            // is derived from the enabled rows in the grading category, ordered by
            // the weight the balancer itself sorts on
            modelCatalog = {
                enabledModels: jest.fn(async () => [
                    {
                        name: "cheap-grader",
                        provider: "openrouter",
                        category: AiModelCategory.Medium,
                        complimentary: false,
                        weight: 3.76,
                        supportedTasks: ["grading"],
                    },
                    {
                        name: "dear-grader",
                        provider: "openrouter",
                        category: AiModelCategory.Medium,
                        complimentary: false,
                        weight: 1.67,
                        supportedTasks: ["grading"],
                    },
                    {
                        name: "chat-only",
                        provider: "openrouter",
                        category: "free",
                        complimentary: true,
                        weight: 6.71,
                        supportedTasks: ["chatting"],
                    },
                ]),
            } as unknown as jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

            // balancer: which providers currently have a healthy key (drives `available`)
            useApiService = {
                availableProviders: jest.fn(async () => new Set(["openrouter"])),
            } as unknown as jest.Mocked<Pick<UseApiService, "availableProviders">>

            module = await Test.createTestingModule({
                providers: [
                    AiModelsHandler,
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
                // ReviewCvSubmission -- milestone generation was removed)
                expect(result.models).toHaveLength(3)
                const grade = result.models.find(
                    (model) => model.taskKind === AiTaskKind.Grade,
                )
                // the chain is read off the catalog: enabled + grading-capable +
                // in the grading category, ordered by the weight the balancer sorts on
                expect(grade?.activeModel).toEqual({
                    model: "cheap-grader",
                    provider: "openrouter",
                })
                expect(grade?.fallbackChain).toEqual([
                    {
                        model: "cheap-grader",
                        provider: "openrouter",
                    },
                    {
                        model: "dear-grader",
                        provider: "openrouter",
                    },
                ])
                // the chat-only model never appears in a grading chain
                expect(grade?.fallbackChain.map((choice) => choice.model))
                    .not.toContain("chat-only")
            })

        it("projects the enabled catalog into gradable models",
            async () => {
                const result = await handler.execute()

                // the picker lists EVERY enabled model, whatever its category
                expect(result.gradableModels.map((model) => model.model)).toEqual([
                    "cheap-grader",
                    "dear-grader",
                    "chat-only",
                ])
                // openrouter is in the mocked available-providers set
                expect(result.gradableModels.every((model) => model.available)).toBe(true)
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
                // own risk (the FE flags them danger -- may grade inaccurately)
                modelCatalog.enabledModels.mockResolvedValueOnce([
                    {
                        name: "qwen/qwen-2.5-coder-32b-instruct",
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
                        model: "qwen/qwen-2.5-coder-32b-instruct",
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
