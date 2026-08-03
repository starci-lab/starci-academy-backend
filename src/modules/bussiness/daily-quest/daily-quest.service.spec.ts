import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    QueryFailedError,
} from "typeorm"
import {
    DailyQuestService,
} from "./daily-quest.service"
import {
    DAILY_QUEST_MIN_TASKS_REQUIRED,
    DAILY_QUEST_REWARD,
} from "./daily-quest.catalog"
import {
    DailyQuestAlreadyClaimedException,
    DailyQuestNotCompleteException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    DailyQuestTodayCountsRow,
} from "./types"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** {@link EntityManagerMock} widened with the raw `insert` the completion row needs. */
type EntityManagerMockWithInsert = EntityManagerMock & {
    insert: jest.Mock
}

/** Postgres unique-violation SQLSTATE the concurrent-claim path translates. */
const PG_UNIQUE_VIOLATION = "23505"

describe("DailyQuestService",
    () => {
        let module: TestingModule
        let service: DailyQuestService
        let entityManager: EntityManagerMockWithInsert

        const userId = "user-1"
        const today = "2026-08-04"

        /** Today's-date row `manager.query` resolves for `getTodayDate`. */
        const dateRow = [
            {
                today,
            },
        ]

        /**
         * Build the raw "today counts" row. `DAILY_QUEST_TASKS` (in catalog order) is
         * ReadContent(target 1), PassChallenge(target 1), ReviewFlashcards(target 5),
         * MockInterview(target 1), QuizSession(target 1).
         */
        const countsRow = (
            counts: Partial<DailyQuestTodayCountsRow>,
        ): Array<DailyQuestTodayCountsRow> => [
            {
                lessonsToday: "0",
                challengesToday: "0",
                flashcardsToday: "0",
                mockInterviewToday: "0",
                quizSessionToday: "0",
                ...counts,
            },
        ]

        // exactly DAILY_QUEST_MIN_TASKS_REQUIRED (3) of the 5 tasks done
        const threeTasksDone = countsRow({
            lessonsToday: "1",
            challengesToday: "1",
            flashcardsToday: "5",
        })

        // only 2 of the 5 tasks done — below the threshold
        const twoTasksDone = countsRow({
            lessonsToday: "1",
            challengesToday: "1",
        })

        /** Build the "already claimed today" existence row. */
        const claimedRow = (claimed: boolean) => [
            {
                claimed: claimed ? "1" : "0",
            },
        ]

        beforeEach(async () => {
            entityManager = makeEntityManagerMock() as EntityManagerMockWithInsert
            // the completion row is a raw `insert` — not part of the shared mock's
            // typed surface, so it is programmed locally per this suite
            entityManager.insert = jest.fn().mockResolvedValue({
                identifiers: [
                    {
                        id: "completion-1",
                    },
                ],
                generatedMaps: [],
                raw: [],
            })

            module = await Test.createTestingModule({
                providers: [
                    DailyQuestService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<DailyQuestService>(DailyQuestService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getMyDailyQuest",
            () => {
                it(`resolves allDone = true once >= ${DAILY_QUEST_MIN_TASKS_REQUIRED} tasks are complete`,
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce(dateRow)
                            .mockResolvedValueOnce(threeTasksDone)
                            .mockResolvedValueOnce(claimedRow(false))

                        const result = await service.getMyDailyQuest(userId)

                        expect(result.allDone).toBe(true)
                        expect(result.date).toBe(today)
                        expect(result.reward).toBe(DAILY_QUEST_REWARD)
                        expect(result.claimed).toBe(false)
                    })

                it(`resolves allDone = false when fewer than ${DAILY_QUEST_MIN_TASKS_REQUIRED} tasks are complete`,
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce(dateRow)
                            .mockResolvedValueOnce(twoTasksDone)
                            .mockResolvedValueOnce(claimedRow(false))

                        const result = await service.getMyDailyQuest(userId)

                        expect(result.allDone).toBe(false)
                    })

                it("resolves claimed = true when a completion row already exists for today",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce(dateRow)
                            .mockResolvedValueOnce(threeTasksDone)
                            .mockResolvedValueOnce(claimedRow(true))

                        const result = await service.getMyDailyQuest(userId)

                        expect(result.claimed).toBe(true)
                    })
            })

        describe("claimReward",
            () => {
                it(`throws DailyQuestNotCompleteException when fewer than ${DAILY_QUEST_MIN_TASKS_REQUIRED} tasks are done`,
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce(dateRow)
                            .mockResolvedValueOnce(twoTasksDone)

                        await expect(
                            service.claimReward(userId),
                        ).rejects.toBeInstanceOf(DailyQuestNotCompleteException)
                        // the incompleteness check short-circuits before touching the ledger
                        expect(entityManager.insert).not.toHaveBeenCalled()
                        expect(entityManager.increment).not.toHaveBeenCalled()
                    })

                it("throws DailyQuestAlreadyClaimedException when today was already claimed (sequential check)",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce(dateRow)
                            .mockResolvedValueOnce(threeTasksDone)
                            .mockResolvedValueOnce(claimedRow(true))

                        await expect(
                            service.claimReward(userId),
                        ).rejects.toBeInstanceOf(DailyQuestAlreadyClaimedException)
                        expect(entityManager.insert).not.toHaveBeenCalled()
                    })

                it("claims: inserts the completion row, credits Coin, and returns the refreshed balance",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce(dateRow)
                            .mockResolvedValueOnce(threeTasksDone)
                            .mockResolvedValueOnce(claimedRow(false))
                        // writeCoinHistory's idempotency read finds nothing yet
                        entityManager.findOne.mockResolvedValueOnce(null)
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 120,
                        })

                        const result = await service.claimReward(userId)

                        // the (user_id, quest_date) unique row is the idempotency backstop
                        expect(entityManager.insert).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                userId,
                                questDate: today,
                                coinReward: DAILY_QUEST_REWARD,
                            }),
                        )
                        // flat reward credited via the shared Coin ledger helper (never XP)
                        expect(entityManager.increment).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: userId,
                            },
                            "coinBalance",
                            DAILY_QUEST_REWARD,
                        )
                        expect(result).toEqual({
                            balance: 120,
                        })
                    })

                it("round-2: translates a concurrent 23505 unique-violation into DailyQuestAlreadyClaimedException, not the raw error",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce(dateRow)
                            .mockResolvedValueOnce(threeTasksDone)
                            // this replica's own sequential check still sees "not claimed" —
                            // the race is lost only at the unique-constrained insert below
                            .mockResolvedValueOnce(claimedRow(false))
                        const raceError = new QueryFailedError(
                            "INSERT INTO daily_quest_completions (...)",
                            [],
                            Object.assign(
                                new Error("duplicate key value violates unique constraint \"UQ_daily_quest_completions_user_date\""),
                                {
                                    code: PG_UNIQUE_VIOLATION,
                                },
                            ),
                        )
                        entityManager.insert.mockRejectedValueOnce(raceError)

                        const rejection = service.claimReward(userId)

                        await expect(rejection).rejects.toBeInstanceOf(DailyQuestAlreadyClaimedException)
                        await expect(rejection).rejects.not.toBeInstanceOf(QueryFailedError)
                        // the raw driver error must never leak past the translation
                        await expect(rejection).rejects.not.toBe(raceError)
                        // the loser never reaches the coin grant
                        expect(entityManager.increment).not.toHaveBeenCalled()
                    })

                it("rethrows a QueryFailedError with a different SQLSTATE unchanged (not a claim race)",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce(dateRow)
                            .mockResolvedValueOnce(threeTasksDone)
                            .mockResolvedValueOnce(claimedRow(false))
                        const otherError = new QueryFailedError(
                            "INSERT INTO daily_quest_completions (...)",
                            [],
                            Object.assign(
                                new Error("null value in column \"quest_date\" violates not-null constraint"),
                                {
                                    code: "23502",
                                },
                            ),
                        )
                        entityManager.insert.mockRejectedValueOnce(otherError)

                        await expect(
                            service.claimReward(userId),
                        ).rejects.toBe(otherError)
                    })

                it("rethrows a non-QueryFailedError failure unchanged",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce(dateRow)
                            .mockResolvedValueOnce(threeTasksDone)
                            .mockResolvedValueOnce(claimedRow(false))
                        const failure = new Error("connection terminated")
                        entityManager.insert.mockRejectedValueOnce(failure)

                        await expect(
                            service.claimReward(userId),
                        ).rejects.toBe(failure)
                    })
            })
    })
