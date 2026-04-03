import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/** Response for syncing challenge submissions for the current user. */
@ObjectType({
    description: "Response for syncing challenge submissions for the current user.",
})
export class SyncSubmissionsResponse extends AbstractGraphQLResponse {
}
