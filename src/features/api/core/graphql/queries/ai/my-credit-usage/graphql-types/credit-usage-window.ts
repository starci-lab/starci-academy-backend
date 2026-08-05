import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "AI credits consumed within a single rolling time window.",
})
/**
 * Credit usage for one rolling window (5 hours or 7 days).
 */
export class MyCreditUsageWindowData {
    @Field(
        () => Int,
        {
            description: "Credits consumed inside the window.",
        },
    )
        usedCredits: number

    @Field(
        () => Int,
        {
            description: "Credit cap for the window.",
        },
    )
        quota: number

    @Field(
        () => Int,
        {
            description: "Credits left before hitting the cap (never negative).",
        },
    )
        remainingCredits: number

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When the oldest in-window charge ages out; null when no usage.",
        },
    )
        resetAt: Date | null
}
