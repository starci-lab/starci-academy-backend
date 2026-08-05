import {
    Field,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to join the GitHub team mapped to an enrolled course.",
})
/**
 * Identifies which enrolled course's org team to invite the viewer into —
 * membership is resolved from auth, not passed in, so a caller cannot join
 * a team for a course they do not own.
 */
export class RequestToTeamRequest {
    @Field(
        () => String,
        {
            description: "The enrolled course id whose GitHub team the viewer wants to join.",
        },
    )
        courseId: string
}
