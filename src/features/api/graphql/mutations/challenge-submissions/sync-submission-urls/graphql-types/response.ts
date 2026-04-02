import {
    AbstractGraphQLResponse 
} from "@modules/api"
import {
    ObjectType 
} from "@nestjs/graphql"

/** Response for syncing challenge submission URLs for the current user. */
@ObjectType({
    description: "Response for syncing challenge submission URLs for the current user.",
})
export class SyncSubmissionUrlsResponse extends AbstractGraphQLResponse {
}