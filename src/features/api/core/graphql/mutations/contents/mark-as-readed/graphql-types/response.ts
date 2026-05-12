import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/** Response for syncing challenge submissions for the current user. */
@ObjectType({
    description: "Response for marking a content as read.",
})
export class MarkAsReadedResponse extends AbstractGraphQLResponse {
}