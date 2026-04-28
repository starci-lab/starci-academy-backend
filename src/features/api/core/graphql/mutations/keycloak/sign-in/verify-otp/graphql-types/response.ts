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
export class SignInVerifyOtpResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SignInVerifyOtpData>
{
    @Field(() => SignInVerifyOtpData,
        {
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
