import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to submit a personal project idea.",
})
export class SubmitPersonalProjectIdealRequest {
    @Field(
        () => ID,
        {
            description: "Course ID.",
        },
    )
        courseId: string

    @Field(
        () => String,
        {
            description: "The project idea text.",
        },
    )
        ideaText: string
}
