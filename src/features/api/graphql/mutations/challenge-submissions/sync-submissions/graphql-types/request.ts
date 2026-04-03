import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** One challenge submission id and URL to upsert for the current user. */
@InputType({
    description: "Challenge submission id and submission URL (GitHub or Google Docs per submission type).",
})
export class SyncSubmissionItemInput {
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

/** Request for syncing multiple challenge submissions (URLs). */
@InputType({
    description: "List of challenge submission ids and URLs to upsert for the current user.",
})
export class SyncSubmissionsRequest {
    @Field(
        () => [SyncSubmissionItemInput],
        {
            description: "Items to upsert.",
        },
    )
        items: SyncSubmissionItemInput[]
}
