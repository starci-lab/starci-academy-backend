import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CommunityPostQuotaService,
} from "./community-post-quota.service"
import {
    MembershipService,
} from "@modules/membership"
import {
    DayjsService,
} from "@modules/mixin"
import {
    CommunityPostQuotaExceededException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("CommunityPostQuotaService",
    () => {
        let module: TestingModule
        let service: CommunityPostQuotaService
        let entityManager: EntityManagerMock
        let membershipService: jest.Mocked<Pick<MembershipService, "isActive">>

        const userId = "user-1"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // membership gate stub — the SUT short-circuits on an active member
            membershipService = {
                isActive: jest.fn(),
            } as unknown as jest.Mocked<Pick<MembershipService, "isActive">>

            module = await Test.createTestingModule({
                providers: [
                    CommunityPostQuotaService,
                    {
                        provide: MembershipService,
                        useValue: membershipService,
                    },
                    // DayjsService is a pure dayjs wrapper (no I/O) → use the real one
                    DayjsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<CommunityPostQuotaService>(CommunityPostQuotaService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("assertCanCreatePost",
            () => {
                it("is a no-op for an active member without counting any posts",
                    async () => {
                        membershipService.isActive.mockResolvedValueOnce(true)

                        await expect(
                            service.assertCanCreatePost({
                                userId,
                            }),
                        ).resolves.toBeUndefined()

                        // members are never rate-limited → short-circuits before any count
                        expect(entityManager.count).not.toHaveBeenCalled()
                    })

                it("allows a non-member whose recent post count is under the cap",
                    async () => {
                        membershipService.isActive.mockResolvedValueOnce(false)
                        // default cap is 3 → 2 recent posts is still under it
                        entityManager.count.mockResolvedValueOnce(2)

                        await expect(
                            service.assertCanCreatePost({
                                userId,
                            }),
                        ).resolves.toBeUndefined()
                    })

                it("counts this author's posts inside the rolling window (deleted rows included)",
                    async () => {
                        membershipService.isActive.mockResolvedValueOnce(false)
                        entityManager.count.mockResolvedValueOnce(0)

                        await service.assertCanCreatePost({
                            userId,
                        })

                        const [
                            entity,
                            options,
                        ] = entityManager.count.mock.calls[0] as [
                            unknown,
                            {
                                where: {
                                    author: {
                                        id: string
                                    }
                                    createdAt: {
                                        _type: string
                                        _value: Date
                                    }
                                }
                            },
                        ]
                        expect(entity).toBeDefined()
                        // scoped to this author only
                        expect(options.where.author).toEqual({
                            id: userId,
                        })
                        // a MoreThan(...) FindOperator gates the rolling window — note the
                        // query has no isDeleted filter, so a soft-deleted post still counts
                        // toward the quota and a user cannot reset it by deleting
                        expect(options.where.createdAt._type).toBe("moreThan")
                        expect(options.where.createdAt._value).toBeInstanceOf(Date)
                    })

                it("throws CommunityPostQuotaExceededException when the non-member is AT the cap",
                    async () => {
                        membershipService.isActive.mockResolvedValueOnce(false)
                        // default cap is 3 → exactly 3 recent posts trips the >= gate
                        entityManager.count.mockResolvedValueOnce(3)

                        await expect(
                            service.assertCanCreatePost({
                                userId,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostQuotaExceededException)
                    })

                it("throws CommunityPostQuotaExceededException when the non-member is OVER the cap",
                    async () => {
                        membershipService.isActive.mockResolvedValueOnce(false)
                        entityManager.count.mockResolvedValueOnce(9)

                        await expect(
                            service.assertCanCreatePost({
                                userId,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostQuotaExceededException)
                    })
            })
    })
