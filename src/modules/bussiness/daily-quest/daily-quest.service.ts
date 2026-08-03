import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    QueryFailedError,
} from "typeorm"
import {
    APP_TIMEZONE,
} from "@modules/common"
import {
    CoinSource,
    DailyQuestCompletionEntity,
    DailyQuestKey,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    DailyQuestAlreadyClaimedException,
    DailyQuestNotCompleteException,
} from "@modules/exceptions"
import {
    writeCoinHistory,
} from "@features/api/processors/ai/shared/xp"
import {
    DAILY_QUEST_MIN_TASKS_REQUIRED,
    DAILY_QUEST_REWARD,
    DAILY_QUEST_TASKS,
} from "./daily-quest.catalog"
import type {
    ClaimDailyQuestResult,
    DailyQuestClaimedRow,
    DailyQuestResult,
    DailyQuestTaskResult,
    DailyQuestTodayCountsRow,
    DailyQuestTodayDateRow,
} from "./types"

/** The IANA timezone the "daily" calendar day is reckoned in. */
const QUEST_TIMEZONE = APP_TIMEZONE

/** Postgres unique-violation SQLSTATE — a concurrent duplicate lost the idempotency race. */
const PG_UNIQUE_VIOLATION = "23505"

/**
 * Daily-quest business logic. The quest is per-request DERIVED from TODAY's
 * (Asia/Ho_Chi_Minh) activity — read lessons + passed challenges come from the
 * `xp_histories` ledger, flashcard reviews from `user_flashcard_reviews`, mock
 * interview sessions from `mock_interview_attempts`, and flashcard quiz
 * sessions from `flashcard_quiz_sessions` — so it needs no projection table.
 * Completing at least {@link DAILY_QUEST_MIN_TASKS_REQUIRED} of the 5 tasks and
 * claiming once per VN day grants a flat reward via {@link writeXpHistory};
 * the grant is made idempotent by the `(user_id, quest_date)` unique row on
 * `daily_quest_completions`.
 */
@Injectable()
export class DailyQuestService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /** Today's Asia/Ho_Chi_Minh calendar day as `YYYY-MM-DD`. */
    private async getTodayDate(manager: EntityManager): Promise<string> {
        const rows = await manager.query<Array<DailyQuestTodayDateRow>>(
            `
            SELECT to_char((now() AT TIME ZONE $1)::date, 'YYYY-MM-DD') AS today
            `,
            [
                QUEST_TIMEZONE,
            ],
        )
        return rows[0].today
    }

    /** TODAY's (VN) per-type activity counts for one user. */
    private async getTodayCounts(
        manager: EntityManager,
        userId: string,
    ): Promise<DailyQuestTodayCountsRow> {
        const rows = await manager.query<Array<DailyQuestTodayCountsRow>>(
            `
            SELECT
              COALESCE((
                SELECT COUNT(*) FROM xp_histories
                WHERE user_id = $1 AND source = 'lessonRead'
                  AND (created_at AT TIME ZONE $2)::date
                    = (now() AT TIME ZONE $2)::date
              ), 0) AS "lessonsToday",
              COALESCE((
                SELECT COUNT(*) FROM xp_histories
                WHERE user_id = $1 AND source = 'challenge'
                  AND (created_at AT TIME ZONE $2)::date
                    = (now() AT TIME ZONE $2)::date
              ), 0) AS "challengesToday",
              COALESCE((
                SELECT COUNT(*) FROM user_flashcard_reviews
                WHERE user_id = $1
                  AND (last_reviewed_at AT TIME ZONE $2)::date
                    = (now() AT TIME ZONE $2)::date
              ), 0) AS "flashcardsToday",
              COALESCE((
                SELECT COUNT(*) FROM mock_interview_attempts
                JOIN enrollments ON enrollments.id = mock_interview_attempts.enrollment_id
                WHERE enrollments.user_id = $1
                  AND (mock_interview_attempts.created_at AT TIME ZONE $2)::date
                    = (now() AT TIME ZONE $2)::date
              ), 0) AS "mockInterviewToday",
              COALESCE((
                SELECT COUNT(*) FROM flashcard_quiz_sessions
                JOIN enrollments ON enrollments.id = flashcard_quiz_sessions.enrollment_id
                WHERE enrollments.user_id = $1
                  AND flashcard_quiz_sessions.status = 'completed'
                  AND (flashcard_quiz_sessions.updated_at AT TIME ZONE $2)::date
                    = (now() AT TIME ZONE $2)::date
              ), 0) AS "quizSessionToday"
            `,
            [
                userId,
                QUEST_TIMEZONE,
            ],
        )
        return rows[0]
    }

    /** Whether the user already has a completion row for the given VN day. */
    private async hasClaimedToday(
        manager: EntityManager,
        userId: string,
        questDate: string,
    ): Promise<boolean> {
        const rows = await manager.query<Array<DailyQuestClaimedRow>>(
            `
            SELECT COUNT(*) AS claimed
            FROM daily_quest_completions
            WHERE user_id = $1 AND quest_date = $2
            `,
            [
                userId,
                questDate,
            ],
        )
        return Number(rows[0]?.claimed) > 0
    }

    /** Map TODAY's raw counts onto each catalog task's `current` value. */
    private buildTasks(counts: DailyQuestTodayCountsRow): Array<DailyQuestTaskResult> {
        // the current value for each task, keyed by DailyQuestKey
        const currentByKey: Record<DailyQuestKey, number> = {
            [DailyQuestKey.ReadContent]: Number(counts.lessonsToday) || 0,
            [DailyQuestKey.PassChallenge]: Number(counts.challengesToday) || 0,
            [DailyQuestKey.ReviewFlashcards]: Number(counts.flashcardsToday) || 0,
            [DailyQuestKey.MockInterview]: Number(counts.mockInterviewToday) || 0,
            [DailyQuestKey.QuizSession]: Number(counts.quizSessionToday) || 0,
        }
        return DAILY_QUEST_TASKS.map((task) => ({
            key: task.key,
            current: currentByKey[task.key],
            target: task.target,
        }))
    }

    /**
     * Read the viewer's daily quest for today: each task's progress + target,
     * whether at least {@link DAILY_QUEST_MIN_TASKS_REQUIRED} of the tasks are
     * done, and whether the reward was already claimed.
     *
     * @param userId - the viewing user's id.
     * @returns the resolved daily-quest state.
     */
    async getMyDailyQuest(userId: string): Promise<DailyQuestResult> {
        const date = await this.getTodayDate(this.entityManager)
        const counts = await this.getTodayCounts(this.entityManager,
            userId)
        const claimed = await this.hasClaimedToday(this.entityManager,
            userId,
            date)
        const tasks = this.buildTasks(counts)
        const completedCount = tasks.filter((task) => task.current >= task.target).length
        const allDone = completedCount >= DAILY_QUEST_MIN_TASKS_REQUIRED
        return {
            date,
            tasks,
            allDone,
            claimed,
            reward: DAILY_QUEST_REWARD,
        }
    }

    /**
     * Claim the daily-quest reward. Runs the completeness + already-claimed checks,
     * the reward grant, and the completion insert in ONE transaction so a
     * concurrent double-claim cannot double-credit. Throws a typed exception when
     * fewer than {@link DAILY_QUEST_MIN_TASKS_REQUIRED} tasks are done or the
     * quest was already claimed today — including when a RACING concurrent claim
     * wins the (user_id, quest_date) unique-constraint backstop: the loser's raw
     * `QueryFailedError` (SQLSTATE 23505) is caught and translated into the same
     * typed exception the sequential already-claimed check throws.
     *
     * @param userId - the claiming user's id.
     * @returns the user's refreshed Coin balance.
     */
    async claimReward(userId: string): Promise<ClaimDailyQuestResult> {
        // captured from inside the tx so the catch block can report the right day
        let date: string | undefined
        try {
            return await this.entityManager.transaction(async (manager) => {
                date = await this.getTodayDate(manager)
                const counts = await this.getTodayCounts(manager,
                    userId)
                const tasks = this.buildTasks(counts)
                const completedCount = tasks.filter((task) => task.current >= task.target).length
                const allDone = completedCount >= DAILY_QUEST_MIN_TASKS_REQUIRED
                if (!allDone) {
                    throw new DailyQuestNotCompleteException({
                        date,
                    })
                }
                if (await this.hasClaimedToday(manager,
                    userId,
                    date)) {
                    throw new DailyQuestAlreadyClaimedException({
                        date,
                    })
                }
                // record the completion first — the (user_id, quest_date) unique row is
                // the idempotency backstop against a racing concurrent claim
                await manager.insert(DailyQuestCompletionEntity,
                    {
                        userId,
                        questDate: date,
                        coinReward: DAILY_QUEST_REWARD,
                    })
                // grant the flat reward via the shared coin ledger helper (never XP).
                // refId is unique per user+day so the grant is idempotent on its own too.
                await writeCoinHistory({
                    entityManager: manager,
                    userId,
                    source: CoinSource.DailyQuest,
                    points: DAILY_QUEST_REWARD,
                    refId: `daily:${date}`,
                })
                // read back the credited balance for the response
                const user = await manager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: userId,
                        },
                        select: {
                            id: true,
                            coinBalance: true,
                        },
                    })
                return {
                    balance: user.coinBalance,
                }
            })
        } catch (error) {
            // a concurrent duplicate lost the unique race → translate to the same
            // typed exception the sequential already-claimed check throws above
            if (error instanceof QueryFailedError
                && (error.driverError as { code?: string } | undefined)?.code === PG_UNIQUE_VIOLATION) {
                throw new DailyQuestAlreadyClaimedException({
                    date: date as string,
                })
            }
            throw error
        }
    }
}
