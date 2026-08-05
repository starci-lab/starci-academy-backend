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
    MyCreditUsageWindowData,
} from "./credit-usage-window"

@ObjectType({
    description: "Per-user AI credit usage snapshot.",
})
/**
 * Per-user AI credit usage snapshot (source of truth: `credit_usage_histories`).
 */
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

    @Field(
        () => MyCreditUsageWindowData,
        {
            description: "Credits used within the rolling 5-hour window.",
        },
    )
        window5h: MyCreditUsageWindowData

    @Field(
        () => MyCreditUsageWindowData,
        {
            description: "Credits used within the rolling 7-day window.",
        },
    )
        windowWeek: MyCreditUsageWindowData
}

@ObjectType({
    description: "Response wrapper for the myCreditUsage query.",
})
/**
 * GraphQL envelope for `myCreditUsage`. `data` is null only on the error path;
 * `overQuota` inside the snapshot is what the client uses to block new AI calls.
 */
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
