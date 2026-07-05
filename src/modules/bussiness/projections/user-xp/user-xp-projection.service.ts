import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserXpProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    RecomputeUserXpParams,
    UserXpParams,
    UserXpResult,
} from "./types"

/**
 * CQRS projection service for a user's XP aggregate. The per-source SUM(amount)
 * over `xp_histories` runs ONLY in {@link recompute}, which folds
 * `{ challengeXp, milestoneXp, codingXp, lessonXp, totalPoints, coinBalance }`
 * into the jsonb `value` keyed by user. {@link getXp} reads the flat row with a
 * TTL lazy-refresh; the CDC listener keeps it fresh on new ledger rows / balance
 * changes.
 */
@Injectable()
export class UserXpProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the XP aggregate for one user (idempotent UPSERT).
     *
     * @param params - {@link RecomputeUserXpParams}
     */
    async recompute(
        {
            userId,
            entityManager,
        }: RecomputeUserXpParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager
        await manager.query(
            this.buildUpsertSql(),
            [
                userId,
            ],
        )
    }

    /**
     * Read a user's XP aggregate (per-source XP + the two balances), TTL
     * lazy-refreshed.
     *
     * @param params - {@link UserXpParams}
     * @returns the XP aggregate (zeroed when the user has no ledger / row).
     */
    async getXp(
        {
            userId,
        }: UserXpParams,
    ): Promise<UserXpResult> {
        const value = await this.readValue(userId)
        return {
            challengeXp: this.numberAt(value,
                "challengeXp"),
            milestoneXp: this.numberAt(value,
                "milestoneXp"),
            codingXp: this.numberAt(value,
                "codingXp"),
            lessonXp: this.numberAt(value,
                "lessonXp"),
            totalPoints: this.numberAt(value,
                "totalPoints"),
            coinBalance: this.numberAt(value,
                "coinBalance"),
        }
    }

    /**
     * Coerce one jsonb value key to a finite number (0 when absent / non-numeric).
     *
     * @param value - the projection's jsonb value.
     * @param key - the metric key to read.
     * @returns the numeric metric, defaulting to 0.
     */
    private numberAt(
        value: Record<string, unknown>,
        key: string,
    ): number {
        const raw = value[key]
        const parsed = Number(raw)
        return Number.isFinite(parsed) ? parsed : 0
    }

    /**
     * Read the projection row's jsonb value, recomputing first when missing or
     * stale (TTL lazy-refresh).
     *
     * @param userId - the user to read.
     * @returns the jsonb value (empty object when still absent).
     */
    private async readValue(userId: string): Promise<Record<string, unknown>> {
        let row = await this.entityManager.findOne(
            UserXpProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                userId,
            })
            row = await this.entityManager.findOne(
                UserXpProjectionEntity,
                {
                    where: {
                        userId,
                    },
                },
            )
        }
        return row?.value ?? {
        }
    }

    /**
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Build the XP-aggregate UPSERT — per-source SUM(amount) over the
     * `xp_histories` ledger plus the two materialized balances read straight off
     * the `users` row, all for the single user `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO user_xp_projections (user_id, value)
            SELECT $1::uuid, jsonb_build_object(
                'challengeXp', COALESCE((
                    SELECT SUM(x.amount)::int
                    FROM xp_histories x
                    WHERE x.user_id = $1 AND x.source = 'challenge'
                ), 0),
                'milestoneXp', COALESCE((
                    SELECT SUM(x.amount)::int
                    FROM xp_histories x
                    WHERE x.user_id = $1 AND x.source = 'milestone'
                ), 0),
                'codingXp', COALESCE((
                    SELECT SUM(x.amount)::int
                    FROM xp_histories x
                    WHERE x.user_id = $1 AND x.source = 'coding'
                ), 0),
                'lessonXp', COALESCE((
                    SELECT SUM(x.amount)::int
                    FROM xp_histories x
                    WHERE x.user_id = $1 AND x.source = 'lessonRead'
                ), 0),
                'totalPoints', COALESCE((
                    SELECT u.total_points FROM users u WHERE u.id = $1
                ), 0),
                'coinBalance', COALESCE((
                    SELECT u.coin_balance FROM users u WHERE u.id = $1
                ), 0)
            )
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
