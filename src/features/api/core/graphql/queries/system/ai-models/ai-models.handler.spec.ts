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
} from "@modules/ai"

describe("AiModelsHandler",
    () => {
        let module: TestingModule
        let handler: AiModelsHandler
        let aiTaskModelService: jest.Mocked<Pick<AiTaskModelService, "primaryChoice" | "fallbackChain">>
        let modelCatalog: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

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

                // one active-model row per declared task kind
                expect(result.models).toHaveLength(4)
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
                    },
                ])
            })

        it("returns an empty gradable list when the catalog is empty",
            async () => {
                modelCatalog.enabledModels.mockResolvedValueOnce([])

                const result = await handler.execute()

                expect(result.gradableModels).toEqual([])
            })
    })
