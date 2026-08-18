import type {
    Client,
} from "@elastic/elasticsearch"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ElasticsearchBulkIndexException,
} from "@modules/platform/exceptions/errors/elasticsearch/elasticsearch-bulk-index"
import {
    ElasticsearchIndexConfigMissingException,
} from "@modules/platform/exceptions/errors/elasticsearch/elasticsearch-index-config-missing"
import {
    ElasticsearchIndexMappingNotAppliedException,
} from "@modules/platform/exceptions/errors/elasticsearch/elasticsearch-index-mapping-not-applied"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    configMap,
} from "./config"
import {
    ElasticsearchService,
} from "./elasticsearch.service"
import {
    resolveElasticsearchIndexMapping,
} from "./mappings"

/** Elasticsearch's "already there" / "not there" error envelope. */
const esError = (
    type: string,
) => ({
    meta: {
        body: {
            error: {
                type,
            },
        },
    },
})

describe("ElasticsearchService",
    () => {
        let service: ElasticsearchService
        let client: {
            indices: {
                exists: jest.Mock
                create: jest.Mock
                delete: jest.Mock
                getMapping: jest.Mock
            }
            index: jest.Mock
            bulk: jest.Mock
            delete: jest.Mock
            count: jest.Mock
            deleteByQuery: jest.Mock
        }
        const createWatcher = jest.fn()
        const log = jest.fn()

        beforeEach(() => {
            jest.clearAllMocks()
            client = {
                indices: {
                    exists: jest.fn().mockResolvedValue(false),
                    create: jest.fn().mockResolvedValue({
                    }),
                    delete: jest.fn().mockResolvedValue({
                    }),
                    getMapping: jest.fn().mockResolvedValue({
                    }),
                },
                index: jest.fn().mockResolvedValue({
                }),
                bulk: jest.fn().mockResolvedValue({
                    errors: false,
                    items: [],
                }),
                delete: jest.fn().mockResolvedValue({
                }),
                count: jest.fn().mockResolvedValue({
                    count: 0,
                }),
                deleteByQuery: jest.fn().mockResolvedValue({
                    deleted: 0,
                }),
            }
            service = new ElasticsearchService(
                client as unknown as Client,
                {
                    createWatcher,
                } as never,
                {
                    log,
                } as never,
            )
        })

        describe("indicateName",
            () => {
                it("suffixes the declared base index with the locale",
                    () => {
                        expect(service.indicateName({
                            entity: "CourseEntity",
                            locale: Locale.Vi,
                        })).toBe("courses-vi")
                    })

                it("returns the bare base index when no locale is given",
                    () => {
                        expect(service.indicateName({
                            entity: "CourseEntity",
                        })).toBe("courses")
                    })

                it("rejects an entity that was never registered in the config map",
                    () => {
                        expect(() => service.indicateName({
                            entity: "GhostEntity",
                        })).toThrow(ElasticsearchIndexConfigMissingException)
                    })
            })

        describe("onModuleInit",
            () => {
                it("registers a readiness watcher and creates every declared index variant",
                    async () => {
                        await service.onModuleInit()

                        expect(createWatcher).toHaveBeenCalledWith("ElasticsearchService")
                        const created = client.indices.create.mock.calls.map((call) => call[0].index)
                        // localized entity -> base + one index per locale
                        expect(created).toEqual(expect.arrayContaining([
                            "courses",
                            "courses-vi",
                            "courses-en",
                        ]))
                        // the non-localized users index must NOT get locale variants
                        expect(created).toContain("users")
                        expect(created).not.toContain("users-vi")
                        // every entity in the config map is covered: 1 base + 2 locales each,
                        // minus the two locale variants the non-localized index does not own
                        expect(created).toHaveLength(Object.keys(configMap).length * 3 - 2)
                    })
            })

        describe("ensureIndexForEntity",
            () => {
                it("creates a missing index from its declared mapping",
                    async () => {
                        client.indices.exists.mockResolvedValue(false)

                        await service.ensureIndexForEntity({
                            entity: "CourseEntity",
                            locale: Locale.En,
                        })

                        expect(client.indices.create).toHaveBeenCalledWith({
                            index: "courses-en",
                            ...resolveElasticsearchIndexMapping("CourseEntity"),
                        })
                        expect(client.indices.getMapping).not.toHaveBeenCalled()
                    })

                it("creates a missing index with dynamic mapping when the entity declares none",
                    async () => {
                        client.indices.exists.mockResolvedValue(false)

                        await service.ensureIndexForEntity({
                            entity: "FoundationEntity",
                            locale: Locale.Vi,
                        })

                        expect(client.indices.create).toHaveBeenCalledWith({
                            index: "foundations-vi",
                        })
                    })

                it("leaves an existing index alone when the entity declares no mapping to compare",
                    async () => {
                        client.indices.exists.mockResolvedValue(true)

                        await service.ensureIndexForEntity({
                            entity: "FoundationEntity",
                        })

                        expect(client.indices.getMapping).not.toHaveBeenCalled()
                        expect(client.indices.create).not.toHaveBeenCalled()
                    })

                it("does nothing when the live mapping matches the declaration",
                    async () => {
                        // the client's `exists` may answer with the transport `{ body }` envelope
                        client.indices.exists.mockResolvedValue({
                            body: true,
                        })
                        client.indices.getMapping.mockResolvedValue({
                            "courses-en": {
                                mappings: resolveElasticsearchIndexMapping("CourseEntity")?.mappings,
                            },
                        })

                        await service.ensureIndexForEntity({
                            entity: "CourseEntity",
                            locale: Locale.En,
                        })

                        expect(client.indices.delete).not.toHaveBeenCalled()
                        expect(client.indices.create).not.toHaveBeenCalled()
                        expect(log).not.toHaveBeenCalled()
                    })

                it("reports drift but refuses to rebuild an index that still holds documents",
                    async () => {
                        client.indices.exists.mockResolvedValue(true)
                        // the live index lost every declared field -> full drift
                        client.indices.getMapping.mockResolvedValue({
                            "courses-en": {
                                mappings: {
                                    properties: {
                                    },
                                },
                            },
                        })
                        client.count.mockResolvedValue({
                            count: 12,
                        })

                        await service.ensureIndexForEntity({
                            entity: "CourseEntity",
                            locale: Locale.En,
                        })

                        expect(log).toHaveBeenCalledWith(
                            WinstonLog.ElasticsearchIndexMappingDrifted,
                            expect.objectContaining({
                                index: "courses-en",
                                documentCount: 12,
                            }),
                        )
                        expect(client.indices.delete).not.toHaveBeenCalled()
                        expect(client.indices.create).not.toHaveBeenCalled()
                    })

                it("drops and recreates a drifted index that is empty",
                    async () => {
                        client.indices.exists.mockResolvedValue(true)
                        // the response is not keyed by this index at all -> live mapping unknown
                        client.indices.getMapping.mockResolvedValue({
                        })
                        client.count.mockResolvedValue({
                            count: 0,
                        })

                        await service.ensureIndexForEntity({
                            entity: "CourseEntity",
                            locale: Locale.En,
                        })

                        expect(client.indices.delete).toHaveBeenCalledWith({
                            index: "courses-en",
                        })
                        expect(client.indices.create).toHaveBeenCalledWith({
                            index: "courses-en",
                            ...resolveElasticsearchIndexMapping("CourseEntity"),
                        })
                        expect(log).toHaveBeenCalledWith(
                            WinstonLog.ElasticsearchIndexMappingRepaired,
                            {
                                index: "courses-en",
                                documentCount: 0,
                            },
                        )
                    })

                it("tolerates another boot worker having just created the same index",
                    async () => {
                        client.indices.exists.mockResolvedValue(false)
                        client.indices.create.mockRejectedValue(
                            esError("resource_already_exists_exception"),
                        )

                        await expect(service.ensureIndexForEntity({
                            entity: "CourseEntity",
                        })).resolves.toBeUndefined()
                    })

                it("tolerates the race when it only surfaces in the error message",
                    async () => {
                        client.indices.exists.mockResolvedValue(false)
                        client.indices.create.mockRejectedValue(
                            new Error("resource_already_exists_exception: courses"),
                        )

                        await expect(service.ensureIndexForEntity({
                            entity: "CourseEntity",
                        })).resolves.toBeUndefined()
                    })

                it("fails loudly when the declared mapping cannot be applied",
                    async () => {
                        client.indices.exists.mockResolvedValue(false)
                        const cause = new Error("mapper_parsing_exception")
                        client.indices.create.mockRejectedValue(cause)

                        const error = await service.ensureIndexForEntity({
                            entity: "CourseEntity",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ElasticsearchIndexMappingNotAppliedException)
                        expect((error as ElasticsearchIndexMappingNotAppliedException).metadata).toMatchObject({
                            index: "courses",
                            entity: "CourseEntity",
                            originalError: cause,
                        })
                    })

                it("drops originalError when the create failure is not an Error instance",
                    async () => {
                        client.indices.exists.mockResolvedValue(false)
                        client.indices.create.mockRejectedValue({
                            reason: "transport closed",
                        })

                        const error = await service.ensureIndexForEntity({
                            entity: "CourseEntity",
                        }).catch((thrown: unknown) => thrown)

                        expect((error as ElasticsearchIndexMappingNotAppliedException).metadata).toMatchObject({
                            originalError: undefined,
                        })
                    })
            })

        describe("ensureIndexExists",
            () => {
                // `ensureIndexExists` takes `Omit<Parameters<Client["indices"]["create"]>[0], "index">`.
                // That parameter is the union of the client's body-less and deprecated `body` request
                // shapes, so the only keys it exposes are the ones both carry -- the request-level
                // knobs below. Body content (`settings` / `mappings` / `aliases`) is not reachable
                // through this door, so the passthrough is proven with a key that is.
                it("merges the supplied create options into the create call when the index is absent",
                    async () => {
                        client.indices.exists.mockResolvedValue(false)

                        await service.ensureIndexExists("ad-hoc",
                            {
                                wait_for_active_shards: 1,
                                timeout: "30s",
                            })

                        expect(client.indices.create).toHaveBeenCalledWith({
                            index: "ad-hoc",
                            wait_for_active_shards: 1,
                            timeout: "30s",
                        })
                    })

                it("creates a bare index when no create options are supplied",
                    async () => {
                        client.indices.exists.mockResolvedValue(false)

                        await service.ensureIndexExists("ad-hoc")

                        expect(client.indices.create).toHaveBeenCalledWith({
                            index: "ad-hoc",
                        })
                    })

                it("does not create an index that already exists",
                    async () => {
                        client.indices.exists.mockResolvedValue(true)

                        await service.ensureIndexExists("ad-hoc")

                        expect(client.indices.create).not.toHaveBeenCalled()
                    })
            })

        describe("indexEntity",
            () => {
                it("indexes one document under the entity's per-locale index and its own id",
                    async () => {
                        await service.indexEntity({
                            entity: {
                                name: "CourseEntity",
                            },
                            data: {
                                id: "course-1",
                                title: "Backend",
                            },
                            locale: Locale.Vi,
                        })

                        expect(client.index).toHaveBeenCalledWith({
                            index: "courses-vi",
                            id: "course-1",
                            body: {
                                id: "course-1",
                                title: "Backend",
                            },
                        })
                    })
            })

        describe("indexEntities",
            () => {
                it("flattens each document into an action line followed by its source line",
                    async () => {
                        await service.indexEntities({
                            entity: {
                                name: "CourseEntity",
                            },
                            data: [
                                {
                                    id: "a",
                                },
                                {
                                    id: "b",
                                },
                            ],
                            locale: Locale.En,
                        })

                        expect(client.bulk).toHaveBeenCalledWith({
                            refresh: true,
                            operations: [
                                {
                                    index: {
                                        _index: "courses-en",
                                        _id: "a",
                                    },
                                },
                                {
                                    id: "a",
                                },
                                {
                                    index: {
                                        _index: "courses-en",
                                        _id: "b",
                                    },
                                },
                                {
                                    id: "b",
                                },
                            ],
                        })
                    })

                it("skips the bulk call entirely for an empty batch",
                    async () => {
                        await service.indexEntities({
                            entity: {
                                name: "CourseEntity",
                            },
                            data: [],
                        })

                        expect(client.bulk).not.toHaveBeenCalled()
                    })

                it("surfaces the first per-item failure instead of leaving the index partial",
                    async () => {
                        client.bulk.mockResolvedValue({
                            errors: true,
                            items: [
                                {
                                    index: {
                                    },
                                },
                                {
                                    index: {
                                        error: {
                                            type: "mapper_parsing_exception",
                                        },
                                    },
                                },
                            ],
                        })

                        const error = await service.indexEntities({
                            entity: {
                                name: "CourseEntity",
                            },
                            data: [
                                {
                                    id: "a",
                                },
                            ],
                            locale: Locale.En,
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ElasticsearchBulkIndexException)
                        expect((error as ElasticsearchBulkIndexException).metadata).toMatchObject({
                            index: "courses-en",
                            firstError: {
                                type: "mapper_parsing_exception",
                            },
                        })
                    })

                it("still fails when the bulk response flags errors without naming an item",
                    async () => {
                        client.bulk.mockResolvedValue({
                            errors: true,
                            items: [
                                {
                                },
                            ],
                        })

                        const error = await service.indexEntities({
                            entity: {
                                name: "CourseEntity",
                            },
                            data: [
                                {
                                    id: "a",
                                },
                            ],
                        }).catch((thrown: unknown) => thrown)

                        expect((error as ElasticsearchBulkIndexException).metadata).toMatchObject({
                            firstError: undefined,
                        })
                    })
            })

        describe("deleteEntity",
            () => {
                it("deletes the document by id with an immediate refresh",
                    async () => {
                        await service.deleteEntity({
                            entity: "CourseEntity",
                            id: "course-1",
                            locale: Locale.Vi,
                        })

                        expect(client.delete).toHaveBeenCalledWith({
                            index: "courses-vi",
                            id: "course-1",
                            refresh: true,
                        })
                    })

                it("treats a 404 as the desired end state",
                    async () => {
                        client.delete.mockRejectedValue({
                            meta: {
                                statusCode: 404,
                            },
                        })

                        await expect(service.deleteEntity({
                            entity: "CourseEntity",
                            id: "gone",
                        })).resolves.toBeUndefined()
                    })

                it("treats a not_found result envelope as the desired end state",
                    async () => {
                        client.delete.mockRejectedValue({
                            meta: {
                                body: {
                                    result: "not_found",
                                },
                            },
                        })

                        await expect(service.deleteEntity({
                            entity: "CourseEntity",
                            id: "gone",
                        })).resolves.toBeUndefined()
                    })

                it("treats a never-created index as nothing to delete",
                    async () => {
                        client.delete.mockRejectedValue(esError("index_not_found_exception"))

                        await expect(service.deleteEntity({
                            entity: "CourseEntity",
                            id: "gone",
                        })).resolves.toBeUndefined()
                    })

                it("treats a missing index reported only in the message as nothing to delete",
                    async () => {
                        client.delete.mockRejectedValue(
                            new Error("index_not_found_exception: courses"),
                        )

                        await expect(service.deleteEntity({
                            entity: "CourseEntity",
                            id: "gone",
                        })).resolves.toBeUndefined()
                    })

                it("rethrows any other delete failure",
                    async () => {
                        const cause = new Error("cluster_block_exception")
                        client.delete.mockRejectedValue(cause)

                        await expect(service.deleteEntity({
                            entity: "CourseEntity",
                            id: "course-1",
                        })).rejects.toBe(cause)
                    })
            })

        describe("countDocs",
            () => {
                it("returns the live document count for the per-locale index",
                    async () => {
                        client.count.mockResolvedValue({
                            count: 7,
                        })

                        await expect(service.countDocs({
                            entity: "CourseEntity",
                            locale: Locale.Vi,
                        })).resolves.toBe(7)

                        expect(client.count).toHaveBeenCalledWith({
                            index: "courses-vi",
                        })
                    })

                it("counts a never-created index as zero",
                    async () => {
                        client.count.mockRejectedValue(esError("index_not_found_exception"))

                        await expect(service.countDocs({
                            entity: "CourseEntity",
                        })).resolves.toBe(0)
                    })

                it("counts a missing index reported only in the message as zero",
                    async () => {
                        client.count.mockRejectedValue(
                            new Error("index_not_found_exception: courses"),
                        )

                        await expect(service.countDocs({
                            entity: "CourseEntity",
                        })).resolves.toBe(0)
                    })

                it("rethrows any other count failure",
                    async () => {
                        const cause = new Error("search_phase_execution_exception")
                        client.count.mockRejectedValue(cause)

                        await expect(service.countDocs({
                            entity: "CourseEntity",
                        })).rejects.toBe(cause)
                    })
            })

        describe("pruneOrphans",
            () => {
                it("deletes every document outside the keep-list and returns the deleted count",
                    async () => {
                        client.deleteByQuery.mockResolvedValue({
                            deleted: 3,
                        })

                        await expect(service.pruneOrphans({
                            entity: "CourseEntity",
                            locale: Locale.En,
                            ids: [
                                "keep-1",
                            ],
                        })).resolves.toBe(3)

                        expect(client.deleteByQuery).toHaveBeenCalledWith({
                            index: "courses-en",
                            conflicts: "proceed",
                            refresh: true,
                            query: {
                                bool: {
                                    must_not: [
                                        {
                                            ids: {
                                                values: [
                                                    "keep-1",
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        })
                    })

                it("matches everything when no id should be kept",
                    async () => {
                        client.deleteByQuery.mockResolvedValue({
                        })

                        // an omitted `deleted` in the response reads as zero
                        await expect(service.pruneOrphans({
                            entity: "CourseEntity",
                            locale: Locale.En,
                            ids: [],
                        })).resolves.toBe(0)

                        expect(client.deleteByQuery.mock.calls[0][0].query).toEqual({
                            match_all: {
                            },
                        })
                    })

                it("prunes nothing when the index was never created",
                    async () => {
                        client.deleteByQuery.mockRejectedValue(esError("index_not_found_exception"))

                        await expect(service.pruneOrphans({
                            entity: "CourseEntity",
                            ids: [],
                        })).resolves.toBe(0)
                    })

                it("prunes nothing when the missing index is reported only in the message",
                    async () => {
                        client.deleteByQuery.mockRejectedValue(
                            new Error("index_not_found_exception: courses"),
                        )

                        await expect(service.pruneOrphans({
                            entity: "CourseEntity",
                            ids: [],
                        })).resolves.toBe(0)
                    })

                it("rethrows any other prune failure",
                    async () => {
                        const cause = new Error("version_conflict_engine_exception")
                        client.deleteByQuery.mockRejectedValue(cause)

                        await expect(service.pruneOrphans({
                            entity: "CourseEntity",
                            ids: [],
                        })).rejects.toBe(cause)
                    })
            })

        describe("deleteIndex",
            () => {
                it("deletes the index",
                    async () => {
                        await service.deleteIndex("courses-en")

                        expect(client.indices.delete).toHaveBeenCalledWith({
                            index: "courses-en",
                        })
                    })

                it("ignores a delete against an index that does not exist",
                    async () => {
                        client.indices.delete.mockRejectedValue(esError("index_not_found_exception"))

                        await expect(service.deleteIndex("courses-en")).resolves.toBeUndefined()
                    })

                it("ignores a missing index reported only in the message",
                    async () => {
                        client.indices.delete.mockRejectedValue(
                            new Error("index_not_found_exception: courses-en"),
                        )

                        await expect(service.deleteIndex("courses-en")).resolves.toBeUndefined()
                    })

                it("rethrows any other delete failure",
                    async () => {
                        const cause = new Error("cluster_block_exception")
                        client.indices.delete.mockRejectedValue(cause)

                        await expect(service.deleteIndex("courses-en")).rejects.toBe(cause)
                    })
            })
    })
