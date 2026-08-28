import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request one durable job owned by the authenticated user.",
})
/** GraphQL input selecting one durable job by id. */
export class JobStatusRequest {
    @Field(
        () => ID,
        {
            description: "Durable job id returned by an asynchronous mutation.",
        },
    )
        jobId: string
}
