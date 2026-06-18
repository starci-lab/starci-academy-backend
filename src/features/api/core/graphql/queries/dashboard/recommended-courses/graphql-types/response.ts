import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    DiscountReason,
    GraphQLTypeDiscountReason,
} from "@modules/databases"

/**
 * One recommended course priced with the viewer's loyalty discount: the course
 * display fields, the original vs discounted price (VND always; USD when set),
 * and the discount metadata that drives the FE copy.
 */
@ObjectType({
    description: "A recommended course priced with the viewer's loyalty discount.",
})
export class RecommendedCourseObject {
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier (not the primary key).",
        },
    )
        displayId: string

    @Field(
        () => String,
        {
            description: "Human-readable course title.",
        },
    )
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Short public description of the course.",
        },
    )
        description: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "thumbnail URL of the course.",
        },
    )
        thumbnailUrl: string | null

    @Field(
        () => Int,
        {
            description: "Original (pre-discount) VND price.",
        },
    )
        originalPriceVnd: number

    @Field(
        () => Int,
        {
            description: "Loyalty-discounted VND price (what the viewer would pay).",
        },
    )
        discountedPriceVnd: number

    @Field(
        () => Int,
        {
            description: "Loyalty discount percent applied (0–30).",
        },
    )
        discountPercent: number

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Original (pre-discount) USD price; null when no USD price is set.",
        },
    )
        originalPriceUsd: number | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Loyalty-discounted USD price; null when no USD price is set.",
        },
    )
        discountedPriceUsd: number | null

    @Field(
        () => GraphQLTypeDiscountReason,
        {
            description: "Why the loyalty discount applies (drives FE copy).",
        },
    )
        discountReason: DiscountReason

    @Field(
        () => Int,
        {
            description: "Number of courses the viewer already owns (fed the discount).",
        },
    )
        enrolledCount: number
}

/**
 * The recommended-courses payload: the priced course list.
 */
@ObjectType({
    description: "The viewer's recommended courses, each priced with the loyalty discount.",
})
export class RecommendedCoursesData {
    @Field(
        () => [RecommendedCourseObject],
        {
            description: "Recommended courses the viewer does not already own.",
        },
    )
        items: Array<RecommendedCourseObject>
}

/**
 * Response wrapper for the recommendedCourses query.
 */
@ObjectType({
    description: "Response wrapper for the recommendedCourses query.",
})
export class RecommendedCoursesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RecommendedCoursesData> {
    @Field(
        () => RecommendedCoursesData,
        {
            nullable: true,
            description: "The viewer's recommended courses.",
        },
    )
        data: RecommendedCoursesData
}
