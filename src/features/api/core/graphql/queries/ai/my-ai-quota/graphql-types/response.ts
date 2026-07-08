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
    AiModelCategory,
    AiSubTier,
    GraphQLTypeAiModelCategory,
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
/**
 * Per-surface model CEILING the user set in settings (cost control). Null on a
 * field = inherit the default (or, for `default`, no cap → plan ceiling only).
 */
@ObjectType({
    description: "Per-surface AI model ceiling the user set (cost control).",
})
export class MyAiCeilData {
    @Field(
        () => GraphQLTypeAiModelCategory,
        {
            nullable: true,
            description: "Global default ceiling; null = no cap (plan ceiling only).",
        },
    )
        default: AiModelCategory | null

    @Field(
        () => GraphQLTypeAiModelCategory,
        {
            nullable: true,
            description: "Hỏi AI khi đọc bài override; null = follow default.",
        },
    )
        chatbot: AiModelCategory | null

    @Field(
        () => GraphQLTypeAiModelCategory,
        {
            nullable: true,
            description: "Chấm bài override; null = follow default.",
        },
    )
        grading: AiModelCategory | null

    @Field(
        () => GraphQLTypeAiModelCategory,
        {
            nullable: true,
            description: "Phỏng vấn thử override; null = follow default.",
        },
    )
        interview: AiModelCategory | null
}

@ObjectType({
    description: "Per-user AI quota snapshot (single credit pool).",
})
export class MyAiQuotaResponseData {
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

    @Field(
        () => [GraphQLTypeAiModelCategory],
        {
            description: "Categories the user's plan unlocks (the ceiling to cap within).",
        },
    )
        allowedCategories: Array<AiModelCategory>

    @Field(
        () => MyAiCeilData,
        {
            description: "Per-surface model ceiling the user set (cost control).",
        },
    )
        ceil: MyAiCeilData
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
