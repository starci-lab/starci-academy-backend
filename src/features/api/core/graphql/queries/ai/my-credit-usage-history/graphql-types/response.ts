import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    AiCeilSurface,
    GraphQLTypeAiCeilSurface,
} from "@modules/databases"

/**
 * One AI credit charge in the user's usage history.
 */
@ObjectType({
    description: "One AI credit charge in the usage history.",
})
export class CreditUsageHistoryItemObject {
    @Field(
        () => ID,
        {
            description: "Charge row id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "AI lane billed (auto / premium).",
        },
    )
        mode: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Premium tier billed (low / medium / high); null for auto.",
        },
    )
        recommendation: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model billed (e.g. gpt-5-mini); null for the free Auto lane.",
        },
    )
        model: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Provider of the billed model (gemini / openai); null for the free Auto lane.",
        },
    )
        provider: string | null

    @Field(
        () => Int,
        {
            description: "Credits charged for this run.",
        },
    )
        credits: number

    @Field(
        () => Date,
        {
            description: "When the charge was recorded.",
        },
    )
        createdAt: Date

    @Field(
        () => GraphQLTypeAiCeilSurface,
        {
            nullable: true,
            description: "AI surface (chatbot / grading / interview) that triggered this charge; null for rows recorded before this column existed.",
        },
    )
        surface: AiCeilSurface | null
}

/**
 * Paginated AI credit usage history (newest first).
 */
@ObjectType({
    description: "Paginated AI credit usage history.",
})
export class MyCreditUsageHistoryResponseData {
    @Field(
        () => [CreditUsageHistoryItemObject],
        {
            description: "Charge rows for the requested page, newest first.",
        },
    )
        items: Array<CreditUsageHistoryItemObject>

    @Field(
        () => Int,
        {
            description: "Total number of charge rows for the user (across all pages).",
        },
    )
        total: number
}

/**
 * Response wrapper for the myCreditUsageHistory query.
 */
@ObjectType({
    description: "Response wrapper for the myCreditUsageHistory query.",
})
export class MyCreditUsageHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyCreditUsageHistoryResponseData>
{
    @Field(
        () => MyCreditUsageHistoryResponseData,
        {
            nullable: true,
            description: "Paginated AI credit usage history.",
        },
    )
        data: MyCreditUsageHistoryResponseData
}
