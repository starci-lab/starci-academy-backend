import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/** Response for following/unfollowing a user. */
@ObjectType({
    description: "Response for following or unfollowing a user.",
})
export class SetFollowResponse extends AbstractGraphQLResponse {
}
