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
 * One weekly KPI: the rolling-7-day `current` value vs the user's self-set
 * `target` (null = no target set yet for this KPI).
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
            description: "The rolling-7-day current value for this KPI.",
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
