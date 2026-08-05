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
    description: "Platform-wide aggregate counters for the public landing page.",
})
/**
 * Landing-page hero counters -- distinct enrolled learners, lessons, courses,
 * and badges earned across the whole platform.
 */
export class PlatformStatsData {
    @Field(
        () => Int,
        {
            description: "Distinct learners that have enrolled in at least one course.",
        },
    )
        totalLearners: number

    @Field(
        () => Int,
        {
            description: "Total content units (lessons) across every course.",
        },
    )
        totalLessons: number

    @Field(
        () => Int,
        {
            description: "Total courses available on the platform.",
        },
    )
        totalCourses: number

    @Field(
        () => Int,
        {
            description: "Total badges earned by all learners (achievement ledger size).",
        },
    )
        totalBadgesEarned: number
}

@ObjectType({
    description: "Response wrapper for platform-wide aggregate stats.",
})
/** GraphQL envelope for the public `platformStats` query. */
export class PlatformStatsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<PlatformStatsData>
{
    @Field(
        () => PlatformStatsData,
        {
            nullable: true,
            description: "Platform-wide aggregate counters.",
        },
    )
        data: PlatformStatsData
}
