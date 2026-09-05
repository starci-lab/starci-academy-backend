import type {
    DeepPartial,
} from "typeorm"
import {
    ConceptEntity,
} from "@modules/databases/postgresql/primary/entities/concept.entity"
import {
    ConceptSectionEntity,
} from "@modules/databases/postgresql/primary/entities/concept-section.entity"
import {
    ConceptSectionTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/concept-section-translation.entity"
import {
    ConceptTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/concept-translation.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ConceptInsertService,
} from "./insert.service"

const snapshot = (): DeepPartial<ConceptEntity> => ({
    id: "0b1e6d0b-c9d4-5af3-b3c9-80d055df1cbc",
    displayId: "request-response-lifecycle",
    title: "Request lifecycle",
    description: "Choose the correct layer.",
    category: "backend",
    difficulty: "foundation",
    minutesRead: 65,
    implementation: "typescript",
    orderIndex: 0,
    sortIndex: 0,
    body: "Body",
    learningOutcomes: [],
    prerequisites: [],
    references: [],
    workspace: null,
    activities: [],
    translations: [{
        conceptId: "0b1e6d0b-c9d4-5af3-b3c9-80d055df1cbc",
        locale: Locale.En,
        title: "Request lifecycle",
        description: "Choose the correct layer.",
        body: "Body",
    }],
    sections: [{
        id: "b01bbf4e-8140-5fda-b030-b6b306aa819c",
        displayId: "predict",
        title: "Predict",
        phase: "predict",
        body: "Predict first.",
        orderIndex: 0,
        sortIndex: 0,
        activities: [],
        concept: {
            id: "0b1e6d0b-c9d4-5af3-b3c9-80d055df1cbc",
        },
        translations: [{
            conceptSectionId: "b01bbf4e-8140-5fda-b030-b6b306aa819c",
            locale: Locale.En,
            title: "Predict",
            body: "Predict first.",
        }],
    }],
})

describe("ConceptInsertService",
    () => {
        it("does nothing for an empty mount so it cannot delete the domain",
            async () => {
                const transaction = jest.fn()
                const service = new ConceptInsertService({
                    transaction,
                } as never)

                await service.insertAll([])

                expect(transaction).not.toHaveBeenCalled()
            })

        it("synchronizes the complete snapshot in one transaction with explicit root pruning",
            async () => {
                const upsertMany = jest.fn(async () => ({
                    createIds: [],
                    updateIds: [],
                    deleteIds: [],
                }))
                const upsertTranslationMany = jest.fn(async () => undefined)
                const scoped = {
                    upsertMany,
                    upsertTranslationMany,
                }
                const transaction = jest.fn(async (
                    work: (value: typeof scoped) => Promise<void>,
                ) => work(scoped))
                const service = new ConceptInsertService({
                    transaction,
                } as never)
                const concept = snapshot()

                await service.insertAll([concept])

                expect(transaction).toHaveBeenCalledTimes(1)
                expect(upsertMany).toHaveBeenNthCalledWith(1,
                    ConceptEntity,
                    [expect.objectContaining({
                        id: concept.id,
                        displayId: concept.displayId,
                    })],
                    {
                    })
                expect(upsertTranslationMany).toHaveBeenCalledWith(
                    ConceptTranslationEntity,
                    concept.translations,
                    {
                        conceptId: concept.id,
                    },
                )
                expect(upsertMany).toHaveBeenNthCalledWith(2,
                    ConceptSectionEntity,
                    [expect.objectContaining({
                        id: concept.sections?.[0].id,
                    })],
                    {
                        concept: {
                            id: concept.id,
                        },
                    })
                expect(upsertTranslationMany).toHaveBeenCalledWith(
                    ConceptSectionTranslationEntity,
                    concept.sections?.[0].translations,
                    {
                        conceptSectionId: concept.sections?.[0].id,
                    },
                )
            })

        it("propagates a child failure through the transaction boundary",
            async () => {
                const failure = new Error("section write failed")
                const scoped = {
                    upsertMany: jest.fn()
                        .mockResolvedValueOnce({
                            createIds: [], updateIds: [], deleteIds: [],
                        })
                        .mockRejectedValueOnce(failure),
                    upsertTranslationMany: jest.fn(async () => undefined),
                }
                const transaction = jest.fn(async (
                    work: (value: typeof scoped) => Promise<void>,
                ) => work(scoped))
                const service = new ConceptInsertService({
                    transaction,
                } as never)

                await expect(service.insertAll([snapshot()]))
                    .rejects.toBe(failure)
                expect(transaction).toHaveBeenCalledTimes(1)
            })

        it("uses the same deterministic snapshot on a repeated run",
            async () => {
                const rootIds: Array<Array<string | undefined>> = []
                const scoped = {
                    upsertMany: jest.fn(async (
                        entity: unknown,
                        rows: Array<DeepPartial<ConceptEntity>>,
                    ) => {
                        if (entity === ConceptEntity) {
                            rootIds.push(rows.map((row) => row.id))
                        }
                        return {
                            createIds: [], updateIds: [], deleteIds: [],
                        }
                    }),
                    upsertTranslationMany: jest.fn(async () => undefined),
                }
                const service = new ConceptInsertService({
                    transaction: async (
                        work: (value: typeof scoped) => Promise<void>,
                    ) => work(scoped),
                } as never)
                const concept = snapshot()

                await service.insertAll([concept])
                await service.insertAll([concept])

                expect(rootIds).toEqual([
                    [concept.id],
                    [concept.id],
                ])
            })
    })
