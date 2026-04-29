import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Payload: whether the caller is enrolled. */
@ObjectType({
    description: "Enrollment flag for the current user on a course.",
})
export class CourseEnrollmentStatusData {
    @Field(
        () => Boolean,
        {
            description: "True when the current authenticated user is enrolled in the course.",
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
        data: CourseEnrollmentStatusData
}
