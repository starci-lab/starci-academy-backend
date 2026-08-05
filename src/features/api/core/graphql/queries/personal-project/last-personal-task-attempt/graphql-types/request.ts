import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for the latest personal-project review attempt for a given user (self or staff).",
})
/**
 * Args for `lastPersonalTaskAttempt` -- course, task, and subject userId
 * (self or staff-viewed learner).
 */
export class LastPersonalTaskAttemptRequest {
    @Field(
        () => ID,
        {
            description: "Course ID.",
        },
    )
        courseId: string

    @Field(
        () => ID,
        {
            description: "Milestone task ID.",
        },
    )
        taskId: string

    @Field(
        () => ID,
        {
            description: "User ID whose latest attempt is returned.",
        },
    )
        userId: string
}
