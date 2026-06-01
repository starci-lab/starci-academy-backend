import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    MoreThanOrEqual,
} from "typeorm"
import {
    AiMode,
    InjectPrimaryPostgreSQLEntityManager,
    CreditUsageHistoryEntity,
} from "@modules/databases"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    DayjsService,
} from "@modules/mixin"
import {
    CREDIT_QUOTA,
    CREDIT_WINDOW_DAYS,
} from "./constants"

/**
 * Used / quota / remaining credit snapshot for a user within the rolling window.
 */
export interface CreditUsageSnapshot {
    /** Credits consumed within the current rolling window. */
    usedCredits: number
    /** Credits allowed per window. */
    quota: number
    /** Credits left before hitting the quota (never negative). */
    remainingCredits: number
    /** Whether the user has reached or exceeded the quota. */
    overQuota: boolean
    /** When the oldest in-window charge ages out and credits start recovering; null when no usage. */
    resetAt: Date | null
}

/** One AI credit charge row for the usage history list. */
export interface CreditUsageHistoryItem {
    /** Charge row id. */
    id: string
    /** AI lane the charge was billed on (auto / premium / byok). */
    mode: AiMode
    /** Premium tier billed (low / medium / high); null for auto / byok. */
    recommendation: string | null
    /** Concrete model billed (e.g. claude-sonnet-4-5); null for the free Auto lane. */
    model: string | null
    /** Provider of the billed model (gemini / openai / claude); null for the free Auto lane. */
    provider: string | null
    /** Credits charged for this run. */
    credits: number
    /** When the charge was recorded. */
    createdAt: Date
}

/** A page of AI credit charge rows plus the total count. */
export interface CreditUsageHistoryPage {
    /** The charge rows for the requested page, newest first. */
    items: Array<CreditUsageHistoryItem>
    /** Total number of charge rows for the user (across all pages). */
    total: number
}

/**
 * Reads AI credit usage with `credit_usage_histories` as the source of truth.
 * Counts only charges inside a rolling {@link CREDIT_WINDOW_DAYS}-day window, and
 * caches the windowed total + recovery time in Redis so quota checks stay cheap.
 */
@Injectable()
export class CreditUsageService {
    constructor(
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) {}

    /**
     * Used / quota / remaining / overQuota / resetAt snapshot for the user.
     * Served from Redis on a hit; otherwise computed from the table and cached.
     * @param userId - The user to read the snapshot for.
     */
    async getSnapshot(
        userId: string,
    ): Promise<CreditUsageSnapshot> {
        const cached = await this.cacheService.get({
            key: CacheKey.CreditUsage,
            args: [userId],
        })
        const usage = cached && typeof cached.usedCredits === "number"
            ? {
                usedCredits: cached.usedCredits,
                resetAtMs: cached.resetAtMs ?? null,
            }
            : await this.computeAndCacheUsage(userId)

        const remainingCredits = Math.max(0,
            CREDIT_QUOTA - usage.usedCredits)
        return {
            usedCredits: usage.usedCredits,
            quota: CREDIT_QUOTA,
            remainingCredits,
            overQuota: usage.usedCredits >= CREDIT_QUOTA,
            resetAt: usage.resetAtMs === null ? null : new Date(usage.resetAtMs),
        }
    }

    /**
     * Paginated AI credit charge history for the user, newest first. Reads the table
     * directly (not cached) since history is viewed on demand, not on the hot path.
     * @param userId - The user whose charges to list.
     * @param params - `limit` (page size) and `offset` (rows to skip).
     * @returns The page of charge rows plus the total count.
     */
    async getHistory(
        userId: string,
        {
            limit,
            offset,
        }: {
            limit: number
            offset: number
        },
    ): Promise<CreditUsageHistoryPage> {
        const [
            rows,
            total,
        ] = await this.entityManager.findAndCount(
            CreditUsageHistoryEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
                select: {
                    id: true,
                    mode: true,
                    recommendation: true,
                    model: true,
                    provider: true,
                    credits: true,
                    createdAt: true,
                },
                order: {
                    createdAt: "DESC",
                },
                take: limit,
                skip: offset,
            },
        )
        return {
            items: rows.map((row) => ({
                id: row.id,
                mode: row.mode,
                recommendation: row.recommendation,
                model: row.model,
                provider: row.provider,
                credits: row.credits,
                createdAt: row.createdAt,
            })),
            total,
        }
    }

    /**
     * Drop the cached total so the next read recomputes from the table.
     * Call this after a new `credit_usage_histories` row is written.
     * @param userId - The user whose cached usage to invalidate.
     */
    async invalidate(
        userId: string,
    ): Promise<void> {
        await this.cacheService.del({
            key: CacheKey.CreditUsage,
            args: [userId],
        })
    }

    /**
     * Sum in-window credits + find the recovery time, then cache the result.
     * @param userId - The user to compute usage for.
     */
    private async computeAndCacheUsage(
        userId: string,
    ): Promise<{ usedCredits: number, resetAtMs: number | null }> {
        // Only charges newer than the window cutoff count toward the quota.
        const windowStart = this.dayjsService.now().subtract(CREDIT_WINDOW_DAYS,
            "day").toDate()
        const rows = await this.entityManager.find(
            CreditUsageHistoryEntity,
            {
                where: {
                    // only the free Auto lane draws from the shared 50-credit pool;
                    // Premium has its own tier pool, Byok is free — both excluded.
                    mode: AiMode.Auto,
                    user: {
                        id: userId,
                    },
                    createdAt: MoreThanOrEqual(windowStart),
                },
                select: {
                    id: true,
                    credits: true,
                    createdAt: true,
                },
                order: {
                    createdAt: "ASC",
                },
            },
        )

        const usedCredits = rows.reduce(
            (sum, row) => sum + (row.credits ?? 0),
            0,
        )
        // The oldest in-window charge frees its credits one window after it happened.
        const oldest = rows[0] ?? null
        const resetAtMs = oldest
            ? this.dayjsService.from(oldest.createdAt).add(CREDIT_WINDOW_DAYS,
                "day").toDate().getTime()
            : null

        await this.cacheService.set({
            key: CacheKey.CreditUsage,
            args: [userId],
            cacheResult: {
                usedCredits,
                resetAtMs,
            },
        })
        return {
            usedCredits,
            resetAtMs,
        }
    }
}
