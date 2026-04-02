import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** One challenge submission id and URL to upsert for the current user. */
@InputType({
    description: "Challenge submission id and submission URL (GitHub or Google Docs per submission type).",
})
export class SyncSubmissionUrlItemInput {
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

/** Request for syncing multiple submission URLs. */
@InputType({
    description: "List of challenge submission ids and URLs to upsert for the current user.",
})
export class SyncSubmissionUrlsRequest {
    @Field(
        () => [SyncSubmissionUrlItemInput],
        {
            description: "Items to upsert.",
        },
    )
        items: SyncSubmissionUrlItemInput[]
}
