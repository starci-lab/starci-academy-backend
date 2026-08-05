import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Tokens after OTP verification (refresh token is set as HttpOnly cookie).",
})
/**
 * Client-visible half of completed sign-in: only the access token. Refresh
 * stays httpOnly-cookied so XSS cannot steal a long-lived credential.
 */
export class SignInVerifyOtpData {
    @Field(() => String,
        {
            description: "Keycloak access token (JWT).",
        })
        accessToken: string
}

@ObjectType({
    description: "Response wrapper for the signInVerifyOtp mutation.",
})
/**
 * Envelope for completed password sign-in. Also reused by forgot-password
 * verify. `data` is nullable for the interceptor error path.
 */
export class SignInVerifyOtpResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SignInVerifyOtpData>
{
    @Field(() => SignInVerifyOtpData,
        {
            nullable: true,
            description: "Tokens payload (refresh token via cookie).",
        })
        data: SignInVerifyOtpData
}

/**
 * Result of the verifyChallenge command.
 */
export interface SignInVerifyOtpCommandResult {
    /**
     * The data returned from the command.
     */
    data: SignInVerifyOtpData
    /**
     * The refresh token returned from the command.
     */
    refreshToken: string
}
