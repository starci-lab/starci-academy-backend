import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api"

/** Response for confirming two-factor setup. */
@ObjectType({
    description: "Response for confirming two-factor (TOTP) setup.",
})
export class ConfirmTwoFactorResponse extends AbstractGraphQLResponse {
}
