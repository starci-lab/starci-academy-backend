import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to fetch personal project feedback history.",
})
export class PersonalFeedbacksRequest {
    @Field(
        () => ID,
        {
            description: "Enrollment ID to fetch feedback for.",
        },
    )
        enrollmentId: string
}
