import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    LeagueService,
} from "./league.service"
import {
    LeagueCohortEntity,
} from "@modules/databases/postgresql/primary/entities/league-cohort.entity"
import {
    UserLeagueEntity,
} from "@modules/databases/postgresql/primary/entities/user-league.entity"
import {
    LeagueTier,
} from "@modules/databases/postgresql/primary/enums/league-tier"
import {
    LeagueCohortPointsProjectionService,
} from "../projections/league-cohort-points/league-cohort-points-projection.service"
import {
    PostgreSqlAdvisoryLockService,
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("LeagueService",
    () => {
        let module: TestingModule
        let service: LeagueService
        let entityManager: EntityManagerMock
        let leagueCohortPointsProjectionService: jest.Mocked<LeagueCohortPointsProjectionService>

        const userId = "user-1"

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.query = jest.fn().mockResolvedValue([])

            leagueCohortPointsProjectionService = {
                getMembers: jest.fn().mockResolvedValue([]),
            } as unknown as jest.Mocked<LeagueCohortPointsProjectionService>

            module = await Test.createTestingModule({
                providers: [
                    LeagueService,
                    {
                        provide: PostgreSqlAdvisoryLockService,
                        useValue: {
                            acquireXactLockByKey: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: LeagueCohortPointsProjectionService,
                        useValue: leagueCohortPointsProjectionService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<LeagueService>(LeagueService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getGlobalLeaderboard",
            () => {
                it("returns viewer-relative follow truth in the top-list query without N+1 reads",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: "leader", username: "leader", avatar: null, points: "50", is_following: true
                                },
                                {
                                    id: userId, username: "viewer", avatar: null, points: "10", is_following: true
                                },
                            ])
                            .mockResolvedValueOnce([{
                                my_points: "10", my_rank: 2
                            }])

                        const result = await service.getGlobalLeaderboard(userId,
                            50)

                        expect(result.entries[0].isFollowing).toBe(true)
                        expect(result.entries[1].isFollowing).toBe(false)
                        expect(entityManager.query).toHaveBeenCalledTimes(2)
                        expect(entityManager.query.mock.calls[0][0]).toContain("user_follows")
                        expect(entityManager.query.mock.calls[0][1]).toEqual([50,
                            userId])
                    })
            })

        describe("placeUserLazily (via getMyStanding)",
            () => {
                it("places a never-seen user into Bronze + a freshly-created open cohort",
                    async () => {
                        // outer read: no league row at all for this user
                        entityManager.findOne.mockResolvedValueOnce(null)
                        // re-read inside the placement transaction: still nothing (no race)
                        entityManager.findOne.mockResolvedValueOnce(null)
                        // findOrCreateOpenCohort: no open Bronze cohort this week
                        entityManager.query.mockResolvedValueOnce([])
                        const createdCohort = {
                            id: "cohort-new",
                            tier: LeagueTier.Bronze,
                            weekEndAt: new Date("2026-08-09T17:00:00.000Z"),
                        } as LeagueCohortEntity
                        entityManager.save.mockResolvedValueOnce(createdCohort)
                        // upsert of the user's league row (return value unused -- re-read below)
                        entityManager.save.mockResolvedValueOnce(undefined)
                        // final re-read with the cohort relation populated
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            userId,
                            tier: LeagueTier.Bronze,
                            cohort: createdCohort,
                        })
                        // last-week-rank lookup (no baseline for a brand-new user)
                        entityManager.query.mockResolvedValueOnce([])

                        const result = await service.getMyStanding(userId)

                        expect(result.tier).toBe(LeagueTier.Bronze)
                        expect(result.weekEndAt).toBe(createdCohort.weekEndAt)
                        // a fresh cohort was created for the new placement
                        expect(entityManager.save).toHaveBeenCalledWith(
                            LeagueCohortEntity,
                            expect.objectContaining({
                                tier: LeagueTier.Bronze,
                            }),
                        )
                    })

                it("keeps the user's already-settled tier when re-placing after their cohort was cleared",
                    async () => {
                        // outer read: a league row exists but has no cohort (cleared by the
                        // just-run weekly reset) -- still routes into placeUserLazily
                        entityManager.findOne.mockResolvedValueOnce({
                            userId,
                            tier: LeagueTier.Gold,
                            cohort: null,
                        })
                        // re-read inside the txn: same settled-but-uncohorted row, no race
                        entityManager.findOne.mockResolvedValueOnce({
                            userId,
                            tier: LeagueTier.Gold,
                            cohort: null,
                        })
                        // no open Gold cohort this week yet
                        entityManager.query.mockResolvedValueOnce([])
                        const createdCohort = {
                            id: "cohort-gold",
                            tier: LeagueTier.Gold,
                            weekEndAt: new Date("2026-08-09T17:00:00.000Z"),
                        } as LeagueCohortEntity
                        entityManager.save.mockResolvedValueOnce(createdCohort)
                        entityManager.save.mockResolvedValueOnce(undefined)
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            userId,
                            tier: LeagueTier.Gold,
                            cohort: createdCohort,
                        })
                        entityManager.query.mockResolvedValueOnce([])

                        const result = await service.getMyStanding(userId)

                        // re-placement must NOT reset an already-settled user back to Bronze
                        expect(result.tier).toBe(LeagueTier.Gold)
                        expect(entityManager.save).toHaveBeenCalledWith(
                            LeagueCohortEntity,
                            expect.objectContaining({
                                tier: LeagueTier.Gold,
                            }),
                        )
                    })

                it("reuses the cohort a racing request already placed, without creating a duplicate",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)
                        const raced = {
                            userId,
                            tier: LeagueTier.Bronze,
                            cohort: {
                                id: "cohort-raced",
                                tier: LeagueTier.Bronze,
                                weekEndAt: new Date("2026-08-09T17:00:00.000Z"),
                            } as LeagueCohortEntity,
                        }
                        // re-read inside the txn: a concurrent request already placed this user
                        entityManager.findOne.mockResolvedValueOnce(raced)
                        // last-week-rank lookup back in getMyStanding
                        entityManager.query.mockResolvedValueOnce([])

                        const result = await service.getMyStanding(userId)

                        expect(result.tier).toBe(LeagueTier.Bronze)
                        // no new cohort or league row was written -- the race winner's row stood
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(entityManager.findOneOrFail).not.toHaveBeenCalled()
                    })
            })

        describe("runWeeklyReset — active-users bucketing",
            () => {
                it("buildActiveUsersSql filters strictly on this-week points — no tautological OR that would re-bucket a dormant member",
                    async () => {
                        // no cohorts are ending this run, and no cohorts exist yet for the
                        // new week -- isolates the assertion to formNewCohorts' bucketing query
                        entityManager.find.mockResolvedValueOnce([])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                user_id: "active-1",
                                tier: LeagueTier.Bronze,
                            },
                        ])

                        await service.runWeeklyReset()

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0]
                        // filters on an actual points-earning event this week...
                        expect(sql).toContain("xp_histories")
                        expect(sql).toContain("WHERE EXISTS")
                        // ...and carries no secondary OR clause that would ALSO match every
                        // existing league row regardless of points earned (the round-4 bug:
                        // a dormant member with 0 points this week got re-bucketed anyway)
                        expect(sql.toUpperCase()).not.toMatch(/\)\s*OR\s/)
                        expect(params).toHaveLength(3)
                    })

                it("only forms a cohort for / reassigns the users the active-users query returned",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([])
                        // the query already excluded the dormant member -- only one active user
                        // comes back, so the bucketing step below must never reference the
                        // dormant user's id anywhere
                        entityManager.query.mockResolvedValueOnce([
                            {
                                user_id: "active-1",
                                tier: LeagueTier.Bronze,
                            },
                        ])
                        const newCohort = {
                            id: "cohort-week2",
                            tier: LeagueTier.Bronze,
                        } as LeagueCohortEntity
                        entityManager.save.mockResolvedValueOnce(newCohort)

                        await service.runWeeklyReset()

                        expect(entityManager.update).toHaveBeenCalledWith(
                            UserLeagueEntity,
                            {
                                userId: [
                                    "active-1",
                                ],
                            },
                            expect.objectContaining({
                                cohort: newCohort,
                            }),
                        )
                        // never touched a "dormant-1" id anywhere in the reassignment
                        const updateCalls = entityManager.update.mock.calls
                        for (const call of updateCalls) {
                            expect(JSON.stringify(call)).not.toContain("dormant-1")
                        }
                    })

                it("is a no-op re-run when the new week's cohorts already exist",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([])
                        entityManager.count.mockResolvedValueOnce(1)

                        await service.runWeeklyReset()

                        // guarded before the bucketing query ever runs
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })

        it("maps rank movement and clamps every tier shift at the ladder ends",
            async () => {
                const cohort = {
                    id: "cohort-1",
                    tier: LeagueTier.Gold,
                    weekEndAt: new Date("2026-08-09T17:00:00.000Z"),
                } as LeagueCohortEntity
                entityManager.findOne.mockResolvedValueOnce({
                    userId,
                    tier: LeagueTier.Gold,
                    cohort,
                })
                leagueCohortPointsProjectionService.getMembers.mockResolvedValueOnce([
                    {
                        userId,
                        username: "viewer",
                        avatar: null,
                        points: 20,
                        rank: 1,
                    },
                ] as never)
                entityManager.query.mockResolvedValueOnce([{
                    user_id: userId,
                    last_week_rank: 3,
                }])

                const result = await service.getMyStanding(userId)

                expect(result.members[0]).toEqual(expect.objectContaining({
                    rankDelta: 2,
                }))
                const exposed = service as unknown as {
                shiftTier: (params: { tier: LeagueTier; promote: boolean; demote: boolean }) => LeagueTier
            }
                expect(exposed.shiftTier({
                    tier: LeagueTier.Bronze,
                    promote: false,
                    demote: true,
                })).toBe(LeagueTier.Bronze)
                expect(exposed.shiftTier({
                    tier: LeagueTier.Legend,
                    promote: true,
                    demote: false,
                })).toBe(LeagueTier.Legend)
                expect(exposed.shiftTier({
                    tier: LeagueTier.Gold,
                    promote: false,
                    demote: false,
                })).toBe(LeagueTier.Gold)
            })

        it("settles cohort members into promoted and demoted tiers",
            async () => {
                const endingCohort = {
                    id: "ending-cohort",
                    tier: LeagueTier.Silver,
                    weekStartAt: new Date("2026-08-02T17:00:00.000Z"),
                    weekEndAt: new Date("2026-08-09T17:00:00.000Z"),
                }
                entityManager.find.mockResolvedValueOnce([endingCohort])
                entityManager.query.mockResolvedValueOnce(Array.from({
                    length: 11
                },
                (_, index) => ({
                    user_id: index === 0 ? "top-user" : index === 10 ? "bottom-user" : `member-${index}`,
                    week_points: 100 - index,
                })))
                const exposed = service as unknown as {
                settleEndingCohorts: (params: { manager: unknown; endingWeekStart: Date }) => Promise<void>
            }

                await exposed.settleEndingCohorts({
                    manager: entityManager,
                    endingWeekStart: endingCohort.weekStartAt,
                })

                expect(entityManager.update).toHaveBeenCalledTimes(11)
                expect(entityManager.update).toHaveBeenNthCalledWith(1,
                    UserLeagueEntity,
                    {
                        userId: "top-user",
                    },
                    expect.objectContaining({
                        tier: LeagueTier.Gold,
                        lastWeekRank: 1,
                    }))
                expect(entityManager.update).toHaveBeenNthCalledWith(11,
                    UserLeagueEntity,
                    {
                        userId: "bottom-user",
                    },
                    expect.objectContaining({
                        tier: LeagueTier.Bronze,
                        lastWeekRank: 11,
                    }))
            })
    })
