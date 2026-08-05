import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    KpiWeeklyRewardFloorEntity,
} from "@modules/databases/postgresql/primary/entities/kpi-weekly-reward-floor.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CoinSource,
} from "@modules/databases/postgresql/primary/enums/coin-source"
import {
    KpiKey,
} from "@modules/databases/postgresql/primary/enums/kpi-key"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    KpiRewardAlreadyClaimedException,
} from "@modules/platform/exceptions/errors/kpi-reward/kpi-reward-already-claimed"
import {
    KpiRewardNotEligibleException,
} from "@modules/platform/exceptions/errors/kpi-reward/kpi-reward-not-eligible"
import {
    writeCoinHistory,
} from "@features/api/processors/ai/shared/xp/write-coin-history"
import {
    KPI_WEEK_START_SQL,
} from "../projections/user-stats/kpi-week.util"
import {
    getKpiCurrentValues,
} from "../projections/user-stats/kpi-current.util"
import {
    UserStatsProjectionService,
} from "../projections/user-stats/user-stats-projection.service"
import {
    computeKpiCoinReward,
    KPI_TARGET_MAX,
} from "./kpi-reward.catalog"
import type {
    ClaimKpiRewardParams,
    ClaimKpiRewardResult,
    GetKpiRewardFloorStatesParams,
    KpiRewardFloorState,
    KpiWeekStartRow,
    SetKpiTargetParams,
} from "./types"

@Injectable()
/**
 * Weekly-KPI coin-reward business logic: the anti-gaming FLOOR tracking (a
 * target can only lower the floor within a week -- see
 * {@link KpiWeeklyRewardFloorEntity}) and the per-KPI claim (mirrors
 * `DailyQuestService.claimReward`'s idempotent transaction + `writeCoinHistory`
 * grant, but scaled by the floor instead of a flat amount).
 */
export class KpiRewardService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userStatsProjectionService: UserStatsProjectionService,
    ) {}

    /** The current KPI week's start instant (Monday 8am Asia/Ho_Chi_Minh). */
    private async getCurrentWeekStart(manager: EntityManager): Promise<Date> {
        const rows = await manager.query<Array<KpiWeekStartRow>>(
            `SELECT ${KPI_WEEK_START_SQL} AS "weekStart"`,
        )
        return new Date(rows[0].weekStart)
    }

    /**
     * Lower the tracked floor for one KPI this week (never raises it). Called
     * from `setKpiTarget` right after the target itself is persisted -- creates
     * the week's floor row on the FIRST touch (seeded at the just-set value),
     * or takes `LEAST(existing, new)` on every touch after that.
     *
     * @param userId - the user changing their target.
     * @param key - which KPI.
     * @param newTarget - the target value just persisted.
     */
    async lowerFloor(
        userId: string,
        key: KpiKey,
        newTarget: number,
    ): Promise<void> {
        await this.entityManager.query(
            `
            INSERT INTO kpi_weekly_reward_floors (user_id, kpi_key, week_start_at, floor_target)
            VALUES ($1, $2, ${KPI_WEEK_START_SQL}, $3)
            ON CONFLICT (user_id, kpi_key, week_start_at) DO UPDATE SET
                floor_target = LEAST(kpi_weekly_reward_floors.floor_target, EXCLUDED.floor_target)
            `,
            [
                userId,
                key,
                newTarget,
            ],
        )
    }

    /**
     * Set one of a user's weekly KPI targets. Clamps the requested value into
     * `[0, KPI_TARGET_MAX[key]]` (0 clears that KPI's goal), then merges it
     * into the user's `weekly_kpi_targets` jsonb map via an atomic
     * `jsonb_set` so concurrent writes to different keys don't clobber each
     * other. Also lowers this week's anti-gaming floor to match the new
     * target -- skipped for a clear (target 0), which isn't a real commitment
     * to track.
     *
     * @param params - {@link SetKpiTargetParams}
     * @returns the post-clamp target that was actually persisted.
     */
    async setTarget(
        {
            userId,
            key,
            target,
        }: SetKpiTargetParams,
    ): Promise<number> {
        const clampedTarget = Math.min(
            Math.max(Math.trunc(target),
                0),
            KPI_TARGET_MAX[key],
        )
        await this.entityManager.query(
            `
            UPDATE users
            SET weekly_kpi_targets = jsonb_set(
                COALESCE(weekly_kpi_targets, '{}'::jsonb),
                $2,
                to_jsonb($3::int),
                true
            )
            WHERE id = $1
            `,
            [
                userId,
                `{${key}}`,
                clampedTarget,
            ],
        )
        if (clampedTarget > 0) {
            await this.lowerFloor(userId,
                key,
                clampedTarget)
        }
        return clampedTarget
    }

    /**
     * Read this week's floor + claimed state for every KPI that has EITHER a
     * floor row this week OR a current self-set target (untouched-this-week
     * KPIs fall back to `currentTargets` -- safe, since nothing moved it).
     *
     * @param params - {@link GetKpiRewardFloorStatesParams}
     * @returns floor state per KPI key that has a target this week.
     */
    async getFloorStates(
        {
            userId,
            currentTargets,
        }: GetKpiRewardFloorStatesParams,
    ): Promise<Partial<Record<KpiKey, KpiRewardFloorState>>> {
        const rows = await this.entityManager.query<Array<{
            kpiKey: KpiKey
            floorTarget: number
            claimedAt: Date | null
        }>>(
            `
            SELECT kpi_key AS "kpiKey", floor_target AS "floorTarget", claimed_at AS "claimedAt"
            FROM kpi_weekly_reward_floors
            WHERE user_id = $1 AND week_start_at = ${KPI_WEEK_START_SQL}
            `,
            [
                userId,
            ],
        )
        const floorByKey = new Map(rows.map((row) => [row.kpiKey,
            row]))
        const result: Partial<Record<KpiKey, KpiRewardFloorState>> = {
        }
        for (const key of Object.values(KpiKey)) {
            const row = floorByKey.get(key)
            const fallbackTarget = Number(currentTargets[key]) || 0
            if (!row && fallbackTarget <= 0) {
                // no floor row this week AND no current target -> not eligible, skip
                continue
            }
            result[key] = {
                floorTarget: row ? Number(row.floorTarget) : fallbackTarget,
                claimed: row?.claimedAt != null,
            }
        }
        return result
    }

    /**
     * Claim the coin reward for ONE KPI this week. Runs the eligibility +
     * already-claimed checks, the reward grant, and the floor-row update in ONE
     * transaction so a concurrent double-claim cannot double-credit.
     *
     * @param params - {@link ClaimKpiRewardParams}
     * @returns the user's refreshed Coin balance + the amount just granted.
     */
    async claimReward(
        {
            userId,
            key,
        }: ClaimKpiRewardParams,
    ): Promise<ClaimKpiRewardResult> {
        return this.entityManager.transaction(async (manager) => {
            const weekStart = await this.getCurrentWeekStart(manager)
            let floorRow = await manager.findOne(
                KpiWeeklyRewardFloorEntity,
                {
                    where: {
                        userId,
                        kpiKey: key,
                        weekStartAt: weekStart,
                    },
                },
            )
            // no floor row yet this week (user never called setKpiTarget) -> lazily
            // seed one from the CURRENT target (safe: nothing has moved it this week)
            if (!floorRow) {
                const user = await manager.findOneOrFail(
                    UserEntity,
                    {
                        where: {
                            id: userId,
                        },
                        select: {
                            id: true,
                            weeklyKpiTargets: true,
                        },
                    },
                )
                const currentTarget = Number(user.weeklyKpiTargets?.[key]) || 0
                if (currentTarget <= 0) {
                    throw new KpiRewardNotEligibleException({
                        key,
                    })
                }
                floorRow = manager.create(
                    KpiWeeklyRewardFloorEntity,
                    {
                        userId,
                        kpiKey: key,
                        weekStartAt: weekStart,
                        floorTarget: currentTarget,
                    },
                )
                await manager.save(floorRow)
            }
            if (floorRow.claimedAt) {
                throw new KpiRewardAlreadyClaimedException({
                    key,
                })
            }
            const stats = await this.userStatsProjectionService.getStats(userId)
            const current = getKpiCurrentValues(stats)[key]
            if (current < floorRow.floorTarget) {
                throw new KpiRewardNotEligibleException({
                    key,
                })
            }
            const coinReward = computeKpiCoinReward(key,
                floorRow.floorTarget)
            // idempotent ledger write + Coin credit -- refId unique per user+kpi+week
            await writeCoinHistory({
                entityManager: manager,
                userId,
                source: CoinSource.KpiReward,
                points: coinReward,
                refId: `kpi:${key}:${weekStart.toISOString()}`,
            })
            floorRow.claimedAt = new Date()
            floorRow.coinReward = coinReward
            await manager.save(floorRow)
            const user = await manager.findOneOrFail(
                UserEntity,
                {
                    where: {
                        id: userId,
                    },
                    select: {
                        id: true,
                        coinBalance: true,
                    },
                },
            )
            return {
                balance: user.coinBalance,
                coinReward,
            }
        })
    }
}
