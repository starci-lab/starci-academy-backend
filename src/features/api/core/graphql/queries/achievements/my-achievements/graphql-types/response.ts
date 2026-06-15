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
    AchievementCriteriaType,
    GraphQLTypeAchievementCriteriaType,
} from "@modules/databases"

/**
 * One achievement as shown on the profile: the definition fields plus the
 * viewer's earned status and live progress toward it. The badge art is fetched
 * by the client from MinIO using `iconKey`.
 */
@ObjectType({
    description: "An achievement definition with the viewer's earned status and progress.",
})
export class MyAchievementItemData {
    @Field(
        () => String,
        {
            description: "Stable slug (also the badge art filename stem).",
        },
    )
        slug: string

    @Field(
        () => String,
        {
            description: "Localized display name (resolved to the request locale).",
        },
    )
        name: string

    @Field(
        () => String,
        {
            description: "Localized description (resolved to the request locale).",
        },
    )
        description: string

    @Field(
        () => String,
        {
            description: "MinIO object key of the badge art.",
        },
    )
        iconKey: string

    @Field(
        () => GraphQLTypeAchievementCriteriaType,
        {
            description: "The source metric this achievement is measured against.",
        },
    )
        criteriaType: AchievementCriteriaType

    @Field(
        () => Int,
        {
            description: "Metric value at which the achievement is earned (first tier when tiered).",
        },
    )
        threshold: number

    @Field(
        () => Boolean,
        {
            description: "Whether the viewer has earned this achievement (any tier).",
        },
    )
        earned: boolean

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When it was first earned, or null when not yet earned.",
        },
    )
        earnedAt: Date | null

    @Field(
        () => Int,
        {
            description: "The viewer's current metric value for this criteria.",
        },
    )
        currentValue: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Highest tier reached (1-based), or null for single-tier / not earned.",
        },
    )
        tierReached: number | null
}

/**
 * Response wrapper for the myAchievements query.
 */
@ObjectType({
    description: "Response wrapper for the myAchievements query.",
})
export class MyAchievementsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MyAchievementItemData>> {
    @Field(
        () => [MyAchievementItemData],
        {
            nullable: true,
            description: "Every achievement with the viewer's earned status + progress.",
        },
    )
        data: Array<MyAchievementItemData>
}
