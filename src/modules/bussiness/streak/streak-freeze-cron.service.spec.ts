import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    StreakFreezeCronService,
} from "./streak-freeze-cron.service"
import {
    UserStatsProjectionService,
} from "../projections/user-stats/user-stats-projection.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("StreakFreezeCronService",
    () => {
        let module: TestingModule
        let service: StreakFreezeCronService
        let entityManager: EntityManagerMock
        let userStatsProjectionService: jest.Mocked<UserStatsProjectionService>

        let winstonLogSpy: jest.Mock

        const userId = "user-1"

        beforeEach(async () => {
            winstonLogSpy = jest.fn()
            entityManager = makeEntityManagerMock()
            userStatsProjectionService = {
                recompute: jest.fn(),
            } as unknown as jest.Mocked<UserStatsProjectionService>

            module = await Test.createTestingModule({
                providers: [
                    StreakFreezeCronService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: UserStatsProjectionService,
                        useValue: userStatsProjectionService,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: winstonLogSpy,
                        },
                    },
                ],
            }).compile()

            service = module.get<StreakFreezeCronService>(StreakFreezeCronService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("consumeStreakFreezeForMisses",
            () => {
                it("does nothing when the candidate scan finds no one to protect",
                    async () => {
                        // the single set-based candidate query -- empty result
                        entityManager.query.mockResolvedValueOnce([])

                        await service.consumeStreakFreezeForMisses()

                        expect(entityManager.transaction).not.toHaveBeenCalled()
                        expect(userStatsProjectionService.recompute).not.toHaveBeenCalled()
                    })

                it("round-2: protects a candidate — inserts the protected day FIRST, then decrements a freeze and recomputes stats",
                    async () => {
                        entityManager.query
                            // candidate scan
                            .mockResolvedValueOnce([
                                {
                                    user_id: userId,
                                },
                            ])
                            // INSERT ... ON CONFLICT DO NOTHING RETURNING id -- this replica won the race
                            .mockResolvedValueOnce([
                                {
                                    id: "protected-day-1",
                                },
                            ])
                            // UPDATE users SET streak_freezes = streak_freezes - 1 ... RETURNING id
                            .mockResolvedValueOnce([
                                {
                                    id: userId,
                                },
                            ])

                        await service.consumeStreakFreezeForMisses()

                        expect(entityManager.query).toHaveBeenCalledTimes(3)
                        // the insert must run BEFORE the decrement (idempotency backstop first)
                        const [
                            insertSql,
                        ] = entityManager.query.mock.calls[1]
                        expect(insertSql).toContain("INSERT INTO streak_protected_days")
                        const [
                            updateSql,
                        ] = entityManager.query.mock.calls[2]
                        expect(updateSql).toContain("streak_freezes = streak_freezes - 1")
                        // recompute runs in the SAME transactional manager
                        expect(userStatsProjectionService.recompute).toHaveBeenCalledWith({
                            userId,
                            entityManager,
                        })
                    })

                it("round-2: a lost insert race (0 rows) skips BOTH the decrement and the recompute",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    user_id: userId,
                                },
                            ])
                            // a racing replica already inserted the protected day -- 0 rows back
                            .mockResolvedValueOnce([])

                        await service.consumeStreakFreezeForMisses()

                        // only the candidate scan + the losing insert attempt ran
                        expect(entityManager.query).toHaveBeenCalledTimes(2)
                        expect(userStatsProjectionService.recompute).not.toHaveBeenCalled()
                    })

                it("removes a provisional protected day when freeze stock vanished after the scan",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([{
                                user_id: userId,
                            }])
                            .mockResolvedValueOnce([{
                                id: "protected-day-1",
                            }])
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([])

                        await service.consumeStreakFreezeForMisses()

                        expect(entityManager.query).toHaveBeenLastCalledWith(
                            "DELETE FROM streak_protected_days WHERE id = $1",
                            ["protected-day-1"],
                        )
                        expect(userStatsProjectionService.recompute).not.toHaveBeenCalled()
                    })

                it("protects every candidate returned by the scan (loop over the set)",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    user_id: "user-1",
                                },
                                {
                                    user_id: "user-2",
                                },
                            ])
                            // user-1: wins the insert race
                            .mockResolvedValueOnce([
                                {
                                    id: "protected-day-1",
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    id: "user-1",
                                },
                            ])
                            // user-2: loses the insert race
                            .mockResolvedValueOnce([])

                        await service.consumeStreakFreezeForMisses()

                        expect(userStatsProjectionService.recompute).toHaveBeenCalledTimes(1)
                        expect(userStatsProjectionService.recompute).toHaveBeenCalledWith({
                            userId: "user-1",
                            entityManager,
                        })
                    })

                it("swallows a failure and logs it rather than throwing (next day self-heals)",
                    async () => {
                        const failure = new Error("connection terminated")
                        entityManager.query.mockRejectedValueOnce(failure)

                        await expect(
                            service.consumeStreakFreezeForMisses(),
                        ).resolves.toBeUndefined()

                        expect(winstonLogSpy).toHaveBeenCalledWith(
                            WinstonLog.CronTickFailed,
                            expect.objectContaining({
                                op: "cron.streak-freeze.failed",
                                error: failure.message,
                            }),
                        )
                    })
            })
    })
