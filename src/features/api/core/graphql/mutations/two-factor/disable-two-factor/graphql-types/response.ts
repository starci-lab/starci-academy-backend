import {
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"

@ObjectType({
    description: "Response for disabling two-factor (TOTP).",
})
/** Response for disabling two-factor. */
export class DisableTwoFactorResponse extends AbstractGraphQLResponse {
}
