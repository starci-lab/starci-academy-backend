import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    ModelProvider,
} from "@modules/databases"
import {
    AiTaskModelService,
} from "./ai-task-model.service"
import {
    AiTaskKind,
} from "./types"

describe("AiTaskModelService",
    () => {
        let module: TestingModule
        let service: AiTaskModelService

        beforeEach(async () => {
            module = await Test.createTestingModule({
                providers: [
                    AiTaskModelService,
                ],
            }).compile()

            service = module.get<AiTaskModelService>(AiTaskModelService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("fallbackChain",
            () => {
                it("returns the low-tier chain for grading (default env tier)",
                    () => {
                        // default AI_MODEL_RECOMMENDATION is "low" → local Qwen primary,
                        // then the economy cloud fallback chain
                        const chain = service.fallbackChain(AiTaskKind.Grade)

                        expect(chain).toEqual([
                            {
                                model: "qwen2.5-coder:7b",
                                provider: ModelProvider.Local,
                            },
                            {
                                model: "gpt-5.4-nano",
                                provider: ModelProvider.OpenAI,
                            },
                            {
                                model: "gemini-2.5-flash-lite",
                                provider: ModelProvider.Gemini,
                            },
                        ])
                    })

                it("returns a distinct chain for milestone generation",
                    () => {
                        // milestone low-tier leads with Gemini Flash-Lite, not OpenAI
                        const chain = service.fallbackChain(AiTaskKind.GenerateMilestone)

                        expect(chain[0]).toEqual({
                            model: "gemini-2.5-flash-lite",
                            provider: ModelProvider.Gemini,
                        })
                    })
            })

        describe("primaryChoice",
            () => {
                it("returns the head of the fallback chain",
                    () => {
                        // primary is always index 0 of the resolved chain
                        const primary = service.primaryChoice(AiTaskKind.Grade)

                        expect(primary).toEqual({
                            model: "qwen2.5-coder:7b",
                            provider: ModelProvider.Local,
                        })
                    })
            })
    })
