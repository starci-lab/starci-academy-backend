import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"

@ObjectType({
    description: "Response for confirming two-factor (TOTP) setup.",
})
/** Response for confirming two-factor setup. */
export class ConfirmTwoFactorResponse extends AbstractGraphQLResponse {
}
