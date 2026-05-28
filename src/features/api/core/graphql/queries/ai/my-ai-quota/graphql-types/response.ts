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
 * Free Auto-lane ("lượt") quota for the current user, per window.
 */
@ObjectType({
    description: "Free Auto-lane (complimentary) quota — counted in uses.",
})
export class MyAiAutoQuotaData {
    @Field(
        () => Int,
        {
            description: "Max Auto uses allowed in the 5h window.",
        },
    )
        limit5h: number

    @Field(
        () => Int,
        {
            description: "Auto uses consumed in the current 5h window.",
        },
    )
        used5h: number

    @Field(
        () => Int,
        {
            description: "Remaining Auto uses in the 5h window.",
        },
    )
        remaining5h: number

    @Field(
        () => Int,
        {
            description: "Max Auto uses allowed in the weekly window.",
        },
    )
        limitWeek: number

    @Field(
        () => Int,
        {
            description: "Auto uses consumed in the current weekly window.",
        },
    )
        usedWeek: number

    @Field(
        () => Int,
        {
            description: "Remaining Auto uses in the weekly window.",
        },
    )
        remainingWeek: number
}

/**
 * Paid Premium-lane (credit) quota for the current user, per window.
 */
@ObjectType({
    description: "Paid Premium-lane quota — counted in credits.",
})
export class MyAiPremiumQuotaData {
    @Field(
        () => Int,
        {
            description: "Credit cap in the 5h window (0 when no active tier).",
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
            description: "Credit cap in the weekly window (0 when no active tier).",
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
    description: "Per-user AI quota snapshot (Auto + Premium).",
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
        () => MyAiAutoQuotaData,
        {
            description: "Free Auto-lane (complimentary) quota.",
        },
    )
        auto: MyAiAutoQuotaData

    @Field(
        () => MyAiPremiumQuotaData,
        {
            description: "Paid Premium-lane (credit) quota.",
        },
    )
        premium: MyAiPremiumQuotaData

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
