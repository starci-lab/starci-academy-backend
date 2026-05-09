import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to sync a personal project idea text.",
})
export class SyncIdealTextRequest {
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
