import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api"

/** Response for disabling two-factor. */
@ObjectType({
    description: "Response for disabling two-factor (TOTP).",
})
export class DisableTwoFactorResponse extends AbstractGraphQLResponse {
}
