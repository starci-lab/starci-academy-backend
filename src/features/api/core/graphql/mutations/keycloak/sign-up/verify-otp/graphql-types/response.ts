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

export interface SignUpVerifyOtpCommandResult {
    data: SignUpVerifyOtpData
    refreshToken: string
}

