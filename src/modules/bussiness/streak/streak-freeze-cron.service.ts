import {
    Injectable,
} from "@nestjs/common"
import {
    Cron,
    CronExpression,
} from "@nestjs/schedule"
import {
    EntityManager,
} from "typeorm"
import {
    APP_TIMEZONE,
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    UserStatsProjectionService,
} from "../projections/user-stats/user-stats-projection.service"
import type {
    StreakFreezeCandidate,
    StreakFreezeProtectIdRow,
} from "./types"

@Injectable()
/**
 * Daily auto-protect cron for streak freezes. Once a day it finds users who had
 * a live streak (were active the day before yesterday) but missed yesterday and
 * still own at least one freeze, then spends one freeze to insert a protected
 * day for YESTERDAY and recomputes their stats so the streak survives the miss.
 *
 * "Active" on a day means the user earned XP that day OR already had a protected
 * day for it (so a previously-protected day keeps the chain alive). The work is
 * split off {@link StreakService} only to keep the cron wiring tidy; the candidate
 * lookup is a single set-based query and each protection is its own short txn.
 */
export class StreakFreezeCronService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userStatsProjectionService: UserStatsProjectionService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Run the auto-protect sweep once per day (01:00 Asia/Ho_Chi_Minh, after the
     * day boundary so "yesterday" is fully settled). Any failure is logged and
     * swallowed so a bad run can never crash the scheduler -- the sweep is
     * idempotent (the unique (user, date) row makes a re-run a no-op).
     */
    @Cron(
        CronExpression.EVERY_DAY_AT_1AM,
        {
            name: "streak-freeze-auto-protect",
            timeZone: APP_TIMEZONE,
        },
    )
    async consumeStreakFreezeForMisses(): Promise<void> {
        try {
            // single set-based query for every user that should be auto-protected
            const candidates = await this.entityManager.query<Array<StreakFreezeCandidate>>(
                this.buildCandidateSql(),
            )
            // protect each candidate in its own short transaction
            for (const candidate of candidates) {
                await this.protectUser(candidate.user_id)
            }
            // confirm completion so ops can see the sweep ran
            this.winstonService.log(WinstonLog.CronTickCompleted,
                {
                    op: "cron.streak-freeze.completed",
                    count: candidates.length,
                })
        } catch (error) {
            // normalize + log (Error-style: message + stack) and swallow -- next day self-heals
            const cause = error instanceof Error ? error : new Error(String(error))
            this.winstonService.log(WinstonLog.CronTickFailed,
                {
                    op: "cron.streak-freeze.failed",
                    error: cause.message,
                })
        }
    }

    /**
     * Protect ONE candidate user for yesterday: insert the protected day FIRST,
     * then decrement a freeze, and recompute their stats -- all in one transaction.
     * The idempotent insert (`ON CONFLICT ... DO NOTHING RETURNING id`) reports
     * whether THIS txn is the one that actually created the protected-day row --
     * a concurrent replica racing the same user+day gets 0 rows back and skips
     * both the decrement and the recompute, so a freeze is spent AT MOST ONCE
     * per protected day even with no cross-replica lock.
     *
     * @param userId - the user to protect.
     */
    private async protectUser(userId: string): Promise<void> {
        await this.entityManager.transaction(async (manager) => {
            // insert yesterday as a protected day (idempotent on the unique (user,
            // date)); RETURNING id tells us whether THIS txn won the insert race
            const insertResult = await manager.query<Array<StreakFreezeProtectIdRow>>(
                `INSERT INTO streak_protected_days (user_id, date)
                 VALUES ($1, ((now() AT TIME ZONE '${APP_TIMEZONE}')::date - 1))
                 ON CONFLICT ON CONSTRAINT uq_streak_protected_days_user_date DO NOTHING
                 RETURNING id`,
                [
                    userId,
                ],
            )
            if (insertResult.length === 0) {
                // the day is already protected (this run or a racing replica already
                // did it) -- nothing new to protect, so no freeze should be spent
                return
            }
            // only the txn that actually inserted the protected day may spend a
            // freeze for it (race-safe); 0 rows affected means the freeze was
            // spent elsewhere, so the day stays protected without a spend
            await manager.query<Array<StreakFreezeProtectIdRow>>(
                `UPDATE users
                 SET streak_freezes = streak_freezes - 1
                 WHERE id = $1 AND streak_freezes > 0
                 RETURNING id`,
                [
                    userId,
                ],
            )
            // recompute the user's stats in the same txn so the streak reflects the
            // freshly-protected day immediately
            await this.userStatsProjectionService.recompute({
                userId,
                entityManager: manager,
            })
        })
    }

    /**
     * Build the candidate query: users with a freeze in stock who were ACTIVE the
     * day before yesterday (VN "today" - 2) but INACTIVE yesterday (VN "today" -
     * 1). "Active" = an XP event OR an existing protected day on that calendar
     * day, with the day boundary reckoned in {@link APP_TIMEZONE} -- matching the
     * VN-cast day boundary the streak projection itself now uses, so the cron's
     * notion of "yesterday" can never drift from the projection's. This is a
     * single set-based scan (no per-user loop).
     *
     * @returns the parameterless candidate SQL.
     */
    private buildCandidateSql(): string {
        return `
            SELECT u.id AS user_id
            FROM users u
            WHERE u.streak_freezes > 0
              AND u.is_deleted = false
              -- active the day before yesterday (live streak running into yesterday)
              AND (
                EXISTS (
                    SELECT 1 FROM xp_histories x
                    WHERE x.user_id = u.id
                      AND (x.created_at AT TIME ZONE '${APP_TIMEZONE}')::date
                        = (now() AT TIME ZONE '${APP_TIMEZONE}')::date - 2
                ) OR EXISTS (
                    SELECT 1 FROM streak_protected_days spd
                    WHERE spd.user_id = u.id
                      AND spd.date = ((now() AT TIME ZONE '${APP_TIMEZONE}')::date - 2)
                )
              )
              -- inactive yesterday (the miss we want to cover)
              AND NOT EXISTS (
                SELECT 1 FROM xp_histories x
                WHERE x.user_id = u.id
                  AND (x.created_at AT TIME ZONE '${APP_TIMEZONE}')::date
                    = (now() AT TIME ZONE '${APP_TIMEZONE}')::date - 1
              )
              AND NOT EXISTS (
                SELECT 1 FROM streak_protected_days spd
                WHERE spd.user_id = u.id
                  AND spd.date = ((now() AT TIME ZONE '${APP_TIMEZONE}')::date - 1)
              )
        `
    }
}
