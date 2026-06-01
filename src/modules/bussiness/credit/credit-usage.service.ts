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
    AiAutoQuotaConfigService,
} from "@modules/filesystem"
import {
    CREDIT_WINDOW_5H_HOURS,
    CREDIT_WINDOW_DAYS,
} from "./constants"
import type {
    CreditUsageWindowSnapshot,
} from "./types"

/**
 * Used / quota / remaining credit snapshot for a user (Auto lane rolling windows).
 */
export interface CreditUsageSnapshot {
    /** Week-window used credits (same as {@link CreditUsageSnapshot.windowWeek}). */
    usedCredits: number
    /** Week-window cap (same as {@link CreditUsageSnapshot.windowWeek}). */
    quota: number
    /** Week-window remaining (same as {@link CreditUsageSnapshot.windowWeek}). */
    remainingCredits: number
    /** Whether the week-window cap is exhausted. */
    overQuota: boolean
    /** Week-window recovery time (same as {@link CreditUsageSnapshot.windowWeek}). */
    resetAt: Date | null
    /** Credits used / cap within the rolling 5-hour window. */
    window5h: CreditUsageWindowSnapshot
    /** Credits used / cap within the rolling 7-day window. */
    windowWeek: CreditUsageWindowSnapshot
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

/** Raw usage totals loaded from DB / cache. */
interface CreditUsageTotals {
    /** Credits summed inside the 5-hour window. */
    usedCredits5h: number
    /** Credits summed inside the week window. */
    usedCreditsWeek: number
    /** Recovery time for the 5-hour window. */
    resetAt5hMs: number | null
    /** Recovery time for the week window. */
    resetAtWeekMs: number | null
}

/**
 * Reads AI credit usage with `credit_usage_histories` as the source of truth.
 * Exposes rolling **5-hour** and **7-day** credit windows for the Auto lane.
 */
@Injectable()
export class CreditUsageService {
    constructor(
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
        private readonly aiAutoQuotaConfigService: AiAutoQuotaConfigService,
    ) {}

    /**
     * Credit snapshot for the user (5h + week windows; top-level fields mirror the week window).
     * @param userId - The user to read the snapshot for.
     */
    async getSnapshot(
        userId: string,
    ): Promise<CreditUsageSnapshot> {
        const cached = await this.cacheService.get({
            key: CacheKey.CreditUsage,
            args: [userId],
        })
        const totals = cached
            && typeof cached.usedCreditsWeek === "number"
            && typeof cached.usedCredits5h === "number"
            ? {
                usedCredits5h: cached.usedCredits5h,
                usedCreditsWeek: cached.usedCreditsWeek,
                resetAt5hMs: cached.resetAt5hMs ?? null,
                resetAtWeekMs: cached.resetAtWeekMs ?? null,
            }
            : await this.computeAndCacheUsage(userId)

        const autoQuota = this.aiAutoQuotaConfigService.getAutoQuota()
        const window5h = this.buildWindowSnapshot(
            totals.usedCredits5h,
            autoQuota.creditsPer5h,
            totals.resetAt5hMs,
        )
        const windowWeek = this.buildWindowSnapshot(
            totals.usedCreditsWeek,
            autoQuota.creditsPerWeek,
            totals.resetAtWeekMs,
        )
        const overQuota = windowWeek.usedCredits >= windowWeek.quota
            || window5h.usedCredits >= window5h.quota
        return {
            usedCredits: windowWeek.usedCredits,
            quota: windowWeek.quota,
            remainingCredits: windowWeek.remainingCredits,
            overQuota,
            resetAt: windowWeek.resetAt,
            window5h,
            windowWeek,
        }
    }

    /**
     * Paginated AI credit charge history for the user, newest first.
     * @param userId - The user whose charges to list.
     * @param params - `limit` (page size) and `offset` (rows to skip).
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
     * Drop the cached totals so the next read recomputes from the table.
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
     * Build a window snapshot from raw totals.
     */
    private buildWindowSnapshot(
        usedCredits: number,
        quota: number,
        resetAtMs: number | null,
    ): CreditUsageWindowSnapshot {
        const remainingCredits = Math.max(0,
            quota - usedCredits)
        return {
            usedCredits,
            quota,
            remainingCredits,
            resetAt: resetAtMs === null ? null : new Date(resetAtMs),
        }
    }

    /**
     * Sum in-window credits for 5h + week, then cache.
     * @param userId - The user to compute usage for.
     */
    private async computeAndCacheUsage(
        userId: string,
    ): Promise<CreditUsageTotals> {
        const now = this.dayjsService.now()
        const weekStart = now.subtract(CREDIT_WINDOW_DAYS,
            "day").toDate()
        const fiveHStart = now.subtract(CREDIT_WINDOW_5H_HOURS,
            "hour").toDate()
        const rows = await this.entityManager.find(
            CreditUsageHistoryEntity,
            {
                where: {
                    mode: AiMode.Auto,
                    user: {
                        id: userId,
                    },
                    createdAt: MoreThanOrEqual(weekStart),
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

        let usedCreditsWeek = 0
        let usedCredits5h = 0
        for (const row of rows) {
            const credits = row.credits ?? 0
            usedCreditsWeek += credits
            if (row.createdAt >= fiveHStart) {
                usedCredits5h += credits
            }
        }

        const oldestWeek = rows[0] ?? null
        const resetAtWeekMs = oldestWeek
            ? this.dayjsService.from(oldestWeek.createdAt).add(CREDIT_WINDOW_DAYS,
                "day").toDate().getTime()
            : null

        const fiveHRows = rows.filter((row) => row.createdAt >= fiveHStart)
        const oldest5h = fiveHRows[0] ?? null
        const resetAt5hMs = oldest5h
            ? this.dayjsService.from(oldest5h.createdAt).add(CREDIT_WINDOW_5H_HOURS,
                "hour").toDate().getTime()
            : null

        await this.cacheService.set({
            key: CacheKey.CreditUsage,
            args: [userId],
            cacheResult: {
                usedCreditsWeek,
                resetAtWeekMs,
                usedCredits5h,
                resetAt5hMs,
            },
        })
        return {
            usedCredits5h,
            usedCreditsWeek,
            resetAt5hMs,
            resetAtWeekMs,
        }
    }
}
