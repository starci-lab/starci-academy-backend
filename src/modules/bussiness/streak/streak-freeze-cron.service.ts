import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Cron,
    CronExpression,
} from "@nestjs/schedule"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserStatsProjectionService,
} from "../projections"
import type {
    StreakFreezeCandidate,
    StreakFreezeProtectIdRow,
} from "./types"

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
@Injectable()
export class StreakFreezeCronService {
    /** Logger scoped to this service for easy grep of auto-protect runs. */
    private readonly logger = new Logger(StreakFreezeCronService.name)

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userStatsProjectionService: UserStatsProjectionService,
    ) {}

    /**
     * Run the auto-protect sweep once per day (01:00 Asia/Ho_Chi_Minh, after the
     * day boundary so "yesterday" is fully settled). Any failure is logged and
     * swallowed so a bad run can never crash the scheduler — the sweep is
     * idempotent (the unique (user, date) row makes a re-run a no-op).
     */
    @Cron(
        CronExpression.EVERY_DAY_AT_1AM,
        {
            name: "streak-freeze-auto-protect",
            timeZone: "Asia/Ho_Chi_Minh",
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
            this.logger.log(`Streak-freeze auto-protect processed ${candidates.length} user(s)`)
        } catch (error) {
            // normalize + log (Error-style: message + stack) and swallow — next day self-heals
            const cause = error instanceof Error ? error : new Error(String(error))
            this.logger.error(cause.message,
                cause.stack)
        }
    }

    /**
     * Protect ONE candidate user for yesterday: decrement a freeze, insert the
     * protected day, and recompute their stats — all in one transaction. A
     * conditional UPDATE (`streak_freezes > 0`) guards against a freeze spent
     * between the candidate query and this txn (then the insert is skipped).
     *
     * @param userId - the user to protect.
     */
    private async protectUser(userId: string): Promise<void> {
        await this.entityManager.transaction(async (manager) => {
            // decrement only if a freeze is still available (race-safe); 0 rows
            // affected means it was spent elsewhere → skip the protection
            const updateResult = await manager.query<Array<StreakFreezeProtectIdRow>>(
                `UPDATE users
                 SET streak_freezes = streak_freezes - 1
                 WHERE id = $1 AND streak_freezes > 0
                 RETURNING id`,
                [
                    userId,
                ],
            )
            if (updateResult.length === 0) {
                return
            }
            // insert yesterday as a protected day (idempotent on the unique (user, date))
            await manager.query(
                `INSERT INTO streak_protected_days (user_id, date)
                 VALUES ($1, (CURRENT_DATE - 1)::date)
                 ON CONFLICT ON CONSTRAINT uq_streak_protected_days_user_date DO NOTHING`,
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
     * day before yesterday (`CURRENT_DATE - 2`) but INACTIVE yesterday
     * (`CURRENT_DATE - 1`). "Active" = an XP event OR an existing protected day on
     * that calendar day. This is a single set-based scan (no per-user loop).
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
                    WHERE x.user_id = u.id AND x.created_at::date = CURRENT_DATE - 2
                ) OR EXISTS (
                    SELECT 1 FROM streak_protected_days spd
                    WHERE spd.user_id = u.id AND spd.date = (CURRENT_DATE - 2)::date
                )
              )
              -- inactive yesterday (the miss we want to cover)
              AND NOT EXISTS (
                SELECT 1 FROM xp_histories x
                WHERE x.user_id = u.id AND x.created_at::date = CURRENT_DATE - 1
              )
              AND NOT EXISTS (
                SELECT 1 FROM streak_protected_days spd
                WHERE spd.user_id = u.id AND spd.date = (CURRENT_DATE - 1)::date
              )
        `
    }
}
