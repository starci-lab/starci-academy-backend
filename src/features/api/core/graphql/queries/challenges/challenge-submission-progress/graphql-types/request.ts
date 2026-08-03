import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    IsUUID,
} from "class-validator"

/**
 * Request for `challengeSubmissionProgress`: scopes the read to the
 * viewer's enrollment in this course.
 */
@InputType({
    description: "Request for fetching challenge submission progress.",
})
export class ChallengeSubmissionProgressRequest {
    @Field(
        () => ID,
        {
            description: "Course ID.",
        },
    )
    // must be a real course uuid — rejected before it reaches the TypeORM lookup
    @IsUUID()
        courseId: string
}
