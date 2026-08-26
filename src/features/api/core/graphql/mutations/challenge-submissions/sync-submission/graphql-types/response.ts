import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Saved Challenge draft revision.",
})
/** Data returned after a Challenge draft is synchronized. */
export class SyncSubmissionResponseData {
    @Field(() => Int)
        draftRevision: number

    @Field(
        () => Date,
        {
            nullable: true,
        },
    )
        savedAt: Date | null
}

@ObjectType({
    description: "Response for syncing challenge submissions for the current user.",
})
/** Response for syncing challenge submissions for the current user. */
export class SyncSubmissionResponse extends AbstractGraphQLResponse {
    @Field(
        () => SyncSubmissionResponseData,
        {
            nullable: true,
        },
    )
        data: SyncSubmissionResponseData
}
