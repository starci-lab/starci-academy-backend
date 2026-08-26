import {
    AiModelInsertService,
} from "./ai-model-insert.service"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    AiModelTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model-translation.entity"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import type {
    AiModelCatalogParsed,
} from "../parsers/types"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

describe("AiModelInsertService",
    () => {
        const entry = (): AiModelCatalogParsed => ({
            model: {
                name: "gpt-test",
                provider: ModelProvider.OpenAI,
                category: AiModelCategory.Low,
                keysFilePath: "/keys/openai",
                priority: 1,
                credit: 2,
                weight: 1,
                priceInUsdPerMTok: 1,
                priceOutUsdPerMTok: 2,
                creditPerMTokIn: 1,
                creditPerMTokOut: 2,
                enabled: true,
                complimentary: false,
                supportedTasks: [AiModelTask.Chatting],
            },
            en: {
                label: "Test model",
                description: "English description",
            },
            vi: {
                label: "Vietnamese test model",
                description: "Localized description",
            },
        })

        it("does not query or retire anything for an empty seed",
            async () => {
                const find = jest.fn()
                const service = new AiModelInsertService({
                    find
                } as never)
                await expect(service.upsertMany([])).resolves.toBe(0)
                expect(find).not.toHaveBeenCalled()
            })

        it("upserts the model translations and retires enabled stale rows",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.save.mockImplementation(
                    (entity: unknown, data: unknown) => entity === AiModelEntity
                        ? {
                            id: "model-1",
                        }
                        : data,
                )
                entityManager.find.mockResolvedValueOnce([
                    {
                        id: "stale-1",
                        name: "old-model",
                        provider: ModelProvider.Gemini,
                    },
                    {
                        id: "model-1",
                        name: "gpt-test",
                        provider: ModelProvider.OpenAI,
                    },
                ])

                const service = new AiModelInsertService(asEntityManager(entityManager))
                await expect(service.upsertMany([entry()])).resolves.toBe(1)

                expect(entityManager.find).toHaveBeenCalledWith(
                    AiModelEntity,
                    expect.objectContaining({
                        where: {
                            enabled: true,
                        },
                    }),
                )
                expect(entityManager.update).toHaveBeenCalledWith(
                    AiModelEntity,
                    ["stale-1"],
                    {
                        enabled: false,
                    },
                )
                const translationSave = entityManager.save.mock.calls.find(
                    ([entity]) => entity === AiModelTranslationEntity,
                )
                expect(translationSave?.[1]).toEqual([
                    expect.objectContaining({
                        aiModelId: "model-1",
                        field: "label",
                        value: "Test model",
                    }),
                    expect.objectContaining({
                        aiModelId: "model-1",
                        field: "description",
                        value: "English description",
                    }),
                    expect.objectContaining({
                        aiModelId: "model-1",
                        field: "label",
                        value: "Vietnamese test model",
                    }),
                    expect.objectContaining({
                        aiModelId: "model-1",
                        field: "description",
                        value: "Localized description",
                    }),
                ])
            })

        it("keeps the existing model id when refreshing an entry",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.findOne.mockResolvedValueOnce({
                    id: "existing-1",
                })
                entityManager.save.mockImplementation(
                    (entity: unknown, data: unknown) => entity === AiModelEntity
                        ? {
                            id: "existing-1",
                        }
                        : data,
                )

                const service = new AiModelInsertService(asEntityManager(entityManager))
                await service.upsertMany([entry()])

                expect(entityManager.save).toHaveBeenCalledWith(
                    AiModelEntity,
                    expect.objectContaining({
                        id: "existing-1",
                        name: "gpt-test",
                        defaultLocale: "en",
                    }),
                )
                expect(entityManager.update).not.toHaveBeenCalled()
            })
    })
