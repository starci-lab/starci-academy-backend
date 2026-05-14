import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/** Response for syncing the personal project GitHub URL for the current user. */
@ObjectType({
    description: "Response for syncing the personal project GitHub URL for the current user.",
})
export class SyncPersonalProjectGithubResponse extends AbstractGraphQLResponse {
}
