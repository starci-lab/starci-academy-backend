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
    AiMode,
    AiSubTier,
    GraphQLTypeAiMode,
    GraphQLTypeAiSubTier,
} from "@modules/databases"

/**
 * Unified platform-credit quota for the current user, per window.
 */
@ObjectType({
    description: "Unified platform credit quota (free base + tier).",
})
export class MyAiCreditQuotaData {
    @Field(
        () => Int,
        {
            description: "Credit allowance in the current 5-hour window (free base + tier).",
        },
    )
        limit5h: number

    @Field(
        () => Int,
        {
            description: "Credits consumed in the current 5h window.",
        },
    )
        used5h: number

    @Field(
        () => Int,
        {
            description: "Remaining credits in the 5h window.",
        },
    )
        remaining5h: number

    @Field(
        () => Int,
        {
            description: "Credit allowance in the current weekly window (free base + tier).",
        },
    )
        limitWeek: number

    @Field(
        () => Int,
        {
            description: "Credits consumed in the current weekly window.",
        },
    )
        usedWeek: number

    @Field(
        () => Int,
        {
            description: "Remaining credits in the weekly window.",
        },
    )
        remainingWeek: number
}

/**
 * Full per-user quota snapshot — both lanes + window reset times.
 */
@ObjectType({
    description: "Per-user AI quota snapshot (single credit pool).",
})
export class MyAiQuotaResponseData {
    @Field(
        () => GraphQLTypeAiMode,
        {
            description: "Natural lane the user is on right now.",
        },
    )
        mode: AiMode

    @Field(
        () => GraphQLTypeAiSubTier,
        {
            nullable: true,
            description: "Active paid tier, or null on the free lane.",
        },
    )
        tier: AiSubTier | null

    @Field(
        () => MyAiCreditQuotaData,
        {
            description: "Unified platform credit quota (free base + tier).",
        },
    )
        credit: MyAiCreditQuotaData

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the 5h window rolls over (counters reset).",
        },
    )
        window5hResetAt: Date | null

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the weekly window rolls over.",
        },
    )
        windowWeekResetAt: Date | null
}

@ObjectType({
    description: "Response wrapper for the myAiQuota query.",
})
export class MyAiQuotaResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyAiQuotaResponseData>
{
    @Field(
        () => MyAiQuotaResponseData,
        {
            nullable: true,
            description: "Per-user AI quota snapshot.",
        },
    )
        data: MyAiQuotaResponseData
}
