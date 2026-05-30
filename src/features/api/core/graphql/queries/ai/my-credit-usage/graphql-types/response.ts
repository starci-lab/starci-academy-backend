import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Per-user AI credit usage snapshot (source of truth: `credit_usage_histories`).
 */
@ObjectType({
    description: "Per-user AI credit usage snapshot.",
})
export class MyCreditUsageResponseData {
    @Field(
        () => Int,
        {
            description: "Total credits the user has consumed.",
        },
    )
        usedCredits: number

    @Field(
        () => Int,
        {
            description: "Total credits the user is allowed to consume.",
        },
    )
        quota: number

    @Field(
        () => Int,
        {
            description: "Credits left before hitting the quota (never negative).",
        },
    )
        remainingCredits: number

    @Field(
        () => Boolean,
        {
            description: "Whether the user has reached or exceeded the quota.",
        },
    )
        overQuota: boolean

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the oldest in-window charge ages out and credits start recovering; null when no usage.",
        },
    )
        resetAt: Date | null
}

@ObjectType({
    description: "Response wrapper for the myCreditUsage query.",
})
export class MyCreditUsageResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyCreditUsageResponseData>
{
    @Field(
        () => MyCreditUsageResponseData,
        {
            nullable: true,
            description: "Per-user AI credit usage snapshot.",
        },
    )
        data: MyCreditUsageResponseData
}
