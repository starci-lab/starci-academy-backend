import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Challenge submission id and submission URL (GitHub or Google Docs per submission type).",
})
export class SyncSubmissionRequest {
    @Field(
        () => ID,
        {
            description: "Challenge submission id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Submission URL (validated against the submission type).",
        },
    )
        url: string
}
