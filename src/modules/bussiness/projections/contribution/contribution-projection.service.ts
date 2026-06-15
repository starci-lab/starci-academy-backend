import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserContributionProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    ContributionDayResult,
    ContributionDayValue,
    RecomputeContributionParams,
} from "./types"

/**
 * CQRS projection service for a user's GitHub-style contribution calendar, scoped
 * to ONE calendar year per row. The per-day GROUP BY over the `activities` ledger
 * runs ONLY in {@link recompute}, writing `{ days: [...] }` as the jsonb `value`
 * keyed by `(user_id, year)`. {@link getCalendar} reads the flat row; the current
 * year gets a TTL lazy-refresh (it still grows), past years are immutable once built.
 */
@Injectable()
export class ContributionProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the calendar row for ONE user + year (idempotent UPSERT).
     *
     * @param params - {@link RecomputeContributionParams}
     */
    async recompute(
        {
            userId,
            year,
            entityManager,
        }: RecomputeContributionParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        // single scoped UPSERT building that year's per-day aggregate jsonb
        await manager.query(
            this.buildUpsertSql(),
            [
                userId,
                year,
            ],
        )
    }

    /**
     * Read a user's contribution calendar for one year (TTL lazy-refresh on the
     * current year only).
     *
     * @param userId - the user to read.
     * @param year - the calendar year (e.g. 2025).
     * @returns active days oldest-first, each with its folded total.
     */
    async getCalendar(
        userId: string,
        year: number,
    ): Promise<Array<ContributionDayResult>> {
        // first read of the flat projection row (PK is user_id + year)
        let row = await this.entityManager.findOne(
            UserContributionProjectionEntity,
            {
                where: {
                    userId,
                    year,
                },
            },
        )
        // the current year still grows → TTL-refresh it; past years are immutable
        // once built, so only (re)compute them when the row is missing entirely
        const isCurrentYear = year === new Date().getFullYear()
        const needsRecompute = !row || (isCurrentYear && this.isStale(row.updatedAt))
        if (needsRecompute) {
            await this.recompute({
                userId,
                year,
            })
            row = await this.entityManager.findOne(
                UserContributionProjectionEntity,
                {
                    where: {
                        userId,
                        year,
                    },
                },
            )
        }
        // parse the jsonb { days: [...] } into the typed view (empty when absent)
        const days = (row?.value?.days as Array<ContributionDayValue> | undefined) ?? []
        return days.map((day) => ({
            date: day.date,
            contents: Number(day.contents) || 0,
            challenges: Number(day.challenges) || 0,
            milestones: Number(day.milestones) || 0,
            total: (Number(day.contents) || 0)
                + (Number(day.challenges) || 0)
                + (Number(day.milestones) || 0),
        }))
    }

    /**
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        // compare age against the env-tunable projection TTL
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Build the scoped calendar UPSERT — the per-day counts (contents / challenges
     * / milestones) for year `$2` folded into one jsonb `value.days` array for the
     * single user `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO user_contribution_projections (user_id, year, value)
            SELECT $1::uuid, $2::int, jsonb_build_object('days', COALESCE((
                -- one ordered array of active days, each with per-type counts
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date',       d.day,
                        'contents',   d.contents,
                        'challenges', d.challenges,
                        'milestones', d.milestones
                    ) ORDER BY d.day
                )
                FROM (
                    -- group the ledger by calendar day within year $2, counting each type
                    SELECT to_char(created_at, 'YYYY-MM-DD') AS day,
                           COUNT(*) FILTER (WHERE type = 'lessonRead')::int      AS contents,
                           COUNT(*) FILTER (WHERE type = 'challengePassed')::int AS challenges,
                           COUNT(*) FILTER (WHERE type = 'milestonePassed')::int AS milestones
                    FROM activities
                    WHERE user_id = $1
                      AND type IN ('lessonRead', 'challengePassed', 'milestonePassed')
                      AND created_at >= make_date($2, 1, 1)
                      AND created_at <  make_date($2 + 1, 1, 1)
                    GROUP BY day
                ) d
            ), '[]'::jsonb))
            ON CONFLICT (user_id, year) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
