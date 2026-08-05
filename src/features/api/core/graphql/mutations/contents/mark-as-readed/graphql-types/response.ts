import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for marking a content as read.",
})
/** Response for syncing challenge submissions for the current user. */
export class MarkAsReadedResponse extends AbstractGraphQLResponse {
}