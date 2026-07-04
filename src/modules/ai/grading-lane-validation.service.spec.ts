import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiMode,
    AiModelCategory,
    AiModelEntity,
    ModelProvider,
} from "@modules/databases"
import {
    AiByokInvalidException,
    AiModeNotEntitledException,
} from "@modules/exceptions"
import {
    GradingLaneValidationService,
} from "./grading-lane-validation.service"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import {
    AiModelCatalogService,
} from "./balancer"

/**
 * Build a minimal enabled catalog row — only the fields the validator reads
 * (name, provider, category, complimentary) need real values.
 */
const buildModelRow = (
    overrides: Partial<AiModelEntity> = {
    },
): AiModelEntity => ({
    name: "gpt-4o",
    provider: ModelProvider.OpenAI,
    category: AiModelCategory.Balanced,
    complimentary: false,
    ...overrides,
}) as AiModelEntity

describe("GradingLaneValidationService",
    () => {
        let module: TestingModule
        let service: GradingLaneValidationService
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "resolve" | "assertCanUsePaidModels" | "resolveTierCategories">>
        let aiModelCatalogService: jest.Mocked<Pick<AiModelCatalogService, "enabledModels">>

        const userId = "user-1"

        beforeEach(async () => {
            // entitlement resolver: default to Auto; tests override per-lane
            aiEntitlementService = {
                resolve: jest.fn(async () => ({
                    mode: AiMode.Auto,
                    allowedCategories: [
                        AiModelCategory.Economy,
                    ],
                })),
                // explicit-Premium gate (paid OR enrolled); default: unlocked
                assertCanUsePaidModels: jest.fn(async () => undefined),
                // enroll-aware unlocked categories for the Premium path
                resolveTierCategories: jest.fn(async () => [
                    AiModelCategory.Economy,
                ]),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "resolve" | "assertCanUsePaidModels" | "resolveTierCategories">>

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

        describe("auto lane",
            () => {
                it("returns a bare Auto result when no model is picked",
                    async () => {
                        // no model pick → balancer chooses, nothing to validate
                        const result = await service.validate({
                            userId,
                        })

                        expect(result).toEqual({
                            mode: AiMode.Auto,
                        })
                    })

                it("accepts a complimentary enabled model on the Auto lane",
                    async () => {
                        // a complimentary catalog row in an allowed category may be
                        // pinned on Auto (default allowed = [Economy])
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                name: "gpt-4o-mini",
                                category: AiModelCategory.Economy,
                                complimentary: true,
                            }),
                        ])

                        const result = await service.validate({
                            userId,
                            model: "gpt-4o-mini",
                            provider: ModelProvider.OpenAI,
                        })

                        expect(result).toEqual({
                            mode: AiMode.Auto,
                            gradingModel: "gpt-4o-mini",
                            gradingProvider: ModelProvider.OpenAI,
                        })
                    })

                it("rejects a non-complimentary model on the Auto lane",
                    async () => {
                        // a paid-only model cannot ride the free Auto lane
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                name: "gpt-4o-mini",
                                complimentary: false,
                            }),
                        ])

                        await expect(
                            service.validate({
                                userId,
                                model: "gpt-4o-mini",
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(AiByokInvalidException)
                    })

                it("rejects a model that is not in the enabled catalog",
                    async () => {
                        // unknown (model, provider) pair → no row → reject
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

        describe("premium lane",
            () => {
                beforeEach(() => {
                    // explicit Premium → gated on assertCanUsePaidModels (paid OR
                    // enrolled, default unlocked) + the enroll-aware categories
                    aiEntitlementService.resolveTierCategories.mockResolvedValue([
                        AiModelCategory.Balanced,
                    ])
                })

                it("rejects an explicit Premium pick when NOT unlocked (not paid, not enrolled)",
                    async () => {
                        // assertCanUsePaidModels throws for an unentitled user → reject
                        aiEntitlementService.assertCanUsePaidModels.mockRejectedValueOnce(
                            new AiModeNotEntitledException({
                                requestedMode: AiMode.Premium,
                                reason: "no active paid subscription or enrollment",
                            }),
                        )

                        await expect(
                            service.validate({
                                userId,
                                mode: AiMode.Premium,
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(AiModeNotEntitledException)
                    })

                it("returns the resolved catalog row for an allowed category",
                    async () => {
                        // the picked model's category is within the subscription
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                category: AiModelCategory.Balanced,
                            }),
                        ])

                        const result = await service.validate({
                            userId,
                            mode: AiMode.Premium,
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                        })

                        expect(result).toEqual({
                            mode: AiMode.Premium,
                            gradingModel: "gpt-4o",
                            gradingProvider: ModelProvider.OpenAI,
                        })
                    })

                it("rejects a model whose category is outside the subscription",
                    async () => {
                        // a Premium-category row when only Balanced is unlocked → reject
                        aiModelCatalogService.enabledModels.mockResolvedValueOnce([
                            buildModelRow({
                                category: AiModelCategory.Premium,
                            }),
                        ])

                        await expect(
                            service.validate({
                                userId,
                                mode: AiMode.Premium,
                                model: "gpt-4o",
                                provider: ModelProvider.OpenAI,
                            }),
                        ).rejects.toBeInstanceOf(AiByokInvalidException)
                    })

                it("rejects a Premium request with no model pick",
                    async () => {
                        // Premium requires an explicit model + provider
                        await expect(
                            service.validate({
                                userId,
                                mode: AiMode.Premium,
                            }),
                        ).rejects.toBeInstanceOf(AiByokInvalidException)
                    })
            })
    })
