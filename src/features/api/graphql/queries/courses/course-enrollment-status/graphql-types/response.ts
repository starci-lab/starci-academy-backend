import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Payload: total enrollments and whether the caller is enrolled (false if anonymous). */
@ObjectType({
    description: "Enrollment count for a course and enrollment flag for the current user.",
})
export class CourseEnrollmentStatusData {
    @Field(
        () => Int,
        {
            description: "Number of enrollments for this course.",
        },
    )
        enrollmentCount: number

    @Field(
        () => Boolean,
        {
            description: "True when an Authorization Bearer is valid and the user is enrolled; false otherwise.",
        },
    )
        isEnrolled: boolean
}

@ObjectType({
    description: "Response wrapper for the course enrollment status query.",
})
export class CourseEnrollmentStatusResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseEnrollmentStatusData>
{
    @Field(
        () => CourseEnrollmentStatusData,
        {
            nullable: true,
        },
    )
        data?: CourseEnrollmentStatusData
}
