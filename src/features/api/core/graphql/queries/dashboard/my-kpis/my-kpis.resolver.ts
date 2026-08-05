import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    KpiKey,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KpiRewardService,
    UserStatsProjectionService,
    computeKpiCoinReward,
    getKpiCurrentValues,
} from "@modules/bussiness"
import {
    KpiItemData,
    MyKpisData,
    MyKpisResponse,
} from "./graphql-types"

@Resolver()
/**
 * Weekly-KPI query: every KPI's current-week value (resets Monday 8am
 * Asia/Ho_Chi_Minh) vs the user's self-set target, its coin reward + claim
 * state, plus a composite score over the KPIs that have a target. Current
 * values come from the user-stats projection (no inline aggregate); the
 * targets live on the user row (set via `setKpiTarget`); reward/floor state
 * comes from {@link KpiRewardService} (claimed via `claimKpiReward`).
 */
export class MyKpisResolver {
    constructor(
        private readonly userStatsProjectionService: UserStatsProjectionService,
        private readonly kpiRewardService: KpiRewardService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Weekly KPIs fetched successfully",
        [Locale.Vi]: "Lấy KPI tuần thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyKpisResponse,
        {
            name: "myKpis",
            description: "The viewer's weekly KPIs (per-KPI progress + composite score).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyKpisData> {
        // single projection read — current-week counters are precomputed there
        const stats = await this.userStatsProjectionService.getStats(user.id)
        // the current value for each KPI, keyed by KpiKey (shared with the reward claim)
        const currentByKey = getKpiCurrentValues(stats)
        // self-set targets map off the user row (absent / 0 = no target)
        const targets = user.weeklyKpiTargets ?? {
        }
        // this week's anti-gaming floor + claimed state per KPI (only present for
        // KPIs that have EITHER a floor row this week or a current target)
        const floorStates = await this.kpiRewardService.getFloorStates({
            userId: user.id,
            currentTargets: targets,
        })
        // build one item per KPI in a stable display order
        const items: Array<KpiItemData> = Object.values(KpiKey).map((key) => {
            const raw = Number(targets[key]) || 0
            const target = raw > 0 ? raw : null
            const floorState = floorStates[key]
            const current = currentByKey[key]
            return {
                key,
                current,
                target,
                coinReward: floorState ? computeKpiCoinReward(key,
                    floorState.floorTarget) : null,
                claimed: floorState?.claimed ?? false,
                canClaim: Boolean(
                    floorState
                    && !floorState.claimed
                    && current >= floorState.floorTarget,
                ),
            }
        })
        // composite over the KPIs that have a target set
        const targeted = items.filter((item) => item.target !== null)
        const completed = targeted.filter((item) => item.current >= (item.target ?? 0)).length
        const percent = targeted.length > 0
            ? Math.round(
                (targeted.reduce(
                    (acc, item) => acc + Math.min(1,
                        item.current / (item.target ?? 1)),
                    0,
                ) / targeted.length) * 100,
            )
            : 0
        return {
            items,
            composite: {
                percent,
                completed,
                total: targeted.length,
            },
            resetAt: new Date(stats.weekResetAt),
        }
    }
}
