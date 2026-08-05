import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    EsSyncUserService,
} from "./es-sync-user.service"
import {
    UserEntity,
} from "@modules/databases"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("EsSyncUserService",
    () => {
        let module: TestingModule
        let service: EsSyncUserService
        let entityManager: EntityManagerMock
        let elasticsearchService: jest.Mocked<
            Pick<
                ElasticsearchService,
                | "ensureIndexForEntity"
                | "deleteEntity"
                | "indexEntity"
                | "indexEntities"
                | "pruneOrphans"
            >
        >

        const userId = "user-1"

        /** Build a minimal, valid (non-deleted) user row for the sync source-of-truth read. */
        const makeUser = (overrides: Partial<UserEntity> = {
        }): UserEntity =>
            ({
                id: userId,
                username: "starci",
                displayName: "Starci",
                bio: "hello",
                avatar: "avatar.png",
                githubUsername: "starci183",
                openToWork: true,
                coinBalance: 42,
                isDeleted: false,
                ...overrides,
            } as UserEntity)

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // ES client surface this service actually calls, mocked per the reference pattern
            elasticsearchService = {
                ensureIndexForEntity: jest.fn(),
                deleteEntity: jest.fn(),
                indexEntity: jest.fn(),
                indexEntities: jest.fn(),
                pruneOrphans: jest.fn().mockResolvedValue(0),
            } as unknown as jest.Mocked<
                Pick<
                    ElasticsearchService,
                    | "ensureIndexForEntity"
                    | "deleteEntity"
                    | "indexEntity"
                    | "indexEntities"
                    | "pruneOrphans"
                >
            >

            module = await Test.createTestingModule({
                providers: [
                    EsSyncUserService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearchService,
                    },
                ],
            }).compile()

            service = module.get<EsSyncUserService>(EsSyncUserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("onModuleInit",
            () => {
                it("ensures the non-localized `users` index exists on boot",
                    async () => {
                        await service.onModuleInit()

                        expect(elasticsearchService.ensureIndexForEntity).toHaveBeenCalledWith({
                            entity: UserEntity.name,
                        })
                    })

                it("swallows an index-ensure failure instead of blocking boot",
                    async () => {
                        elasticsearchService.ensureIndexForEntity.mockRejectedValueOnce(
                            new Error("ES unreachable"),
                        )

                        await expect(service.onModuleInit()).resolves.toBeUndefined()
                    })
            })

        describe("reindexOne",
            () => {
                it("upserts the search-doc shape for a live user",
                    async () => {
                        const user = makeUser()
                        entityManager.findOne.mockResolvedValueOnce(user)

                        await service.reindexOne({
                            userId,
                        })

                        // re-read the authoritative row by id
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            UserEntity,
                            {
                                where: {
                                    id: userId,
                                },
                            },
                        )
                        // upserted with the projected search-doc shape, not the raw entity
                        expect(elasticsearchService.indexEntity).toHaveBeenCalledWith({
                            entity: UserEntity,
                            data: {
                                id: user.id,
                                username: user.username,
                                displayName: user.displayName,
                                bio: user.bio,
                                avatar: user.avatar,
                                githubUsername: user.githubUsername,
                                openToWork: user.openToWork,
                                points: user.coinBalance,
                            },
                        })
                        expect(elasticsearchService.deleteEntity).not.toHaveBeenCalled()
                    })

                it("deletes the doc instead of indexing when the user row is gone",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await service.reindexOne({
                            userId,
                        })

                        expect(elasticsearchService.deleteEntity).toHaveBeenCalledWith({
                            entity: UserEntity.name,
                            id: userId,
                        })
                        expect(elasticsearchService.indexEntity).not.toHaveBeenCalled()
                    })

                it("deletes the doc instead of indexing for a soft-deleted user",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            makeUser({
                                isDeleted: true,
                            }),
                        )

                        await service.reindexOne({
                            userId,
                        })

                        expect(elasticsearchService.deleteEntity).toHaveBeenCalledWith({
                            entity: UserEntity.name,
                            id: userId,
                        })
                        expect(elasticsearchService.indexEntity).not.toHaveBeenCalled()
                    })
            })

        describe("reindexAll",
            () => {
                it("bulk-indexes one page of live users and reports zero pruned",
                    async () => {
                        const users = [
                            makeUser({
                                id: "user-1",
                            }),
                            makeUser({
                                id: "user-2",
                            }),
                        ]
                        // short page (< REINDEX_PAGE_SIZE) → loop stops after the first read
                        entityManager.find.mockResolvedValueOnce(users)

                        const result = await service.reindexAll()

                        // read only non-deleted rows, ordered for a stable cursor
                        expect(entityManager.find).toHaveBeenCalledWith(
                            UserEntity,
                            expect.objectContaining({
                                where: {
                                    isDeleted: false,
                                },
                                order: {
                                    id: "ASC",
                                },
                            }),
                        )
                        // bulk-indexed both rows as projected search docs
                        expect(elasticsearchService.indexEntities).toHaveBeenCalledWith({
                            entity: UserEntity,
                            data: users.map((user) => ({
                                id: user.id,
                                username: user.username,
                                displayName: user.displayName,
                                bio: user.bio,
                                avatar: user.avatar,
                                githubUsername: user.githubUsername,
                                openToWork: user.openToWork,
                                points: user.coinBalance,
                            })),
                        })
                        // pruned against the exact set of ids just indexed
                        expect(elasticsearchService.pruneOrphans).toHaveBeenCalledWith({
                            entity: UserEntity.name,
                            ids: [
                                "user-1",
                                "user-2",
                            ],
                        })
                        expect(result).toEqual({
                            indexed: 2,
                            pruned: 0,
                        })
                    })

                it("paginates across multiple pages until a short page ends the loop",
                    async () => {
                        // two full-size pages would require patching REINDEX_PAGE_SIZE, so
                        // instead assert the loop stops correctly on the very first short page
                        // and never calls indexEntities/pruneOrphans when there are zero rows
                        entityManager.find.mockResolvedValueOnce([])

                        const result = await service.reindexAll()

                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                        expect(elasticsearchService.indexEntities).not.toHaveBeenCalled()
                        expect(elasticsearchService.pruneOrphans).toHaveBeenCalledWith({
                            entity: UserEntity.name,
                            ids: [],
                        })
                        expect(result).toEqual({
                            indexed: 0,
                            pruned: 0,
                        })
                    })

                it("surfaces the prune count returned by the ES service",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([
                            makeUser(),
                        ])
                        elasticsearchService.pruneOrphans.mockResolvedValueOnce(3)

                        const result = await service.reindexAll()

                        expect(result.pruned).toBe(3)
                    })
            })
    })
