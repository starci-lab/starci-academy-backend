import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    AiByokInvalidException,
} from "@modules/platform/exceptions/errors/ai/ai-byok-invalid"
import {
    AiModeNotEntitledException,
} from "@modules/platform/exceptions/errors/ai/ai-mode-not-entitled"
import {
    GradingLaneValidationService,
} from "./grading-lane-validation.service"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import {
    AiModelCatalogService,
} from "./balancer/ai-model-catalog.service"

/**
 * Build a minimal enabled catalog row -- only the fields the validator reads
 * (name, provider, category) need real values.
 */
const buildModelRow = (
    overrides: Partial<AiModelEntity> = {
    },
): AiModelEntity => ({
    name: "gpt-4o",
    provider: ModelProvider.OpenAI,
    category: AiModelCategory.Medium,
    ...overrides,
}) as AiModelEntity

describe("GradingLaneValidationService",
    () => {
        let module: TestingModule
        let service: GradingLaneValidationService
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "assertCanUsePaidModels" | "resolveTierCategories">>
        let aiModelCatalogService: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

        const userId = "user-1"

        beforeEach(async () => {
            aiEntitlementService = {
                // pinned-model gate (paid OR enrolled); default: unlocked
                assertCanUsePaidModels: jest.fn(async () => undefined),
                // enroll-aware unlocked categories a pinned model is checked against
                resolveTierCategories: jest.fn(async () => [
                    AiModelCategory.Low,
                ]),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "assertCanUsePaidModels" | "resolveTierCategories">>

            // catalog: empty by default so tests opt into a specific row set
            aiModelCatalogService = {
                enabledModels: jest.fn(async () => []),
            } as unknown as jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

            module = await Test.createTestingModule({
                providers: [
                    GradingLaneValidationService,
                    {
                        provide: AiEntitlementService,
                        useValue: aiEntitlementService,
                    },
                    {
                        provide: AiModelCatalogService,
                        useValue: aiModelCatalogService,
                    },
                ],
            }).compile()

            service = module.get<GradingLaneValidationService>(GradingLaneValidationService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("assertModelProviderPairing",
            () => {
                it("rejects a model supplied without a provider",
                    async () => {
                        // model + provider must come as a pair or not at all
                        await expect(
                            service.validate({
                                userId,
                                model: "gpt-4o",
                            }),
                        ).rejects.toBeInstanceOf(AiByokInvalidException)
                    })

                it("rejects a provider supplied without a model",
                    async () => {
                        // the inverse half-pair is equally invalid
                        await expect(
                            service.validate({
                                userId,
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(AiByokInvalidException)
                    })
            })

        describe("no model pinned",
            () => {
                it("returns an empty result when no model is picked",
                    async () => {
                        // no model pick -> balancer chooses, nothing to validate
                        const result = await service.validate({
                            userId,
                        })

                        expect(result).toEqual({
                        })
                        // nothing to gate when no model is pinned
                        expect(aiEntitlementService.assertCanUsePaidModels).not.toHaveBeenCalled()
                    })
            })

        describe("pinned model",
            () => {
                beforeEach(() => {
                    aiEntitlementService.resolveTierCategories.mockResolvedValue([
                        AiModelCategory.Medium,
                    ])
                })

                it("rejects a pinned model when NOT unlocked (not paid, not enrolled)",
                    async () => {
                        // assertCanUsePaidModels throws for an unentitled user -> reject
                        aiEntitlementService.assertCanUsePaidModels.mockRejectedValueOnce(
                            new AiModeNotEntitledException({
                                reason: "no active paid subscription or enrollment",
                            }),
                        )

                        await expect(
                            service.validate({
                                userId,
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(AiModeNotEntitledException)
                    })

                it("returns the resolved catalog row for an allowed category",
                    async () => {
                        // the picked model's category is within the tier categories
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                category: AiModelCategory.Medium,
                            }),
                        ])

                        const result = await service.validate({
                            userId,
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                        })

                        expect(result).toEqual({
                            gradingModel: "gpt-4o",
                            gradingProvider: ModelProvider.OpenAI,
                        })
                    })

                it("rejects a model whose category is outside the tier categories",
                    async () => {
                        // a Premium-category row when only Balanced is unlocked -> reject
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                category: AiModelCategory.High,
                            }),
                        ])

                        await expect(
                            service.validate({
                                userId,
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(AiByokInvalidException)
                    })

                it("rejects a model that is not in the enabled catalog",
                    async () => {
                        // unknown (model, provider) pair -> no row -> reject
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([])

                        await expect(
                            service.validate({
                                userId,
                                model: "ghost-model",
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(AiByokInvalidException)
                    })
            })
    })
