import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response for disabling two-factor (TOTP).",
})
/** Response for disabling two-factor. */
export class DisableTwoFactorResponse extends AbstractGraphQLResponse {
}
