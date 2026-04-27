import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Keycloak tokens after OTP verification.",
})
export class LoginVerifyOtpData {
    @Field(() => String,
        {
            description: "Local user id.",
        })
        id: string

    @Field(() => String,
        {
            description: "Keycloak access token (JWT).",
        })
        accessToken: string

    @Field(() => String,
        {
            description: "Keycloak refresh token.",
        })
        refreshToken: string

    @Field(() => String,
        {
            description: "Token type (usually Bearer).",
        })
        tokenType: string

    @Field(() => String,
        {
            nullable: true,
            description: "Optional ID token (JWT).",
        })
        idToken?: string
}

@ObjectType({
    description: "Response wrapper for the loginVerifyOtp mutation.",
})
export class LoginVerifyOtpResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<LoginVerifyOtpData>
{
    @Field(() => LoginVerifyOtpData,
        {
            description: "Login tokens payload.",
        })
        data: LoginVerifyOtpData
}

