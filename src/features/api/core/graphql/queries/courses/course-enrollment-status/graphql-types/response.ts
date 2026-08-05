import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    EnrollmentEntity,
} from "@modules/databases"

@ObjectType({
    description: "Enrollment flag for the current user on a course.",
})
/** Payload: whether the caller is enrolled. */
export class CourseEnrollmentStatusData {
    @Field(
        () => Boolean,
        {
            description: "True when the current authenticated user is enrolled in the course.",
        },
    )
        isEnrolled: boolean

    @Field(
        () => EnrollmentEntity,
        {
            nullable: true,
            description: "The enrollment record, if the user is enrolled. Contains ideaText and personalProjectGithubUrl.",
        },
    )
        enrollment?: EnrollmentEntity | null
}

@ObjectType({
    description: "Response wrapper for the course enrollment status query.",
})
/** GraphQL envelope for the `courseEnrollmentStatus` query. */
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
