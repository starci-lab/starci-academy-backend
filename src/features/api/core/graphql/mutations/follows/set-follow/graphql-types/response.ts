import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for following or unfollowing a user.",
})
/** Response for following/unfollowing a user. */
export class SetFollowResponse extends AbstractGraphQLResponse {
}
