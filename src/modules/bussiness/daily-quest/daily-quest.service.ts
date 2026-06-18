import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    DailyQuestCompletionEntity,
    DailyQuestKey,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
    XpSource,
} from "@modules/databases"
import {
    DailyQuestAlreadyClaimedException,
    DailyQuestNotCompleteException,
} from "@modules/exceptions"
import {
    writeXpHistory,
} from "@features/api/processors/ai/shared/xp"
import {
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
const QUEST_TIMEZONE = "Asia/Ho_Chi_Minh"

/**
 * Daily-quest business logic. The quest is per-request DERIVED from TODAY's
 * (Asia/Ho_Chi_Minh) activity — read lessons + passed challenges come from the
 * `xp_histories` ledger, flashcard reviews from `user_flashcard_reviews` — so it
 * needs no projection table. Completing every task and claiming once per VN day
 * grants a flat reward via {@link writeXpHistory}; the grant is made idempotent
 * by the `(user_id, quest_date)` unique row on `daily_quest_completions`.
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
              ), 0) AS "flashcardsToday"
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
        }
        return DAILY_QUEST_TASKS.map((task) => ({
            key: task.key,
            current: currentByKey[task.key],
            target: task.target,
        }))
    }

    /**
     * Read the viewer's daily quest for today: each task's progress + target,
     * whether everything is done, and whether the reward was already claimed.
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
        const allDone = tasks.every((task) => task.current >= task.target)
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
     * the quest is incomplete or already claimed today.
     *
     * @param userId - the claiming user's id.
     * @returns the user's refreshed reward-points balance.
     */
    async claimReward(userId: string): Promise<ClaimDailyQuestResult> {
        return this.entityManager.transaction(async (manager) => {
            const date = await this.getTodayDate(manager)
            const counts = await this.getTodayCounts(manager,
                userId)
            const tasks = this.buildTasks(counts)
            const allDone = tasks.every((task) => task.current >= task.target)
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
                    rewardPoints: DAILY_QUEST_REWARD,
                })
            // grant the flat reward via the shared ledger helper (points only, no XP).
            // refId is unique per user+day so the grant is idempotent on its own too.
            await writeXpHistory({
                entityManager: manager,
                userId,
                courseId: null,
                source: XpSource.DailyQuest,
                amount: 0,
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
                        rewardPoints: true,
                    },
                })
            return {
                balance: user.rewardPoints,
            }
        })
    }
}
