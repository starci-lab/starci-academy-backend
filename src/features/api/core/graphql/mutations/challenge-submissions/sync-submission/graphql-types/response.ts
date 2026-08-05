import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for syncing challenge submissions for the current user.",
})
/** Response for syncing challenge submissions for the current user. */
export class SyncSubmissionResponse extends AbstractGraphQLResponse {
}
