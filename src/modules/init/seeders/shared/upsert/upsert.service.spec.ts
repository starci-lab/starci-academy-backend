import {
    EntitySchema 
} from "typeorm"
import {
    UpsertService 
} from "./upsert.service"
import {
    DbSyncType 
} from "@modules/platform/winston/types/messages/db-synchronizer"
import {
    UuidAbstractEntity,
} from "@modules/databases/postgresql/primary/entities/abstract"

class SeedEntity extends UuidAbstractEntity {
    displayId?: string
}

describe("UpsertService",
    () => {
        const entityManager = {
            find: jest.fn(),
            delete: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
        }
        const winstonService = {
            log: jest.fn() 
        }
        let service: UpsertService

        beforeEach(() => {
            jest.clearAllMocks()
            entityManager.find.mockResolvedValue([])
            entityManager.delete.mockResolvedValue(undefined)
            entityManager.save.mockResolvedValue(undefined)
            entityManager.remove.mockResolvedValue(undefined)
            service = new UpsertService(
      entityManager as never,
      winstonService as never,
            )
        })

        it("partitions incoming rows against scoped existing rows",
            async () => {
                entityManager.find.mockResolvedValue([{
                    id: "old" 
                },
                {
                    id: "keep" 
                }])
                await expect(
                    service.partitionUuidSync({
                        entityClass: SeedEntity,
                        entities: [{
                            id: "keep" 
                        },
                        {
                            id: "new", displayId: "n" 
                        }],
                        where: {
                            displayId: "scope" 
                        } as never,
                    }),
                ).resolves.toEqual({
                    createEntities: [{
                        id: "new", displayId: "n" 
                    }],
                    updateEntities: [{
                        id: "keep" 
                    }],
                    deleteEntities: [{
                        id: "old" 
                    }],
                })
                expect(entityManager.find).toHaveBeenCalledWith(SeedEntity,
                    {
                        where: {
                            displayId: "scope" 
                        },
                    })
            })

        it("deletes stale rows, saves only persistable entities, and logs actions",
            async () => {
                entityManager.find.mockResolvedValue([
                    {
                        id: "stale", displayId: "stale" 
                    },
                    {
                        id: "kept" 
                    },
                ])
                await expect(
                    service.upsertMany(SeedEntity,
                        [
                            {
                                id: "kept" 
                            },
                            {
                                id: "fresh", displayId: "fresh" 
                            },
                        ]),
                ).resolves.toEqual({
                    createIds: ["fresh"],
                    updateIds: ["kept"],
                    deleteIds: ["stale"],
                })
                expect(entityManager.delete).toHaveBeenCalledWith(SeedEntity,
                    ["stale"])
                expect(entityManager.save).toHaveBeenCalledWith(SeedEntity,
                    [
                        {
                            id: "fresh", displayId: "fresh" 
                        },
                    ])
                expect(winstonService.log).toHaveBeenCalledTimes(3)
                expect(winstonService.log.mock.calls.map((call) => call[1].type)).toEqual([
                    DbSyncType.Created,
                    DbSyncType.Updated,
                    DbSyncType.Deleted,
                ])
            })

        it("supports empty scoped seeds and replaces translation rows",
            async () => {
                entityManager.find.mockResolvedValueOnce([{
                    id: "a" 
                },
                {
                    id: "b" 
                }])
                await expect(
                    service.upsertMany(SeedEntity,
                        [],
{
    displayId: "parent" 
} as never),
                ).resolves.toEqual({
                    createIds: [], updateIds: [], deleteIds: ["a",
                        "b"] 
                })
                expect(entityManager.delete).toHaveBeenCalledWith(SeedEntity,
                    ["a",
                        "b"])

                entityManager.find.mockResolvedValueOnce([{
                    id: "t1" 
                }])
                await service.upsertTranslationMany<SeedEntity>(SeedEntity,
                    [{
                        id: "t2" 
                    }],
{
    displayId: "parent",
} as never)
                expect(entityManager.remove).toHaveBeenCalledWith([{
                    id: "t1" 
                }])
                expect(entityManager.save).toHaveBeenCalledWith(SeedEntity,
                    [{
                        id: "t2" 
                    }])
            })

        it("resolves target names for string and schema targets and skips id-less logs",
            () => {
                const schema = new EntitySchema({
                    name: "SchemaEntity",
                    columns: {
                        id: {
                            type: String, primary: true 
                        } 
                    },
                })
                service.logSync(
                    "NamedEntity",
                    [{
                        id: "one" 
                    },
                    {
                    }],
                    DbSyncType.Created,
                )
                service.logSync(schema,
                    [{
                        id: "two" 
                    }],
                    DbSyncType.Updated)
                expect(winstonService.log).toHaveBeenCalledTimes(2)
                expect(
                    winstonService.log.mock.calls.map((call) => call[1].entityKind),
                ).toEqual(["NamedEntity",
                    "SchemaEntity"])
            })
    })
