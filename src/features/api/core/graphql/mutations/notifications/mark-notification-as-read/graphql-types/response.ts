import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for marking a notification as read.",
})
/**
 * Response for marking a single notification as read. Carries no data — clients
 * decrement the badge locally or re-fetch `myUnreadNotificationCount`.
 */
export class MarkNotificationAsReadResponse extends AbstractGraphQLResponse {
}
