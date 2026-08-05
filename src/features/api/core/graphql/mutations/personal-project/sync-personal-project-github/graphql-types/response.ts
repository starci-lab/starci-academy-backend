import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for syncing the personal project GitHub URL for the current user.",
})
/** Response for syncing the personal project GitHub URL for the current user. */
export class SyncPersonalProjectGithubResponse extends AbstractGraphQLResponse {
}
