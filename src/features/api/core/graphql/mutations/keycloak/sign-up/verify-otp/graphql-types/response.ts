import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Tokens after OTP verification (refresh token is set as HttpOnly cookie).",
})
/**
 * Client-visible half of completed sign-up: only the access token. Refresh
 * stays httpOnly-cookied so XSS cannot steal a long-lived credential.
 */
export class SignUpVerifyOtpData {
    @Field(() => String,
        {
            description: "Keycloak access token (JWT).",
        })
        accessToken: string
}

@ObjectType({
    description: "Response wrapper for the signUpVerifyOtp mutation.",
})
/**
 * Envelope for completed sign-up. `data` is nullable for the interceptor
 * error path.
 */
export class SignUpVerifyOtpResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SignUpVerifyOtpData>
{
    @Field(() => SignUpVerifyOtpData,
        {
            nullable: true,
            description: "Tokens payload (refresh token via cookie).",
        })
        data: SignUpVerifyOtpData
}

/**
 * Internal command result: GraphQL data plus the refresh token kept off the
 * schema so the resolver can lock it in an httpOnly cookie.
 */
export interface SignUpVerifyOtpResult {
    data: SignUpVerifyOtpData
    refreshToken: string
}

