import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

/**
 * Response for a contact-form submission. Carries no data — the client shows a
 * success panel; the message is delivered to the team by email out of band.
 */
@ObjectType({
    description: "Response for submitting a contact-form message.",
})
export class SubmitContactResponse extends AbstractGraphQLResponse {
}
