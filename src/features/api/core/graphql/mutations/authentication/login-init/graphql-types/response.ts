import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Payload of loginInit: challenge id and expiry.",
})
export class LoginInitData {
    @Field(() => String,
        {
            description: "Opaque challenge id; use it for loginVerifyOtp.",
        })
        challengeId: string

    @Field(() => Number,
        {
            description: "OTP expiry in seconds.",
        })
        expiresInSeconds: number
}

@ObjectType({
    description: "Response wrapper for the loginInit mutation.",
})
export class LoginInitResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<LoginInitData>
{
    @Field(() => LoginInitData,
        {
            description: "Login challenge payload.",
        })
        data: LoginInitData
}

