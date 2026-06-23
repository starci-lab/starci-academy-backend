import {
    Field,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to join the GitHub team mapped to an enrolled course.",
})
export class RequestToTeamRequest {
    @Field(
        () => String,
        {
            description: "The enrolled course id whose GitHub team the viewer wants to join.",
        },
    )
        courseId: string
}
