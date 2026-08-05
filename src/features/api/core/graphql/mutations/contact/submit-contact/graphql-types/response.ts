import {
    AbstractGraphQLResponse,
} from "@modules/api"
import {
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response for submitting a contact-form message.",
})
/**
 * Response for a contact-form submission. Carries no data -- the client shows a
 * success panel; the message is delivered to the team by email out of band.
 */
export class SubmitContactResponse extends AbstractGraphQLResponse {
}
