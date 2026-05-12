import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

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
        courseId: string
}
