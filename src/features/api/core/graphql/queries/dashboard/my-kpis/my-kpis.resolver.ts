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
    UserStatsProjectionService,
} from "@modules/bussiness"
import {
    KpiItemData,
    MyKpisData,
    MyKpisResponse,
} from "./graphql-types"

/**
 * Weekly-KPI query: every KPI's rolling-7-day current value vs the user's
 * self-set target, plus a composite score over the KPIs that have a target.
 * Current values come from the user-stats projection (no inline aggregate); the
 * targets live on the user row (set via `setKpiTarget`).
 */
@Resolver()
export class MyKpisResolver {
    constructor(
        private readonly userStatsProjectionService: UserStatsProjectionService,
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
        // single projection read — rolling-7-day counters are precomputed there
        const stats = await this.userStatsProjectionService.getStats(user.id)
        // distinct active days this week (derived from the 7-day strip)
        const studyDays = stats.last7Days.filter((day) => day.active).length
        // the current value for each KPI, keyed by KpiKey
        const currentByKey: Record<KpiKey, number> = {
            [KpiKey.Lessons]: stats.weeklyLessons,
            [KpiKey.StudyDays]: studyDays,
            [KpiKey.Challenges]: stats.weeklyChallenges,
            [KpiKey.Coding]: stats.weeklyCoding,
            [KpiKey.Flashcards]: stats.weeklyFlashcards,
            [KpiKey.Milestones]: stats.weeklyMilestones,
        }
        // self-set targets map off the user row (absent / 0 = no target)
        const targets = user.weeklyKpiTargets ?? {
        }
        // build one item per KPI in a stable display order
        const items: Array<KpiItemData> = Object.values(KpiKey).map((key) => {
            const raw = Number(targets[key]) || 0
            return {
                key,
                current: currentByKey[key],
                target: raw > 0 ? raw : null,
            }
        })
        // composite over the KPIs that have a target set
        const targeted = items.filter((item) => item.target !== null)
        const completed = targeted.filter((item) => item.current >= (item.target ?? 0)).length
        const percent = targeted.length > 0
            ? Math.round(
                (targeted.reduce(
                    (acc, item) => acc + Math.min(1, item.current / (item.target ?? 1)),
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
        }
    }
}
