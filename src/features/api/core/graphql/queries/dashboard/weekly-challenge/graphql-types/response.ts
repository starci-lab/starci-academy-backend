import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A user who passed the weekly challenge this week.",
})
/**
 * One weekly-challenge leaderboard entry: a user who passed it this week.
 */
export class WeeklyChallengeEntryObject {
    @Field(
        () => String,
        {
            description: "Passer username (display handle).",
        },
    )
        username: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Passer avatar URL, or null.",
        },
    )
        avatar: string | null

    @Field(
        () => Date,
        {
            description: "When the user passed the challenge this week.",
        },
    )
        passedAt: Date
}

@ObjectType({
    description: "The current week's auto-rotated challenge event.",
})
/**
 * The current ISO week's challenge event (auto-rotated, read-only).
 */
export class WeeklyChallengeObject {
    @Field(
        () => String,
        {
            description: "Global (relay) id of the picked challenge.",
        },
    )
        challengeGlobalId: string

    @Field(
        () => String,
        {
            description: "Challenge title.",
        },
    )
        title: string

    @Field(
        () => Date,
        {
            description: "End of the current ISO week (Sunday 23:59:59.999).",
        },
    )
        weekEndAt: Date

    @Field(
        () => Boolean,
        {
            description: "Whether the authed viewer passed it this week (false when anonymous).",
        },
    )
        viewerPassed: boolean

    @Field(
        () => Int,
        {
            description: "Total number of users who passed it this week.",
        },
    )
        passedCount: number

    @Field(
        () => [WeeklyChallengeEntryObject],
        {
            nullable: true,
            description: "Up to ~10 most-recent passers this week (newest first).",
        },
    )
        leaderboard: Array<WeeklyChallengeEntryObject>

    @Field(
        () => Boolean,
        {
            description: "Whether the viewer already claimed the reward this week.",
        },
    )
        claimed: boolean

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Coin reward for claiming; null when the viewer hasn't passed yet.",
        },
    )
        coinReward: number | null
}

@ObjectType({
    description: "Response wrapper for the weeklyChallenge query.",
})
/**
 * Response wrapper for the weeklyChallenge query (data is nullable — null when
 * there are no challenges to rotate over).
 */
export class WeeklyChallengeResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<WeeklyChallengeObject> {
    @Field(
        () => WeeklyChallengeObject,
        {
            nullable: true,
            description: "The current week's challenge event, or null.",
        },
    )
        data: WeeklyChallengeObject
}
