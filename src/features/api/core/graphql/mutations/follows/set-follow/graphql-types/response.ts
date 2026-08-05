import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for following or unfollowing a user.",
})
/** Response for following/unfollowing a user. */
export class SetFollowResponse extends AbstractGraphQLResponse {
}
