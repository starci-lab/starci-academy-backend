import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    GraphQLTypeKpiKey,
    KpiKey,
} from "@modules/databases"

/**
 * One weekly KPI: the current-week `current` value (resets Monday 8am
 * Asia/Ho_Chi_Minh) vs the user's self-set `target` (null = no target set yet
 * for this KPI).
 */
@ObjectType({
    description: "One weekly KPI with its current value and target.",
})
export class KpiItemData {
    @Field(
        () => GraphQLTypeKpiKey,
        {
            description: "Which KPI this row is.",
        },
    )
        key: KpiKey

    @Field(
        () => Int,
        {
            description: "The current-week (resets Monday 8am GMT+7) value for this KPI.",
        },
    )
        current: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "The user's weekly target; null when none set.",
        },
    )
        target: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Coin reward for claiming this KPI this week; null when no target is set.",
        },
    )
        coinReward: number | null

    @Field(
        () => Boolean,
        {
            description: "Whether this KPI's reward was already claimed this week.",
        },
    )
        claimed: boolean

    @Field(
        () => Boolean,
        {
            description: "Whether this KPI's reward can be claimed right now (met + not yet claimed).",
        },
    )
        canClaim: boolean
}

/**
 * Composite KPI score across the KPIs that HAVE a target set.
 */
@ObjectType({
    description: "Composite weekly KPI score (over KPIs with a target).",
})
export class KpiCompositeData {
    @Field(
        () => Int,
        {
            description: "Average completion across targeted KPIs, 0–100.",
        },
    )
        percent: number

    @Field(
        () => Int,
        {
            description: "Number of targeted KPIs already met (current >= target).",
        },
    )
        completed: number

    @Field(
        () => Int,
        {
            description: "Number of KPIs that have a target set.",
        },
    )
        total: number
}

/**
 * The viewer's weekly KPIs: every KPI's current/target + the composite score.
 */
@ObjectType({
    description: "The viewer's weekly KPIs (per-KPI progress + composite score).",
})
export class MyKpisData {
    @Field(
        () => [KpiItemData],
        {
            description: "Every weekly KPI with its current value and target.",
        },
    )
        items: Array<KpiItemData>

    @Field(
        () => KpiCompositeData,
        {
            description: "Composite score over the KPIs that have a target.",
        },
    )
        composite: KpiCompositeData

    @Field(
        () => Date,
        {
            description: "The next weekly KPI reset instant (Monday 8am Asia/Ho_Chi_Minh).",
        },
    )
        resetAt: Date
}

/**
 * Response wrapper for the myKpis query.
 */
@ObjectType({
    description: "Response wrapper for the myKpis query.",
})
export class MyKpisResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyKpisData> {
    @Field(
        () => MyKpisData,
        {
            nullable: true,
            description: "The viewer's weekly KPIs.",
        },
    )
        data: MyKpisData
}
