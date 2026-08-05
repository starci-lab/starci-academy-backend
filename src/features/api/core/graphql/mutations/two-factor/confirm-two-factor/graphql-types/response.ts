import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response for confirming two-factor (TOTP) setup.",
})
/** Response for confirming two-factor setup. */
export class ConfirmTwoFactorResponse extends AbstractGraphQLResponse {
}
